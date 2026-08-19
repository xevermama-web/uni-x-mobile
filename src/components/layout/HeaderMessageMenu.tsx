import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search, Users, BookOpen, ChevronRight, X, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { resolveUserProfile, playNotificationSound, getLocalReadTime, setLocalReadTime } from '../../lib/chatUtils';

interface HeaderMessageMenuProps {
  user?: any;
  role?: string;
}

interface ChatGroupItem {
  id: string;
  name: string;
  description?: string;
  department?: string;
  batches?: string[];
  type?: 'study_group' | 'course_group';
  image_url?: string;
  group_photo?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function HeaderMessageMenu({ user, role }: HeaderMessageMenuProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState<ChatGroupItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const channelRef = useRef<any>(null);

  const currentUser = resolveUserProfile(user, role);

  // Determine chat route base path for current role
  const getChatBasePath = () => {
    const currentRole = currentUser?.role || role || 'student';
    if (currentRole === 'faculty') return '/faculty-dashboard/chat';
    if (currentRole === 'moderator') return '/moderator-dashboard/chat';
    return '/dashboard/chat';
  };

  // 1. Fetch user chat groups and calculate unread counts
  const fetchHeaderGroups = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    try {
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        const stored = localStorage.getItem('unixx_groups');
        const mockGroups: ChatGroupItem[] = stored ? JSON.parse(stored) : [];
        setGroups(mockGroups);
        setLoading(false);
        return;
      }

      // Query database groups
      const { data: dbGroups, error: groupsErr } = await supabase
        .from('study_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (groupsErr) throw groupsErr;

      const rawGroups = dbGroups || [];

      // Get user memberships
      const { data: myMemberships } = await supabase
        .from('group_members')
        .select('group_id, last_read_at, role')
        .eq('user_id', currentUser.id);

      const membershipMap = new Map<string, any>();
      (myMemberships || []).forEach(m => membershipMap.set(m.group_id, m));

      // Filter groups relevant to user
      const userDept = (currentUser.department || '').toLowerCase();
      const userBatch = currentUser.batch ? String(currentUser.batch) : '';
      const isFaculty = currentUser.role === 'faculty';
      const isAdminOrMod = currentUser.role === 'admin' || currentUser.role === 'moderator';

      const filtered = rawGroups.filter((g: any) => {
        // Faculty members must ONLY see Study Groups they personally created
        if (isFaculty) {
          return g.created_by === currentUser.id;
        }

        if (membershipMap.has(g.id)) return true;
        if (g.created_by === currentUser.id) return true;
        if (isAdminOrMod) return true;

        let batches = g.batches || [];
        let department = g.department || '';
        let type = g.type || 'study_group';

        if (typeof g.description === 'string' && g.description.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(g.description);
            if (parsed.batches) batches = parsed.batches;
            if (parsed.department) department = parsed.department;
            if (parsed.type) type = parsed.type;
          } catch (e) {}
        }

        if (userBatch && batches && batches.includes(userBatch)) {
          if (!department || department.toLowerCase() === userDept || department.toLowerCase().includes(userDept) || userDept.includes(department.toLowerCase())) return true;
        }
        if (type === 'course_group') return true;

        return false;
      });

      // Process unread counts and last message info
      const processed: ChatGroupItem[] = await Promise.all(
        filtered.map(async (g: any) => {
          let descriptionText = g.description || '';
          let department = g.department || '';
          let type: 'study_group' | 'course_group' = g.type || 'study_group';
          let imageUrl = g.image_url || g.group_photo || '';

          // Check localStorage cache
          const cachedPhoto = localStorage.getItem(`unixx_group_photo_${g.id}`);
          if (cachedPhoto) {
            imageUrl = cachedPhoto;
          }

          if (typeof descriptionText === 'string' && descriptionText.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(descriptionText);
              descriptionText = parsed.description || '';
              if (parsed.department) department = parsed.department;
              if (parsed.type) type = parsed.type;
              if (parsed.image_url || parsed.group_photo) {
                imageUrl = cachedPhoto || parsed.image_url || parsed.group_photo;
              }
            } catch (e) {}
          }

          const membership = membershipMap.get(g.id);
          const localRead = getLocalReadTime(currentUser.id, g.id);
          const lastReadTime = membership?.last_read_at || localRead || g.created_at;

          // Fetch last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('group_id', g.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Calculate unread count
          let unread = 0;
          if (lastReadTime) {
            const { count: unreadCnt } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', g.id)
              .gt('created_at', lastReadTime)
              .neq('sender_id', currentUser.id);

            unread = unreadCnt || 0;
          }

          return {
            id: g.id,
            name: g.name,
            description: descriptionText,
            department,
            type,
            image_url: imageUrl,
            group_photo: imageUrl,
            lastMessage: lastMsg?.content || 'No messages yet.',
            lastMessageTime: lastMsg?.created_at || g.created_at,
            unreadCount: unread
          };
        })
      );

      // Sort by last message timestamp descending
      processed.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      setGroups(processed);
    } catch (err) {
      console.error('Error fetching header chat groups:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, currentUser?.department, currentUser?.batch, currentUser?.role]);

  // Initial load
  useEffect(() => {
    fetchHeaderGroups();
  }, [fetchHeaderGroups]);

  // Listen to custom 'chat_read_updated' event dispatched when user reads chat in ChatPage or elsewhere
  useEffect(() => {
    const handleChatReadUpdated = (e: CustomEvent) => {
      const groupId = e.detail?.groupId;
      if (groupId) {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, unreadCount: 0 } : g));
      }
    };

    window.addEventListener('chat_read_updated' as any, handleChatReadUpdated);
    return () => {
      window.removeEventListener('chat_read_updated' as any, handleChatReadUpdated);
    };
  }, []);

  // 2. Setup Supabase Realtime Subscription for incoming messages
  useEffect(() => {
    if (!currentUser?.id || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      return;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`global-header-messages-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (!newMsg || !newMsg.id) return;

          // Avoid processing same message twice
          if (processedMessageIdsRef.current.has(newMsg.id)) return;
          processedMessageIdsRef.current.add(newMsg.id);

          // Messages sent by current user do NOT increase unread count
          if (newMsg.sender_id === currentUser.id) {
            setGroups(prev => {
              const updated = prev.map(g => {
                if (g.id === newMsg.group_id) {
                  return { ...g, lastMessage: newMsg.content, lastMessageTime: newMsg.created_at };
                }
                return g;
              });
              updated.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
              return updated;
            });
            return;
          }

          // Check if message belongs to one of user's groups
          setGroups(prev => {
            const groupExists = prev.some(g => g.id === newMsg.group_id);
            if (!groupExists) {
              // Group not in current list, refetch groups
              fetchHeaderGroups();
              return prev;
            }

            // Play notification sound for incoming unread message
            playNotificationSound();

            const updated = prev.map(g => {
              if (g.id === newMsg.group_id) {
                return {
                  ...g,
                  lastMessage: newMsg.content,
                  lastMessageTime: newMsg.created_at,
                  unreadCount: g.unreadCount + 1
                };
              }
              return g;
            });

            // Resort list
            updated.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
            return updated;
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUser?.id, fetchHeaderGroups]);

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Total unread count across all groups
  const totalUnreadCount = groups.reduce((acc, g) => acc + (g.unreadCount || 0), 0);

  // Mark group as read and navigate to chat
  const handleOpenGroup = (groupId: string) => {
    if (currentUser?.id) {
      setLocalReadTime(currentUser.id, groupId);
      
      // Update local state
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, unreadCount: 0 } : g));

      // Dispatch event to sync other components
      window.dispatchEvent(new CustomEvent('chat_read_updated', { detail: { groupId } }));

      // Update in Supabase
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        (async () => {
          try {
            await supabase
              .from('group_members')
              .update({ last_read_at: new Date().toISOString() })
              .eq('group_id', groupId)
              .eq('user_id', currentUser.id);
          } catch (e) {}
        })();
      }
    }

    setIsOpen(false);
    navigate(`${getChatBasePath()}?group=${groupId}`);
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.department && g.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Message Header Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-white dark:bg-slate-800 p-2.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        title="Study Groups & Messages"
        aria-label="Study Groups & Messages"
      >
        <MessageSquare className="h-5 w-5 text-slate-500 dark:text-slate-400 dark:text-slate-300" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white border-2 border-white shadow-2xs animate-in zoom-in-50 duration-200">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-4 z-[999] text-slate-800 dark:text-slate-200 dark:text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">Messages & Groups</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Study groups & course channels</p>
              </div>
            </div>
            {totalUnreadCount > 0 ? (
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                {totalUnreadCount} unread
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                All caught up
              </span>
            )}
          </div>

          {/* Search Bar */}
          <div className="mt-3 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search study groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Group List */}
          <div className="mt-3 max-h-72 overflow-y-auto space-y-1 pr-0.5">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading chat groups...</div>
            ) : filteredGroups.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {searchQuery ? 'No matching study groups found' : 'No study groups available'}
              </div>
            ) : (
              filteredGroups.map((group) => {
                const hasUnread = group.unreadCount > 0;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleOpenGroup(group.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer group ${
                      hasUnread
                        ? 'bg-blue-50/60 hover:bg-blue-50 border border-blue-100/80 shadow-2xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    {group.image_url || group.group_photo ? (
                      <img
                        src={group.image_url || group.group_photo}
                        alt={group.name}
                        className="w-9 h-9 rounded-xl object-cover flex-shrink-0 mt-0.5 border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                        group.type === 'course_group'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {group.type === 'course_group' ? <BookOpen className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-xs truncate ${hasUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-semibold text-slate-800 dark:text-slate-200'}`}>
                          {group.name}
                        </span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {formatTime(group.lastMessageTime)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[11px] truncate ${hasUnread ? 'font-semibold text-blue-900' : 'text-slate-500 dark:text-slate-400'}`}>
                          {group.lastMessage}
                        </p>
                        {hasUnread && (
                          <span className="bg-blue-600 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full flex-shrink-0 shadow-2xs">
                            {group.unreadCount > 99 ? '99+' : group.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer - Go to Full Chat */}
          <div className="-mx-4 -mb-4 mt-3 p-3 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-700/80 rounded-b-2xl">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(getChatBasePath());
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 rounded-xl shadow-2xs hover:shadow-xs transition-all text-center cursor-pointer"
            >
              <span>Open Study Groups & Chat</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
