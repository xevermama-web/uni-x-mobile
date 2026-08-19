import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { error } = await supabase.from('departments').insert([{ code: 'CS' }]);
  console.log('Error:', error);
}

test();
