import { supabase } from '../supabaseClient';
import {
  sendOnboardingMessage,
  sendConversationMessage
} from './groqService';

// ─── GET OR CREATE SESSION ────────────────────────

export async function getOrCreateSession(userId: string) {
  const { data: sessions } = await supabase
    .from('chatbot_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1);

  if (sessions && sessions.length > 0) return sessions[0];

  const { data: newSession, error } = await supabase
    .from('chatbot_sessions')
    .insert({
      user_id: userId,
      phase: 'onboarding',
      onboarding_data: {},
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    console.error('Session creation failed:', error);
    return null;
  }

  return newSession;
}

// ─── LOAD MESSAGES ────────────────────────────────

export async function loadMessages(sessionId: string) {
  const { data, error } = await supabase
    .from('chatbot_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load messages:', error);
    return [];
  }

  return data || [];
}

// ─── FETCH AVAILABLE MENTORS ──────────────────────

export async function fetchAvailableMentors() {
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

export function formatMentorsForPrompt(mentors: any[]) {
  if (mentors.length === 0) {
    return 'No mentors are currently available on the platform.';
  }

  const grouped: Record<string, any[]> = {};
  mentors.forEach((m) => {
    const cat = m.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(m);
  });

  let result = 'CURRENTLY AVAILABLE MENTORS ON GUIDEME:\n\n';

  Object.entries(grouped).forEach(([category, list]) => {
    result += `${category.toUpperCase()} MENTORS:\n`;
    list.forEach((m) => {
      const name = m.profiles?.full_name || 'Unknown';
      const verified = m.profiles?.is_verified ? 'Verified' : '';
      const price = m.is_free_first_session
        ? 'Free first session'
        : `PKR ${m.initial_session_price} per session`;
      const rating = m.average_rating
        ? `${m.average_rating} stars`
        : 'New mentor';
      const expertise = (m.expertise_areas || []).join(', ');

      result += `- ${name} ${verified}\n`;
      result += `  Category: ${category}\n`;
      result += `  Rating: ${rating}\n`;
      result += `  Price: ${price}\n`;
      if (m.years_of_experience) result += `  Experience: ${m.years_of_experience} years\n`;
      if (m.session_language) result += `  Language: ${m.session_language}\n`;
      if (expertise) result += `  Expertise: ${expertise}\n`;
      result += '\n';
    });
  });

  return result;
}

// ─── ONBOARDING COMPLETE DETECTION ───────────────

function isOnboardingComplete(botReply: string) {
  return (
    botReply.includes('Feel free to ask me anything') ||
    botReply.includes('I am ready to help')
  );
}

// ─── SAVE MESSAGE ─────────────────────────────────

async function saveMessage(
  sessionId: string,
  sender: string,
  messageText: string
) {
  await supabase.from('chatbot_messages').insert({
    session_id: sessionId,
    sender,
    message_text: messageText,
  });
}

// ─── MAIN SEND FUNCTION ───────────────────────────

export async function sendChat(
  sessionId: string,
  userMessage: string,
  conversationHistory: any[],
  currentPhase: string,
  onboardingData: Record<string, string>,
  userName: string,
  userRole: string
) {
  // Skip empty or very short messages gracefully
  const trimmed = userMessage.trim();
  if (!trimmed) {
    return {
      botReply: 'Please type your message and I will be happy to help!',
      newPhase: currentPhase,
      newOnboardingData: onboardingData,
    };
  }

  // Save user message
  await saveMessage(sessionId, 'user', trimmed);

  let botReply = '';
  let newPhase = currentPhase;
  let newOnboardingData = { ...onboardingData };

  if (currentPhase === 'onboarding') {
    botReply = await sendOnboardingMessage(
      conversationHistory,
      trimmed,
      userName,
      userRole
    );

    if (isOnboardingComplete(botReply)) {
      newPhase = 'conversation';
      await supabase
        .from('chatbot_sessions')
        .update({
          phase: 'conversation',
          onboarding_data: newOnboardingData,
        })
        .eq('id', sessionId);
    }

  } else {
    // Fetch real mentor data for recommendations
    let mentorContext = '';
    try {
      const mentors = await fetchAvailableMentors();
      console.log('Fetched mentors:', mentors.length);
      mentorContext = formatMentorsForPrompt(mentors);
      console.log('Mentor context length:', mentorContext.length);
    } catch (err) {
      console.error('Failed to fetch mentors:', err);
      mentorContext = 'No mentor data available at this time.';
    }

    botReply = await sendConversationMessage(
      conversationHistory,
      trimmed,
      onboardingData,
      userName,
      userRole,
      mentorContext
    );
  }

  // Save bot reply
  await saveMessage(sessionId, 'bot', botReply);

  return { botReply, newPhase, newOnboardingData };
}