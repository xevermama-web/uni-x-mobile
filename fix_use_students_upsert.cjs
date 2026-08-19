const fs = require('fs');
let code = fs.readFileSync('src/hooks/useStudents.ts', 'utf-8');

const target = `      if (authData?.user) {
        // The trigger creates the profile, but doesn't set academic_id, so we update it here
        await supabase
          .from('profiles')
          .update({ academic_id: newStudent.id })
          .eq('id', authData.user.id);
      }`;

const replacement = `      if (authData?.user) {
        // Explicitly ensure the profile is created using the main client
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ 
            id: authData.user.id,
            full_name: newStudent.name,
            role: 'student',
            department: newStudent.department,
            batch: newStudent.batch,
            academic_id: newStudent.id,
            email: newStudent.email
          });
          
        if (upsertError) {
          console.error("Profile upsert error:", upsertError);
        }
      }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/hooks/useStudents.ts', code);
console.log("Updated useStudents.ts to upsert profile.");
