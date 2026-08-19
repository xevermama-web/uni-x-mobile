const fs = require('fs');
let code = fs.readFileSync('src/hooks/useDashboardStats.ts', 'utf-8');

code = code.replace(/import { useState, useEffect } from 'react';/, `import { useState, useEffect } from 'react';\nimport localforage from 'localforage';`);

const target = `        const localNotices = JSON.parse(localStorage.getItem('unixx_notices') || '[]');`;
const replacement = `        const rawNotices = await localforage.getItem('unixx_notices');
        const localNotices = rawNotices ? (typeof rawNotices === 'string' ? JSON.parse(rawNotices) : rawNotices) : [];`;

code = code.split(target).join(replacement);
fs.writeFileSync('src/hooks/useDashboardStats.ts', code);
