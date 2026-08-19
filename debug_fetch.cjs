const fs = require('fs');
let code = fs.readFileSync('src/hooks/useStudents.ts', 'utf-8');
code = code.replace(
  'console.error("Failed to fetch students:", err);',
  'console.error("Failed to fetch students:", err); alert("Failed to fetch students: " + JSON.stringify(err));'
);
fs.writeFileSync('src/hooks/useStudents.ts', code);
