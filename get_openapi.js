const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function run() {
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`);
  const spec = await res.json();
  const routines = spec.definitions.routines.properties;
  console.log("Routines columns:", Object.keys(routines));
}
run();
