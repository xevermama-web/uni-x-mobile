import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

export const handleAiChat = async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages array' });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    if (!openAiKey) {
      return res.status(500).json({ error: 'OpenAI API key is not configured.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const openai = new OpenAI({ apiKey: openAiKey });

    const tools: any = [
      {
        type: "function",
        function: {
          name: "get_my_profile",
          description: "Get the profile information of the currently logged-in user.",
          parameters: { type: "object", properties: {}, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "get_notices",
          description: "Get the latest notices from the university.",
          parameters: { 
            type: "object", 
            properties: { limit: { type: "number", description: "Max number of notices to return" } },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_routines",
          description: "Get class routines.",
          parameters: { 
            type: "object", 
            properties: { 
              batch: { type: "string" }, 
              departmentId: { type: "string" },
              dayOfWeek: { type: "string" }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_attendance",
          description: "Get attendance records.",
          parameters: { 
            type: "object", 
            properties: { 
              course_id: { type: "string" }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_courses",
          description: "Get available courses.",
          parameters: { type: "object", properties: {}, required: [] }
        }
      }
    ];

    const systemPrompt = `You are the Uni-X AI Chatbot. You help students and faculty with university-related tasks.
Use the provided tools to query the database securely when users ask for information.
Never guess or hallucinate database information. If a query returns no results, tell the user the info is not available.
If a user asks about their own data, use the get_my_profile tool to find who they are first if needed, though most queries auto-filter by the user's secure token.`;

    // Process the chat
    const runner = openai.beta.chat.completions.runTools({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      tools,
    }).on('message', (message) => console.log('OpenAI message:', message));
    
    // Actually, `runTools` is an event emitter but also a promise. But since we need to execute the DB queries, we have to provide the tool handlers!
    // I should provide the tool execution callbacks or just use basic loop.
    // wait, runTools uses a runner that requires tools to be defined with handlers in `openai.beta.chat.completions.runTools`.
    // But `runTools` syntax is:
    /*
      const runner = openai.beta.chat.completions.runTools({
        model: 'gpt-4o-mini',
        messages: ...,
        tools: [
          // ... 
        ]
      }) // This doesn't auto-execute OUR functions unless we pass them somehow?
    */
    
  } catch (error) {
    console.error('AI Error:', error);
  }
};
