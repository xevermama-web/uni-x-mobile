import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { logoutUser, clearSessionData } from '../../lib/authSession';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  CheckSquare,
  Users,
  Bell,
  LogOut,
  Settings,
  GraduationCap,
  ArrowLeft,
  Undo2,
  MessageSquare,
  Menu,
  Search
} from 'lucide-react';
import { cn } from '../../lib/utils';
import UserProfileDropdown from './UserProfileDropdown';
import HeaderMessageMenu from './HeaderMessageMenu';
import HeaderNotificationMenu from './HeaderNotificationMenu';
import { ThemeToggle } from './ThemeToggle';
import MobileBottomNav from './MobileBottomNav';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchUserRole = async (sessionUser: any) => {
    let role = 'student';
    let avatar_url = sessionUser.avatar_url || sessionUser.user_metadata?.avatar_url || '';

    if (sessionUser.email === 'admin@unixx.com') {
      role = 'admin';
    } else if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role, avatar_url')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (data) {
          if (data.role) role = data.role;
          if (data.avatar_url) avatar_url = data.avatar_url;
        } else {
          role = sessionUser.user_metadata?.role || 'student';
        }
      } catch (err) {
        role = sessionUser.user_metadata?.role || 'student';
      }
    } else {
      role = sessionUser.user_metadata?.role || 'student';
    }

    const finalAvatar = avatar_url || sessionUser.avatar_url || sessionUser.user_metadata?.avatar_url || '';
    const loggedInUser = { ...sessionUser, role, avatar_url: finalAvatar };
    loggedInUser.user_metadata = { ...loggedInUser.user_metadata, role, avatar_url: finalAvatar };
    
    if (finalAvatar) {
      if (sessionUser.email) localStorage.setItem(`unixx_avatar_${sessionUser.email}`, finalAvatar);
      if (sessionUser.id) localStorage.setItem(`unixx_avatar_${sessionUser.id}`, finalAvatar);
    }

    setUser(loggedInUser);
    setLoading(false);
  };

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const activeRole = localStorage.getItem('unixx_role');
      if (activeRole === 'admin' || activeRole === 'faculty' || activeRole === 'moderator') {
        return;
      }

      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') return;

      if (_event === 'SIGNED_OUT') {
        clearSessionData();
        setUser(null);
        setLoading(false);
        navigate('/login', { replace: true });
      } else if (session?.user && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED' || _event === 'USER_UPDATED')) {
        localStorage.setItem('unixx_student_session', JSON.stringify(session.user));
        localStorage.setItem('unixx_role', 'student');
        await fetchUserRole(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUser = async () => {
    try {
      const adminSess = localStorage.getItem('unixx_admin_session') === 'true';
      const facultySess = localStorage.getItem('unixx_faculty_session');
      const modSess = localStorage.getItem('unixx_moderator_session');
      const studentSess = localStorage.getItem('unixx_student_session');

      // 1. Explicit Admin Session
      if (adminSess) {
        await fetchUserRole({ email: 'admin@unixx.com', id: 'admin-id' });
        return;
      }

      // 2. Explicit Faculty Session
      if (facultySess) {
        try {
          const parsed = JSON.parse(facultySess);
          setUser({ ...parsed, role: 'faculty', user_metadata: { role: 'faculty' } });
          setLoading(false);
          return;
        } catch {}
      }

      // 3. Explicit Moderator Session
      if (modSess) {
        try {
          const parsed = JSON.parse(modSess);
          setUser({ ...parsed, role: 'moderator', user_metadata: { role: 'moderator' } });
          setLoading(false);
          return;
        } catch {}
      }

      // 4. Supabase Authenticated User Validation
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const { data: { user: validatedUser } } = await supabase.auth.getUser();
        if (validatedUser) {
          localStorage.setItem('unixx_student_session', JSON.stringify(validatedUser));
          localStorage.setItem('unixx_role', 'student');
          await fetchUserRole(validatedUser);
          return;
        }
      }

      // 5. Fallback Student Session check
      if (studentSess) {
        try {
          const parsed = JSON.parse(studentSess);
          setUser({ ...parsed, role: 'student', user_metadata: { role: 'student' } });
          setLoading(false);
          return;
        } catch {}
      }

      // No active valid session found
      await logoutUser();
      setUser(null);
      setLoading(false);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Session check failed:', error);
      await logoutUser();
      setUser(null);
      setLoading(false);
      navigate('/login', { replace: true });
    }
  };

  const handleSignOut = async () => {
    setUser(null);
    await logoutUser();
    navigate('/login', { replace: true });
  };

  const studentNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Study Groups & Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Notice Board', href: '/dashboard/notices', icon: Bell },
    { name: 'Class Routines', href: '/dashboard/routines', icon: Calendar },
    { name: 'My Attendance', href: '/dashboard/attendance', icon: CheckSquare },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const adminNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Manage Students', href: '/dashboard/students', icon: Users },
    { name: 'Manage Faculty', href: '/dashboard/faculty', icon: Users },
    { name: 'Manage Moderators', href: '/dashboard/moderators', icon: Users },
    { name: 'Departments', href: '/dashboard/departments', icon: BookOpen },
    { name: 'Study Groups & Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Manage Notices', href: '/dashboard/notices', icon: Bell },
    { name: 'Routines', href: '/dashboard/routines', icon: Calendar },
    { name: 'Attendance', href: '/dashboard/attendance', icon: CheckSquare },
    { name: 'Analytics', href: '/dashboard/analytics', icon: GraduationCap },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const facultyNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Materials', href: '/dashboard/materials', icon: BookOpen },
    { name: 'Manage Students', href: '/dashboard/students', icon: Users },
    { name: 'Study Groups & Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Manage Notices', href: '/dashboard/notices', icon: Bell },
    { name: 'Routines', href: '/dashboard/routines', icon: Calendar },
    { name: 'Take Attendance', href: '/dashboard/attendance', icon: CheckSquare },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const moderatorNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Manage Students', href: '/dashboard/students', icon: Users },
    { name: 'Manage Faculty', href: '/dashboard/faculty', icon: Users },
    { name: 'Departments', href: '/dashboard/departments', icon: BookOpen },
    { name: 'Study Groups & Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Manage Notices', href: '/dashboard/notices', icon: Bell },
    { name: 'Routines', href: '/dashboard/routines', icon: Calendar },
    { name: 'Attendance', href: '/dashboard/attendance', icon: CheckSquare },
    { name: 'Analytics', href: '/dashboard/analytics', icon: GraduationCap },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const role = (user?.role || user?.user_metadata?.role || (user?.email === 'admin@unixx.com' ? 'admin' : 'student')).toLowerCase();
  let navigation = studentNav;
  if (role === 'admin') navigation = adminNav;
  if (role === 'faculty') navigation = facultyNav;
  if (role === 'moderator') navigation = moderatorNav;

  // Restricted routes based on role
  const adminOnlyPaths = [
    '/dashboard/students',
    '/dashboard/faculty',
    '/dashboard/moderators',
    '/dashboard/departments',
    '/dashboard/analytics'
  ];

  const isRestrictedRoute = (role === 'student' || role === 'faculty') && adminOnlyPaths.some(p => location.pathname.startsWith(p));

  useEffect(() => {
    if (isRestrictedRoute) {
      navigate('/dashboard');
    }
  }, [isRestrictedRoute, navigate]);

  if (loading) {
    return <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  if (isRestrictedRoute && role !== 'admin') {
    return null;
  }

  return (
    <div className="h-screen font-sans flex relative overflow-hidden bg-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,#e0e7ff_0%,transparent_50%),radial-gradient(circle_at_100%_0%,#dcfce7_0%,transparent_50%),radial-gradient(circle_at_100%_100%,#fef3c7_0%,transparent_50%),radial-gradient(circle_at_0%_100%,#fae8ff_0%,transparent_50%)] pointer-events-none" />
      {/* Sidebar Navigation */}
      <div className={cn(
        "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex relative z-10 shadow-sm transition-all duration-300",
        isSidebarOpen ? "w-64" : "w-[88px]"
      )}>
        <div className={cn(
          "h-20 flex items-center bg-white/40 dark:bg-slate-900/50 backdrop-blur-3xl border-b border-white/50 dark:border-white/10 relative before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-gradient-to-r before:from-cyan-400 before:via-blue-500 before:via-indigo-500 before:via-purple-500 before:to-pink-500 before:z-20 before:shadow-[0_0_12px_rgba(129,140,248,0.8)] after:absolute after:inset-x-0 after:top-[3px] after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-white/80 dark:after:via-white/20 after:to-transparent after:z-20",
          isSidebarOpen ? "px-6 justify-start gap-2.5" : "justify-center px-2 flex-row gap-1.5"
        )}>
          {/* Liquid Ambient Soft Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-none">
            <div className="absolute -top-10 -left-10 w-36 h-36 bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-purple-500/20 dark:bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-white/90 dark:text-slate-200 dark:hover:bg-slate-800/90 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/80 dark:border-slate-700/80 shadow-xs md:flex hidden items-center justify-center w-9 h-9 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {isSidebarOpen ? <path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/> : <path d="m13 17 5-5-5-5M6 17l5-5-5-5"/>}
              </svg>
            </button>
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-700 hover:bg-white/90 dark:text-slate-200 dark:hover:bg-slate-800/90 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/80 dark:border-slate-700/80 shadow-xs md:flex hidden items-center justify-center w-9 h-9 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Go back"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={cn("flex-1 overflow-y-auto py-6", isSidebarOpen ? "px-4" : "px-3")}>
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 py-3 rounded-2xl text-[15px] font-semibold transition-all mb-1.5",
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100",
                    isSidebarOpen ? "px-4" : "justify-center px-2"
                  )}
                  title={!isSidebarOpen ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {isSidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-[#f8fafc] dark:bg-slate-950">
        <header className="h-20 bg-white/40 dark:bg-slate-900/50 backdrop-blur-3xl border-b border-white/50 dark:border-white/10 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] relative before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-gradient-to-r before:from-cyan-400 before:via-blue-500 before:via-indigo-500 before:via-purple-500 before:to-pink-500 before:z-20 before:shadow-[0_0_12px_rgba(129,140,248,0.8)] after:absolute after:inset-x-0 after:top-[3px] after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-white/80 dark:after:via-white/20 after:to-transparent after:z-20">
          {/* Liquid Ambient Glowing Light Orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-none">
            <div className="absolute -top-12 -left-12 w-56 h-56 bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-16 left-1/3 w-72 h-72 bg-indigo-500/15 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-56 h-56 bg-pink-500/15 dark:bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>
          
          <div className="flex items-center gap-2 relative z-10">
            {/* Hamburger button on mobile to open drawer */}
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open_mobile_drawer'))} 
              className="p-2 rounded-xl text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/80 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-slate-700/60 shadow-xs flex md:hidden items-center justify-center w-9 h-9 transition-all cursor-pointer" 
              title="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {location.pathname !== '/dashboard' && location.pathname !== '/' && (
              <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/80 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-slate-700/60 shadow-xs flex md:hidden items-center justify-center w-9 h-9 transition-all" title="Go back">
                <Undo2 className="h-4 w-4" />
              </button>
            )}
            <Link to="/dashboard" className="h-10 sm:h-11 flex items-center justify-center -ml-1 md:ml-0 relative group px-1 py-0.5">
              <div className="absolute inset-0 rounded-full bg-white/90 dark:bg-white/95 blur-md opacity-0 dark:opacity-100 transition-all duration-300 pointer-events-none scale-105 shadow-[0_0_20px_rgba(255,255,255,0.85)]" />
              <img src="https://i.postimg.cc/Qd32FsgX/Uni-X-Logo.png" alt="Uni-X" className="h-full w-auto object-contain relative z-10 dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
            </Link>

            {/* Role Badge Chip */}
            <div className="hidden lg:flex items-center ml-2">
              {role === 'admin' ? (
                <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300/70 dark:border-rose-700/60 backdrop-blur-md shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                  Admin Account
                </span>
              ) : (
                <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300/70 dark:border-blue-700/60 backdrop-blur-md shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  Student Portal
                </span>
              )}
            </div>

            <div className="hidden md:flex relative w-72 lg:w-80 ml-3">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search courses, routines, students..."
                className="w-full pl-10 pr-16 py-2.5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/60 dark:border-slate-700/60 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/80 transition-all shadow-inner placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/70 dark:bg-slate-700/70 backdrop-blur-xs text-slate-600 dark:text-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-white/80 dark:border-slate-600 shadow-2xs">
                Ctrl + /
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3.5 relative z-10">
            {/* Search Icon button on mobile */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open_ai_assistant'))}
              className="p-2 rounded-xl text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/80 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-slate-700/60 shadow-xs flex md:hidden items-center justify-center w-9 h-9 transition-all cursor-pointer"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <HeaderMessageMenu user={user} role={role} />
            <HeaderNotificationMenu user={user} role={role} />
            <ThemeToggle />
            <UserProfileDropdown user={user} role={role} handleSignOut={handleSignOut} />
          </div>
        </header>

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-y-auto">
          <Outlet context={{ user: user ? { ...user, role } : null, role }} />
        </main>
        
        {/* Dedicated Mobile Navigation */}
        <MobileBottomNav role={role} navigation={navigation} handleSignOut={handleSignOut} user={user} />
      </div>
    </div>
  );
}
