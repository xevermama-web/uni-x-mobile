const fs = require('fs');
let code = fs.readFileSync('src/components/ai/AIAssistant.tsx', 'utf8');

const oldInvoke = `      const { data, error: functionError } = await supabase.functions.invoke('ai-chat', {
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

const newInvoke = `      // Use standard fetch to the Edge Function to accurately capture JSON error responses
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
      const functionUrl = \`\${supabaseUrl}/functions/v1/ai-chat\`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${session.access_token}\`
        },
        body: JSON.stringify({
          messages: messages.concat(userMessage).map(m => ({ role: m.role, content: m.content }))
        })
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(\`Edge Function returned non-JSON response (\${response.status}): \${responseText.substring(0, 50)}...\`);
      }

      if (!response.ok) {
        throw new Error(data.error || \`Edge Function Error \${response.status}\`);
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }`;

code = code.replace(oldInvoke, newInvoke);
fs.writeFileSync('src/components/ai/AIAssistant.tsx', code);
console.log("Patched AIAssistant.tsx with fetch for better error logging");
