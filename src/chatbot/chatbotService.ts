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
      botReply = await sendConversationMessage(
        conversationHistory,
        userMessage,
        onboardingData,
        userName,
        userRole
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