import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('profiles').select('department, batch');
  console.log('Error:', error);
  console.log('Data size:', data ? data.length : 0);
  if (data) console.log(data.slice(0, 5));
}
test();
