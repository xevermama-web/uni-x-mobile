const fs = require('fs');

function patchFile(file) {
  let code = fs.readFileSync(file, 'utf-8');

  // Remove overflow-hidden from Dept Container
  code = code.replace(
    /className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"/g,
    'className="bg-white border border-slate-200 rounded-xl shadow-sm"'
  );
  
  // Add rounded-t-xl to Dept Header button to prevent corners from bleeding
  code = code.replace(
    /className="w-full flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"/g,
    'className="w-full flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200 rounded-t-xl"'
  );

  // Fix Dept Animate (remove className="overflow-hidden", add it to framer motion states)
  code = code.replace(
    /<motion\.div\s*initial={{ height: 0 }}\s*animate={{ height: 'auto' }}\s*exit={{ height: 0 }}\s*className="overflow-hidden"/g,
    `<motion.div
                            initial={{ height: 0, overflow: 'hidden' }}
                            animate={{ height: 'auto', overflow: 'visible', transitionEnd: { overflow: 'visible' } }}
                            exit={{ height: 0, overflow: 'hidden' }}`
  );

  // Remove overflow-hidden from Batch Container
  code = code.replace(
    /className="ml-6 bg-slate-50\/50 border border-slate-100 rounded-lg overflow-hidden"/g,
    'className="ml-6 bg-slate-50/50 border border-slate-100 rounded-lg"'
  );
  
  // Add rounded-t-lg to Batch Header button
  code = code.replace(
    /className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 transition-colors border-b border-slate-100"/g,
    'className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 transition-colors border-b border-slate-100 rounded-t-lg"'
  );

  fs.writeFileSync(file, code);
}

patchFile('src/pages/dashboard/ManageStudents.tsx');
