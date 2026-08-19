import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data: deps } = await supabase.from('departments').select('*');
  console.log("Deps:", deps);
  if (deps && deps.length > 0) {
     const res = await supabase.from('routines').insert([{
        department_id: deps[0].id,
        batch: '2024',
        day_of_week: 'Saturday',
        start_time: '10:00 AM',
        end_time: '11:00 AM',
        course: 'Test',
        faculty_name: 'Test',
        room: '101',
        is_published: false
     }]);
     console.log("Insert result:", res);
  }
}
test();
