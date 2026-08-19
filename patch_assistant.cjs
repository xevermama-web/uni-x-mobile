const fs = require('fs');

let code = fs.readFileSync('src/components/ai/AIAssistant.tsx', 'utf8');

const oldFetch = `      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: \`Bearer \${session.access_token}\` } : {})
        },
        body: JSON.stringify({ 
          messages: messages.concat(userMessage).map(m => ({ role: m.role, content: m.content }))
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || \`Error \${response.status}\`);
      }`;

const newInvoke = `      const { data, error: functionError } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: messages.concat(userMessage).map(m => ({ role: m.role, content: m.content }))
        }
      });
      
      if (functionError) {
        throw new Error(functionError.message || 'AI Assistant service error');
      }`;

code = code.replace(oldFetch, newInvoke);
fs.writeFileSync('src/components/ai/AIAssistant.tsx', code);
console.log("Patched AIAssistant.tsx");
