import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Users, 
  X, 
  Plus,
  MoreHorizontal,
  Megaphone,
  UserCheck,
  Zap,
  ChevronDown,
  BarChart2,
  CheckSquare,
  MapPin,
  ArrowRight,
  Sparkles, Download, FileText
} from 'lucide-react';
import { useNotices, Notice } from '../../hooks/useNotices';
import { useRoutines } from '../../hooks/useRoutines';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useDepartments } from '../../hooks/useDepartments';
import { parseTimeToMinutes, getDhakaCurrentMinutes, getDhakaDayOfWeek, getClassStatus } from '../../utils/routineTime';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useOutletContext<any>();
  const { notices, loading: noticesLoading } = useNotices();
  const { routines } = useRoutines();
  const { departments } = useDepartments();
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const role = useMemo(() => {
    if (user?.role) return user.role.toLowerCase();
    if (user?.user_metadata?.role) return user.user_metadata.role.toLowerCase();
    if (user?.email === 'admin@unixx.com') return 'admin';

    const studSess = localStorage.getItem('unixx_student_session');
    if (studSess) return 'student';

    const facSess = localStorage.getItem('unixx_faculty_session');
    if (facSess) return 'faculty';

    const modSess = localStorage.getItem('unixx_moderator_session');
    if (modSess) return 'moderator';

    const adminSess = localStorage.getItem('unixx_admin_session');
    if (adminSess === 'true') return 'admin';

    return 'student';
  }, [user]);

  const { stats: realStats, loading: statsLoading } = useDashboardStats(role);

  const isAdmin = role === 'admin';
  const isFaculty = role === 'faculty';
  const isModerator = role === 'moderator';
  const isStudent = role === 'student';

  const roleTitle = isAdmin ? 'Admin' : isFaculty ? (user?.full_name?.split(' ')[0] || 'Faculty') : isModerator ? 'Moderator' : (user?.full_name?.split(' ')[0] || 'Student');

  // Stats definition matching reference UI design
  const stats = isAdmin ? [
    { 
      label: "Total Students", 
      value: statsLoading ? "7" : (realStats.students || 7).toString(), 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-blue-100/70", 
      trend: "16.7% from last month", 
      trendUp: true,
      sparklineColor: "#3B82F6",
      sparklinePath: "M0,25 Q15,10 30,22 T60,8 T90,18 T120,5"
    },
    { 
      label: "Total Faculty", 
      value: statsLoading ? "3" : (realStats.faculty || 3).toString(), 
      icon: UserCheck, 
      color: "text-purple-600", 
      bg: "bg-purple-100/70", 
      trend: "No change", 
      trendUp: null,
      sparklineColor: "#A855F7",
      sparklinePath: "M0,15 Q20,20 40,10 T80,18 T120,12"
    },
    { 
      label: "Active Courses", 
      value: statsLoading ? "12" : (realStats.courses || 12).toString(), 
      icon: BookOpen, 
      color: "text-emerald-600", 
      bg: "bg-emerald-100/70", 
      trend: "No change", 
      trendUp: null,
      sparklineColor: "#10B981",
      sparklinePath: "M0,20 Q20,22 40,15 T80,12 T120,8"
    },
    { 
      label: "Total Notices", 
      value: statsLoading ? "2" : (realStats.notices || 2).toString(), 
      icon: Megaphone, 
      color: "text-amber-600", 
      bg: "bg-amber-100/70", 
      trend: "100% from last month", 
      trendUp: true,
      sparklineColor: "#F59E0B",
      sparklinePath: "M0,28 Q15,18 30,20 T60,10 T90,14 T120,4"
    }
  ] : isFaculty ? [
    { label: "Active Courses", value: statsLoading ? "12" : (realStats.courses || 12).toString(), icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100/70", trend: "No change", trendUp: null, sparklineColor: "#3B82F6", sparklinePath: "M0,20 Q20,15 40,18 T80,10 T120,5" },
    { label: "Total Students", value: statsLoading ? "7" : (realStats.students || 7).toString(), icon: Users, color: "text-purple-600", bg: "bg-purple-100/70", trend: "5% from last month", trendUp: true, sparklineColor: "#A855F7", sparklinePath: "M0,25 Q15,12 30,20 T60,8 T90,15 T120,5" },
    { label: "Pending Grades", value: "0", icon: Clock, color: "text-amber-600", bg: "bg-amber-100/70", trend: "No change", trendUp: null, sparklineColor: "#F59E0B", sparklinePath: "M0,15 Q20,18 40,12 T80,15 T120,10" },
    { label: "Avg Attendance", value: "94%", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100/70", trend: "2% increase", trendUp: true, sparklineColor: "#10B981", sparklinePath: "M0,22 Q20,18 40,12 T80,10 T120,4" }
  ] : isModerator ? [
    { label: "Departments", value: statsLoading ? "4" : (realStats.departments || 4).toString(), icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100/70", trend: "No change", trendUp: null, sparklineColor: "#3B82F6", sparklinePath: "M0,20 Q20,15 40,18 T80,10 T120,5" },
    { label: "Managed Faculty", value: statsLoading ? "3" : (realStats.faculty || 3).toString(), icon: UserCheck, color: "text-purple-600", bg: "bg-purple-100/70", trend: "2% from last month", trendUp: true, sparklineColor: "#A855F7", sparklinePath: "M0,25 Q15,12 30,20 T60,8 T90,15 T120,5" },
    { label: "Active Routines", value: "12", icon: CalendarIcon, color: "text-emerald-600", bg: "bg-emerald-100/70", trend: "No change", trendUp: null, sparklineColor: "#10B981", sparklinePath: "M0,15 Q20,18 40,12 T80,15 T120,10" },
    { label: "Total Notices", value: statsLoading ? "2" : (realStats.notices || 2).toString(), icon: Megaphone, color: "text-amber-600", bg: "bg-amber-100/70", trend: "100% increase", trendUp: true, sparklineColor: "#F59E0B", sparklinePath: "M0,28 Q15,18 30,20 T60,10 T90,14 T120,4" }
  ] : [
    { label: "Enrolled Courses", value: "6", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100/70", trend: "No change", trendUp: null, sparklineColor: "#3B82F6", sparklinePath: "M0,20 Q20,15 40,18 T80,10 T120,5" },
    { label: "Pending Tasks", value: "2", icon: Clock, color: "text-amber-600", bg: "bg-amber-100/70", trend: "Due soon", trendUp: false, sparklineColor: "#F59E0B", sparklinePath: "M0,10 Q20,18 40,12 T80,22 T120,18" },
    { label: "Overall Attendance", value: "92%", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100/70", trend: "3% increase", trendUp: true, sparklineColor: "#10B981", sparklinePath: "M0,22 Q20,18 40,12 T80,10 T120,4" },
    { label: "Current CGPA", value: "3.85", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100/70", trend: "Top 5%", trendUp: true, sparklineColor: "#A855F7", sparklinePath: "M0,25 Q15,12 30,20 T60,8 T90,15 T120,5" }
  ];

  const [currentDhakaMinutes, setCurrentDhakaMinutes] = useState(() => getDhakaCurrentMinutes());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDhakaMinutes(getDhakaCurrentMinutes());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const today = getDhakaDayOfWeek();

  // Filter today's class routines from useRoutines hook
  const todaysClassRoutines = useMemo(() => {
    if (!routines || routines.length === 0) return [];
    
    // Match today's day of week
    const matchingDay = routines.filter(r => 
      r.dayOfWeek && r.dayOfWeek.toLowerCase() === today.toLowerCase()
    );

    // If user has department/batch metadata, try to filter for them
    const studentDept = user?.department || user?.department_id || user?.user_metadata?.department;
    const studentBatch = user?.batch || user?.user_metadata?.batch;

    let filtered = matchingDay;
    if (studentDept && filtered.some(r => r.departmentId === studentDept)) {
      filtered = filtered.filter(r => r.departmentId === studentDept);
    }
    if (studentBatch && filtered.some(r => r.batch === studentBatch)) {
      filtered = filtered.filter(r => r.batch === studentBatch);
    }

    return filtered.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  }, [routines, today, user]);

  // Default student schedule if no published routine in DB for today
  const defaultStudentSchedule = [
    {
      startTime: "09:00 AM",
      endTime: "10:30 AM",
      course: "Database Systems (CSE-301)",
      location: "Room 301 • Dr. Sarah Khan",
      iconBg: "bg-blue-100 text-blue-600",
      nodeColor: "bg-blue-600 ring-blue-100"
    },
    {
      startTime: "11:00 AM",
      endTime: "12:30 PM",
      course: "Data Structures & Algorithms",
      location: "Room 204 • Prof. Ahmed",
      iconBg: "bg-purple-100 text-purple-600",
      nodeColor: "bg-purple-600 ring-purple-100"
    },
    {
      startTime: "02:00 PM",
      endTime: "03:30 PM",
      course: "Software Engineering Lab",
      location: "Computer Lab 2 • Ms. Farhana",
      iconBg: "bg-emerald-100 text-emerald-600",
      nodeColor: "bg-emerald-600 ring-emerald-100"
    }
  ];

  // Reference schedule matching admin/staff screenshot
  const defaultSchedule = [
    { 
      startTime: "09:00 AM", 
      endTime: "10:00 AM", 
      title: "Department Head Meeting", 
      location: "Conference Room A",
      iconBg: "bg-blue-100 text-blue-600",
      nodeColor: "bg-blue-600 ring-blue-100"
    },
    { 
      startTime: "11:30 AM", 
      endTime: "12:30 PM", 
      title: "Faculty Review", 
      location: "Admin Block",
      iconBg: "bg-purple-100 text-purple-600",
      nodeColor: "bg-purple-600 ring-purple-100"
    },
    { 
      startTime: "02:00 PM", 
      endTime: "03:00 PM", 
      title: "System Maintenance", 
      location: "Server Room",
      iconBg: "bg-amber-100 text-amber-600",
      nodeColor: "bg-amber-600 ring-amber-100"
    }
  ];

  // Quick Action navigation mapping
  const getNavPath = (path: string) => {
    if (role === 'faculty') return `/faculty-dashboard${path}`;
    if (role === 'moderator') return `/moderator-dashboard${path}`;
    return `/dashboard${path}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10 font-sans">
      {/* 1. Header Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 lg:p-8 bg-slate-900 text-white shadow-xl border border-slate-800">
        {/* Dynamic Colorful Textured Mesh Overlay */}
        <div 
          className={`absolute inset-0 opacity-90 transition-all duration-500 bg-gradient-to-r ${
            role === 'admin' 
              ? 'from-rose-600/90 via-purple-700/80 to-amber-600/90 dark:from-rose-950 dark:via-purple-950 dark:to-amber-950' 
              : role === 'faculty'
              ? 'from-blue-600/90 via-indigo-700/80 to-cyan-600/90 dark:from-blue-950 dark:via-indigo-950 dark:to-cyan-950'
              : role === 'moderator'
              ? 'from-purple-600/90 via-violet-700/80 to-emerald-600/90 dark:from-purple-950 dark:via-violet-950 dark:to-emerald-950'
              : 'from-blue-600/90 via-indigo-600/80 to-purple-600/90 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950'
          }`}
        />

        {/* Ambient Radial Glowing Light Orbs */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 right-1/4 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Geometric Dot & Mesh Pattern Overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none [background-image:radial-gradient(#ffffff_1.2px,transparent_1.2px)] [background-size:20px_20px]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {role === 'admin' ? '🛡️ Admin Command Center' : role === 'faculty' ? '🎓 Faculty Academic Portal' : role === 'moderator' ? '⚡ Moderator Operations' : '✨ Student Study Portal'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/20 backdrop-blur-md text-slate-200 border border-white/10">
                Uni-X Portal • {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-sm flex items-center gap-2">
              Welcome back, {roleTitle}! <span className="animate-bounce inline-block">👋</span>
            </h1>

            <p className="text-slate-100/90 text-sm lg:text-base font-medium leading-relaxed max-w-xl">
              {role === 'admin' 
                ? 'Full administrative overview of students, course schedules, study groups, and system permissions.'
                : role === 'faculty'
                ? 'Manage your assigned classes, attendance logs, course materials, and student group chats.'
                : role === 'moderator'
                ? 'Monitor active campus study groups, notice announcements, and group chat moderation.'
                : 'Track your class routines, study groups, course materials, notice board, and peer discussions.'}
            </p>
          </div>

          {/* Banner 3D Graphic Card */}
          <div className="relative w-full lg:w-[360px] h-32 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden flex items-center justify-between px-6 py-4 group hover:border-white/40 transition-all">
            <div className="space-y-1 z-10 max-w-[180px]">
              <span className="text-[10px] font-extrabold tracking-widest uppercase text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-300/30">Uni-X Smart System</span>
              <p className="text-xs font-bold text-white leading-snug mt-1">Smart Academic Management Engine</p>
              <div className="text-[11px] text-slate-200 font-medium flex items-center gap-1 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Real-time Sync Active
              </div>
            </div>
            
            {/* Custom CSS/SVG 3D Graphic */}
            <div className="relative w-32 h-24 flex items-center justify-center">
              {/* Soft Glow */}
              <div className="absolute w-20 h-20 bg-amber-400/30 rounded-full blur-xl animate-pulse" />
              
              {/* 3D Bar Chart Visual */}
              <div className="absolute right-1 bottom-2 flex items-end gap-1.5 opacity-90">
                <div className="w-3 h-10 bg-gradient-to-t from-blue-500 to-cyan-300 rounded-t-md shadow-md transform -skew-x-6" />
                <div className="w-3 h-14 bg-gradient-to-t from-amber-500 to-yellow-300 rounded-t-md shadow-md transform -skew-x-6" />
                <div className="w-3 h-11 bg-gradient-to-t from-emerald-500 to-teal-300 rounded-t-md shadow-md transform -skew-x-6" />
              </div>

              {/* 3D Graduation Cap Visual */}
              <div className="absolute left-0 top-1 transform -rotate-12 group-hover:rotate-0 transition-transform duration-300">
                <div className="relative">
                  <div className="w-14 h-7 bg-slate-900 rounded-sm shadow-lg transform rotate-45 border border-slate-600" />
                  <div className="absolute top-2.5 left-2.5 w-9 h-5 bg-slate-800 rounded-b-md shadow-inner" />
                  <div className="absolute top-1.5 left-7 w-1.5 h-6 bg-amber-400 rounded-full shadow-2xs" />
                  <div className="absolute top-7 left-7 w-2.5 h-2.5 bg-amber-400 rounded-full" />
                </div>
              </div>

              <Sparkles className="absolute top-0 right-0 w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Metric Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all relative flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <button className="text-slate-300 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">{stat.value}</h3>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs font-semibold flex items-center gap-1">
                {stat.trendUp === true ? (
                  <span className="text-emerald-600 flex items-center font-bold">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    {stat.trend}
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">
                    &mdash; {stat.trend}
                  </span>
                )}
              </div>

              {/* Sparkline Graphic */}
              <div className="w-16 h-8 flex items-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 120 30">
                  <path 
                    d={stat.sparklinePath} 
                    fill="none" 
                    stroke={stat.sparklineColor} 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3. Middle Grid Section */}
      <div className={`grid ${isAdmin ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6 items-stretch`}>
        {/* Left Column (2/3 width): Today's Schedule */}
        {!isAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 lg:p-7 flex flex-col justify-between space-y-6 h-full"
          >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {isStudent ? "Today's Class Routine" : "Today's Schedule"}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {today}, {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isStudent && (
                <Link 
                  to={getNavPath("/routines")}
                  className="bg-blue-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Routine
                </Link>
              )}
              <Link 
                to={getNavPath("/routines")}
                className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold text-xs px-3 py-2.5 rounded-xl hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
              >
                {isStudent ? 'Full Routine' : 'View All'}
              </Link>
            </div>
          </div>

          {/* Schedule List */}
          <div className="space-y-4 relative pl-2 flex-1 flex flex-col justify-center">
            {/* Timeline Vertical Line */}
            <div className="absolute left-[58px] sm:left-[78px] top-3 bottom-3 w-0.5 bg-slate-100 dark:bg-slate-800" />

            {todaysClassRoutines.length > 0 ? (
              todaysClassRoutines.map((item, idx) => {
                const status = getClassStatus(item.startTime, item.endTime, currentDhakaMinutes);
                return (
                  <div key={item.id || idx} className="flex items-start sm:items-center gap-2.5 sm:gap-4 relative group">
                    {/* Time Range */}
                    <div className="w-[58px] sm:w-[68px] text-right flex-shrink-0 pt-1 sm:pt-0">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">{item.startTime}</p>
                      <p className="text-[9px] sm:text-[10px] font-medium text-slate-400">{item.endTime}</p>
                    </div>

                    {/* Timeline Dot */}
                    <div className="relative z-10 flex-shrink-0 pt-1.5 sm:pt-0">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                        status === 'ONGOING' ? 'bg-emerald-500 ring-emerald-200' :
                        status === 'UPCOMING' ? 'bg-blue-600 ring-blue-100' : 'bg-slate-400 ring-slate-100'
                      }`} />
                    </div>

                    {/* Event Card */}
                    <div className="flex-1 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 sm:p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{item.course}</h4>
                          <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                            Room {item.room} {item.facultyName ? `• ${item.facultyName}` : ''} {item.batch ? `• Batch ${item.batch}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {status === 'ONGOING' ? (
                        <span className="bg-emerald-100/80 text-emerald-700 font-bold text-[10px] sm:text-[11px] px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1 self-start sm:self-center flex-shrink-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Ongoing
                        </span>
                      ) : status === 'UPCOMING' ? (
                        <span className="bg-blue-100/80 text-blue-700 font-bold text-[10px] sm:text-[11px] px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1 self-start sm:self-center flex-shrink-0">
                          <Clock className="w-3 h-3 text-blue-600" /> Upcoming
                        </span>
                      ) : (
                        <span className="bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold text-[10px] sm:text-[11px] px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1 self-start sm:self-center flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-slate-500" /> Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : isStudent ? (
              defaultStudentSchedule.map((item, idx) => {
                const status = getClassStatus(item.startTime, item.endTime, currentDhakaMinutes);
                return (
                  <div key={idx} className="flex items-start sm:items-center gap-2.5 sm:gap-4 relative group">
                    <div className="w-[58px] sm:w-[68px] text-right flex-shrink-0 pt-1 sm:pt-0">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">{item.startTime}</p>
                      <p className="text-[9px] sm:text-[10px] font-medium text-slate-400">{item.endTime}</p>
                    </div>

                    <div className="relative z-10 flex-shrink-0 pt-1.5 sm:pt-0">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                        status === 'ONGOING' ? 'bg-emerald-500 ring-emerald-200' :
                        status === 'UPCOMING' ? 'bg-blue-600 ring-blue-100' : 'bg-slate-400 ring-slate-100'
                      }`} />
                    </div>

                    <div className="flex-1 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 sm:p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${item.iconBg} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{item.course}</h4>
                          <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                            {item.location}
                          </p>
                        </div>
                      </div>

                      {status === 'ONGOING' ? (
                        <span className="bg-emerald-100/80 text-emerald-700 font-bold text-[10px] sm:text-[11px] px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1 self-start sm:self-center flex-shrink-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Ongoing
                        </span>
                      ) : status === 'UPCOMING' ? (
                        <span className="bg-blue-100/80 text-blue-700 font-bold text-[10px] sm:text-[11px] px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1 self-start sm:self-center flex-shrink-0">
                          <Clock className="w-3 h-3 text-blue-600" /> Upcoming
                        </span>
                      ) : (
                        <span className="bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold text-[10px] sm:text-[11px] px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1 self-start sm:self-center flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-slate-500" /> Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              defaultSchedule.map((item, idx) => (
                <div key={idx} className="flex items-start sm:items-center gap-2.5 sm:gap-4 relative group">
                  {/* Time Range */}
                  <div className="w-[58px] sm:w-[68px] text-right flex-shrink-0 pt-1 sm:pt-0">
                    <p className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">{item.startTime}</p>
                    <p className="text-[9px] sm:text-[10px] font-medium text-slate-400">{item.endTime}</p>
                  </div>

                  {/* Timeline Dot */}
                  <div className="relative z-10 flex-shrink-0 pt-1.5 sm:pt-0">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${item.nodeColor}`} />
                  </div>

                  {/* Event Card */}
                  <div className="flex-1 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 sm:p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${item.iconBg} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                        <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</h4>
                        <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                          {item.location}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className="bg-emerald-100/80 text-emerald-700 font-bold text-[10px] sm:text-[11px] px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1 self-start sm:self-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" /> Completed
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Link */}
          <div className="pt-2 text-center">
            <Link 
              to={getNavPath("/routines")} 
              className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold text-xs px-5 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700 inline-flex items-center gap-1.5 transition-colors"
            >
              View Full Routine <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
        )}

        {/* Right Column (1/3 width): Notice Board & Quick Actions */}
        <div className={`flex flex-col gap-6 ${isAdmin ? 'lg:flex-row' : ''}`}>
          {/* Notice Board */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4 ${isAdmin ? 'flex-1' : ''}`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" /> Notice Board
              </h3>
              <Link to={getNavPath("/notices")} className="text-blue-600 font-semibold text-xs hover:underline">
                View All
              </Link>
            </div>

            {noticesLoading ? (
              <div className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Loading notices...
              </div>
            ) : notices.length > 0 ? (
              <div className="flex flex-col gap-3">
                {notices.slice(0, 3).map((notice, idx) => (
                  <div key={notice.id || idx} className="border-l-[3.5px] border-l-blue-600 bg-slate-50/70 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`${notice.tagColor || 'bg-blue-100 text-blue-700'} font-bold text-[10px] px-2.5 py-0.5 rounded-md uppercase tracking-wider`}>
                        {notice.tag || 'INFO'}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3 text-slate-400" /> {new Date(notice.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{notice.title}</h4>
                      <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                        👤 {notice.department}
                      </p>
                    </div>

                    {notice.type === 'image' && (
                      <div className="relative mt-2 w-full h-24 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden group">
                        {notice.content.match(/data:application\/|\.pdf|\.doc/i) ? (
                           <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400">
                             <FileText className="w-6 h-6 mb-1 text-red-400" />
                             <span className="text-[10px] font-medium text-slate-500">Document Attached</span>
                           </div>
                        ) : (
                           <img src={notice.content} alt={notice.title} loading="lazy" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" onError={(e) => {
                             (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Attachment';
                           }} />
                        )}
                        <a 
                          href={notice.content} 
                          download={notice.title.replace(/\s+/g, '_') + (notice.content.match(/data:application\/|\.pdf|\.doc/i) ? '.pdf' : '.png')}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-1 right-1 p-1 bg-white/90 text-slate-700 rounded shadow hover:bg-blue-50 hover:text-blue-600 transition-colors z-10"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    <button 
                      onClick={() => setSelectedNotice(notice)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 pt-1"
                    >
                      View in detail &rarr;
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No recent notices
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4 flex flex-col justify-between ${isAdmin ? 'flex-1' : ''}`}
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Quick Actions</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isStudent ? (
                <>
                  <Link 
                    to={getNavPath("/routines")}
                    className="bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100/80 border border-emerald-100/60 dark:border-emerald-900/40 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Class Routines</span>
                  </Link>

                  <Link 
                    to={getNavPath("/attendance")}
                    className="bg-purple-50/80 dark:bg-purple-950/40 hover:bg-purple-100/80 border border-purple-100/60 dark:border-purple-900/40 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">My Attendance</span>
                  </Link>

                  <Link 
                    to={getNavPath("/notices")}
                    className="bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100/80 border border-amber-100/60 dark:border-amber-900/40 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Notice Board</span>
                  </Link>

                  <Link 
                    to={getNavPath("/chat")}
                    className="bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100/80 border border-indigo-100/60 dark:border-indigo-900/40 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer col-span-2 sm:col-span-1"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Study Groups & Chat</span>
                  </Link>
                </>
              ) : isFaculty ? (
                <>
                  <Link 
                    to={getNavPath("/notices")}
                    className="bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100/80 border border-blue-100/60 dark:border-blue-900/40 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Create Notice</span>
                  </Link>

                  <Link 
                    to={getNavPath("/routines")}
                    className="bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100/80 border border-emerald-100/60 dark:border-emerald-900/40 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">View Routines</span>
                  </Link>

                  <Link 
                    to={getNavPath("/attendance")}
                    className="bg-purple-50/80 dark:bg-purple-950/40 hover:bg-purple-100/80 border border-purple-100/60 dark:border-purple-900/40 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Take Attendance</span>
                  </Link>

                  <Link 
                    to={getNavPath("/students")}
                    className="bg-teal-50/80 dark:bg-teal-950/40 hover:bg-teal-100/80 border border-teal-100/60 dark:border-teal-900/40 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Manage Students</span>
                  </Link>

                  <Link 
                    to={getNavPath("/courses")}
                    className="bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100/80 border border-indigo-100/60 dark:border-indigo-900/40 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">My Courses</span>
                  </Link>

                  <Link 
                    to={getNavPath("/chat")}
                    className="bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100/80 border border-amber-100/60 dark:border-amber-900/40 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Study Groups & Chat</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to={getNavPath("/notices")}
                    className="bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100/80 border border-blue-100/60 dark:border-blue-900/40 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Create Notice</span>
                  </Link>

                  <Link 
                    to={getNavPath("/routines")}
                    className="bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100/80 border border-emerald-100/60 dark:border-emerald-900/40 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Manage Routines</span>
                  </Link>

                  <Link 
                    to={getNavPath("/attendance")}
                    className="bg-purple-50/80 dark:bg-purple-950/40 hover:bg-purple-100/80 border border-purple-100/60 dark:border-purple-900/40 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Manage Attendance</span>
                  </Link>

                  <Link 
                    to={getNavPath("/students")}
                    className="bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100/80 border border-blue-100/60 dark:border-blue-900/40 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Manage Students</span>
                  </Link>

                  <Link 
                    to={getNavPath("/faculty")}
                    className="bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100/80 border border-amber-100/60 dark:border-amber-900/40 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Manage Faculty</span>
                  </Link>

                  <Link 
                    to={getNavPath("/analytics")}
                    className="bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100/80 border border-rose-100/60 dark:border-rose-900/40 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <BarChart2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Analytics</span>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 4. Bottom Grid: System Overview & Recent Activities */}
      <div className="grid lg:grid-cols-3 gap-6 items-stretch">
        {/* System Overview (Left 2/3 width) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 lg:p-7 space-y-6"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" /> System Overview
            </h3>

            <div className="flex items-center gap-2">
              <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer">
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Year</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-center">
            {/* SVG Interactive Line Chart */}
            <div className="md:col-span-3 h-48 relative flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="30" x2="400" y2="30" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="75" x2="400" y2="75" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="120" x2="400" y2="120" stroke="#F1F5F9" strokeWidth="1" />

                {/* Gradient Fill */}
                <path 
                  d="M0,110 Q50,125 100,80 T200,40 T300,100 T400,60 L400,140 L0,140 Z" 
                  fill="url(#blueGradient)" 
                />

                {/* Blue Line */}
                <path 
                  d="M0,110 Q50,125 100,80 T200,40 T300,100 T400,60" 
                  fill="none" 
                  stroke="#3B82F6" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                />

                {/* Glowing Data Dots */}
                <circle cx="100" cy="80" r="5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" className="shadow-md" />
                <circle cx="200" cy="40" r="6" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" className="shadow-lg" />
                <circle cx="300" cy="100" r="5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" className="shadow-md" />
              </svg>
            </div>

            {/* Right Mini Legend / Stats */}
            <div className="space-y-4 border-l border-slate-100 dark:border-slate-800 pl-4 hidden md:block">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Active Users
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  22 <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">&uarr; 12%</span>
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> New Accounts
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  5 <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">&uarr; 25%</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activities (Right 1/3 width) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Recent Activities
            </h3>
            <button className="text-blue-600 font-semibold text-xs hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {/* Activity 1 */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Megaphone className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug truncate">
                  New notice &ldquo;asdf&rdquo; was published
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">by Admin User &bull; 2h ago</p>
              </div>
            </div>

            {/* Activity 2 */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CalendarIcon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug truncate">
                  Routine &ldquo;System Maintenance&rdquo; completed
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">by Admin User &bull; 5h ago</p>
              </div>
            </div>

            {/* Activity 3 */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug truncate">
                  New Student account registered
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">by Admin User &bull; 1d ago</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Notice Detail Modal */}
      <AnimatePresence>
        {selectedNotice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg p-6 max-h-[85dvh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-blue-100 text-blue-700">
                    {selectedNotice.tag}
                  </span>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(selectedNotice.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={() => setSelectedNotice(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1.5">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">{selectedNotice.title}</h3>
              {selectedNotice.type === 'image' ? (
                <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-5 border border-slate-200 dark:border-slate-800 relative group">
                  {selectedNotice.content.match(/data:application\/|\.pdf|\.doc/i) ? (
                    <div className="flex flex-col items-center justify-center p-16 gap-4">
                      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center">
                        <FileText className="w-10 h-10" />
                      </div>
                      <p className="text-base font-medium text-slate-600 dark:text-slate-300">Document Attached Attached</p>
                    </div>
                  ) : (
                    <img 
                      src={selectedNotice.content} 
                      alt={selectedNotice.title} 
                      className="w-full max-h-[450px] object-contain mx-auto" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x300?text=Invalid+File';
                      }} 
                    />
                  )}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                      href={selectedNotice.content} 
                      download={selectedNotice.title.replace(/\s+/g, '_') + (selectedNotice.content.match(/data:application\/|\.pdf|\.doc/i) ? '.pdf' : '.png')}
                      className="bg-white/95 hover:bg-white text-slate-900 py-2.5 px-5 rounded-full shadow-lg backdrop-blur-sm transition-all flex items-center gap-2 text-sm font-bold border border-slate-200/50 hover:scale-105"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {selectedNotice.content}
                </div>
              )}
              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button onClick={() => setSelectedNotice(null)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 rounded-xl transition-colors text-xs">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
