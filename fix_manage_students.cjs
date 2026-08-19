const fs = require('fs');

const lines = fs.readFileSync('src/pages/dashboard/ManageStudents.tsx', 'utf-8').split('\n');
const fixedLines = [];
let foundDupe = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("import { useState } from 'react';") && i > 100) {
    // Found the duplication start
    break;
  }
  fixedLines.push(lines[i]);
}

// Then find the modal from the rest of the file
const modalStartIdx = lines.findIndex((l, idx) => l.includes("{/* Add Student Modal */}") && idx > 100);

if (modalStartIdx !== -1) {
  fixedLines.push("      </div>");
  for (let i = modalStartIdx; i < lines.length; i++) {
    fixedLines.push(lines[i]);
  }
}

fs.writeFileSync('src/pages/dashboard/ManageStudents.tsx', fixedLines.join('\n'));
console.log("Fixed!");
