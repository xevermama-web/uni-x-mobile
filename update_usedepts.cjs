const fs = require('fs');
let content = fs.readFileSync('src/hooks/useDepartments.ts', 'utf8');

// Replace fetchDepartments
content = content.replace(
/  const fetchDepartments = async \(\) => \{[\s\S]*?  \};\n\n  useEffect/g,
`  const fetchDepartments = async () => {
    setLoading(true);
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      const stored = localStorage.getItem('unixx_departments');
      const localStudents = JSON.parse(localStorage.getItem('unixx_students') || '[]');
      const localFaculties = JSON.parse(localStorage.getItem('unixx_faculties') || '[]');
      
      if (stored) {
        setDepartments(JSON.parse(stored).map((d: any) => ({
          ...d,
          studentCount: localStudents.filter((s: any) => s.department === d.name).length,
          facultyCount: localFaculties.filter((f: any) => f.department === d.name).length
        })));
      } else {
        setDepartments(DEFAULT_DEPARTMENTS);
        localStorage.setItem('unixx_departments', JSON.stringify(DEFAULT_DEPARTMENTS));
      }
      setLoading(false);
      return;
    }

    try {
      const [deptRes, profilesRes] = await Promise.all([
        supabase.from('departments').select('*').order('name'),
        supabase.from('profiles').select('department, role')
      ]);
      
      if (deptRes.error) throw deptRes.error;
      const data = deptRes.data;

      if (data && data.length > 0) {
        const profiles = profilesRes.data || [];
        setDepartments(data.map((d: any) => {
          const deptProfiles = profiles.filter((p: any) => p.department === d.name || p.department === d.id);
          const studentCount = deptProfiles.filter((p: any) => p.role === 'student').length;
          const facultyCount = deptProfiles.filter((p: any) => ['faculty', 'moderator', 'admin'].includes(p.role?.toLowerCase() || '')).length;
          
          return { 
            ...d, 
            head: d.head || '', 
            facultyCount: facultyCount, 
            studentCount: studentCount 
          };
        }));
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect`
);

// Replace addDepartment
content = content.replace(
/      const dbDept = \{\n        name: dept.name,\n      \};\n      const \{ data, error \} = await supabase\.from\('departments'\)\.insert\(\[dbDept\]\)\.select\(\);\n      if \(error\) throw error;\n      if \(data\) \{\n        setDepartments\(\[\{ \.\.\.data\[0\], head: '', facultyCount: 0, studentCount: 0 \}, \.\.\.departments\]\);\n        return \{ data: \{ \.\.\.data\[0\], head: '', facultyCount: 0, studentCount: 0 \}, error: null \};\n      \}/g,
`      const dbDept: any = {
        name: dept.name,
        head: dept.head || ''
      };
      
      let insertRes = await supabase.from('departments').insert([dbDept]).select();
      
      if (insertRes.error && (insertRes.error.message?.includes('head') || insertRes.error.message?.includes('column') || insertRes.error.code === 'PGRST204')) {
         console.warn("Retrying without head column", insertRes.error);
         delete dbDept.head;
         insertRes = await supabase.from('departments').insert([dbDept]).select();
      }

      if (insertRes.error) throw insertRes.error;
      const data = insertRes.data;

      if (data) {
        const newD = { ...data[0], head: dbDept.head || '', facultyCount: 0, studentCount: 0 };
        setDepartments([newD, ...departments]);
        return { data: newD, error: null };
      }`
);

// Replace editDepartment
content = content.replace(
/      const dbUpdates: any = \{ \.\.\.updates \};\n      delete dbUpdates\.facultyCount;\n      delete dbUpdates\.studentCount;\n      delete dbUpdates\.head;\n      delete dbUpdates\.id;\n      const \{ error \} = await supabase\.from\('departments'\)\.update\(dbUpdates\)\.eq\('id', id\);\n      if \(error\) throw error;\n      setDepartments\(departments\.map\(d => d\.id === id \? \{ \.\.\.d, \.\.\.updates \} : d\)\);\n      return \{ error: null \};/g,
`      const dbUpdates: any = { ...updates };
      delete dbUpdates.facultyCount;
      delete dbUpdates.studentCount;
      delete dbUpdates.id;
      
      let updateRes = await supabase.from('departments').update(dbUpdates).eq('id', id);
      
      if (updateRes.error && (updateRes.error.message?.includes('head') || updateRes.error.message?.includes('column') || updateRes.error.code === 'PGRST204')) {
         console.warn("Retrying without head column", updateRes.error);
         delete dbUpdates.head;
         updateRes = await supabase.from('departments').update(dbUpdates).eq('id', id);
      }

      if (updateRes.error) throw updateRes.error;
      setDepartments(departments.map(d => d.id === id ? { ...d, ...updates } : d));
      return { error: null };`
);

fs.writeFileSync('src/hooks/useDepartments.ts', content);
