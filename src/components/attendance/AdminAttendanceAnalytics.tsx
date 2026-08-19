import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';
import { Users, BookOpen, Calendar, TrendingUp, Filter, CheckCircle2, XCircle, Award, AlertTriangle } from 'lucide-react';
import { useDepartments } from '../../hooks/useDepartments';
import { useBatches } from '../../hooks/useBatches';
import { supabase } from '../../lib/supabase';

interface StudentAttendanceSummary {
  student_id: string;
  name: string;
  academic_id: string;
  department: string;
  batch: string;
  total_classes: number;
  attended_classes: number;
  absent_classes: number;
  percentage: number;
}

export default function AdminAttendanceAnalytics() {
  const { departments, loading: deptsLoading } = useDepartments();
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const { batches, loading: batchesLoading } = useBatches(selectedDept === 'all' ? '' : selectedDept);
  const [selectedBatch, setSelectedBatch] = useState<string>('all');

  const [loading, setLoading] = useState<boolean>(true);
  const [rawAttendance, setRawAttendance] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);

  // Fetch all profiles and attendance data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        // Fetch profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, name, academic_id, department, batch, role')
          .eq('role', 'student');

        setStudentsList(profiles || []);

        // Fetch attendance
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('id, student_id, course_id, status, date');

        // Fetch courses list
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id, title, course_code');

        const courseMap = new Map<string, any>();
        if (coursesData) {
          coursesData.forEach((c: any) => courseMap.set(c.id, c));
        }

        const formattedAttendance = (attendanceData || []).map((att: any) => ({
          ...att,
          courses: att.courses || courseMap.get(att.course_id) || { title: 'General Course', course_code: '' }
        }));

        setRawAttendance(formattedAttendance);
      } else {
        // Local storage / fallback data
        const localStudents = JSON.parse(localStorage.getItem('unixx_students') || '[]');
        setStudentsList(localStudents);
        const localAtt = JSON.parse(localStorage.getItem('unixx_attendance') || '[]');
        setRawAttendance(localAtt);
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset batch filter when department changes
  const handleDeptChange = (dept: string) => {
    setSelectedDept(dept);
    setSelectedBatch('all');
  };

  // Filter students based on selected Dept & Batch
  const filteredStudents = studentsList.filter(s => {
    const matchesDept = selectedDept === 'all' || !selectedDept || s.department === selectedDept;
    const matchesBatch = selectedBatch === 'all' || !selectedBatch || s.batch === selectedBatch;
    return matchesDept && matchesBatch;
  });

  const filteredStudentIds = new Set(filteredStudents.map(s => s.id));

  // Filter raw attendance to matching students
  const filteredAttendance = rawAttendance.filter(att => filteredStudentIds.has(att.student_id));

  // Metrics calculation
  const totalRecords = filteredAttendance.length;
  const presentRecords = filteredAttendance.filter(a => a.status?.toLowerCase() === 'present').length;
  const absentRecords = filteredAttendance.filter(a => a.status?.toLowerCase() === 'absent').length;
  const overallPercentage = totalRecords > 0 ? ((presentRecords / totalRecords) * 100) : 0;

  // Student level breakdown
  const studentSummaries: StudentAttendanceSummary[] = filteredStudents.map(s => {
    const studentRecords = filteredAttendance.filter(att => att.student_id === s.id);
    const total = studentRecords.length;
    const present = studentRecords.filter(att => att.status?.toLowerCase() === 'present').length;
    const absent = studentRecords.filter(att => att.status?.toLowerCase() === 'absent').length;
    const pct = total > 0 ? (present / total) * 100 : 0;

    return {
      student_id: s.id,
      name: s.full_name || s.name || 'Unknown Student',
      academic_id: s.academic_id || s.id || '-',
      department: s.department || selectedDept || '-',
      batch: s.batch || selectedBatch || '-',
      total_classes: total,
      attended_classes: present,
      absent_classes: absent,
      percentage: Math.round(pct * 10) / 10
    };
  });

  // Course-wise attendance stats for BarChart
  const courseStatsMap: Record<string, { title: string; present: number; total: number }> = {};
  filteredAttendance.forEach(att => {
    const courseTitle = att.courses?.title || att.courses?.course_code || 'General Course';
    if (!courseStatsMap[courseTitle]) {
      courseStatsMap[courseTitle] = { title: courseTitle, present: 0, total: 0 };
    }
    courseStatsMap[courseTitle].total += 1;
    if (att.status?.toLowerCase() === 'present') {
      courseStatsMap[courseTitle].present += 1;
    }
  });

  const courseChartData = Object.values(courseStatsMap).map(c => ({
    name: c.title.length > 20 ? `${c.title.substring(0, 18)}...` : c.title,
    fullName: c.title,
    percentage: c.total > 0 ? Math.round((c.present / c.total) * 100) : 0,
    present: c.present,
    total: c.total
  }));

  // Attendance Distribution Pie Chart Data
  let highCount = 0; // > 75%
  let midCount = 0;  // 60% - 75%
  let lowCount = 0;  // < 60%

  studentSummaries.forEach(s => {
    if (s.total_classes === 0) return;
    if (s.percentage > 75) highCount++;
    else if (s.percentage >= 60) midCount++;
    else lowCount++;
  });

  const pieChartData = [
    { name: 'Above 75% (Good)', value: highCount, color: '#10b981' },
    { name: '60% - 75% (Average)', value: midCount, color: '#3b82f6' },
    { name: 'Below 60% (At Risk)', value: lowCount, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Daily Trend Data
  const dateMap: Record<string, { date: string; present: number; total: number }> = {};
  filteredAttendance.forEach(att => {
    const d = att.date || 'Today';
    if (!dateMap[d]) {
      dateMap[d] = { date: d, present: 0, total: 0 };
    }
    dateMap[d].total += 1;
    if (att.status?.toLowerCase() === 'present') {
      dateMap[d].present += 1;
    }
  });

  const trendData = Object.values(dateMap)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      percentage: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0,
      total: d.total
    }));

  return (
    <div className="space-y-8">
      {/* Header & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800/90 p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Attendance Analytics</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Department and batch-level attendance performance metrics and reports
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/70 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filters</span>
            </div>

            {/* Department Filter */}
            <div className="min-w-[180px]">
              <select
                value={selectedDept}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Batch Filter */}
            <div className="min-w-[140px]">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="all">All Batches</option>
                {batches.map((b) => (
                  <option key={b} value={b}>Batch {b}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall Attendance</span>
            <div className={`p-2 rounded-xl ${overallPercentage >= 75 ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600' : overallPercentage >= 60 ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${overallPercentage >= 75 ? 'text-emerald-600' : overallPercentage >= 60 ? 'text-blue-600' : 'text-rose-600'}`}>
              {overallPercentage.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-medium">avg rate</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ${overallPercentage >= 75 ? 'bg-emerald-500' : overallPercentage >= 60 ? 'bg-blue-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, overallPercentage))}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Present Records</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{presentRecords}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">out of {totalRecords} logged entries</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Absent Records</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-rose-600">{absentRecords}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {totalRecords > 0 ? ((absentRecords / totalRecords) * 100).toFixed(1) : '0'}% absent rate
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Students Tracked</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{filteredStudents.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">in selected filter scope</p>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Attendance Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Course-wise Attendance Rate</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Average attendance % per course</p>
            </div>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>

          {courseChartData.length > 0 ? (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'Attendance Rate']}
                    contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="percentage" radius={[6, 6, 0, 0]} barSize={36}>
                    {courseChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.percentage >= 75 ? '#10b981' : entry.percentage >= 60 ? '#3b82f6' : '#ef4444'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-medium">
              No attendance records found for this filter
            </div>
          )}
        </div>

        {/* Student Performance Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Student Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Categorized by attendance threshold</p>
          </div>

          {pieChartData.length > 0 ? (
            <div className="h-64 w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${val} students`, 'Count']} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-medium">
              No student records available
            </div>
          )}
        </div>
      </div>

      {/* Attendance Trend Line/Area Chart */}
      {trendData.length > 1 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Date-wise Attendance Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Daily attendance percentage over time</p>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Daily Attendance']} />
                <Area type="monotone" dataKey="percentage" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAtt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Student List & Attendance Summary Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Student Attendance Directory</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Read-only student-wise attendance records</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {studentSummaries.length} Students
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">ID / Academic ID</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Batch</th>
                <th className="px-6 py-3.5 text-center">Attended / Total</th>
                <th className="px-6 py-3.5 text-right">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {studentSummaries.map((student) => {
                const isHigh = student.percentage > 75;
                const isMid = student.percentage >= 60 && student.percentage <= 75;
                const isLow = student.percentage < 60;

                return (
                  <tr key={student.student_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                      {student.academic_id}
                    </td>
                    <td className="px-6 py-4">
                      {student.department}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-md font-semibold">
                        Batch {student.batch}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      <span className="text-emerald-600 font-bold">{student.attended_classes}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-slate-700 dark:text-slate-300">{student.total_classes}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {student.total_classes > 0 ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs ${
                          isHigh 
                            ? 'bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50' 
                            : isMid 
                            ? 'bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50' 
                            : 'bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
                        }`}>
                          {isLow && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          {isHigh && <Award className="w-3 h-3 text-emerald-600" />}
                          {student.percentage}%
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No classes yet</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {studentSummaries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No students match the selected department and batch filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
