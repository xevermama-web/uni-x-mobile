import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, X, Users, Calendar, BookOpen, AlertTriangle, FileText, ChevronRight, Filter } from 'lucide-react';
import { resolveUserProfile } from '../../lib/chatUtils';
import {
  getUserNotifications,
  getUserNotificationsAsync,
  subscribeToRealtimeNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNoticeLink,
  NotificationItem
} from '../../lib/notificationService';

interface HeaderNotificationMenuProps {
  user?: any;
  role?: string;
}

export default function HeaderNotificationMenu({ user, role }: HeaderNotificationMenuProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'notice' | 'academic' | 'alerts'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentUser = resolveUserProfile(user, role);

  const refreshNotifications = useCallback(() => {
    if (!currentUser?.id) return;
    // Initial sync
    const items = getUserNotifications(user, role);
    setNotifications(items);
    
    // Async DB query
    getUserNotificationsAsync(user, role).then((asyncItems) => {
      setNotifications(asyncItems);
    });
  }, [user, role, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;

    // Subscribe to real-time Supabase postgres_changes & local events
    const unsubscribe = subscribeToRealtimeNotifications(user, role, (updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    return () => {
      unsubscribe();
    };
  }, [user, role, currentUser?.id]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleItemClick = (item: NotificationItem) => {
    if (currentUser?.id) {
      markNotificationAsRead(currentUser.id, item.id);
      refreshNotifications();
    }
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleMarkAllRead = () => {
    if (currentUser?.id) {
      const allIds = notifications.map(n => n.id);
      markAllNotificationsAsRead(currentUser.id, allIds);
      refreshNotifications();
    }
  };

  // Filtered list
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'notice') return n.type === 'notice';
    if (filter === 'academic') return n.type === 'study_group' || n.type === 'routine' || n.type === 'material';
    if (filter === 'alerts') return n.type === 'low_attendance';
    return true;
  });

  const getIconForType = (type: NotificationItem['type']) => {
    switch (type) {
      case 'notice':
        return <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'study_group':
        return <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'routine':
        return <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'material':
        return <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'low_attendance':
        return <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSecs < 60) return 'Just now';
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
      if (diffSecs < 172800) return 'Yesterday';
      return `${Math.floor(diffSecs / 86400)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative bg-white dark:bg-slate-800 p-2.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
          isOpen ? 'ring-2 ring-blue-500/30 bg-slate-50 dark:bg-slate-700' : ''
        }`}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-slate-900 shadow-2xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 z-[999] overflow-hidden transition-all text-slate-800 dark:text-slate-100 font-sans">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 rounded-lg text-blue-600 dark:text-blue-400">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1 overflow-x-auto no-scrollbar bg-slate-50/30 dark:bg-slate-900/60 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('notice')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === 'notice'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Notices
            </button>
            <button
              onClick={() => setFilter('academic')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === 'academic'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Academic
            </button>
            <button
              onClick={() => setFilter('alerts')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === 'alerts'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Alerts
            </button>
          </div>

          {/* Notification List Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 opacity-60" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No notifications found</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">You are all caught up with your updates!</p>
              </div>
            ) : (
              filteredNotifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    !item.read
                      ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 mt-0.5">
                    {getIconForType(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className={`text-xs font-semibold truncate ${!item.read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0">
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-1.5 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between">
                      {item.targetInfo ? (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${item.badgeColor || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {item.targetInfo}
                        </span>
                      ) : (
                        <span />
                      )}

                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 px-2 text-[11px]">
              Role: <strong className="capitalize text-slate-700 dark:text-slate-200">{currentUser?.role || 'User'}</strong>
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate(getNoticeLink(currentUser?.role || 'student'));
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1 px-2 py-1"
            >
              Notice Board
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
