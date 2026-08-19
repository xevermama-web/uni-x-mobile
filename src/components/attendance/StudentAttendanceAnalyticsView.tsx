import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  Calendar, CheckCircle2, XCircle, TrendingUp, User, 
  GraduationCap, BookOpen, AlertTriangle, Check, ShieldCheck, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface StudentAttendanceAnalyticsViewProps {
  user: any;
  onClose?: () => void;
  isModal?: boolean;
}

export default function StudentAttendanceAnalyticsView({ user, onClose, isModal = false }: StudentAttendanceAnalyticsViewProps) {
  const [stats, setStats] = useState<any[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStudentDetailsAndAttendance();
    }
  }, [user]);

  const fetchStudentDetailsAndAttendance = async () => {
    setLoading(true);
    try {
      // 1. Fetch Student profile information (Name, Student ID, Department, Batch)
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, name, academic_id, department, batch, email')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setStudentInfo({
            name: profile.full_name || profile.name || user?.user_metadata?.full_name || user?.name || 'Student',
            id: profile.academic_id || profile.id || user?.id || '-',
            department: profile.department || user?.user_metadata?.department || 'Computer Science',
            batch: profile.batch || user?.user_metadata?.batch || '2024',
            email: profile.email || user?.email || ''
          });
        } else {
          setStudentInfo({
            name: user?.user_metadata?.full_name || user?.name || 'Student',
            id: user?.user_metadata?.academic_id || user?.id || '-',
            department: user?.user_metadata?.department || 'Computer Science',
            batch: user?.user_metadata?.batch || '2024',
            email: user?.email || ''
          });
        }

        // 2. Fetch authenticated student's attendance records
        let attendanceList: any[] = [];
        const { data: attendanceRecords, error: attErr } = await supabase
          .from('attendance')
          .select('id, status, date, course_id, student_id')
          .eq('student_id', user.id);

        if (!attErr && attendanceRecords) {
          attendanceList = attendanceRecords;
        } else {
          // Fallback to local storage if query fails or returns nothing
          const localAtt = JSON.parse(localStorage.getItem('unixx_attendance') || '[]');
          attendanceList = localAtt.filter((a: any) => a.student_id === user.id);
        }

        // Fetch courses for mapping course names safely
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id, title, course_code');

        const courseMap = new Map<string, any>();
        if (coursesData) {
          coursesData.forEach((c: any) => courseMap.set(c.id, c));
        }

        const formattedStats = attendanceList.map((att: any) => ({
          ...att,
          courses: att.courses || courseMap.get(att.course_id) || { title: 'General Course', course_code: '' }
        }));

        setStats(formattedStats);
      } else {
        // Fallback for local storage session
        const localStudents = JSON.parse(localStorage.getItem('unixx_students') || '[]');
        const found = localStudents.find((s: any) => s.id === user.id || s.email === user.email);
        
        setStudentInfo({
          name: found?.name || user?.name || user?.user_metadata?.full_name || 'Student',
          id: found?.academic_id || found?.id || '2024-5510',
          department: found?.department || 'Computer Science',
          batch: found?.batch || '2024',
          email: user?.email || ''
        });

        const localAtt = JSON.parse(localStorage.getItem('unixx_attendance') || '[]');
        const myAtt = localAtt.filter((a: any) => a.student_id === user.id || a.student_id === found?.id);
        setStats(myAtt);
      }
    } catch (err) {
      console.warn('Error fetching student attendance analytics, using local storage fallback:', err);
      // Local storage fallback
      const localAtt = JSON.parse(localStorage.getItem('unixx_attendance') || '[]');
      const myAtt = localAtt.filter((a: any) => a.student_id === user?.id);
      setStats(myAtt);
    } finally {
      setLoading(false);
    }
  };

  // Metric calculations
  const totalClasses = stats.length;
  const presentCount = stats.filter(s => s.status?.toLowerCase() === 'present').length;
  const absentCount = stats.filter(s => s.status?.toLowerCase() === 'absent').length;
  const attendancePctNum = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;
  const attendancePercentageStr = attendancePctNum.toFixed(1);

  // Determine Color Scheme strictly according to rules:
  // Less than 60% -> Red
  // 60% to 75% -> Blue
  // More than 75% -> Green
  let themeColor = '#10b981'; // Green
  let themeBgClass = 'bg-emerald-50 dark:bg-emerald-950/500';
  let themeTextClass = 'text-emerald-600';
  let themeBadgeBg = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50';
  let statusLabel = 'Excellent Attendance';

  if (attendancePctNum < 60) {
    themeColor = '#ef4444'; // Red
    themeBgClass = 'bg-rose-50 dark:bg-rose-950/500';
    themeTextClass = 'text-rose-600';
    themeBadgeBg = 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50';
    statusLabel = 'Low Attendance Warning';
  } else if (attendancePctNum <= 75) {
    themeColor = '#3b82f6'; // Blue
    themeBgClass = 'bg-blue-50 dark:bg-blue-950/500';
    themeTextClass = 'text-blue-600';
    themeBadgeBg = 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50';
    statusLabel = 'Average Attendance';
  }

  // Course-wise grouping
  const courseMap: Record<string, { title: string; total: number; present: number }> = {};
  stats.forEach(item => {
    const courseTitle = item.courses?.title || item.courses?.course_code || 'General Course';
    if (!courseMap[courseTitle]) {
      courseMap[courseTitle] = { title: courseTitle, total: 0, present: 0 };
    }
    courseMap[courseTitle].total += 1;
    if (item.status?.toLowerCase() === 'present') {
      courseMap[courseTitle].present += 1;
    }
  });

  const courseBreakdown = Object.values(courseMap).map(c => {
    const pct = c.total > 0 ? (c.present / c.total) * 100 : 0;
    return {
      title: c.title,
      total: c.total,
      present: c.present,
      absent: c.total - c.present,
      percentage: Math.round(pct * 10) / 10
    };
  });

  // Recharts Donut Data
  const donutData = [
    { name: 'Present', value: presentCount, color: themeColor },
    { name: 'Absent', value: absentCount, color: '#f1f5f9' }
  ];

  const content = (
    <div className="space-y-6">
      {/* Read-only Security Banner */}
      <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/80 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Strictly Read-Only Student Attendance Record</span>
        </div>
        <span className="text-[11px] bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
          Authenticated Student Access
        </span>
      </div>

      {/* Student Information Top Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-[24px] p-4 sm:p-6 md:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-50 dark:bg-indigo-950/500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-extrabold text-2xl flex-shrink-0 shadow-inner">
              {studentInfo?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black tracking-tight">{studentInfo?.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${themeBadgeBg}`}>
                  {statusLabel}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-mono bg-white dark:bg-slate-900/10 px-2.5 py-1 rounded-lg">
                  <User className="w-3.5 h-3.5 text-indigo-300" /> ID: {studentInfo?.id}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-300" /> {studentInfo?.department}
                </span>
                <span className="flex items-center gap-1.5 font-medium bg-indigo-50 dark:bg-indigo-950/500/20 px-2.5 py-1 rounded-lg border border-indigo-400/30">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-300" /> Batch {studentInfo?.batch}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Attendance Percentage Box */}
          <div className="bg-white dark:bg-slate-900/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[130px] self-stretch sm:self-auto flex flex-col justify-center">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Overall Rate</span>
            <span className={`text-3xl font-black mt-0.5 ${attendancePctNum >= 75 ? 'text-emerald-400' : attendancePctNum >= 60 ? 'text-blue-400' : 'text-rose-400'}`}>
              {attendancePercentageStr}%
            </span>
          </div>
        </div>
      </div>

      {/* Overall Attendance Metrics & Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Visual Donut/Gauge Graph */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800/90 shadow-2xs flex flex-col items-center justify-center text-center space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Overall Attendance Graph</h3>
          
          <div className="relative w-48 h-48 flex items-center justify-center">
            {totalClasses > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-40 h-40 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 text-xs font-medium">
                No Classes
              </div>
            )}

            {/* Centered Percentage Number */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-2xl font-black ${themeTextClass}`}>
                {attendancePercentageStr}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {presentCount} / {totalClasses}
              </span>
            </div>
          </div>

          {/* Color Threshold Rule Legend */}
          <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left">Color Threshold Rules</div>
            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
              <div className={`p-1.5 rounded-lg border text-center ${attendancePctNum < 60 ? 'bg-rose-100 text-rose-800 border-rose-300 ring-2 ring-rose-400/30' : 'bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}>
                &lt; 60% Red
              </div>
              <div className={`p-1.5 rounded-lg border text-center ${attendancePctNum >= 60 && attendancePctNum <= 75 ? 'bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-400/30' : 'bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}>
                60-75% Blue
              </div>
              <div className={`p-1.5 rounded-lg border text-center ${attendancePctNum > 75 ? 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/30' : 'bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}>
                &gt; 75% Green
              </div>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Classes</span>
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-2xl">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{totalClasses}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">scheduled class sessions</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attended Classes</span>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-2xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-emerald-600">{presentCount}</p>
              <p className="text-xs text-emerald-600/80 mt-1 font-medium">present records logged</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Absent Classes</span>
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-2xl">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-rose-600">{absentCount}</p>
              <p className="text-xs text-rose-600/80 mt-1 font-medium">missed class sessions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course-wise Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800/90 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">Course-wise Attendance Breakdown</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Performance in individual enrolled subjects</p>
          </div>
          <BookOpen className="w-5 h-5 text-slate-400" />
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Course Title</th>
                <th className="px-6 py-3.5 text-center">Total Classes</th>
                <th className="px-6 py-3.5 text-center">Attended</th>
                <th className="px-6 py-3.5 text-center">Absent</th>
                <th className="px-6 py-3.5 text-right">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {courseBreakdown.map((course) => {
                const isHigh = course.percentage > 75;
                const isMid = course.percentage >= 60 && course.percentage <= 75;

                return (
                  <tr key={course.title} className="hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                      {course.title}
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      {course.total}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">
                      {course.present}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-rose-600">
                      {course.absent}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs ${
                        isHigh 
                          ? 'bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50' 
                          : isMid 
                          ? 'bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50' 
                          : 'bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
                      }`}>
                        {course.percentage}%
                      </span>
                    </td>
                  </tr>
                );
              })}

              {courseBreakdown.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No course attendance records recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View for Course Breakdown */}
        <div className="block md:hidden p-3 space-y-3">
          {courseBreakdown.map((course) => {
            const isHigh = course.percentage > 75;
            const isMid = course.percentage >= 60 && course.percentage <= 75;

            return (
              <div key={course.title} className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">{course.title}</h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] shrink-0 ${
                    isHigh 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' 
                      : isMid 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300' 
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                  }`}>
                    {course.percentage}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{course.total}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Attended</span>
                    <span className="font-bold text-emerald-600">{course.present}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Absent</span>
                    <span className="font-bold text-rose-600">{course.absent}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {courseBreakdown.length === 0 && (
            <p className="py-6 text-center text-xs text-slate-400">No course attendance records recorded yet.</p>
          )}
        </div>
      </div>

      {/* Attendance History Log */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800/90 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Attendance Log History</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Chronological record of class attendance</p>
          </div>
          <Calendar className="w-5 h-5 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Course</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                    {item.date ? new Date(item.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                    {item.courses?.title || item.courses?.course_code || 'General Course'}
                  </td>
                  <td className="px-6 py-3.5">
                    {item.status?.toLowerCase() === 'present' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                        <Check className="w-3.5 h-3.5" /> Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                        <X className="w-3.5 h-3.5" /> Absent
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {stats.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                    No attendance logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-slate-50 dark:bg-slate-800/70 w-full max-w-4xl max-h-[85dvh] rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto p-4 sm:p-6 md:p-8 relative my-auto">
          {/* Modal Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6 sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-md z-20 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Student Attendance Analytics</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Read-only personal attendance summary</p>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-500 dark:text-slate-400 font-medium text-sm">
              Loading student attendance analytics...
            </div>
          ) : (
            content
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">Loading attendance analytics...</div>;
  }

  return content;
}
