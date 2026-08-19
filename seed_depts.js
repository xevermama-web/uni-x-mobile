import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function seed() {
  const depts = [
    { name: 'Computer Science', head_name: 'Dr. Sarah Williams' },
    { name: 'Electrical Engineering', head_name: 'Dr. James Wilson' },
    { name: 'Business Administration', head_name: 'Dr. Emily Chen' },
  ];
  const { data, error } = await supabase.from('departments').insert(depts).select();
  console.log('Seed Error:', error);
  console.log('Inserted:', data);
}
seed();
