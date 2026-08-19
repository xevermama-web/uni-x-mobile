import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  User,
  Shield,
  Palette,
  Bell,
  Globe,
  BookOpen,
  MessageSquare,
  Sliders,
  Server,
  Info,
  Search,
  ChevronRight,
  X,
  Lock,
  Smartphone,
  Key,
  HelpCircle,
  FileText,
  Moon,
  Sun,
  Monitor,
  Volume2,
  Database,
  Cpu,
  Mail,
  Phone,
  Camera,
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
  Layers,
  Check,
  AlertCircle,
  Calendar,
  CheckSquare
} from 'lucide-react';

interface SettingModalProps {
  isOpen: boolean;
  settingName: string | null;
  onClose: () => void;
}

// Future Scope Modal Popup (for Demo Mode options)
function FutureScopeModal({ isOpen, settingName, onClose }: SettingModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md transition-opacity"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 p-4 sm:p-6 lg:p-8 text-center"
        >
          {/* Top Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Perfect Circular Image */}
          <div className="mx-auto mb-5 relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 animate-pulse opacity-20 blur-md" />
            <img
              src="https://i.postimg.cc/ZRRd5BZc/image.png"
              alt="Feature Avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-500/20 dark:border-blue-400/30 shadow-lg relative z-10"
            />
          </div>

          {/* Setting Name Tag */}
          {settingName && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{settingName}</span>
            </div>
          )}

          {/* Main Notice Heading */}
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
            Feature Preview
          </h3>

          {/* Required Exact Statement */}
          <p className="text-slate-700 dark:text-slate-200 font-semibold text-base sm:text-lg mb-6 leading-snug">
            This feature will be available in the future scope.
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
            This module is currently running in demonstration mode. Backend configuration controls will be linked in an upcoming release.
          </p>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
          >
            Got it
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function SettingsPage() {
  const { user } = useOutletContext<any>();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const { language, setLanguage } = useLanguage();

  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 3000);
  };

  // Appearance State (Real Mode)
  const [fontSize, setFontSize] = useState<string>(() => {
    return localStorage.getItem('unixx_font_size') || 'standard';
  });

  const [sidebarPref, setSidebarPref] = useState<string>(() => {
    return localStorage.getItem('unixx_sidebar_pref') || 'expanded';
  });

  // Language & Region State (Real Mode)
  const [timezone, setTimezone] = useState<string>(() => {
    return localStorage.getItem('unixx_timezone') || '(UTC+06:00) Asia/Dhaka';
  });

  const [dateFormat, setDateFormat] = useState<string>(() => {
    return localStorage.getItem('unixx_date_format') || 'DD/MM/YYYY';
  });

  const [timeFormat, setTimeFormat] = useState<string>(() => {
    return localStorage.getItem('unixx_time_format') || '12-Hour';
  });

  // Apply root document font size when fontSize state changes
  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'small') {
      root.style.fontSize = '15px';
    } else if (fontSize === 'large') {
      root.style.fontSize = '17px';
    } else {
      root.style.fontSize = '16px';
    }
  }, [fontSize]);

  // Handlers for Appearance
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    const labels = { light: 'Light Mode', dark: 'Dark Mode', system: 'System Default' };
    showToast(`Theme updated to ${labels[newTheme]}`);
  };

  const handleAccentChange = (color: string) => {
    setAccentColor(color as any);
    showToast(`Accent color updated to ${color.charAt(0).toUpperCase() + color.slice(1)}`);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    localStorage.setItem('unixx_font_size', size);
    showToast(`Font scaling updated to ${size.charAt(0).toUpperCase() + size.slice(1)}`);
  };

  const handleSidebarPrefChange = (pref: string) => {
    setSidebarPref(pref);
    localStorage.setItem('unixx_sidebar_pref', pref);
    showToast(`Sidebar preference set to ${pref.charAt(0).toUpperCase() + pref.slice(1)}`);
  };

  // Handlers for Language & Region
  const handleLanguageChange = (langKey: string, langName: string) => {
    setLanguage(langKey as any);
    showToast(`Language set to ${langName}`);
  };

  const handleTimezoneChange = (tz: string) => {
    setTimezone(tz);
    localStorage.setItem('unixx_timezone', tz);
    showToast(`Timezone set to ${tz}`);
  };

  const handleDateFormatChange = (df: string) => {
    setDateFormat(df);
    localStorage.setItem('unixx_date_format', df);
    showToast(`Date format set to ${df}`);
  };

  const handleTimeFormatChange = (tf: string) => {
    setTimeFormat(tf);
    localStorage.setItem('unixx_time_format', tf);
    showToast(`Time format set to ${tf}`);
  };

  // Role detection matching app standard
  const role = (
    user?.role || user?.user_metadata?.role ||
    (localStorage.getItem('unixx_admin_session') === 'true' ? 'admin' :
    localStorage.getItem('unixx_moderator_session') ? 'moderator' :
    localStorage.getItem('unixx_faculty_session') ? 'faculty' : 'student')
  ).toLowerCase();

  const isAdmin = role === 'admin';
  const isModerator = role === 'moderator';
  const isFaculty = role === 'faculty';

  const userDisplayName = user?.full_name || (isAdmin ? 'Admin User' : isModerator ? 'Moderator Staff' : isFaculty ? 'Faculty Member' : 'Student');
  const userRoleBadge = isAdmin ? 'System Administrator' : isModerator ? 'Academic Moderator' : isFaculty ? 'Faculty Member' : 'Enrolled Student';
  const userEmail = user?.email || (isAdmin ? 'admin@unix.edu' : isFaculty ? 'faculty@unix.edu' : isModerator ? 'moderator@unix.edu' : 'student@unix.edu');

  // Active section state for left sidebar navigation
  const [activeTab, setActiveTab] = useState<string>('account');

  // Trigger future scope modal for demo mode items
  const handleItemClick = (name: string) => {
    setSelectedSetting(name);
  };

  // Section categories based on role
  const sections = [
    { id: 'account', name: 'Account', group: 'User & Profile', icon: User, badge: 'Profile & Security' },
    { id: 'privacy', name: 'Privacy & Security', group: 'User & Profile', icon: Shield, badge: '2FA & Sessions' },
    { id: 'appearance', name: 'Appearance', group: 'Preferences', icon: Palette, badge: 'Real Mode' },
    { id: 'notifications', name: 'Notifications', group: 'Preferences', icon: Bell, badge: 'Alerts & Sounds' },
    { id: 'language', name: 'Language & Region', group: 'Preferences', icon: Globe, badge: 'Real Mode' },
    {
      id: 'academic',
      name: isAdmin ? 'Academic Settings' : 'Academic Preferences',
      group: 'Academic & Apps',
      icon: BookOpen,
      badge: 'Routines & Courses'
    },
    { id: 'chat', name: 'Chat & Study Groups', group: 'Academic & Apps', icon: MessageSquare, badge: 'Groups & Messages' },
    { id: 'app_prefs', name: 'Application Preferences', group: 'Academic & Apps', icon: Sliders, badge: 'Dashboard & Layout' },
    // Admin-Only section
    ...(isAdmin ? [{ id: 'system', name: 'System Settings', group: 'Administration', icon: Server, badge: 'Admin Controls' }] : []),
    { id: 'about', name: 'About & Support', group: 'System & Support', icon: Info, badge: 'v2.4.0 Pro' }
  ];

  // Filter sections if searching
  const filteredSections = searchQuery.trim()
    ? sections.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.badge.toLowerCase().includes(searchQuery.toLowerCase()))
    : sections;

  return (
    <div className="min-h-full space-y-6 pb-12 font-sans relative">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border border-slate-800 rounded-3xl p-6 shadow-md relative overflow-hidden">
        {/* Colorful Radial Ambient Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
        
        {/* Subtle Mesh Texture Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-2xs">
              {userRoleBadge}
            </span>
            <span className="text-xs text-slate-300">• Uni-X Portal Settings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-xs">
            Settings & Preferences
          </h1>
          <p className="text-sm text-slate-200/90 mt-1 max-w-lg font-medium">
            Manage your profile, theme appearance, language locale, and application settings.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[240px] sm:min-w-[280px] relative z-10">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-sm text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar Navigation */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          {/* Account Profile Card Header */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border border-blue-500/30 flex items-center gap-3 relative overflow-hidden shadow-sm">
            <div className="absolute inset-0 opacity-15 pointer-events-none [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
            <div className="w-12 h-12 rounded-full bg-white text-blue-700 font-black text-lg flex items-center justify-center shadow-md shrink-0 relative z-10">
              {userDisplayName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden relative z-10">
              <h4 className="text-sm font-extrabold text-white truncate">
                {userDisplayName}
              </h4>
              <p className="text-xs text-blue-100 truncate">{userEmail}</p>
              <div className="mt-1 inline-block text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-white/20 text-white border border-white/30">
                {role} account
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
              Setting Sections
            </p>
            <nav className="space-y-1">
              {filteredSections.map((sec) => {
                const IconComp = sec.icon;
                const isActive = activeTab === sec.id;
                const isRealMode = sec.id === 'appearance' || sec.id === 'language';

                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveTab(sec.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span className="truncate">{sec.name}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isRealMode
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {sec.badge}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* SECTION 1: ACCOUNT (DEMO MODE) */}
          {(activeTab === 'account' || searchQuery.length > 0) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Settings</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Manage your profile information and credentials</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  Demo Preview
                </span>
              </div>

              {/* Profile Information Item */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => handleItemClick('Profile Information')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">Profile Information</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Update your display name, department designation, and role bio.</p>
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                    Name: {userDisplayName}
                  </div>
                </div>

                {/* Email Item */}
                <div
                  onClick={() => handleItemClick('Email Settings')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">Email Address</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Primary account email used for portal notifications and recovery.</p>
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 truncate">
                    {userEmail}
                  </div>
                </div>

                {/* Password Item */}
                <div
                  onClick={() => handleItemClick('Password Change')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">Password</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Change your current account password or reset security keys.</p>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Last updated: 30 days ago</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">Change</span>
                  </div>
                </div>

                {/* Phone Number Item */}
                <div
                  onClick={() => handleItemClick('Phone Number')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">Phone Number</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Contact phone number for SMS alerts and emergency notifications.</p>
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                    +880 1700-000000
                  </div>
                </div>

                {/* Profile Picture Item */}
                <div
                  onClick={() => handleItemClick('Profile Picture Upload')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">Profile Picture</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Upload a official profile image for institutional identification.</p>
                  <button className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
                    Upload New Picture
                  </button>
                </div>

                {/* Account Security Item */}
                <div
                  onClick={() => handleItemClick('Account Security Overview')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">Account Security</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Review security status, active permissions, and access logs.</p>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> High Security Grade
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PRIVACY & SECURITY (DEMO MODE) */}
          {(activeTab === 'privacy' || searchQuery.length > 0) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Privacy & Security</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Manage login credentials, active sessions, and 2FA</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Password & Security', desc: 'Manage master password policy and security questions', icon: Key },
                  { name: 'Login Activity', desc: 'View current login history across devices (Dhaka, Bangladesh)', icon: Smartphone },
                  { name: 'Active Sessions', desc: '2 active browser sessions connected to your Uni-X account', icon: Database },
                  { name: 'Two-Factor Authentication', desc: 'Require authenticator code when logging into portal', icon: Lock }
                ].map((item, idx) => {
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleItemClick(item.name)}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          <ItemIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: APPEARANCE (REAL MODE) */}
          {(activeTab === 'appearance' || searchQuery.length > 0) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Appearance
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        Live Real Mode
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Customize real-time theme modes, accent colors, and typography scaling</p>
                  </div>
                </div>
              </div>

              {/* Theme Mode Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-3">Theme Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'light', name: 'Light Mode', icon: Sun, desc: 'Clean high contrast light theme' },
                    { id: 'dark', name: 'Dark Mode', icon: Moon, desc: 'Dark glassmorphism theme' },
                    { id: 'system', name: 'System Default', icon: Monitor, desc: 'Sync automatically with OS' }
                  ].map((mode) => {
                    const ModeIcon = mode.icon;
                    const isSelected = theme === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleThemeChange(mode.id as any)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center justify-center text-center group relative ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-500/20 shadow-md'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <ModeIcon className={`w-6 h-6 mb-2 transition-transform group-hover:scale-110 ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`} />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{mode.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{mode.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color Palette */}
              <div className="pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-3">Accent Color Theme</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { id: 'blue', name: 'Primary Blue', hex: 'bg-blue-600', ring: 'ring-blue-500' },
                    { id: 'emerald', name: 'Emerald', hex: 'bg-emerald-500', ring: 'ring-emerald-500' },
                    { id: 'purple', name: 'Purple', hex: 'bg-purple-600', ring: 'ring-purple-500' },
                    { id: 'indigo', name: 'Indigo', hex: 'bg-indigo-600', ring: 'ring-indigo-500' },
                    { id: 'rose', name: 'Rose', hex: 'bg-rose-500', ring: 'ring-rose-500' }
                  ].map((color) => {
                    const isSelected = accentColor === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => handleAccentChange(color.id)}
                        className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/30 ring-2 ring-purple-500/20 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full ${color.hex} flex items-center justify-center text-white shadow-md ${isSelected ? `ring-4 ${color.ring}/30` : ''}`}>
                          {isSelected && <Check className="w-4 h-4" />}
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size & Scaling */}
              <div className="pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-3">Font Scaling & Density</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'small', name: 'Small (15px)', desc: 'Higher density content layout' },
                    { id: 'standard', name: 'Standard (16px)', desc: 'Recommended default spacing' },
                    { id: 'large', name: 'Large (17px)', desc: 'Enhanced text readability' }
                  ].map((size) => {
                    const isSelected = fontSize === size.id;
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => handleFontSizeChange(size.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{size.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{size.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Preferences */}
              <div className="pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-3">Default Sidebar State</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'expanded', name: 'Expanded Default', desc: 'Keep sidebar open with full label navigation' },
                    { id: 'collapsed', name: 'Compact Default', desc: 'Collapse sidebar to icon rail on page load' }
                  ].map((sp) => {
                    const isSelected = sidebarPref === sp.id;
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => handleSidebarPrefChange(sp.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{sp.name}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{sp.desc}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: NOTIFICATIONS (DEMO MODE) */}
          {(activeTab === 'notifications' || searchQuery.length > 0) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notifications</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Configure alert channels, sound triggers, and push broadcasts</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: 'New Notices', desc: 'Instant alerts when new notices published' },
                  { name: 'Routine Updates', desc: 'Schedule changes and exam timetable alerts' },
                  { name: 'Study Group Notifications', desc: 'Activity and chat messages in joined groups' },
                  { name: 'New Materials', desc: 'Alerts when course slides or PDFs uploaded' },
                  { name: 'Attendance Alerts', desc: 'Low attendance warnings (<75%)' },
                  { name: 'Chat/Messages', desc: 'Direct messages and group chat notifications' },
                  { name: 'Notification Sound', desc: 'In-app audio notification chime' },
                  { name: 'Push Notifications', desc: 'Browser desktop notifications' }
                ].map((notif, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleItemClick(notif.name)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{notif.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{notif.desc}</p>
                    </div>
                    {/* Toggle look */}
                    <div className="w-9 h-5 rounded-full bg-blue-600 flex items-center justify-end px-0.5 shrink-0 shadow-inner">
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: LANGUAGE & REGION (REAL MODE) */}
          {(activeTab === 'language' || searchQuery.length > 0) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Language & Region
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        Live Real Mode
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Configure language locale, real-time timezone, and date/time display formats</p>
                  </div>
                </div>
              </div>

              {/* Primary Language Option */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-3">Portal Display Language</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: 'en', name: 'English (US)', flag: '🇺🇸', native: 'English' },
                    { id: 'bn', name: 'Bengali (বাংলা)', flag: '🇧🇩', native: 'বাংলা' },
                    { id: 'es', name: 'Spanish (Español)', flag: '🇪🇸', native: 'Español' },
                    { id: 'fr', name: 'French (Français)', flag: '🇫🇷', native: 'Français' },
                    { id: 'ar', name: 'Arabic (العربية)', flag: '🇸🇦', native: 'العربية' }
                  ].map((lang) => {
                    const isSelected = language === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => handleLanguageChange(lang.id, lang.name)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-cyan-600 bg-cyan-50/50 dark:bg-cyan-950/30 ring-2 ring-cyan-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-cyan-300 dark:hover:border-cyan-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{lang.flag}</span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{lang.name}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{lang.native}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Zone Selection */}
              <div className="pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-2">Regional Time Zone</label>
                <div className="relative">
                  <select
                    value={timezone}
                    onChange={(e) => handleTimezoneChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all cursor-pointer appearance-none"
                  >
                    <option value="(UTC+06:00) Asia/Dhaka">(UTC+06:00) Asia/Dhaka (Bangladesh Standard Time)</option>
                    <option value="(UTC+00:00) UTC / London">(UTC+00:00) UTC / London (GMT)</option>
                    <option value="(UTC-05:00) America/New_York">(UTC-05:00) America/New_York (EST)</option>
                    <option value="(UTC+08:00) Asia/Singapore">(UTC+08:00) Asia/Singapore (SGT)</option>
                    <option value="(UTC+09:00) Asia/Tokyo">(UTC+09:00) Asia/Tokyo (JST)</option>
                    <option value="(UTC+05:30) Asia/Kolkata">(UTC+05:30) Asia/Kolkata (IST)</option>
                    <option value="(UTC+01:00) Europe/Paris">(UTC+01:00) Europe/Paris (CET)</option>
                  </select>
                  <ChevronRight className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                </div>
              </div>

              {/* Date & Time Formats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Date Format */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-2">Date Format</label>
                  <div className="space-y-2">
                    {[
                      { id: 'DD/MM/YYYY', example: '10/08/2026' },
                      { id: 'MM/DD/YYYY', example: '08/10/2026' },
                      { id: 'YYYY-MM-DD', example: '2026-08-10' }
                    ].map((df) => {
                      const isSelected = dateFormat === df.id;
                      return (
                        <button
                          key={df.id}
                          type="button"
                          onClick={() => handleDateFormatChange(df.id)}
                          className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-cyan-600 bg-cyan-50/50 dark:bg-cyan-950/30 ring-2 ring-cyan-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{df.id}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2">({df.example})</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Format */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-2">Time Format</label>
                  <div className="space-y-2">
                    {[
                      { id: '12-Hour', label: '12-Hour Display', example: '09:30 AM / 04:15 PM' },
                      { id: '24-Hour', label: '24-Hour Display', example: '09:30 / 16:15' }
                    ].map((tf) => {
                      const isSelected = timeFormat === tf.id;
                      return (
                        <button
                          key={tf.id}
                          type="button"
                          onClick={() => handleTimeFormatChange(tf.id)}
                          className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-cyan-600 bg-cyan-50/50 dark:bg-cyan-950/30 ring-2 ring-cyan-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{tf.label}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2">({tf.example})</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: ACADEMIC PREFERENCES / SETTINGS (DEMO MODE) */}
          {(activeTab === 'academic' || searchQuery.length > 0) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {isAdmin ? 'Academic Settings' : 'Academic Preferences'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Configure class routine views, attendance thresholds, and batch defaults</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Routine Preferences', desc: 'Default weekly view and faculty details overlay', icon: Calendar },
                  { name: 'Attendance Preferences', desc: 'Threshold warning percentages and report summaries', icon: CheckSquare },
                  { name: 'Course Preferences', desc: 'Display active semester modules and syllabus view', icon: BookOpen },
                  { name: 'Batch/Department Preferences', desc: 'Filter default batch routines and department announcements', icon: Layers }
                ].map((item, idx) => {
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleItemClick(item.name)}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
                          <ItemIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 7: CHAT & STUDY GROUPS (DEMO MODE) */}
          {(activeTab === 'chat' || searchQuery.length > 0) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chat & Study Groups</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Message sound effects, group chat alerts, and material sharing</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Group Notifications', desc: 'Mute/unmute notifications from joined study groups' },
                  { name: 'Message Notifications', desc: 'In-app banner previews for incoming direct messages' },
                  { name: 'Message Sound', desc: 'Chime sound when sending and receiving chat messages' },
                  { name: 'Material Notifications', desc: 'Alert when new course notes or slides uploaded in group' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleItemClick(item.name)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 8: APPLICATION PREFERENCES (DEMO MODE) */}
          {(activeTab === 'app_prefs' || searchQuery.length > 0) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Application Preferences</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Dashboard layout order, default landing view, and motion settings</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Sidebar Expanded/Collapsed', desc: 'Remember sidebar state across browser reloads' },
                  { name: 'Dashboard Preferences', desc: 'Customize stats widgets and quick action tiles' },
                  { name: 'Animation Preferences', desc: 'Smooth UI page transitions and spring animations' },
                  { name: 'Default Landing Page', desc: 'Set primary page upon portal login' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleItemClick(item.name)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 9: SYSTEM SETTINGS (ADMIN-ONLY DEMO MODE) */}
          {isAdmin && (activeTab === 'system' || searchQuery.length > 0) && (
            <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-6 shadow-sm space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">
                Admin Exclusive
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">System Settings</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Institutional system configurations, departments, and user roles</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'System Configuration', desc: 'Maintenance mode & global alert broadcast banner' },
                  { name: 'User Management', desc: 'User role assignment & permissions hierarchy' },
                  { name: 'Department Management', desc: 'Manage department codes & active faculty seats' },
                  { name: 'Attendance Configuration', desc: 'Configure 75% threshold policy & warning triggers' },
                  { name: 'Academic Session', desc: 'Set active semester session (2026-2027 Term A)' },
                  { name: 'Notification Configuration', desc: 'Manage email dispatch server & push notification key' }
                ].map((sys, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleItemClick(sys.name)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-950/20 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{sys.name}</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sys.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 10: ABOUT & SUPPORT (DEMO MODE) */}
          {(activeTab === 'about' || searchQuery.length > 0) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">About & Support</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Institutional information, platform version, and helpdesk</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'About Uni-X', desc: 'Uni-X Smart Academic Management Portal v2.4.0 Pro' },
                  { name: 'Help & Support', desc: 'Contact institutional IT support desk & user manual' },
                  { name: 'Report a Problem', desc: 'Submit bug report or request feature enhancement' },
                  { name: 'Privacy Policy', desc: 'Review institutional data privacy and security terms' },
                  { name: 'Terms & Conditions', desc: 'Uni-X system usage agreement & acceptable use policy' },
                  { name: 'Application Version', desc: 'Build 2026.08.10 (Latest release version)' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleItemClick(item.name)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real Mode Live Toast Confirmation Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl shadow-xl border border-slate-800 dark:border-slate-200 text-xs font-semibold flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Future Scope Modal Popup - Opens for demo mode settings */}
      <FutureScopeModal
        isOpen={selectedSetting !== null}
        settingName={selectedSetting}
        onClose={() => setSelectedSetting(null)}
      />
    </div>
  );
}
