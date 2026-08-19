import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('notices').insert([{
    title: 'Test Department Notice',
    content: 'Testing department name instead of id',
    department_id: 'Computer Science',
    type: 'text',
    tag: 'INFO'
  }]).select();
  console.log('Error:', error);
  console.log('Data:', data);
}
test();
