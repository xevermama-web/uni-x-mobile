const fs = require('fs');

function patchFile(file) {
  let code = fs.readFileSync(file, 'utf-8');

  // Find the student row div
  const searchStr = 'className="cursor-pointer relative flex items-center justify-between p-2 hover:bg-white rounded-lg group transition-colors before:absolute before:top-1/2 before:left-[-15px] before:w-[11px] before:h-px before:bg-slate-200"';
  const replaceStr = 'className={`cursor-pointer relative flex items-center justify-between p-2 hover:bg-white rounded-lg group transition-colors before:absolute before:top-1/2 before:left-[-15px] before:w-[11px] before:h-px before:bg-slate-200 ${actionMenuOpen === student.id ? "z-50" : "z-0"}`}';
  
  code = code.replace(searchStr, replaceStr);

  // Also make sure z-50 is on the action menu dropdown itself
  code = code.replace(
    'className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20"',
    'className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-[100]"'
  );

  fs.writeFileSync(file, code);
}

patchFile('src/pages/dashboard/ManageStudents.tsx');
