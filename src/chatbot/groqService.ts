import guidemeDocumentation from './guidemeDocumentation';
import {
  getMenteeOnboardingPrompt,
  getMentorOnboardingPrompt,
  getMenteeConversationPrompt,
  getMentorConversationPrompt
} from './systemPrompt';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroq(
  systemPromptText: string,
  conversationHistory: any[],
  userMessage: string
) {
  try {
    // Keep only last 6 messages to avoid rate limits
    const recentHistory = conversationHistory.slice(-6);

    const messages = [
      {
        role: 'system',
        content: systemPromptText + '\n\n' + guidemeDocumentation
      },
      ...recentHistory.map((msg: any) => ({
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
        model: "openai/gpt-oss-20b",
        messages,
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);

      if (response.status === 429) {
        // Rate limited — wait 3 seconds and retry once
        await new Promise(r => setTimeout(r, 3000));
        const retryResponse = await fetch(GROQ_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-20b",
            messages,
            temperature: 0.7,
            max_tokens: 300
          })
        });

        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          return retryData.choices[0].message.content;
        }
      }

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
  conversationHistory: any[],
  userMessage: string,
  onboardingData: Record<string, string>,
  userName: string,
  userRole: string,
  mentorContext: string = ''
) {
  const prompt = userRole === 'mentor'
    ? getMentorConversationPrompt(userName, onboardingData)
    : getMenteeConversationPrompt(userName, onboardingData, mentorContext);

  return await callGroq(prompt, conversationHistory, userMessage);
}


// import guidemeDocumentation from './guidemeDocumentation';
// import {
//   getMenteeOnboardingPrompt,
//   getMentorOnboardingPrompt,
//   getMenteeConversationPrompt,
//   getMentorConversationPrompt
// } from './systemPrompt';

// const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
//   const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

// async function callGemini(
//   systemPromptText: string,
//   conversationHistory: any[],
//   userMessage: string
// ): Promise<string> {
//   try {
//     // Build conversation history in Gemini format
//     const contents: any[] = [];

//     // Add conversation history
//     const recentHistory = conversationHistory.slice(-6);
//     recentHistory.forEach((msg: any) => {
//       contents.push({
//         role: msg.sender === 'user' ? 'user' : 'model',
//         parts: [{ text: msg.message_text }]
//       });
//     });

//     // Add current user message
//     contents.push({
//       role: 'user',
//       parts: [{ text: userMessage }]
//     });

//     const response = await fetch(GEMINI_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         system_instruction: {
//           parts: [{
//             text: systemPromptText + '\n\n' + guidemeDocumentation
//           }]
//         },
//         contents,
//         generationConfig: {
//           temperature: 0.7,
//           maxOutputTokens: 400,
//         }
//       })
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       console.error('Gemini API error:', errorData);
//       throw new Error(`Gemini error: ${response.status}`);
//     }

//     const data = await response.json();
//     return data.candidates[0].content.parts[0].text;

//   } catch (error) {
//     console.error('Gemini API call failed:', error);
//     return 'Sorry, I am having trouble responding right now. Please try again in a moment.';
//   }
// }

// export async function sendOnboardingMessage(
//   conversationHistory: any[],
//   userMessage: string,
//   userName: string,
//   userRole: string
// ): Promise<string> {
//   const prompt = userRole === 'mentor'
//     ? getMentorOnboardingPrompt(userName)
//     : getMenteeOnboardingPrompt(userName);

//   return await callGemini(prompt, conversationHistory, userMessage);
// }

// export async function sendConversationMessage(
//   conversationHistory: any[],
//   userMessage: string,
//   onboardingData: Record<string, string>,
//   userName: string,
//   userRole: string,
//   mentorContext: string = ''
// ): Promise<string> {
//   const prompt = userRole === 'mentor'
//     ? getMentorConversationPrompt(userName, onboardingData)
//     : getMenteeConversationPrompt(userName, onboardingData, mentorContext);

//   return await callGemini(prompt, conversationHistory, userMessage);
// }