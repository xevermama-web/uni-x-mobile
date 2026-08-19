const fs = require('fs');

let code = fs.readFileSync('src/hooks/useStudents.ts', 'utf-8');

const target = `      const student = { ...newStudent, status: 'Active', cgpa: 0.0 };
      setStudents(prev => {
        const updated = [student, ...prev];
                return updated;
      });
      localStorage.setItem('unixx_students', JSON.stringify(updated));
      return { data: student, error: null };`;

const replacement = `      const student = { ...newStudent, status: 'Active', cgpa: 0.0 };
      const updated = [student, ...students];
      setStudents(updated);
      localStorage.setItem('unixx_students', JSON.stringify(updated));
      return { data: student, error: null };`;

code = code.replace(target, replacement);

fs.writeFileSync('src/hooks/useStudents.ts', code);
console.log("Fixed useStudents.ts");
