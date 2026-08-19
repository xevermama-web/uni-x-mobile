import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, Users, BookOpen, Loader2, Search, CheckCircle2, XCircle, Check, TrendingUp, CheckSquare } from 'lucide-react';
import { useDepartments } from '../../hooks/useDepartments';
import { useBatches } from '../../hooks/useBatches';
import { useCourses } from '../../hooks/useCourses';
import { useRoutinesForAttendance } from '../../hooks/useRoutinesForAttendance';
import { supabase } from '../../lib/supabase';
import { useAttendance } from '../../hooks/useAttendance';
import AdminAttendanceAnalytics from '../../components/attendance/AdminAttendanceAnalytics';

import StudentAttendance from './StudentAttendance';

export default function ManageAttendance() {
  const { user, role: contextRole } = useOutletContext<any>();
  const role = (
    contextRole ||
    user?.role ||
    user?.user_metadata?.role ||
    (user?.email === 'admin@unixx.com' ? 'admin' :
    localStorage.getItem('unixx_student_session') ? 'student' :
    localStorage.getItem('unixx_faculty_session') ? 'faculty' :
    localStorage.getItem('unixx_moderator_session') ? 'moderator' :
    localStorage.getItem('unixx_admin_session') === 'true' ? 'admin' : 'student')
  ).toLowerCase();

  if (role === 'student') {
    return <StudentAttendance />;
  }
  const [activeTab, setActiveTab] = useState<'take' | 'analytics'>('take');
  const { departments, loading: deptLoading } = useDepartments();
  const [selectedDept, setSelectedDept] = useState('');
  const { batches, loading: batchesLoading } = useBatches(selectedDept);
  const { courses, loading: coursesLoading } = useCourses();

  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedRoutine, setSelectedRoutine] = useState('');
  const [classDate, setClassDate] = useState(new Date().toISOString().split('T')[0]);

  const facultyName = user?.user_metadata?.full_name || 'Admin User';
  const selectedDeptId = departments.find(d => d.name === selectedDept)?.id || '';
  const { routines, loading: routinesLoading } = useRoutinesForAttendance(selectedDeptId, selectedBatch, classDate, facultyName);
  
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [attendanceData, setAttendanceData] = useState<Record<string, 'Present' | 'Absent'>>({});
  
  const { saveAttendance, loading: saving, error: saveError } = useAttendance();
  const [success, setSuccess] = useState(false);

  const handleFetchStudents = async () => {
    if (!selectedDept || !selectedBatch || !selectedRoutine || !classDate) return;
    
    setLoadingStudents(true);
    setSuccess(false);
    
    try {
      // Find students in the selected department and batch
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .eq('department', selectedDept)
        .eq('batch', selectedBatch)
        .order('full_name');
        
      if (error) throw error;
      
      setStudents(data || []);
      
      // Default to Present
      const initialData: Record<string, 'Present' | 'Absent'> = {};
      data?.forEach(s => {
        initialData[s.id] = 'Present';
      });
      setAttendanceData(initialData);
      
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const toggleStatus = (studentId: string, status: 'Present' | 'Absent') => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0 || !selectedRoutine) return;
    
    try {
      const routineObj = routines.find(r => r.id === selectedRoutine);
      if (!routineObj) {
        return;
      }

      let matchedCourse = courses.find(c => 
        c.title.toLowerCase() === routineObj.course.toLowerCase() || 
        c.course_code.toLowerCase() === routineObj.course.toLowerCase()
      );
      let courseId = matchedCourse?.id;

      if (!courseId) {
        const { data: dbCourse } = await supabase.from('courses').select('id').ilike('title', routineObj.course).maybeSingle();
        if (dbCourse) {
          courseId = dbCourse.id;
        } else {
          const { data: newCourse } = await supabase.from('courses').insert([
            { title: routineObj.course, course_code: routineObj.course.split(' ').map((w: string) => w[0]).join('').toUpperCase(), credits: 3 }
          ]).select().single();
          if (newCourse) courseId = newCourse.id;
        }
      }

      if (!courseId) {
        return;
      }

      const records = students.map(s => ({
        student_id: s.id,
        status: attendanceData[s.id] || 'Present'
      }));
      
      await saveAttendance({
        department_id: selectedDept,
        batch_id: selectedBatch,
        course_id: courseId,
        faculty_id: user?.id || '',
        class_date: classDate,
        class_time: `${routineObj.start_time} - ${routineObj.end_time}`
      }, records);
      
      setSuccess(true);
    } catch (err) {
      console.error('Error saving attendance:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Attendance System</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Take class attendance and view attendance analytics</p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 w-fit shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('take')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'take'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Take Attendance</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Attendance Analytics</span>
          </button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <AdminAttendanceAnalytics />
      ) : (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedBatch('');
                setSelectedRoutine('');
                setStudents([]);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 p-3"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => {
                setSelectedBatch(e.target.value);
                setSelectedRoutine('');
                setStudents([]);
              }}
              disabled={!selectedDept || batchesLoading}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 p-3 disabled:opacity-50"
            >
              <option value="">Select Batch</option>
              {batches.map((b, i) => (
                <option key={i} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Scheduled Class</label>
            <select
              value={selectedRoutine}
              onChange={(e) => setSelectedRoutine(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 p-3"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date</label>
            <input
              type="date"
              value={classDate}
              onChange={(e) => { setClassDate(e.target.value); setSelectedRoutine(''); setStudents([]); }}
              max={new Date().toISOString().split('T')[0]}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 p-3"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleFetchStudents}
            disabled={!selectedDept || !selectedBatch || !selectedRoutine || !classDate || loadingStudents}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loadingStudents ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Fetch Students
          </button>
        </div>
      </div>

      {saveError && (
        <div className="bg-rose-50 dark:bg-rose-950/50 text-rose-600 p-4 rounded-xl border border-rose-100 dark:border-rose-900/50 flex items-start gap-3">
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{saveError}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">Attendance successfully saved for {students.length} students.</p>
        </div>
      )}

      {students.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Student List</h2>
            <div className="flex gap-2">
               <button 
                onClick={() => {
                  const allPresent: Record<string, 'Present' | 'Absent'> = {};
                  students.forEach(s => { allPresent[s.id] = 'Present'; });
                  setAttendanceData(allPresent);
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
               >
                 Mark All Present
               </button>
            </div>
          </div>
          
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Student ID / Email</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">{student.academic_id || student.email}</td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-semibold">{student.full_name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border shadow-2xs ${
                        attendanceData[student.id] === 'Present' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700' 
                          : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          attendanceData[student.id] === 'Present' ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-rose-600 dark:bg-rose-400'
                        }`} />
                        {attendanceData[student.id]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleStatus(student.id, 'Present')}
                          className={`h-9 px-3 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer text-xs font-extrabold ${
                            attendanceData[student.id] === 'Present' 
                              ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-md shadow-emerald-600/30 border-2 border-emerald-600 dark:border-emerald-400' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-300 dark:border-slate-700'
                          }`}
                          title="Mark Present"
                        >
                          <Check className={`w-4 h-4 stroke-[3] ${
                            attendanceData[student.id] === 'Present' ? 'text-white dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'
                          }`} />
                          <span>Present</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(student.id, 'Absent')}
                          className={`h-9 px-3 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer text-xs font-extrabold ${
                            attendanceData[student.id] === 'Absent' 
                              ? 'bg-rose-600 text-white dark:bg-rose-500 dark:text-slate-950 shadow-md shadow-rose-600/30 border-2 border-rose-600 dark:border-rose-400' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-800 dark:hover:text-rose-300 border border-slate-300 dark:border-slate-700'
                          }`}
                          title="Mark Absent"
                        >
                          <XCircle className={`w-4 h-4 stroke-[2.5] ${
                            attendanceData[student.id] === 'Absent' ? 'text-white dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'
                          }`} />
                          <span>Absent</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Student Cards - Touch Friendly for Small Screens */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-3">
            {students.map((student) => (
              <div key={student.id} className="pt-3 first:pt-0 flex flex-col gap-2.5 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{student.full_name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{student.academic_id || student.email}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                    attendanceData[student.id] === 'Present' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  }`}>
                    {attendanceData[student.id]}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => toggleStatus(student.id, 'Present')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer ${
                      attendanceData[student.id] === 'Present'
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm border-2 border-emerald-600 dark:border-emerald-400'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <Check className={`w-4 h-4 stroke-[3] ${
                      attendanceData[student.id] === 'Present' ? 'text-white dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'
                    }`} />
                    <span>Present</span>
                  </button>
                  <button
                    onClick={() => toggleStatus(student.id, 'Absent')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer ${
                      attendanceData[student.id] === 'Absent'
                        ? 'bg-rose-600 text-white dark:bg-rose-500 dark:text-slate-950 shadow-sm border-2 border-rose-600 dark:border-rose-400'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <XCircle className={`w-4 h-4 stroke-[2.5] ${
                      attendanceData[student.id] === 'Absent' ? 'text-white dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'
                    }`} />
                    <span>Absent</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
             <button
                onClick={handleSaveAttendance}
                disabled={saving}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
             >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Attendance
             </button>
          </div>
        </motion.div>
      )}
        </div>
      )}
    </div>
  );
}
