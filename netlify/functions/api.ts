import serverless from 'serverless-http';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const api = express();
api.use(express.json());

// API Route for Gemini AI Assistant
// Handle both /api/chat and /chat depending on how Netlify passes the path
api.post(['/api/chat', '/chat'], async (req, res) => {
  try {
    const { message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Gemini API key is not configured. Please add it to your environment variables.' 
      });
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
        systemInstruction: `You are a helpful AI Assistant for a University Management System called Uni-X.
You help students with programming, assignments, research, course explanations, and study planning.
Keep your answers professional, friendly, and concise.`,
      },
    });

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to communicate with AI' });
  }
});

api.post(['/api/admin-reset-password', '/admin-reset-password'], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Supabase Service Role Key is not configured.' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { userId, newPassword } = req.body;
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) throw error;
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: error.message || 'Failed to reset password' });
  }
});

export const handler = serverless(api);
