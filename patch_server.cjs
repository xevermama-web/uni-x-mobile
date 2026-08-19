const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

if (!serverCode.includes("import OpenAI")) {
  serverCode = "import OpenAI from 'openai';\n" + serverCode;
}

const aiHandlerCode = fs.readFileSync('server_ai_chat.ts', 'utf8');
const handleFunctionStr = aiHandlerCode.replace("import OpenAI from 'openai';\n", "").replace("import { createClient } from '@supabase/supabase-js';\n", "");

// Insert before app.post('/api/admin-reset-password'
const target = "  app.post('/api/admin-reset-password'";

if (serverCode.includes(target) && !serverCode.includes('/api/ai/chat')) {
  const insertPos = serverCode.indexOf(target);
  
  const modifiedCode = serverCode.slice(0, insertPos) +
    handleFunctionStr + "\n" +
    "  app.post('/api/ai/chat', handleAiChat);\n\n" +
    serverCode.slice(insertPos);
    
  fs.writeFileSync('server.ts', modifiedCode);
  console.log("Patched successfully");
} else {
  console.log("Target not found or already patched.");
}
