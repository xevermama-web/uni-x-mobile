import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  MessageSquare, 
  Bell, 
  Menu, 
  X, 
  LogOut,
  Bot,
  Sparkles,
  LucideIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface MobileBottomNavProps {
  role: string;
  navigation: NavItem[];
  handleSignOut: () => void;
  user?: any;
}

export default function MobileBottomNav({ role, navigation, handleSignOut, user }: MobileBottomNavProps) {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Listen for open_mobile_drawer event triggered from top header hamburger menu
  useEffect(() => {
    const handleOpenDrawer = () => setIsMoreOpen(true);
    window.addEventListener('open_mobile_drawer', handleOpenDrawer);
    return () => window.removeEventListener('open_mobile_drawer', handleOpenDrawer);
  }, []);

  const getRoleBasePath = () => {
    if (role === 'faculty') return '/faculty-dashboard';
    if (role === 'moderator') return '/moderator-dashboard';
    return '/dashboard';
  };

  const basePath = getRoleBasePath();

  // Find routes matching slot 1, 2, 4
  const dashboardHref = basePath;
  const chatHref = `${basePath}/chat`;
  const noticesHref = role === 'faculty' ? `${basePath}/attendance` : `${basePath}/notices`;

  const isDashboardActive = location.pathname === dashboardHref || location.pathname === `${basePath}/`;
  const isChatActive = location.pathname.includes('/chat') || location.pathname.includes('/groups');
  const isNoticesActive = location.pathname.includes('/notices') || (role === 'faculty' && location.pathname.includes('/attendance'));

  const handleOpenAI = () => {
    setIsMoreOpen(false);
    window.dispatchEvent(new CustomEvent('open_ai_assistant'));
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar - Glassy Dark Styling matching mockup image */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0A1224]/95 dark:bg-[#070C18]/95 backdrop-blur-2xl border-t border-slate-800/80 px-2 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] pb-safe">
        <div className="grid grid-cols-5 items-center max-w-md mx-auto">
          
          {/* 1. Dashboard */}
          <Link
            to={dashboardHref}
            onClick={() => setIsMoreOpen(false)}
            className={cn(
              "flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer",
              isDashboardActive
                ? "text-blue-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <LayoutGrid className={cn("w-5 h-5 mb-1 transition-all", isDashboardActive && "scale-110 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]")} />
            <span className="text-[10px] leading-tight font-medium">Dashboard</span>
          </Link>

          {/* 2. Groups & Chat */}
          <Link
            to={chatHref}
            onClick={() => setIsMoreOpen(false)}
            className={cn(
              "flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer",
              isChatActive
                ? "text-blue-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <MessageSquare className={cn("w-5 h-5 mb-1 transition-all", isChatActive && "scale-110 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]")} />
            <span className="text-[10px] leading-tight font-medium">Groups & Chat</span>
          </Link>

          {/* 3. Center Glowing AI Bot Button */}
          <div className="flex justify-center -mt-5 relative">
            <button
              onClick={handleOpenAI}
              className="relative group p-3.5 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-blue-500 text-white shadow-[0_0_22px_rgba(124,58,237,0.7)] hover:shadow-[0_0_30px_rgba(124,58,237,0.9)] transition-all transform active:scale-90 cursor-pointer border-2 border-indigo-400/50"
              title="Open AI Assistant"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 blur-md opacity-60 group-hover:opacity-100 transition-opacity -z-10" />
              <Bot className="w-6 h-6 animate-pulse" />
              <Sparkles className="w-3 h-3 absolute top-1 right-1 text-amber-300" />
            </button>
          </div>

          {/* 4. Notices / Routine */}
          <Link
            to={noticesHref}
            onClick={() => setIsMoreOpen(false)}
            className={cn(
              "flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer",
              isNoticesActive
                ? "text-blue-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Bell className={cn("w-5 h-5 mb-1 transition-all", isNoticesActive && "scale-110 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]")} />
            <span className="text-[10px] leading-tight font-medium">{role === 'faculty' ? 'Attendance' : 'Notices'}</span>
          </Link>

          {/* 5. More Menu */}
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={cn(
              "flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer",
              isMoreOpen
                ? "text-blue-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Menu className={cn("w-5 h-5 mb-1 transition-all", isMoreOpen && "scale-110 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]")} />
            <span className="text-[10px] leading-tight font-medium">More</span>
          </button>

        </div>
      </div>

      {/* Slide-Up Mobile Sheet Drawer */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setIsMoreOpen(false)} 
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Content */}
          <div className="relative bg-[#0D1527] border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl max-h-[82vh] overflow-y-auto animate-in slide-in-from-bottom duration-250 pb-24 text-slate-100">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-base shadow-inner">
                  {role.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">Uni-X Navigation</h3>
                  <p className="text-xs text-slate-400 capitalize">{role} Portal Account</p>
                </div>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Assistant Quick Banner */}
            <div 
              onClick={handleOpenAI}
              className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-slate-900 border border-indigo-500/30 flex items-center justify-between cursor-pointer hover:border-indigo-400/60 transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    Uni-X AI Assistant
                    <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] uppercase font-mono">Live</span>
                  </h4>
                  <p className="text-[11px] text-slate-300">Ask routine, exams & course questions</p>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>

            {/* Grid of Navigation Items */}
            <div className="grid grid-cols-2 gap-2.5 py-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl text-xs font-semibold transition-all border cursor-pointer",
                      isActive
                        ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                        : "bg-slate-900/80 text-slate-200 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-blue-400")} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Sign Out Action */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 border border-rose-900/50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out Account</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
