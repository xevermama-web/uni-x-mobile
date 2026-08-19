const fs = require('fs');
let code = fs.readFileSync('src/hooks/useNotices.ts', 'utf-8');

const targetStr = `  const fetchNotices = async () => {
    setLoading(true);
    const localNotices = await getLocalNotices();`;

const replaceStr = `  const fetchNotices = async () => {
    setLoading(true);
    let localNotices = await getLocalNotices();
    // Filter out demo notices
    const demoIds = ['notice-1', 'notice-2'];
    if (localNotices.some(n => demoIds.includes(n.id))) {
       localNotices = localNotices.filter(n => !demoIds.includes(n.id));
       await setLocalNotices(localNotices);
    }`;

code = code.split(targetStr).join(replaceStr);
fs.writeFileSync('src/hooks/useNotices.ts', code);
