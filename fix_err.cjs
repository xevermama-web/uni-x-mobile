const fs = require('fs');
let code = fs.readFileSync('src/hooks/useStudents.ts', 'utf-8');
code = code.replace(
  "return { data: null, error: err };",
  "return { data: null, error: err && Object.keys(err).length === 0 && !err.message ? new Error('Database Trigger Error. Please execute fix_profiles.sql in Supabase SQL editor. Details: ' + String(err)) : err };"
);
fs.writeFileSync('src/hooks/useStudents.ts', code);
