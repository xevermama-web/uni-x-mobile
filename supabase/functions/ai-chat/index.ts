import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "npm:@google/genai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API key is not configured in Edge Function secrets.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey })

    const systemInstruction = `You are Uni-X AI, a helpful, intelligent, and friendly academic assistant for the Uni-X University platform.
You assist students, faculty, and visitors with academic topics, study techniques, coursework questions, exam preparation, essay drafting, problem-solving, schedule planning, and university guidance.
Always provide clear, well-structured, formatted Markdown responses. You do not have direct access to private internal database records, so focus on providing high-quality academic help, conceptual explanations, and study assistance.`

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))
    
    let responseText = ''
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: { systemInstruction }
      })
      responseText = response.text || "I'm here to help! How can I assist you with your studies or questions today?"
    } catch (modelErr: any) {
      const fallback = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: contents,
        config: { systemInstruction }
      })
      responseText = fallback.text || "I'm here to help! How can I assist you with your studies or questions today?"
    }
    
    return new Response(JSON.stringify({ text: responseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('AI Error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to communicate with AI Assistant' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
