import { supabase } from '../supabaseClient';
import {
  sendOnboardingMessage,
  sendConversationMessage
} from './groqService';

// ─── ONBOARDING COMPLETE DETECTION ───────────────

function isOnboardingComplete(botReply) {
  return (
    botReply.includes('Feel free to ask me anything') ||
    botReply.includes('I am ready to help')
  );
}

// ─── CHECK FAQ TABLE FIRST ────────────────────────

async function checkFAQ(userMessage) {
  const message = userMessage.toLowerCase();

  const { data: faqs } = await supabase
    .from('chatbot_faqs')
    .select('keyword, answer');

  if (!faqs) return null;

  // Find FAQ where keyword appears as a meaningful phrase
  // in the message, not just any word match
  for (const faq of faqs) {
    const keyword = faq.keyword.toLowerCase();
    // Only match if the keyword is a meaningful part
    // of the message — require word boundary matching
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(message) && message.length < 80) {
      // Short messages are more likely to be direct FAQ queries
      return faq.answer;
    }
  }

  return null;
}

async function fetchAvailableMentors() {
  const { data, error } = await supabase
    .from('mentor_profiles')
    .select(`
      id,
      category,
      bio,
      expertise_areas,
      initial_session_price,
      is_free_first_session,
      average_rating,
      years_of_experience,
      session_language,
      profiles (
        full_name,
        is_verified
      )
    `)
    .eq('is_available', true)
    .order('average_rating', { ascending: false });

  if (error || !data) return [];
  return data;
}

function formatMentorsForPrompt(mentors: any[]) {
  if (mentors.length === 0) {
    return "No mentors are currently available on the platform.";
  }

  const grouped: Record<string, any[]> = {};

  mentors.forEach((m) => {
    const cat = m.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(m);
  });

  let result = "CURRENTLY AVAILABLE MENTORS ON GUIDEME:\n\n";

  Object.entries(grouped).forEach(([category, list]) => {
    result += `${category.toUpperCase()} MENTORS:\n`;
    list.forEach((m) => {
      const name = m.profiles?.full_name || 'Unknown';
      const verified = m.profiles?.is_verified ? '✓ Verified' : '';
      const price = m.is_free_first_session
        ? 'Free first session'
        : `PKR ${m.initial_session_price} per session`;
      const rating = m.average_rating
        ? `${m.average_rating} stars`
        : 'New mentor';
      const expertise = m.expertise_areas?.join(', ') || '';
      const experience = m.years_of_experience
        ? `${m.years_of_experience} years experience`
        : '';
      const language = m.session_language || '';

      result += `- ${name} ${verified}\n`;
      result += `  Rating: ${rating}\n`;
      result += `  Price: ${price}\n`;
      if (experience) result += `  Experience: ${experience}\n`;
      if (language) result += `  Language: ${language}\n`;
      if (expertise) result += `  Expertise: ${expertise}\n`;
      if (m.bio) result += `  About: ${m.bio.substring(0, 100)}...\n`;
      result += '\n';
    });
  });

  return result;
}


// ─── GET OR CREATE SESSION ────────────────────────

export async function getOrCreateSession(userId: string) {
  // First try to find ANY active session for this user
  const { data: sessions } = await supabase
    .from('chatbot_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1);

  // If found return the most recent one
  if (sessions && sessions.length > 0) {
    return sessions[0];
  }

  // No active session found — create new one
  const { data: newSession, error: createError } = await supabase
    .from('chatbot_sessions')
    .insert({
      user_id: userId,
      phase: 'onboarding',
      onboarding_data: {},
      status: 'active'
    })
    .select()
    .single();

  if (createError) {
    console.error('Session creation failed:', createError);
    return null;
  }

  return newSession;
}

// ─── LOAD MESSAGES ────────────────────────────────

export async function loadMessages(sessionId : string) {
  const { data, error } = await supabase
    .from('chatbot_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

    console.log('loadMessages result:', sessionId, data, error);

  if (error) {
    console.error('Failed to load messages:', error);
    return [];
  }

  return data || [];
}

// ─── MAIN SEND FUNCTION ───────────────────────────

export async function sendChat(
  sessionId,
  userMessage,
  conversationHistory,
  currentPhase,
  onboardingData,
  userName,
  userRole
) {
  // Save user message to DB
  await supabase
    .from('chatbot_messages')
    .insert({
      session_id: sessionId,
      sender: 'user',
      message_text: userMessage
    });

  let botReply = '';
  let newPhase = currentPhase;
  let newOnboardingData = { ...onboardingData };

  if (currentPhase === 'onboarding') {
    botReply = await sendOnboardingMessage(
      conversationHistory,
      userMessage,
      userName,
      userRole
    );

    if (isOnboardingComplete(botReply)) {
      newPhase = 'conversation';

      await supabase
        .from('chatbot_sessions')
        .update({
          phase: 'conversation',
          onboarding_data: newOnboardingData
        })
        .eq('id', sessionId);
    }

  } else {
    const faqAnswer = await checkFAQ(userMessage);

    if (faqAnswer) {
      botReply = faqAnswer;
    } else {
      // Fetch real mentor data for personalized recommendations
      const mentors = await fetchAvailableMentors();
      const mentorContext = formatMentorsForPrompt(mentors);

      botReply = await sendConversationMessage(
        conversationHistory,
        userMessage,
        onboardingData,
        userName,
        userRole,
        mentorContext
      );
    }
  }

  // Save bot reply to DB
  await supabase
    .from('chatbot_messages')
    .insert({
      session_id: sessionId,
      sender: 'bot',
      message_text: botReply
    });

  return { botReply, newPhase, newOnboardingData };
}