const fs = require('fs');
let code = fs.readFileSync('src/lib/notificationService.ts', 'utf-8');

code = `import localforage from 'localforage';\n` + code;

const target1 = `    if (!localStorage.getItem('unixx_notices')) {`;
const replace1 = `    const hasNotices = await localforage.getItem('unixx_notices');
    if (!hasNotices) {`;
code = code.split(target1).join(replace1);

const target2 = `      localStorage.setItem('unixx_notices', JSON.stringify(defaultNotices));`;
const replace2 = `      await localforage.setItem('unixx_notices', defaultNotices);`;
code = code.split(target2).join(replace2);

const target3 = `    const rawNotices = localStorage.getItem('unixx_notices');
    const localNotices = rawNotices ? JSON.parse(rawNotices) : [];`;
const replace3 = `    const rawNotices = await localforage.getItem('unixx_notices');
    const localNotices = rawNotices ? (typeof rawNotices === 'string' ? JSON.parse(rawNotices) : rawNotices) : [];`;
code = code.split(target3).join(replace3);

const target4 = `    const rawLocalNotices = localStorage.getItem('unixx_notices');
    const localNotices = rawLocalNotices ? JSON.parse(rawLocalNotices) : [];`;
const replace4 = `    const rawLocalNotices = await localforage.getItem('unixx_notices');
    const localNotices = rawLocalNotices ? (typeof rawLocalNotices === 'string' ? JSON.parse(rawLocalNotices) : rawLocalNotices) : [];`;
code = code.split(target4).join(replace4);

fs.writeFileSync('src/lib/notificationService.ts', code);
