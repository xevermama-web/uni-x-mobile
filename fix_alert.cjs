const fs = require('fs');
let code = fs.readFileSync('src/hooks/useStudents.ts', 'utf-8');

code = code.replace(
  'console.error("Failed to fetch students:", err); alert("Failed to fetch students: " + JSON.stringify(err));',
  'console.error("Failed to fetch students:", err); setFetchError(err.message || JSON.stringify(err));'
);

// If setFetchError is not defined, we should add it
if (!code.includes("const [fetchError, setFetchError]")) {
  code = code.replace(
    "const [loading, setLoading] = useState(true);",
    "const [loading, setLoading] = useState(true);\n  const [fetchError, setFetchError] = useState<string | null>(null);"
  );
  
  code = code.replace(
    "setLoading(true);",
    "setLoading(true);\n    setFetchError(null);"
  );

  code = code.replace(
    "return { students, loading, addStudent, fetchStudents };",
    "return { students, loading, fetchError, addStudent, fetchStudents };"
  );
}

fs.writeFileSync('src/hooks/useStudents.ts', code);
