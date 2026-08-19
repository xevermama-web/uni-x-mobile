const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/ManageAttendance.tsx', 'utf8');

code = code.replace(
  `import { useCourses } from '../../hooks/useCourses';`,
  `import { useCourses } from '../../hooks/useCourses';\nimport { useRoutinesForAttendance } from '../../hooks/useRoutinesForAttendance';`
);

code = code.replace(
  `  const { courses, loading: coursesLoading } = useCourses();\n  \n  const [selectedBatch, setSelectedBatch] = useState('');\n  const [selectedCourse, setSelectedCourse] = useState('');`,
  `  const { courses, loading: coursesLoading } = useCourses();\n\n  const [selectedBatch, setSelectedBatch] = useState('');\n  const [selectedRoutine, setSelectedRoutine] = useState('');`
);

code = code.replace(
  `  const [classDate, setClassDate] = useState(new Date().toISOString().split('T')[0]);`,
  `  const [classDate, setClassDate] = useState(new Date().toISOString().split('T')[0]);\n\n  const facultyName = user?.user_metadata?.full_name || 'Admin User';\n  const selectedDeptId = departments.find(d => d.name === selectedDept)?.id || '';\n  const { routines, loading: routinesLoading } = useRoutinesForAttendance(selectedDeptId, selectedBatch, classDate, facultyName);`
);

code = code.replace(
  `    if (!selectedDept || !selectedBatch || !selectedCourse || !classDate) return;`,
  `    if (!selectedDept || !selectedBatch || !selectedRoutine || !classDate) return;`
);

code = code.replace(
  `            disabled={!selectedDept || !selectedBatch || !selectedCourse || !classDate || loadingStudents}`,
  `            disabled={!selectedDept || !selectedBatch || !selectedRoutine || !classDate || loadingStudents}`
);

const oldCourseSelect = `          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 p-3"
              disabled={coursesLoading}
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title} ({course.course_code})</option>
              ))}
            </select>
          </div>`;

const newRoutineSelect = `          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Scheduled Class</label>
            <select
              value={selectedRoutine}
              onChange={(e) => setSelectedRoutine(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 p-3"
              disabled={routinesLoading || !selectedDept || !selectedBatch || !classDate}
            >
              <option value="">Select Class</option>
              {routines.map(routine => (
                <option key={routine.id} value={routine.id}>
                  {routine.course} ({routine.start_time} - {routine.end_time}, Room: {routine.room})
                </option>
              ))}
              {routines.length === 0 && !routinesLoading && selectedDept && selectedBatch && classDate && (
                <option disabled>No classes scheduled for this date</option>
              )}
            </select>
          </div>`;

code = code.replace(oldCourseSelect, newRoutineSelect);

const saveLogicOld = `        await saveAttendance({
        department_id: selectedDept,
        batch_id: selectedBatch,
        course_id: selectedCourse,
        faculty_id: user.id,
        class_date: classDate,
        class_time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      }, records);`;

const saveLogicNew = `        const routineObj = routines.find(r => r.id === selectedRoutine);
        const matchedCourse = courses.find(c => c.title === routineObj?.course);
        if (!matchedCourse) {
          alert('Error: Course "'+ (routineObj?.course || 'Unknown') +'" not found in database. Cannot save attendance.');
          return;
        }

        await saveAttendance({
          department_id: selectedDept,
          batch_id: selectedBatch,
          course_id: matchedCourse.id,
          faculty_id: user.id,
          class_date: classDate,
          class_time: routineObj?.start_time + ' - ' + routineObj?.end_time
        }, records);`;

code = code.replace(saveLogicOld, saveLogicNew);

code = code.replace(
  `                setSelectedBatch('');\n                setStudents([]);\n              }}`,
  `                setSelectedBatch('');\n                setSelectedRoutine('');\n                setStudents([]);\n              }}`
);
code = code.replace(
  `                setSelectedBatch(e.target.value);\n                setStudents([]);\n              }}`,
  `                setSelectedBatch(e.target.value);\n                setSelectedRoutine('');\n                setStudents([]);\n              }}`
);
code = code.replace(
  `              onChange={(e) => setClassDate(e.target.value)}`,
  `              onChange={(e) => { setClassDate(e.target.value); setSelectedRoutine(''); setStudents([]); }}`
);

fs.writeFileSync('src/pages/dashboard/ManageAttendance.tsx', code);
