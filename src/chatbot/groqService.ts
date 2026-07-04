import guidemeDocumentation from './guidemeDocumentation';
import {
  getMenteeOnboardingPrompt,
  getMentorOnboardingPrompt,
  getMenteeConversationPrompt,
  getMentorConversationPrompt
} from './systemPrompt';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroq(systemPromptText, conversationHistory, userMessage) {
  try {
    const messages = [
      {
        role: 'system',
        content: systemPromptText + '\n\n' + guidemeDocumentation
      },
      ...conversationHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message_text
      })),
      {
        role: 'user',
        content: userMessage
      }
    ];

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.7,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      throw new Error(`Groq error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('Groq API call failed:', error);
    return 'Sorry, I am having trouble responding right now. Please try again in a moment.';
  }
}

export async function sendOnboardingMessage(
  conversationHistory,
  userMessage,
  userName,
  userRole
) {
  const prompt = userRole === 'mentor'
    ? getMentorOnboardingPrompt(userName)
    : getMenteeOnboardingPrompt(userName);

  return await callGroq(prompt, conversationHistory, userMessage);
}

export async function sendConversationMessage(
  conversationHistory,
  userMessage,
  onboardingData,
  userName,
  userRole
) {
  const prompt = userRole === 'mentor'
    ? getMentorConversationPrompt(userName, onboardingData)
    : getMenteeConversationPrompt(userName, onboardingData);

  return await callGroq(prompt, conversationHistory, userMessage);
}