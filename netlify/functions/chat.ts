import { GoogleGenAI } from '@google/genai';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { message } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_AI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Gemini API key is not configured.' })
      };
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const chat = ai.chats.create({
      model: 'gemini-3.6-flash',
      config: {
        systemInstruction: `You are a helpful AI Assistant for a University Management System called Uni-X.You help students with programming, assignments, research, course explanations, and study planning.Keep your answers professional, friendly, and concise.`,
      },
    });

    const response = await chat.sendMessage({ message });

    return {
      statusCode: 200,
      body: JSON.stringify({ text: response.text })
    };
  } catch (error) {
    console.error('Netlify function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to communicate with AI' })
    };
  }
};
