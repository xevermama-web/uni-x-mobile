const fs = require('fs');
let code = fs.readFileSync('src/lib/notificationService.ts', 'utf-8');

const targetStart = `export function ensureDefaultDataSeeded() {`;
const targetEnd = `// Synchronous notification builder for local rendering fallback`;

const lines = code.split('\n');
let startIdx = lines.findIndex(l => l.startsWith('export function ensureDefaultDataSeeded() {'));
let endIdx = lines.findIndex(l => l.startsWith('// Synchronous notification builder for local rendering fallback'));

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `export function ensureDefaultDataSeeded() {
  try {
    localforage.getItem('unixx_notices').then(hasNotices => {
      if (!hasNotices) {
        const defaultNotices = [
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
        localforage.setItem('unixx_notices', defaultNotices);
      }
    }).catch(e => console.warn(e));

    if (!localStorage.getItem('unixx_students')) {
      const defaultStudents = [
        {
          id: 'stud-1401',
          name: 'Jane Smith',
          full_name: 'Jane Smith',
          department: 'Computer Science',
          batch: '14'
        }
      ];
      localStorage.setItem('unixx_students', JSON.stringify(defaultStudents));
    }

    if (!localStorage.getItem('unixx_attendance')) {
      const defaultAttendance = [
        { id: 'att-1', student_id: 'stud-1401', course_id: 'DBMS', status: 'absent', date: '2026-08-01' },
        { id: 'att-2', student_id: 'stud-1401', course_id: 'DBMS', status: 'absent', date: '2026-08-03' },
        { id: 'att-3', student_id: 'stud-1401', course_id: 'DBMS', status: 'present', date: '2026-08-05' },
        { id: 'att-4', student_id: 'stud-1401', course_id: 'DBMS', status: 'absent', date: '2026-08-07' }
      ];
      localStorage.setItem('unixx_attendance', JSON.stringify(defaultAttendance));
    }
  } catch (e) {
    console.warn("Error seeding default notification data:", e);
  }
}

`;
  lines.splice(startIdx, endIdx - startIdx, replacement);
  fs.writeFileSync('src/lib/notificationService.ts', lines.join('\n'));
}
