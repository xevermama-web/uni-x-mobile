const fs = require('fs');
let code = fs.readFileSync('src/lib/notificationService.ts', 'utf-8');

const target1 = `export function ensureDefaultDataSeeded() {
  try {
    const hasNotices = await localforage.getItem('unixx_notices');
    if (!hasNotices) {`;
const replace1 = `export function ensureDefaultDataSeeded() {
  try {
    localforage.getItem('unixx_notices').then(hasNotices => {
      if (!hasNotices) {`;
code = code.split(target1).join(replace1);

const target1b = `      await localforage.setItem('unixx_notices', defaultNotices);
    }
  } catch (e) {
    console.warn("Error seeding default notification data:", e);
  }
}`;
const replace1b = `      localforage.setItem('unixx_notices', defaultNotices);
      }
    });
  } catch (e) {
    console.warn("Error seeding default notification data:", e);
  }
}`;
code = code.split(target1b).join(replace1b);

const target2 = `    const rawNotices = await localforage.getItem('unixx_notices');
    const notices = rawNotices ? (typeof rawNotices === 'string' ? JSON.parse(rawNotices) : rawNotices) : [];`;
const replace2 = `    const notices: any[] = [];`;
code = code.split(target2).join(replace2);

const target3 = `    const rawLocalNotices = await localforage.getItem('unixx_notices');
    const localNotices = rawLocalNotices ? (typeof rawLocalNotices === 'string' ? JSON.parse(rawLocalNotices) : rawLocalNotices) : [];`;
const replace3 = `    const localNotices: any[] = [];`;
code = code.split(target3).join(replace3);


fs.writeFileSync('src/lib/notificationService.ts', code);
