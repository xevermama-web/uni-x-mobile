import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ChatGroup, ChatMessage, GroupMember, GroupFormData } from '../types/chat';
import { playNotificationSound } from '../lib/chatUtils';

function cleanBatchNumber(str: string): string {
  if (!str) return '';
  const clean = String(str).toLowerCase().trim();
  const numMatch = clean.match(/\d+/);
  if (numMatch) return numMatch[0];
  return clean.replace(/^(cs\s*|cse\s*|batch\s*|-)+/i, '').trim();
}

function isDepartmentMatch(studentDept: string, targetDeptList: string[]): boolean {
  if (!targetDeptList || targetDeptList.length === 0) return true;
  const sDept = (studentDept || '').trim().toLowerCase();
  if (!sDept) return false;

  return targetDeptList.some(target => {
    const t = target.trim().toLowerCase();
    if (!t) return true;
    if (sDept === t) return true;
    if (sDept.includes(t) || t.includes(sDept)) return true;

    const abbrevMap: Record<string, string[]> = {
      'cse': ['computer science', 'software engineering', 'computer science and engineering'],
      'eee': ['electrical', 'electronics', 'electrical and electronic engineering'],
      'bba': ['business', 'business administration'],
      'swe': ['software engineering'],
      'ce': ['civil engineering'],
      'me': ['mechanical engineering']
    };

    if (abbrevMap[sDept]) {
      if (abbrevMap[sDept].some(full => t.includes(full) || full.includes(t))) return true;
    }
    if (abbrevMap[t]) {
      if (abbrevMap[t].some(full => sDept.includes(full) || full.includes(sDept))) return true;
    }

    return false;
  });
}

function isBatchMatch(studentBatch: string, targetBatchList: string[]): boolean {
  if (!targetBatchList || targetBatchList.length === 0) return true;
  const sRaw = String(studentBatch || '').trim().toLowerCase();
  if (!sRaw) return false;

  const sClean = cleanBatchNumber(sRaw);

  return targetBatchList.some(target => {
    const tRaw = String(target || '').trim().toLowerCase();
    if (!tRaw) return true;
    if (sRaw === tRaw) return true;

    const tClean = cleanBatchNumber(tRaw);
    if (sClean && tClean && sClean === tClean) return true;

    if (sRaw.endsWith(tClean) || tRaw.endsWith(sClean)) return true;
    if (sRaw.includes(tRaw) || tRaw.includes(sRaw)) return true;

    return false;
  });
}

export function useChat(currentUser: any) {
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const channelRef = useRef<any>(null);
  const activeGroupIdRef = useRef<string | null>(activeGroupId);
  const messagesCacheRef = useRef<Map<string, ChatMessage[]>>(new Map());
  const membersCacheRef = useRef<Map<string, GroupMember[]>>(new Map());

  // Keep activeGroupIdRef synchronized
  useEffect(() => {
    activeGroupIdRef.current = activeGroupId;
  }, [activeGroupId]);

  // Reset chat state and channel when currentUser is null or changes
  useEffect(() => {
    if (!currentUser?.id) {
      setGroups([]);
      setActiveGroupId(null);
      setMessages([]);
      setMembers([]);
      messagesCacheRef.current.clear();
      membersCacheRef.current.clear();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }
  }, [currentUser?.id]);

  // Parse description metadata helper
  const parseGroupMeta = (group: any): ChatGroup => {
    let descriptionText = group.description || '';
    let department = group.department || '';
    let batches = group.batches || [];
    let type: 'study_group' | 'course_group' = group.type || 'study_group';
    let message_retention: '7_days' | '1_month' | '6_months' = group.message_retention || '7_days';
    let image_url: string | null = group.image_url || group.group_photo || null;

    if (descriptionText && descriptionText.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(descriptionText);
        descriptionText = parsed.description || '';
        if (parsed.department) department = parsed.department;
        if (parsed.batches) batches = parsed.batches;
        if (parsed.type) type = parsed.type;
        if (parsed.message_retention) message_retention = parsed.message_retention;
        if (parsed.image_url) image_url = parsed.image_url;
        if (parsed.group_photo) image_url = parsed.group_photo;
      } catch (e) {
        // Fallback to raw string if parsing fails
      }
    }

    const cachedPhoto = localStorage.getItem(`unixx_group_photo_${group.id}`);
    if (cachedPhoto) {
      image_url = cachedPhoto;
    }

    return {
      ...group,
      description: descriptionText,
      department,
      batches,
      type,
      message_retention,
      image_url,
      group_photo: image_url
    };
  };

  // Helper to get local last_read timestamp
  const getLocalReadTime = (groupId: string) => {
    if (!currentUser?.id) return null;
    return localStorage.getItem(`chat_read_${currentUser.id}_${groupId}`);
  };

  // Helper to set local last_read timestamp
  const setLocalReadTime = (groupId: string) => {
    if (!currentUser?.id) return;
    const now = new Date().toISOString();
    localStorage.setItem(`chat_read_${currentUser.id}_${groupId}`, now);
  };

  // 1. Fetch available chat groups
  const fetchGroups = useCallback(async (isInitial = false) => {
    if (!currentUser?.id) {
      setLoadingGroups(false);
      return;
    }

    if (isInitial && groups.length === 0) {
      setLoadingGroups(true);
    }

    try {
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        const stored = localStorage.getItem('unixx_groups');
        let mockGroups: ChatGroup[] = stored ? JSON.parse(stored) : [];
        if (currentUser?.role === 'faculty') {
          mockGroups = mockGroups.filter(g => g.created_by === currentUser.id);
        }
        setGroups(mockGroups);
        setActiveGroupId(current => {
          if (currentUser?.role === 'faculty' && current && !mockGroups.some(g => g.id === current)) {
            return mockGroups.length > 0 ? mockGroups[0].id : null;
          } else if (!current && mockGroups.length > 0) {
            return mockGroups[0].id;
          }
          return current;
        });
        setLoadingGroups(false);
        return;
      }

      // Query database for groups
      // A user gets groups where they are in group_members, OR groups created by them, OR matching department/batch
      const { data: dbGroups, error: groupsErr } = await supabase
        .from('study_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (groupsErr) throw groupsErr;

      let rawGroups = dbGroups || [];

      // Fetch user's member entries to check membership
      const { data: myMemberships } = await supabase
        .from('group_members')
        .select('group_id, last_read_at, role')
        .eq('user_id', currentUser.id);

      const membershipMap = new Map<string, any>();
      (myMemberships || []).forEach(m => membershipMap.set(m.group_id, m));

      // Filter groups relevant to this user
      const userDept = (currentUser.department || '').toLowerCase();
      const userBatch = currentUser.batch ? String(currentUser.batch) : '';
      const isFaculty = currentUser.role === 'faculty';
      const isAdminOrMod = currentUser.role === 'admin' || currentUser.role === 'moderator';

      const filtered = rawGroups.filter((g: any) => {
        const meta = parseGroupMeta(g);

        // Faculty accounts: Each faculty member MUST ONLY see and access Study Groups they personally created.
        // Study Groups created by other Faculty members or others MUST NOT appear in that Faculty member's list.
        if (isFaculty) {
          return g.created_by === currentUser.id;
        }

        // Is member directly
        if (membershipMap.has(g.id)) return true;
        // Is creator
        if (g.created_by === currentUser.id) return true;
        // Admin and Moderator access remains unchanged
        if (isAdminOrMod) return true;
        // Student matching department and batch
        const targetDepts = meta.department ? meta.department.split(',') : [];
        const matchesDept = isDepartmentMatch(currentUser.department || '', targetDepts);
        const matchesBatch = isBatchMatch(currentUser.batch ? String(currentUser.batch) : '', meta.batches || []);

        if (matchesDept && matchesBatch) {
          // Auto-upsert student into group_members if not already registered
          if (!membershipMap.has(g.id) && currentUser.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id)) {
            Promise.resolve(
              supabase
                .from('group_members')
                .upsert([{ group_id: g.id, user_id: currentUser.id }], { onConflict: 'group_id,user_id' })
            ).catch(() => {});
          }
          return true;
        }
        // Course groups without restricted batches
        if (meta.type === 'course_group') return true;

        return false;
      });

      // Enhance group information with unread count, last message, and member count
      const processedGroups: ChatGroup[] = await Promise.all(
        filtered.map(async (g: any) => {
          const groupObj = parseGroupMeta(g);
          const membership = membershipMap.get(g.id);
          const localRead = getLocalReadTime(g.id);
          const lastReadTime = membership?.last_read_at || localRead || groupObj.created_at;

          // Fetch member count
          const { count: mCount } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', g.id);

          // Fetch last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('group_id', g.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Fetch unread count
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
            ...groupObj,
            memberCount: (mCount || 0) + 1, // Include creator
            lastMessage: lastMsg?.content || 'No messages yet.',
            lastMessageTime: lastMsg?.created_at || g.created_at,
            unreadCount: unread
          };
        })
      );

      // Sort by lastMessageTime descending (WhatsApp Web style)
      processedGroups.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

      setGroups(processedGroups);

      // Auto-select active group or reset if unauthorized using functional update
      setActiveGroupId(current => {
        if (current && isFaculty) {
          const isAllowed = processedGroups.some(g => g.id === current);
          if (!isAllowed) {
            return processedGroups.length > 0 ? processedGroups[0].id : null;
          }
          return current;
        } else if (!current && processedGroups.length > 0) {
          return processedGroups[0].id;
        }
        return current;
      });
    } catch (err) {
      console.error('Error fetching chat groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  }, [currentUser]);

  // 2. Fetch messages for active group
  const fetchMessages = useCallback(async (groupId: string) => {
    if (!groupId) return;

    // Faculty security check: Faculty member must ONLY be able to view messages of groups they created
    if (currentUser?.role === 'faculty') {
      let isOwner = false;
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        const stored = localStorage.getItem('unixx_groups');
        const mockGroups: ChatGroup[] = stored ? JSON.parse(stored) : [];
        const target = mockGroups.find(g => g.id === groupId);
        if (target && target.created_by === currentUser.id) isOwner = true;
      } else {
        const { data: targetGroup } = await supabase
          .from('study_groups')
          .select('created_by')
          .eq('id', groupId)
          .maybeSingle();

        if (targetGroup && targetGroup.created_by === currentUser.id) isOwner = true;
      }

      if (!isOwner) {
        console.warn('Access denied: Faculty members cannot view messages for groups created by others.');
        setMessages([]);
        setMembers([]);
        setLoadingMessages(false);
        return;
      }
    }

    // Load from cache instantly if available for smooth group switching UX
    const cachedMsgs = messagesCacheRef.current.get(groupId);
    const cachedMembers = membersCacheRef.current.get(groupId);

    if (cachedMsgs) {
      setMessages(cachedMsgs);
      if (cachedMembers) setMembers(cachedMembers);
      setLoadingMessages(false);
    } else {
      setLoadingMessages(true);
    }

    try {
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        const storedMsgs = localStorage.getItem(`unixx_msgs_${groupId}`);
        const mockMsgs: ChatMessage[] = storedMsgs ? JSON.parse(storedMsgs) : [];
        messagesCacheRef.current.set(groupId, mockMsgs);
        setMessages(mockMsgs);
        setLoadingMessages(false);
        return;
      }

      // Fetch messages from Supabase
      const { data: dbMsgs, error: msgErr } = await supabase
        .from('messages')
        .select('*, sender:sender_id(id, full_name, email, role, avatar_url)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (msgErr) throw msgErr;

      // Fetch profiles for sender IDs to ensure names are always accurate
      const senderIds = Array.from(new Set((dbMsgs || []).map((m: any) => m.sender_id))).filter(id => id !== 'd3e89a79-18c7-4966-bcec-a108f305529c');
      let profileMap = new Map<string, any>();
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, avatar_url')
          .in('id', senderIds);
        (profiles || []).forEach(p => profileMap.set(p.id, p));
      }

      // Ensure sender information is correctly mapped from message.sender_id
      const processedMsgs: ChatMessage[] = (dbMsgs || []).map((m: any) => {
        let sender = m.sender || profileMap.get(m.sender_id);
        const isAdminSender = m.sender_id === 'd3e89a79-18c7-4966-bcec-a108f305529c'
          || (sender?.role || '').toLowerCase() === 'admin'
          || sender?.email === 'admin@unixx.com';

        // Helper to check localStorage cached avatar
        const getSenderAvatar = (email?: string, id?: string, defaultAvatar?: string | null) => {
          if (email) {
            const cached = localStorage.getItem(`unixx_avatar_${email}`);
            if (cached) return cached;
          }
          if (id) {
            const cached = localStorage.getItem(`unixx_avatar_${id}`);
            if (cached) return cached;
          }
          return defaultAvatar || null;
        };

        if (isAdminSender) {
          const adminEmail = 'admin@unixx.com';
          const adminId = 'd3e89a79-18c7-4966-bcec-a108f305529c';
          sender = {
            id: adminId,
            full_name: 'Admin',
            role: 'admin',
            email: adminEmail,
            avatar_url: getSenderAvatar(adminEmail, adminId, sender?.avatar_url)
          };
        } else {
          const prof = profileMap.get(m.sender_id) || sender;
          let fullName = prof?.full_name || '';
          if (!fullName || fullName.includes('@')) {
            fullName = (prof?.role === 'faculty') ? 'Faculty Member' : 'Student';
          }
          const email = prof?.email || '';
          const id = m.sender_id;
          sender = {
            id,
            full_name: fullName,
            role: (prof?.role || 'student').toLowerCase(),
            email,
            avatar_url: getSenderAvatar(email, id, prof?.avatar_url)
          };
        }

        return {
          ...m,
          sender
        };
      });

      messagesCacheRef.current.set(groupId, processedMsgs);
      setMessages(processedMsgs);

      // Fetch group members with profiles
      const { data: dbMembers } = await supabase
        .from('group_members')
        .select('*, profile:user_id(id, full_name, email, role, avatar_url, department, batch)')
        .eq('group_id', groupId);

      const formattedMembers: GroupMember[] = dbMembers ? dbMembers.map((m: any) => ({
        ...m,
        profile: m.profile || { id: m.user_id, full_name: 'Group Member', role: m.role }
      })) : [];

      membersCacheRef.current.set(groupId, formattedMembers);
      setMembers(formattedMembers);

      // Mark group as read
      markGroupAsRead(groupId);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUser]);

  // Mark group as read function
  const markGroupAsRead = async (groupId: string) => {
    if (!groupId || !currentUser?.id) return;
    setLocalReadTime(groupId);

    // Update unread count in local groups state
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, unreadCount: 0 } : g));

    // Dispatch global event so header unread badge updates immediately
    window.dispatchEvent(new CustomEvent('chat_read_updated', { detail: { groupId } }));

    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
        await supabase
          .from('group_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('group_id', groupId)
          .eq('user_id', currentUser.id);
      } catch (e) {
        // Ignore RLS update error
      }
    }
  };

  // Fetch messages when activeGroupId changes
  useEffect(() => {
    if (activeGroupId) {
      fetchMessages(activeGroupId);
    }
  }, [activeGroupId, fetchMessages]);

  // Listen to custom 'chat_read_updated' event to synchronize unread counts across components
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

  // 3. Setup Supabase Realtime Subscription across all groups
  useEffect(() => {
    if (!currentUser?.id || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      return;
    }

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Subscribe to realtime changes on 'messages' table globally for user
    const channel = supabase
      .channel(`chat-page-global-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const newMsg = payload.new as any;
          if (!newMsg || !newMsg.id) return;

          const currentActive = activeGroupIdRef.current;

          // If message belongs to currently active group, add to messages stream
          if (currentActive && newMsg.group_id === currentActive) {
            let senderProfile = null;
            const isAdminSender = newMsg.sender_id === 'd3e89a79-18c7-4966-bcec-a108f305529c';

            if (isAdminSender) {
              senderProfile = {
                id: 'd3e89a79-18c7-4966-bcec-a108f305529c',
                full_name: 'Admin',
                role: 'admin',
                email: 'admin@unixx.com'
              };
            } else {
              const { data: p } = await supabase
                .from('profiles')
                .select('id, full_name, email, role, avatar_url')
                .eq('id', newMsg.sender_id)
                .maybeSingle();

              if (p) {
                const isPAdmin = (p.role || '').toLowerCase() === 'admin' || p.email === 'admin@unixx.com';
                senderProfile = isPAdmin ? {
                  ...p,
                  role: 'admin',
                  full_name: 'Admin'
                } : p;
              } else if (newMsg.sender_id === currentUser?.id) {
                senderProfile = {
                  id: currentUser.id,
                  full_name: currentUser.role === 'admin' ? 'Admin' : (currentUser.full_name || 'You'),
                  role: currentUser.role,
                  avatar_url: currentUser.avatar_url
                };
              } else {
                senderProfile = { id: newMsg.sender_id, full_name: 'Member', role: 'student' };
              }
            }

            const formattedMsg: ChatMessage = {
              id: newMsg.id,
              group_id: newMsg.group_id,
              sender_id: newMsg.sender_id,
              content: newMsg.content,
              created_at: newMsg.created_at,
              sender: senderProfile
            };

            setMessages(prev => {
              if (prev.some(m => m.id === formattedMsg.id)) return prev;
              const next = [...prev, formattedMsg];
              messagesCacheRef.current.set(currentActive, next);
              return next;
            });

            markGroupAsRead(currentActive);
          } else {
            // Update cache for non-active group if present in cache
            const cached = messagesCacheRef.current.get(newMsg.group_id);
            if (cached && !cached.some(m => m.id === newMsg.id)) {
              messagesCacheRef.current.set(newMsg.group_id, [...cached, {
                id: newMsg.id,
                group_id: newMsg.group_id,
                sender_id: newMsg.sender_id,
                content: newMsg.content,
                created_at: newMsg.created_at,
                sender: { id: newMsg.sender_id, full_name: 'Member', role: 'student' }
              }]);
            }

            if (newMsg.sender_id !== currentUser.id) {
              // Play notification chime for incoming messages in other groups
              playNotificationSound();
            }
          }

          // Update groups list: last message, timestamp, unread count, and RE-SORT by lastMessageTime descending!
          setGroups(prev => {
            const groupExists = prev.some(g => g.id === newMsg.group_id);
            if (!groupExists) {
              fetchGroups();
              return prev;
            }

            const updated = prev.map(g => {
              if (g.id === newMsg.group_id) {
                const isCurrentActive = g.id === activeGroupIdRef.current;
                const isMyMessage = newMsg.sender_id === currentUser.id;
                const newUnread = (isCurrentActive || isMyMessage) ? 0 : g.unreadCount + 1;
                return {
                  ...g,
                  lastMessage: newMsg.content,
                  lastMessageTime: newMsg.created_at,
                  unreadCount: newUnread
                };
              }
              return g;
            });

            // Re-sort by lastMessageTime descending (WhatsApp Web style)
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
  }, [currentUser?.id]);

  // Initial groups load
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // 4. Send Message function
  const sendMessage = async (content: string) => {
    if (!content.trim() || !activeGroupId || !currentUser?.id) return false;

    // Faculty security check: Faculty can ONLY send messages inside groups they personally created
    if (currentUser.role === 'faculty') {
      let isOwner = false;
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        const stored = localStorage.getItem('unixx_groups');
        const mockGroups: ChatGroup[] = stored ? JSON.parse(stored) : [];
        const target = mockGroups.find(g => g.id === activeGroupId);
        if (target && target.created_by === currentUser.id) isOwner = true;
      } else {
        const { data: targetGroup } = await supabase
          .from('study_groups')
          .select('created_by')
          .eq('id', activeGroupId)
          .maybeSingle();

        if (targetGroup && targetGroup.created_by === currentUser.id) isOwner = true;
      }

      if (!isOwner) {
        console.warn('Access denied: Faculty members cannot send messages in groups created by others.');
        alert('Permission denied: Faculty members can only send messages inside their own created groups.');
        return false;
      }
    }

    setSending(true);
    const text = content.trim();

    try {
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        // Mock send
        const newMockMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          group_id: activeGroupId,
          sender_id: currentUser.id,
          content: text,
          created_at: new Date().toISOString(),
          sender: {
            id: currentUser.id,
            full_name: currentUser.role === 'admin' ? 'Admin' : (currentUser.full_name || 'You'),
            role: currentUser.role
          }
        };
        setMessages(prev => [...prev, newMockMsg]);
        setGroups(prev => {
          const updated = prev.map(g => g.id === activeGroupId ? {
            ...g,
            lastMessage: text,
            lastMessageTime: newMockMsg.created_at,
            unreadCount: 0
          } : g);
          updated.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
          return updated;
        });
        setSending(false);
        return true;
      }

      const isUserAdmin = currentUser.role === 'admin' || currentUser.email === 'admin@unixx.com' || currentUser.id === 'd3e89a79-18c7-4966-bcec-a108f305529c';
      const senderIdToUse = isUserAdmin ? 'd3e89a79-18c7-4966-bcec-a108f305529c' : currentUser.id;

      // Ensure user profile exists in profiles table before inserting message
      await supabase.from('profiles').upsert([
        {
          id: senderIdToUse,
          email: currentUser.email || (isUserAdmin ? 'admin@unixx.com' : ''),
          full_name: isUserAdmin ? 'Admin' : (currentUser.full_name || 'User'),
          role: isUserAdmin ? 'admin' : (currentUser.role || 'student'),
          department: currentUser.department || 'Computer Science'
        }
      ], { onConflict: 'id' });

      // Insert message into database
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            group_id: activeGroupId,
            sender_id: senderIdToUse,
            content: text
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const formattedMsg: ChatMessage = {
          ...data,
          sender: {
            id: senderIdToUse,
            full_name: isUserAdmin ? 'Admin' : (currentUser.full_name || 'User'),
            role: isUserAdmin ? 'admin' : currentUser.role,
            avatar_url: currentUser.avatar_url
          }
        };

        setMessages(prev => {
          if (prev.some(m => m.id === formattedMsg.id)) return prev;
          return [...prev, formattedMsg];
        });

        setGroups(prev => {
          const updated = prev.map(g => g.id === activeGroupId ? {
            ...g,
            lastMessage: text,
            lastMessageTime: formattedMsg.created_at,
            unreadCount: 0
          } : g);
          updated.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
          return updated;
        });
      }

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    } finally {
      setSending(false);
    }
  };

  // Helper to sync student members for department and batches
  const syncGroupMembers = async (groupId: string, department?: string, batches?: string[]) => {
    if (!groupId) return;

    try {
      const deptList = typeof department === 'string'
        ? department.split(',').map(d => d.trim()).filter(Boolean)
        : (Array.isArray(department) ? (department as any[]).map(d => String(d).trim()).filter(Boolean) : []);

      const batchList = Array.isArray(batches)
        ? batches.map(b => String(b).trim()).filter(Boolean)
        : [];

      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id, department, batch, role, academic_id');

        if (allProfiles && allProfiles.length > 0) {
          const studentProfiles = allProfiles.filter(p => {
            const r = (p.role || '').toLowerCase();
            return r === 'student' || (!r && p.academic_id) || (!['admin', 'faculty', 'moderator'].includes(r));
          });

          const matchingStudents = studentProfiles.filter(s => {
            const matchesDept = isDepartmentMatch(s.department || '', deptList);
            const matchesBatch = isBatchMatch(s.batch || '', batchList);
            return matchesDept && matchesBatch;
          });

          if (matchingStudents.length > 0) {
            const memberRows = matchingStudents
              .filter(s => s.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.id))
              .map(s => ({
                group_id: groupId,
                user_id: s.id
              }));

            if (memberRows.length > 0) {
              await supabase
                .from('group_members')
                .upsert(memberRows, { onConflict: 'group_id,user_id' });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error syncing group members:', err);
    }
  };

  // 5. Create Group function
  const createGroup = async (formData: GroupFormData): Promise<{ success: boolean; error?: string; group?: any } | boolean> => {
    if (!currentUser?.id) {
      return { success: false, error: 'User is not logged in.' };
    }

    if (currentUser.role === 'student') {
      return { success: false, error: 'Students are not permitted to create study groups. Only Admin, Moderator, and Faculty members can create groups.' };
    }

    try {
      const response = await fetch('/api/chat/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          department: formData.department,
          batches: formData.batches,
          type: formData.type,
          courseId: formData.course_id,
          createdBy: currentUser.id,
          creatorEmail: currentUser.email,
          creatorRole: currentUser.role,
          creatorName: currentUser.full_name || currentUser.name,
          message_retention: formData.message_retention,
          image_url: formData.image_url,
          group_photo: formData.group_photo
        })
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success && result.group) {
        await fetchGroups();
        setActiveGroupId(result.group.id);
        return { success: true, group: result.group };
      }

      if (result.error) {
        console.error('API create group failed:', result.error);
        if (response.status === 403 || response.status === 400) {
          return { success: false, error: result.error };
        }
      }

      // Fallback direct insert if API route is unavailable
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const photoUrl = formData.image_url || formData.group_photo || '';
        const metaDescription = JSON.stringify({
          description: formData.description || '',
          department: formData.department || '',
          batches: formData.batches || [],
          type: formData.type || 'study_group',
          message_retention: formData.message_retention || '7_days',
          image_url: photoUrl,
          group_photo: photoUrl,
          created_by: currentUser.id,
          created_by_role: currentUser.role
        });

        const insertObj: any = {
          name: formData.name.trim(),
          description: metaDescription,
          created_by: currentUser.id
        };
        if (formData.course_id) {
          insertObj.course_id = formData.course_id;
        }

        const { data: newGroup, error: groupErr } = await supabase
          .from('study_groups')
          .insert([insertObj])
          .select()
          .single();

        if (groupErr) {
          console.error('Direct Supabase group insert error:', groupErr);
          return { success: false, error: result.error || groupErr.message || 'Database error creating group.' };
        }

        if (newGroup) {
          // Add creator as member
          if (currentUser.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id)) {
            await supabase.from('group_members').upsert([
              { group_id: newGroup.id, user_id: currentUser.id }
            ], { onConflict: 'group_id,user_id' });
          }

          // Sync student members
          await syncGroupMembers(newGroup.id, formData.department, formData.batches);

          await fetchGroups();
          setActiveGroupId(newGroup.id);
          return { success: true, group: newGroup };
        }
      }

      // Local storage fallback if Supabase URL is placeholder
      const stored = localStorage.getItem('unixx_groups') || '[]';
      const groupsList = JSON.parse(stored);
      const newLocalGroup = {
        id: `group-${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description,
        department: formData.department,
        batches: formData.batches,
        type: formData.type || 'study_group',
        created_by: currentUser.id,
        created_at: new Date().toISOString()
      };
      groupsList.push(newLocalGroup);
      localStorage.setItem('unixx_groups', JSON.stringify(groupsList));

      await fetchGroups();
      setActiveGroupId(newLocalGroup.id);
      return { success: true, group: newLocalGroup };

    } catch (err: any) {
      console.error('Error creating group:', err);
      return { success: false, error: err.message || 'Network error while creating group.' };
    }
  };

  // 6. Update Group function
  const updateGroup = async (groupId: string, formData: GroupFormData): Promise<{ success: boolean; error?: string } | boolean> => {
    if (currentUser?.role === 'faculty') {
      const target = groups.find(g => g.id === groupId);
      if (target && target.created_by !== currentUser.id) {
        return { success: false, error: 'Permission denied: Faculty members can only update groups they personally created.' };
      }
    }

    try {
      const response = await fetch('/api/chat/groups/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          userId: currentUser?.id,
          name: formData.name,
          description: formData.description,
          department: formData.department,
          batches: formData.batches,
          message_retention: formData.message_retention,
          image_url: formData.image_url,
          group_photo: formData.group_photo
        })
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        await fetchGroups();
        if (activeGroupId === groupId) {
          await fetchMessages(groupId);
        }
        return { success: true };
      }

      if (result.error) {
        return { success: false, error: result.error };
      }

      // Direct Supabase fallback
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const photoUrl = formData.image_url || formData.group_photo || '';
        const metaDescription = JSON.stringify({
          description: formData.description || '',
          department: formData.department || '',
          batches: formData.batches || [],
          type: formData.type || 'study_group',
          message_retention: formData.message_retention || '7_days',
          image_url: photoUrl,
          group_photo: photoUrl
        });

        const { error: groupErr } = await supabase
          .from('study_groups')
          .update({
            name: formData.name.trim(),
            description: metaDescription
          })
          .eq('id', groupId);

        if (groupErr) {
          return { success: false, error: groupErr.message };
        }

        await syncGroupMembers(groupId, formData.department, formData.batches);
        await fetchGroups();
        if (activeGroupId === groupId) {
          await fetchMessages(groupId);
        }
        return { success: true };
      }

      await fetchGroups();
      return { success: true };
    } catch (err: any) {
      console.error('Error updating group:', err);
      return { success: false, error: err.message || 'Failed to update group.' };
    }
  };

  // 7. Delete Group function
  const deleteGroup = async (groupId: string): Promise<boolean> => {
    if (!groupId || !currentUser) {
      console.warn('deleteGroup called with missing groupId or currentUser');
      return false;
    }

    const role = (currentUser.role || '').toLowerCase();
    const isUserAdmin = role === 'admin' || currentUser.email === 'admin@unixx.com' || currentUser.id === 'd3e89a79-18c7-4966-bcec-a108f305529c';
    const isUserModerator = role === 'moderator';
    const isUserFaculty = role === 'faculty';

    // Requirement 10: Student accounts must remain completely unable to delete groups.
    if (!isUserAdmin && !isUserModerator && !isUserFaculty) {
      const errMsg = 'Permission denied. Student accounts cannot delete study groups.';
      console.warn(errMsg);
      alert(errMsg);
      return false;
    }

    let isDeleted = false;
    let lastErrorMessage = '';

    // Strategy 1: Direct Supabase Client Delete (using RLS policies)
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
        await supabase.from('messages').delete().eq('group_id', groupId);
        await supabase.from('group_members').delete().eq('group_id', groupId);

        const { error: sbError } = await supabase
          .from('study_groups')
          .delete()
          .eq('id', groupId);

        if (!sbError) {
          isDeleted = true;
        } else {
          console.warn('Supabase client direct group delete notice:', sbError.message);
          lastErrorMessage = sbError.message;
        }
      } catch (err: any) {
        console.warn('Supabase client delete exception:', err?.message || err);
        lastErrorMessage = err?.message || String(err);
      }
    }

    // Strategy 2: Backend API endpoint delete (if not already deleted or as primary fallback)
    if (!isDeleted) {
      try {
        const response = await fetch('/api/chat/groups/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            groupId,
            userId: currentUser.id,
            userEmail: currentUser.email,
            userRole: currentUser.role
          })
        });

        const contentType = response.headers.get('content-type') || '';
        let resData: any = {};

        if (contentType.includes('application/json')) {
          resData = await response.json();
        } else {
          const rawText = await response.text();
          console.warn('Non-JSON response from /api/chat/groups/delete:', rawText);
          if (response.ok) {
            resData = { success: true };
          } else {
            resData = { success: false, error: `Server returned status ${response.status}` };
          }
        }

        if (response.ok && resData.success !== false) {
          isDeleted = true;
        } else {
          lastErrorMessage = resData.error || lastErrorMessage || 'Failed to delete group on server';
        }
      } catch (apiErr: any) {
        console.error('API group delete exception:', apiErr);
        const rawErr = apiErr?.message || String(apiErr);
        if (rawErr.includes('ContentUnion') || rawErr.includes('Unexpected token') || rawErr.includes('Failed to fetch')) {
          lastErrorMessage = lastErrorMessage || 'Unable to delete group. Please check your network connection.';
        } else {
          lastErrorMessage = rawErr;
        }
      }
    }

    // Strategy 3: Local state fallback for offline/demo mode without backend
    if (!isDeleted && (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co')) {
      isDeleted = true;
    }

    if (isDeleted) {
      // Immediate state update without full-page reload
      setGroups(prev => {
        const remaining = prev.filter(g => g.id !== groupId);
        if (activeGroupId === groupId) {
          setActiveGroupId(remaining.length > 0 ? remaining[0].id : null);
        }
        return remaining;
      });

      window.dispatchEvent(new Event('unixx_groups_updated'));
      return true;
    } else {
      // Prevent browser internal errors from exposing raw ContentUnion proxy strings
      const cleanError = (lastErrorMessage && !lastErrorMessage.includes('ContentUnion'))
        ? lastErrorMessage
        : 'Failed to delete study group. Please try again.';

      console.error('Delete group failed:', cleanError);
      alert(cleanError);
      return false;
    }
  };

  // 8. Update Retention Period function
  const updateRetention = async (groupId: string, retentionPeriod: '7_days' | '1_month' | '6_months') => {
    if (!groupId || !currentUser?.id) return false;

    try {
      const response = await fetch('/api/chat/groups/update-retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          userId: currentUser.id,
          message_retention: retentionPeriod
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to update retention setting');
      }

      setGroups(prev => prev.map(g => {
        if (g.id === groupId) {
          return { ...g, message_retention: retentionPeriod };
        }
        return g;
      }));

      if (activeGroupId === groupId) {
        await fetchMessages(groupId);
      }

      return true;
    } catch (err: any) {
      console.error('Error updating retention setting:', err);
      alert(err.message || 'Failed to update retention setting');
      return false;
    }
  };

  // 9. Update Group Photo function (Admin, Moderator, Faculty ONLY - Not student)
  const updateGroupPhoto = async (groupId: string, photoUrl: string): Promise<boolean> => {
    if (!groupId || !currentUser?.id) return false;

    const role = (currentUser.role || '').toLowerCase();
    const targetGroup = groups.find(g => g.id === groupId);
    const isFacultyOwner = role === 'faculty' && targetGroup?.created_by === currentUser.id;
    const canChange = role === 'admin' || role === 'moderator' || isFacultyOwner;
    if (!canChange) {
      alert('Permission denied: Faculty members can only change group photos for study groups they personally created.');
      return false;
    }

    try {
      const trimmedPhoto = photoUrl.trim();

      // Store in local storage for instant offline/client update
      if (trimmedPhoto) {
        localStorage.setItem(`unixx_group_photo_${groupId}`, trimmedPhoto);
      } else {
        localStorage.removeItem(`unixx_group_photo_${groupId}`);
      }

      // Update backend
      const response = await fetch('/api/chat/groups/update-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          userId: currentUser.id,
          image_url: trimmedPhoto,
          group_photo: trimmedPhoto
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to update group photo');
      }

      // Update groups in memory
      setGroups(prev => prev.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            image_url: trimmedPhoto,
            group_photo: trimmedPhoto
          };
        }
        return g;
      }));

      // Update localStorage groups list
      const stored = localStorage.getItem('unixx_groups');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const updated = parsed.map((g: any) => {
            if (g.id === groupId) {
              return { ...g, image_url: trimmedPhoto, group_photo: trimmedPhoto };
            }
            return g;
          });
          localStorage.setItem('unixx_groups', JSON.stringify(updated));
        } catch (e) {}
      }

      window.dispatchEvent(new CustomEvent('unixx_group_updated', {
        detail: { groupId, image_url: trimmedPhoto, group_photo: trimmedPhoto }
      }));

      return true;
    } catch (err: any) {
      console.error('Error updating group photo:', err);
      alert(err.message || 'Failed to update group photo');
      return false;
    }
  };

  // Listen to unixx_avatar_updated and unixx_group_updated events
  useEffect(() => {
    const handleAvatarUpdated = () => {
      if (activeGroupIdRef.current) {
        fetchMessages(activeGroupIdRef.current);
      }
    };

    const handleGroupUpdated = () => {
      fetchGroups();
    };

    window.addEventListener('unixx_avatar_updated', handleAvatarUpdated);
    window.addEventListener('unixx_group_updated', handleGroupUpdated);

    return () => {
      window.removeEventListener('unixx_avatar_updated', handleAvatarUpdated);
      window.removeEventListener('unixx_group_updated', handleGroupUpdated);
    };
  }, [fetchMessages, fetchGroups]);

  return {
    groups,
    activeGroup: groups.find(g => g.id === activeGroupId) || null,
    activeGroupId,
    setActiveGroupId,
    messages,
    members,
    loadingGroups,
    loadingMessages,
    sending,
    sendMessage,
    createGroup,
    updateGroup,
    deleteGroup,
    updateRetention,
    updateGroupPhoto,
    markGroupAsRead,
    refreshGroups: fetchGroups
  };
}
