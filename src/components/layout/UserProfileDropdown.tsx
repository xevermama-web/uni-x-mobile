import { useState, useRef, useEffect } from 'react';
import { LogOut, Check, ChevronDown, Camera, Link as LinkIcon, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import StudentAttendanceAnalyticsView from '../attendance/StudentAttendanceAnalyticsView';

interface UserProfileDropdownProps {
  user: any;
  role: string;
  handleSignOut: () => void;
}

export default function UserProfileDropdown({ user, role, handleSignOut }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userEmail = user?.email || user?.user_metadata?.email || (role === 'admin' ? 'admin@unixx.com' : '');
  const userName = user?.user_metadata?.full_name || user?.name || user?.full_name || (role === 'admin' ? 'Admin User' : 'User');
  const roleTitle = role === 'admin' ? 'Administrator' : role === 'faculty' ? (user?.department || 'Faculty') : role === 'moderator' ? 'Moderator' : 'Student';

  // Get initial avatar URL strictly from user-specific cache or props
  const avatarKey = userEmail ? `unixx_avatar_${userEmail}` : (user?.id ? `unixx_avatar_${user.id}` : '');
  
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    if (avatarKey) {
      const cached = localStorage.getItem(avatarKey);
      if (cached) return cached;
    }
    return user?.avatar_url || user?.user_metadata?.avatar_url || '';
  });
  const [inputUrl, setInputUrl] = useState(avatarUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Whenever user or userEmail changes, initialize with user-specific avatar or empty
    const userSpecificCached = avatarKey ? localStorage.getItem(avatarKey) : null;
    const initialAvatar = userSpecificCached || user?.avatar_url || user?.user_metadata?.avatar_url || '';
    setAvatarUrl(initialAvatar);
    setInputUrl(initialAvatar);

    let isMounted = true;
    const syncAvatarFromDB = async () => {
      let dbAvatarUrl = '';

      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        // 1. Try Supabase Auth metadata for current logged in user
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user && (authData.user.email === userEmail || authData.user.id === user?.id)) {
            if (authData.user.user_metadata?.avatar_url) {
              dbAvatarUrl = authData.user.user_metadata.avatar_url;
            }
          }
        } catch (e) {}

        // 2. Try profiles table
        if (!dbAvatarUrl && (user?.id || userEmail)) {
          try {
            let q = supabase.from('profiles').select('avatar_url');
            if (user?.id) q = q.eq('id', user.id);
            else q = q.eq('email', userEmail);
            const { data } = await q.maybeSingle();
            if (data?.avatar_url) dbAvatarUrl = data.avatar_url;
          } catch (e) {}
        }

        // 3. Try faculties table
        if (!dbAvatarUrl && userEmail) {
          try {
            const { data } = await supabase.from('faculties').select('avatar_url').eq('email', userEmail).maybeSingle();
            if (data?.avatar_url) dbAvatarUrl = data.avatar_url;
          } catch (e) {}
        }

        // 4. Try moderators table
        if (!dbAvatarUrl && userEmail) {
          try {
            const { data } = await supabase.from('moderators').select('avatar_url').eq('email', userEmail).maybeSingle();
            if (data?.avatar_url) dbAvatarUrl = data.avatar_url;
          } catch (e) {}
        }
      }

      if (!isMounted) return;

      if (dbAvatarUrl) {
        setAvatarUrl(dbAvatarUrl);
        setInputUrl(dbAvatarUrl);
        if (avatarKey) localStorage.setItem(avatarKey, dbAvatarUrl);
        if (userEmail) localStorage.setItem(`unixx_avatar_${userEmail}`, dbAvatarUrl);
        if (user?.id) localStorage.setItem(`unixx_avatar_${user.id}`, dbAvatarUrl);
      } else {
        // If DB has no avatar for this user, reset state and clear user-specific cache
        setAvatarUrl('');
        setInputUrl('');
        if (avatarKey) localStorage.removeItem(avatarKey);
        if (userEmail) localStorage.removeItem(`unixx_avatar_${userEmail}`);
        if (user?.id) localStorage.removeItem(`unixx_avatar_${user.id}`);
      }
    };

    syncAvatarFromDB();
    return () => { isMounted = false; };
  }, [userEmail, avatarKey, user?.id, user?.avatar_url, user?.user_metadata?.avatar_url]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditingAvatar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveAvatar = async () => {
    const trimmed = inputUrl.trim();
    setAvatarUrl(trimmed);

    // Save in primary avatar keys
    if (trimmed) {
      localStorage.setItem(avatarKey, trimmed);
      localStorage.setItem('unixx_avatar_url', trimmed);
      if (userEmail) localStorage.setItem(`unixx_avatar_${userEmail}`, trimmed);
      if (user?.id) localStorage.setItem(`unixx_avatar_${user.id}`, trimmed);
    } else {
      localStorage.removeItem(avatarKey);
      localStorage.removeItem('unixx_avatar_url');
      if (userEmail) localStorage.removeItem(`unixx_avatar_${userEmail}`);
      if (user?.id) localStorage.removeItem(`unixx_avatar_${user.id}`);
    }

    // Update faculty/moderator/student session if present
    if (role === 'faculty') {
      const facStr = localStorage.getItem('unixx_faculty_session');
      if (facStr) {
        try {
          const parsed = JSON.parse(facStr);
          parsed.avatar_url = trimmed;
          localStorage.setItem('unixx_faculty_session', JSON.stringify(parsed));
        } catch (e) {}
      }
    } else if (role === 'moderator') {
      const modStr = localStorage.getItem('unixx_moderator_session');
      if (modStr) {
        try {
          const parsed = JSON.parse(modStr);
          parsed.avatar_url = trimmed;
          localStorage.setItem('unixx_moderator_session', JSON.stringify(parsed));
        } catch (e) {}
      }
    } else if (role === 'student') {
      const studStr = localStorage.getItem('unixx_student_session');
      if (studStr) {
        try {
          const parsed = JSON.parse(studStr);
          parsed.avatar_url = trimmed;
          localStorage.setItem('unixx_student_session', JSON.stringify(parsed));
        } catch (e) {}
      }
    }

    // Update local user collections (students, faculty, moderators, users)
    ['unixx_students', 'unixx_faculty', 'unixx_moderators', 'unixx_users'].forEach(storageKey => {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const updated = list.map((item: any) => {
              if (item.email === userEmail || (user?.id && item.id === user.id)) {
                return { ...item, avatar_url: trimmed };
              }
              return item;
            });
            localStorage.setItem(storageKey, JSON.stringify(updated));
          }
        } catch (e) {}
      }
    });

    // Update Supabase Auth user_metadata & database tables for cross-browser persistence
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
        // Update Supabase Auth user metadata
        await supabase.auth.updateUser({
          data: { avatar_url: trimmed }
        });
      } catch (err) {}

      try {
        // Update profiles table by id and/or email
        if (user?.id) {
          await supabase.from('profiles').update({ avatar_url: trimmed }).eq('id', user.id);
        }
        if (userEmail) {
          await supabase.from('profiles').update({ avatar_url: trimmed }).eq('email', userEmail);
        }

        // Update faculties table
        if (userEmail) {
          await supabase.from('faculties').update({ avatar_url: trimmed }).eq('email', userEmail);
        }

        // Update moderators table
        if (userEmail) {
          await supabase.from('moderators').update({ avatar_url: trimmed }).eq('email', userEmail);
        }
      } catch (err) {
        console.error('Failed to update avatar in DB:', err);
      }
    }

    // Dispatch global event so all components update immediately
    window.dispatchEvent(new CustomEvent('unixx_avatar_updated', {
      detail: { email: userEmail, id: user?.id, avatar_url: trimmed }
    }));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    setIsEditingAvatar(false);
  };

  const initialLetter = userName?.charAt(0)?.toUpperCase() || userEmail?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Header Profile Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white dark:bg-slate-800 py-1.5 pl-1.5 pr-4 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
      >
        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-bold text-sm flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={userName} 
              className="w-full h-full object-cover" 
              onError={(e) => {
                // Fallback to initial letter if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }} 
            />
          ) : (
            <span>{initialLetter}</span>
          )}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-none truncate max-w-[120px]">{userName}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 capitalize truncate max-w-[120px]">{roleTitle}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-4 z-[999] text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Info Card */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="relative group w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold text-lg flex items-center justify-center overflow-hidden border border-slate-200 flex-shrink-0 shadow-xs">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span>{initialLetter}</span>
              )}
              <button 
                type="button"
                onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Change Avatar URL"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{userName}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{userEmail}</span>
              <span className="inline-block mt-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 dark:text-blue-300 dark:bg-blue-950/60 dark:border-blue-900/50 px-2.5 py-0.5 rounded-full w-fit capitalize">
                {roleTitle}
              </span>
            </div>
          </div>

          {/* Profile Picture direct URL section */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Profile Picture (Direct URL)
              </span>
              {!isEditingAvatar && (
                <button
                  type="button"
                  onClick={() => setIsEditingAvatar(true)}
                  className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {avatarUrl ? 'Change' : 'Add URL'}
                </button>
              )}
            </div>

            {isEditingAvatar ? (
              <div className="space-y-2 mt-1">
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInputUrl(avatarUrl);
                      setIsEditingAvatar(false);
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAvatar}
                    className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                {avatarUrl ? avatarUrl : 'No custom avatar URL set'}
              </p>
            )}

            {saveSuccess && (
              <div className="mt-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Avatar updated successfully!
              </div>
            )}
          </div>

          {/* Profile Actions / Attendance Analytics Option - ONLY for student accounts */}
          {role?.toLowerCase() === 'student' && (
            <div className="py-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsAnalyticsModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition-all cursor-pointer group"
              >
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                </div>
                <span>Attendance Analytics</span>
              </button>
            </div>
          )}

          {/* Sign Out Section in a distinct bottom layer / texture */}
          <div className="-mx-4 -mb-4 mt-1 p-3 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-700/80 rounded-b-2xl">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                handleSignOut();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200/80 dark:border-red-900/50 rounded-xl shadow-2xs hover:shadow-xs transition-all text-center cursor-pointer"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}

      {/* Attendance Analytics Modal */}
      {isAnalyticsModalOpen && role?.toLowerCase() === 'student' && (
        <StudentAttendanceAnalyticsView
          user={user}
          isModal={true}
          onClose={() => setIsAnalyticsModalOpen(false)}
        />
      )}
    </div>
  );
}
