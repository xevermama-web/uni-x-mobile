const fs = require('fs');

let code = fs.readFileSync('src/components/ai/AIAssistant.tsx', 'utf8');

const oldInvoke = `      const { data, error: functionError } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: messages.concat(userMessage).map(m => ({ role: m.role, content: m.content }))
        }
      });
      
      if (functionError) {
        throw new Error(functionError.message || 'AI Assistant service error');
      }`;

const newInvoke = `      const { data, error: functionError } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: messages.concat(userMessage).map(m => ({ role: m.role, content: m.content }))
        }
      });
      
      if (functionError) {
        // Supabase functions.invoke often returns error object with context
        console.error("Edge Function Error:", functionError);
        const errorBody = await functionError.context?.json().catch(() => null);
        const errorMessage = errorBody?.error || functionError.message || 'AI Assistant service error';
        throw new Error(errorMessage + (functionError.message?.includes('404') ? ' (Ensure Edge Function is deployed)' : ''));
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }`;

code = code.replace(oldInvoke, newInvoke);
fs.writeFileSync('src/components/ai/AIAssistant.tsx', code);
console.log("Patched AIAssistant.tsx error handling");
