const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newTools = `,
      {
        type: "function",
        function: {
          name: "get_departments",
          description: "Get all departments.",
          parameters: { type: "object", properties: {}, required: [] }
        }
      },
      {
        type: "function",
        function: {
          name: "get_students",
          description: "Get students list.",
          parameters: { 
            type: "object", 
            properties: { department: { type: "string" }, batch: { type: "string" } }, 
            required: [] 
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_groups",
          description: "Get study groups.",
          parameters: { type: "object", properties: {}, required: [] }
        }
      }
    ];`;

code = code.replace("    ];\n\n    const systemPrompt", newTools + "\n\n    const systemPrompt");

const newHandlers = `            } else if (functionName === 'get_materials') {
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
            }`;

code = code.replace(`            } else if (functionName === 'get_materials') {
               let q = supabase.from('materials').select('*');
               if (functionArgs.course) q = q.ilike('course', \`%\${functionArgs.course}%\`);
               const { data, error } = await q;
               functionResult = data || { error: error?.message };
            }`, newHandlers);

fs.writeFileSync('server.ts', code);
