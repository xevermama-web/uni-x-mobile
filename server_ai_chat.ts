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
    
    // Create Supabase client with user's token so RLS is automatically applied
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
              dayOfWeek: { type: "string" },
              course: { type: "string" }
            },
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_attendance",
          description: "Get attendance records. Only returns attendance records the user is authorized to see (e.g., their own, or their students if faculty).",
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
      },
      {
        type: "function",
        function: {
          name: "get_materials",
          description: "Get study materials.",
          parameters: { 
            type: "object", 
            properties: { course: { type: "string" } }, 
            required: [] 
          }
        }
      }
    ];

    const systemPrompt = `You are the Uni-X AI Chatbot. You help students and faculty with university-related tasks.
Use the provided tools to query the database securely when users ask for information.
Never guess or hallucinate database information. If a query returns no results, tell the user the info is not available.
Explain data simply and accurately based ONLY on the tool results.`;

    const msgs = [{ role: 'system', content: systemPrompt }, ...messages];
    
    let responseMessage: any = null;
    
    for (let i = 0; i < 4; i++) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: msgs,
        tools: tools,
        tool_choice: "auto"
      });
      
      responseMessage = response.choices[0].message;
      msgs.push(responseMessage);
      
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          let functionResult: any = {};
          
          try {
            if (functionName === 'get_my_profile') {
               const { data, error } = await supabase.from('profiles').select('*').single();
               functionResult = data || { error: error?.message || 'Not found' };
            } else if (functionName === 'get_notices') {
               let q = supabase.from('notices').select('*').order('created_at', { ascending: false });
               if (functionArgs.limit) q = q.limit(functionArgs.limit);
               const { data, error } = await q;
               functionResult = data || { error: error?.message };
            } else if (functionName === 'get_routines') {
               let q = supabase.from('routines').select('*');
               if (functionArgs.batch) q = q.eq('batch', functionArgs.batch);
               if (functionArgs.dayOfWeek) q = q.ilike('dayOfWeek', functionArgs.dayOfWeek);
               if (functionArgs.course) q = q.ilike('course', `%${functionArgs.course}%`);
               const { data, error } = await q;
               functionResult = data || { error: error?.message };
            } else if (functionName === 'get_attendance') {
               let q = supabase.from('attendance').select('*');
               if (functionArgs.course_id) q = q.eq('course_id', functionArgs.course_id);
               const { data, error } = await q;
               functionResult = data || { error: error?.message };
            } else if (functionName === 'get_courses') {
               const { data, error } = await supabase.from('courses').select('*');
               functionResult = data || { error: error?.message };
            } else if (functionName === 'get_materials') {
               let q = supabase.from('materials').select('*');
               if (functionArgs.course) q = q.ilike('course', `%${functionArgs.course}%`);
               const { data, error } = await q;
               functionResult = data || { error: error?.message };
            }
          } catch (err: any) {
             functionResult = { error: err.message };
          }
          
          msgs.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: JSON.stringify(functionResult)
          });
        }
      } else {
        break; // No more tool calls, we're done
      }
    }
    
    return res.json({ text: responseMessage?.content || "I couldn't generate a response." });
  } catch (error: any) {
    console.error('AI Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to communicate with AI Assistant' });
  }
};
