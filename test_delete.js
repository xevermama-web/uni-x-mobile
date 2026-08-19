import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: { user } } = await supabase.auth.getUser();
  console.log("User:", user?.id, user?.user_metadata);

  const { data: notices } = await supabase.from('notices').select('id, title').limit(1);
  if (!notices || notices.length === 0) {
    console.log("No notices found.");
    return;
  }
  
  const targetId = notices[0].id;
  console.log("Attempting to delete notice:", targetId, notices[0].title);
  
  const { data, error } = await supabase.from('notices').delete().eq('id', targetId).select();
  console.log("Delete result:", { data, error });
}
run();
