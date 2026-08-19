const fs = require('fs');
let code = fs.readFileSync('src/hooks/useStudents.ts', 'utf-8');

const target = `        if (upsertError) {
          console.error("Profile upsert error:", upsertError);
        }`;

const replacement = `        if (upsertError) {
          console.error("Profile upsert error:", upsertError);
          // If upsert failed, the profile wasn't created properly
          throw new Error("Profile creation failed: " + (upsertError.message || JSON.stringify(upsertError)));
        }`;

code = code.replace(target, replacement);

const target2 = `      if (existingProfile) {
        throw new Error("Student ID already exists.");
      }`;

const replacement2 = `      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        throw new Error("Database error: " + (profileCheckError.message || JSON.stringify(profileCheckError)));
      }
      if (existingProfile) {
        throw new Error("Student ID already exists.");
      }`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/hooks/useStudents.ts', code);
