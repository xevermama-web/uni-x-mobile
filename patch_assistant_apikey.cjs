const fs = require('fs');
let code = fs.readFileSync('src/components/ai/AIAssistant.tsx', 'utf8');

const oldFetch = `      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${session.access_token}\`
        },`;

const newFetch = `      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${session.access_token}\`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        },`;

code = code.replace(oldFetch, newFetch);
fs.writeFileSync('src/components/ai/AIAssistant.tsx', code);
console.log("Patched AIAssistant.tsx with apikey header");
