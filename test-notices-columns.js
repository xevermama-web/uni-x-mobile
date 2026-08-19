import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('notices').insert([{ id: '550e8400-e29b-41d4-a716-446655440000', title: 'test', content: 'test', type: 'text' }]).select();
  console.log("Error:", error);
  console.log("Data:", data);
  if (!error) {
     await supabase.from('notices').delete().eq('id', '550e8400-e29b-41d4-a716-446655440000');
  }
}
run();
