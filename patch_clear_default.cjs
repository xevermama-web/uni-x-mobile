const fs = require('fs');
let code = fs.readFileSync('src/lib/notificationService.ts', 'utf-8');

const target1 = `        const defaultNotices = [
          {
            id: 'notice-1',
            title: 'Department Head Meeting & Academic Review',
            content: 'All faculty members and student representatives are requested to attend the academic review meeting in Conference Room A.',
            department: 'Computer Science',
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            tag: 'INFO',
            tagColor: 'bg-blue-100 text-blue-800'
          },
          {
            id: 'notice-2',
            title: 'Midterm Examination Schedule Released',
            content: 'The upcoming midterm routine for all batches in Computer Science and Electrical Engineering has been updated.',
            department: 'ALL',
            createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
            tag: 'URGENT',
            tagColor: 'bg-rose-100 text-rose-800'
          }
        ];
        localforage.setItem('unixx_notices', defaultNotices);`;

const replace1 = `        // No demo notices to seed by default
        localforage.setItem('unixx_notices', []);`;

code = code.split(target1).join(replace1);

fs.writeFileSync('src/lib/notificationService.ts', code);
