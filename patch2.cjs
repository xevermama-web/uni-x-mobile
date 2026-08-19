const fs = require('fs');
let code = fs.readFileSync('src/lib/notificationService.ts', 'utf-8');

const target = `    const rawNotices = localStorage.getItem('unixx_notices');
    const notices = rawNotices ? JSON.parse(rawNotices) : [];`;

const replace = `    const rawNotices = await localforage.getItem('unixx_notices');
    const notices = rawNotices ? (typeof rawNotices === 'string' ? JSON.parse(rawNotices) : rawNotices) : [];`;

code = code.split(target).join(replace);
fs.writeFileSync('src/lib/notificationService.ts', code);
