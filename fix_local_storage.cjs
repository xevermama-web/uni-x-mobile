const fs = require('fs');

let code = fs.readFileSync('src/hooks/useStudents.ts', 'utf-8');
code = code.replace(
  "setStudents(prev => {\\n        const updated = [student, ...prev];\\n                return updated;\\n      });",
  "setStudents(prev => {\n        const updated = [student, ...prev];\n        localStorage.setItem('unixx_students', JSON.stringify(updated));\n        return updated;\n      });"
);

fs.writeFileSync('src/hooks/useStudents.ts', code);
console.log("Fixed!");
