import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const [{ count: c1 }, { count: c2 }, { count: c3 }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'faculty'),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
  ]);
  console.log("Students:", c1, "Faculty:", c2, "Courses:", c3);
}
run();
