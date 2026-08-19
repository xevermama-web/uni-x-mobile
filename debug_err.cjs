const fs = require('fs');
let code = fs.readFileSync('src/hooks/useStudents.ts', 'utf-8');
code = code.replace(
  "return { data: null, error: err };",
  "console.error('addStudent error:', err); return { data: null, error: err };"
);
fs.writeFileSync('src/hooks/useStudents.ts', code);
