// import guidemeDocumentation from './guidemeDocumentation';
// import {
//   getMenteeOnboardingPrompt,
//   getMentorOnboardingPrompt,
//   getMenteeConversationPrompt,
//   getMentorConversationPrompt
// } from './systemPrompt';

// const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
// const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// async function callGroq(
//   systemPromptText: string,
//   conversationHistory: any[],
//   userMessage: string
// ) {
//   try {
//     // Keep only last 6 messages to avoid rate limits
//     const recentHistory = conversationHistory.slice(-6);

//     const messages = [
//       {
//         role: 'system',
//         content: systemPromptText + '\n\n' + guidemeDocumentation
//       },
//       ...recentHistory.map((msg: any) => ({
//         role: msg.sender === 'user' ? 'user' : 'assistant',
//         content: msg.message_text
//       })),
//       {
//         role: 'user',
//         content: userMessage
//       }
//     ];

//     const response = await fetch(GROQ_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${GROQ_API_KEY}`
//       },
//       body: JSON.stringify({
//         model: "openai/gpt-oss-20b",
//         messages,
//         temperature: 0.7,
//         max_tokens: 300
//       })
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       console.error('Groq API error:', errorData);

//       if (response.status === 429) {
//         // Rate limited — wait 3 seconds and retry once
//         await new Promise(r => setTimeout(r, 3000));
//         const retryResponse = await fetch(GROQ_URL, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${GROQ_API_KEY}`
//           },
//           body: JSON.stringify({
//             model: "openai/gpt-oss-20b",
//             messages,
//             temperature: 0.7,
//             max_tokens: 300
//           })
//         });

//         if (retryResponse.ok) {
//           const retryData = await retryResponse.json();
//           return retryData.choices[0].message.content;
//         }
//       }

//       throw new Error(`Groq error: ${response.status}`);
//     }

//     const data = await response.json();
//     return data.choices[0].message.content;

//   } catch (error) {
//     console.error('Groq API call failed:', error);
//     return 'Sorry, I am having trouble responding right now. Please try again in a moment.';
//   }
// }

// export async function sendOnboardingMessage(
//   conversationHistory,
//   userMessage,
//   userName,
//   userRole
// ) {
//   const prompt = userRole === 'mentor'
//     ? getMentorOnboardingPrompt(userName)
//     : getMenteeOnboardingPrompt(userName);

//   return await callGroq(prompt, conversationHistory, userMessage);
// }

// export async function sendConversationMessage(
//   conversationHistory: any[],
//   userMessage: string,
//   onboardingData: Record<string, string>,
//   userName: string,
//   userRole: string,
//   mentorContext: string = ''
// ) {
//   const prompt = userRole === 'mentor'
//     ? getMentorConversationPrompt(userName, onboardingData)
//     : getMenteeConversationPrompt(userName, onboardingData, mentorContext);

//   return await callGroq(prompt, conversationHistory, userMessage);
// }


import guidemeDocumentation from './guidemeDocumentation';
import {
  getMenteeOnboardingPrompt,
  getMentorOnboardingPrompt,
  getMenteeConversationPrompt,
  getMentorConversationPrompt
} from './systemPrompt';
  
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(
  systemPromptText: string,
  conversationHistory: any[],
  userMessage: string
): Promise<string> {
  const recentHistory = conversationHistory.slice(-6);

  const contents: any[] = [];
  recentHistory.forEach((msg: any) => {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.message_text }]
    });
  });
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const body = JSON.stringify({
    system_instruction: {
      parts: [{ text: systemPromptText + '\n\n' + guidemeDocumentation }]
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 400,
    }
  });

  // Try up to 3 times with increasing delays
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (response.ok) {
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
      }

      const errorData = await response.json();
      console.error(`Gemini attempt ${attempt} failed:`, errorData);

      // If 503 or 429 wait and retry
      if (response.status === 503 || response.status === 429) {
        if (attempt < 3) {
          const delay = attempt * 2000; // 2s, 4s
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      }

      // For other errors don't retry
      break;

    } catch (error) {
      console.error(`Gemini attempt ${attempt} error:`, error);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  return 'Sorry, I am having trouble responding right now. Please try again in a moment.';
}

export async function sendOnboardingMessage(
  conversationHistory: any[],
  userMessage: string,
  userName: string,
  userRole: string
): Promise<string> {
  const prompt = userRole === 'mentor'
    ? getMentorOnboardingPrompt(userName)
    : getMenteeOnboardingPrompt(userName);

  return await callGemini(prompt, conversationHistory, userMessage);
}

export async function sendConversationMessage(
  conversationHistory: any[],
  userMessage: string,
  onboardingData: Record<string, string>,
  userName: string,
  userRole: string,
  mentorContext: string = ''
): Promise<string> {
  const prompt = userRole === 'mentor'
    ? getMentorConversationPrompt(userName, onboardingData)
    : getMenteeConversationPrompt(userName, onboardingData, mentorContext);

  return await callGemini(prompt, conversationHistory, userMessage);
}