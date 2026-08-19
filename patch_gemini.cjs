const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Insert new import if needed
if (!code.includes("@google/genai")) {
  code = "import { GoogleGenAI, Type } from '@google/genai';\n" + code;
}

// Find the start and end of handleAiChat
const startIndex = code.indexOf("const handleAiChat = async");
const endIndex = code.indexOf("  app.post('/api/ai/chat', handleAiChat);"); // where it's used

if (startIndex !== -1 && endIndex !== -1) {
  const newFunction = `const handleAiChat = async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages array' });
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_AI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    // Create Supabase client with user's token so RLS is automatically applied
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const tools: any = [{
      functionDeclarations: [
        {
          name: "get_my_profile",
          description: "Get the profile information of the currently logged-in user."
        },
        {
          name: "get_notices",
          description: "Get the latest notices from the university.",
          parameters: { 
            type: Type.OBJECT, 
            properties: { limit: { type: Type.NUMBER, description: "Max number of notices to return" } }
          }
        },
        {
          name: "get_routines",
          description: "Get class routines.",
          parameters: { 
            type: Type.OBJECT, 
            properties: { 
              batch: { type: Type.STRING }, 
              dayOfWeek: { type: Type.STRING },
              course: { type: Type.STRING }
            }
          }
        },
        {
          name: "get_attendance",
          description: "Get attendance records. Only returns attendance records the user is authorized to see.",
          parameters: { 
            type: Type.OBJECT, 
            properties: { 
              course_id: { type: Type.STRING }
            }
          }
        },
        {
          name: "get_courses",
          description: "Get available courses."
        },
        {
          name: "get_materials",
          description: "Get study materials.",
          parameters: { 
            type: Type.OBJECT, 
            properties: { course: { type: Type.STRING } }
          }
        },
        {
          name: "get_departments",
          description: "Get all departments."
        },
        {
          name: "get_students",
          description: "Get students list.",
          parameters: { 
            type: Type.OBJECT, 
            properties: { department: { type: Type.STRING }, batch: { type: Type.STRING } }
          }
        },
        {
          name: "get_groups",
          description: "Get study groups."
        }
      ]
    }];

    const systemInstruction = \`You are the Uni-X AI Chatbot. You help students and faculty with university-related tasks.
Use the provided tools to query the database securely when users ask for information.
Never guess or hallucinate database information. If a query returns no results, tell the user the info is not available.
Explain data simply and accurately based ONLY on the tool results.\`;

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    
    let responseText = '';
    
    for (let i = 0; i < 4; i++) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        tools: tools,
        config: { systemInstruction }
      });
      
      if (response.functionCalls && response.functionCalls.length > 0) {
        // Model made tool calls
        contents.push({
          role: 'model',
          parts: response.functionCalls.map((fc: any) => ({ functionCall: fc }))
        });
        
        const toolResponses = [];
        
        for (const call of response.functionCalls) {
          const functionName = call.name;
          const functionArgs = call.args || {};
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
               if (functionArgs.course) q = q.ilike('course', \`%\${functionArgs.course}%\`);
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
               if (functionArgs.course) q = q.ilike('course', \`%\${functionArgs.course}%\`);
               const { data, error } = await q;
               functionResult = data || { error: error?.message };
            } else if (functionName === 'get_departments') {
               const { data, error } = await supabase.from('departments').select('*');
               functionResult = data || { error: error?.message };
            } else if (functionName === 'get_students') {
               let q = supabase.from('profiles').select('*').eq('role', 'student');
               if (functionArgs.department) q = q.eq('department', functionArgs.department);
               if (functionArgs.batch) q = q.eq('batch', functionArgs.batch);
               const { data, error } = await q;
               functionResult = data || { error: error?.message };
            } else if (functionName === 'get_groups') {
               const { data, error } = await supabase.from('groups').select('*');
               functionResult = data || { error: error?.message };
            }
          } catch (err: any) {
             functionResult = { error: err.message };
          }
          
          toolResponses.push({
            functionResponse: {
              name: functionName,
              response: functionResult
            }
          });
        }
        
        contents.push({
          role: 'user',
          parts: toolResponses
        });
        
      } else {
        responseText = response.text || "I couldn't generate a response.";
        break;
      }
    }
    
    return res.json({ text: responseText });
  } catch (error: any) {
    console.error('AI Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to communicate with AI Assistant' });
  }
};
`;

  code = code.slice(0, startIndex) + newFunction + "\n" + code.slice(endIndex);
  fs.writeFileSync('server.ts', code);
  console.log("Patched successfully");
} else {
  console.log("Could not find start or end index.");
}
