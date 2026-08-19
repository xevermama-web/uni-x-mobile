const fs = require('fs');
let code = fs.readFileSync('src/lib/notificationService.ts', 'utf-8');

const target1 = `    const localNotices: any[] = [];

    // Fallback if not connected`;
const replace1 = `    let localNotices: any[] = [];
    try {
      const rawLocalNotices = await localforage.getItem('unixx_notices');
      localNotices = rawLocalNotices ? (typeof rawLocalNotices === 'string' ? JSON.parse(rawLocalNotices) : rawLocalNotices) : [];
    } catch(e) {}

    // Fallback if not connected`;
code = code.split(target1).join(replace1);

fs.writeFileSync('src/lib/notificationService.ts', code);
