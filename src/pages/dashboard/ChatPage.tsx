import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Users,
  Search,
  Plus,
  Send,
  Info,
  ChevronLeft,
  ChevronDown,
  Loader2,
  Shield,
  BookOpen,
  Sparkles,
  CheckCheck
} from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { supabase } from '../../lib/supabase';
import { CreateGroupModal } from '../../components/chat/CreateGroupModal';
import { GroupDetailsModal } from '../../components/chat/GroupDetailsModal';
import { GroupMaterialsView } from '../../components/chat/GroupMaterialsView';
import { ChatGroup, GroupFormData } from '../../types/chat';

export default function ChatPage() {
  const context = useOutletContext<any>();
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  // Determine active profile from session or context
  useEffect(() => {
    const resolveUser = async () => {
      // 1. Check Admin session
      const isAdminSession = localStorage.getItem('unixx_admin_session') === 'true';
      if (isAdminSession) {
        setCurrentUserProfile({
          id: 'd3e89a79-18c7-4966-bcec-a108f305529c',
          full_name: 'Admin',
          email: 'admin@unixx.com',
          role: 'admin',
          department: 'Administration',
          batch: 'Admin'
        });
        return;
      }

      // 2. Check Faculty session
      const facSession = localStorage.getItem('unixx_faculty_session');
      if (facSession) {
        try {
          const fac = JSON.parse(facSession);
          if (fac?.id) {
            setCurrentUserProfile({
              id: fac.id,
              full_name: fac.name || fac.full_name || 'Faculty Member',
              email: fac.email,
              role: 'faculty',
              department: fac.department || 'Computer Science',
              batch: 'Faculty'
            });
            return;
          }
        } catch (e) {}
      }

      // 3. Check Moderator session
      const modSession = localStorage.getItem('unixx_moderator_session');
      if (modSession) {
        try {
          const mod = JSON.parse(modSession);
          if (mod?.id) {
            setCurrentUserProfile({
              id: mod.id,
              full_name: mod.name || mod.full_name || 'Moderator',
              email: mod.email,
              role: 'moderator',
              department: 'Moderation',
              batch: 'Moderator'
            });
            return;
          }
        } catch (e) {}
      }

      // 4. Check context user or Supabase Auth session
      let activeUser = context?.user;
      if (!activeUser && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const { data: { session } } = await supabase.auth.getSession();
        activeUser = session?.user;
      }

      if (activeUser) {
        const rawRole = (activeUser.user_metadata?.role || activeUser.role || (activeUser.email === 'admin@unixx.com' ? 'admin' : 'student')).toLowerCase();
        const isUserAdmin = rawRole === 'admin' || activeUser.email === 'admin@unixx.com';
        const full_name = isUserAdmin ? 'Admin' : (activeUser.user_metadata?.full_name || activeUser.name || activeUser.full_name || activeUser.email || 'User');
        
        setCurrentUserProfile({
          id: isUserAdmin ? 'd3e89a79-18c7-4966-bcec-a108f305529c' : activeUser.id,
          full_name,
          email: activeUser.email,
          role: isUserAdmin ? 'admin' : rawRole,
          department: activeUser.department || 'Computer Science',
          batch: activeUser.batch || '14',
          avatar_url: activeUser.avatar_url || null
        });
        return;
      }

      setCurrentUserProfile(null);
    };

    resolveUser();

    // Listen to Supabase Auth state changes for real-time sign in / sign out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUserProfile(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        resolveUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [context]);

  const {
    groups,
    activeGroup,
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
    updateGroupPhoto
  } = useChat(currentUserProfile);

  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'materials'>('chat');

  useEffect(() => {
    setActiveTab('chat');
  }, [activeGroupId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const prevGroupIdRef = useRef<string | null>(null);
  const prevLoadingRef = useRef<boolean>(false);
  const prevMessagesLengthRef = useRef<number>(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const handledGroupParamRef = useRef<string | null>(null);

  // Handle group selection from URL search param if present
  useEffect(() => {
    const targetGroup = searchParams.get('group');
    if (targetGroup && targetGroup !== handledGroupParamRef.current && groups.some(g => g.id === targetGroup)) {
      handledGroupParamRef.current = targetGroup;
      setActiveGroupId(targetGroup);
      setShowMobileChat(true);
      isNearBottomRef.current = true;
      // Clean up search param from URL so manual group switching works cleanly
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('group');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, groups, setActiveGroupId, setSearchParams]);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior
      });
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
    isNearBottomRef.current = true;
    setShowScrollToBottom(false);
  }, []);

  // Monitor scroll position to determine if user is near bottom
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const threshold = 120; // threshold in px
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom <= threshold;
    isNearBottomRef.current = nearBottom;
    setShowScrollToBottom(!nearBottom && messages.length > 0);
  }, [messages.length]);

  // Smart scroll effect on message or group change
  useEffect(() => {
    if (loadingMessages) {
      prevLoadingRef.current = true;
      return;
    }

    const groupChanged = prevGroupIdRef.current !== activeGroupId;
    const finishedLoading = prevLoadingRef.current && !loadingMessages;
    const newMessageArrived = messages.length > prevMessagesLengthRef.current;
    const lastMsg = messages[messages.length - 1];
    const isSentByMe = lastMsg?.sender_id === currentUserProfile?.id;

    // 1. Initial chat open or group switch: instant scroll to bottom
    if (groupChanged || finishedLoading) {
      scrollToBottom('auto');

      // Double-trigger after DOM/images settle
      const timer1 = setTimeout(() => scrollToBottom('auto'), 50);
      const timer2 = setTimeout(() => scrollToBottom('auto'), 250);

      prevGroupIdRef.current = activeGroupId;
      prevLoadingRef.current = false;
      prevMessagesLengthRef.current = messages.length;

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }

    // 2. Real-time message arrival
    if (newMessageArrived) {
      if (isNearBottomRef.current || isSentByMe) {
        scrollToBottom('smooth');
      } else {
        setShowScrollToBottom(true);
      }
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, activeGroupId, loadingMessages, currentUserProfile?.id, scrollToBottom]);

  // Maintain bottom position as images or content expand if user is at bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        if (isNearBottomRef.current && !loadingMessages) {
          container.scrollTop = container.scrollHeight;
        }
      });
      observer.observe(container);
    }

    return () => {
      observer?.disconnect();
    };
  }, [loadingMessages, activeGroupId]);

  // Scroll to bottom when returning to chat tab
  useEffect(() => {
    if (activeTab === 'chat' && !loadingMessages) {
      scrollToBottom('auto');
    }
  }, [activeTab, loadingMessages, scrollToBottom]);

  // Handle group select
  const handleSelectGroup = (groupId: string) => {
    if (searchParams.get('group')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('group');
      setSearchParams(newParams, { replace: true });
    }
    setActiveGroupId(groupId);
    setShowMobileChat(true);
    isNearBottomRef.current = true;
  };

  // Filter groups
  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.department && g.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;
    const text = inputText;
    setInputText('');
    isNearBottomRef.current = true;
    scrollToBottom('smooth');
    await sendMessage(text);
  };

  const isFacultyOrAdmin =
    currentUserProfile?.role === 'faculty' ||
    currentUserProfile?.role === 'admin' ||
    currentUserProfile?.role === 'moderator';

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-6rem)] max-h-[850px] flex flex-col font-sans bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden m-0 sm:m-4 md:m-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl shrink-0">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className="text-xs sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Study Groups & Course Chat
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              Realtime discussion channels for courses and batch study groups
            </p>
          </div>
        </div>

        {/* Action Button for Faculty/Admin */}
        {isFacultyOrAdmin && (
          <button
            onClick={() => {
              setModalMode('create');
              setIsCreateModalOpen(true);
            }}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] sm:text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Create Study Group</span>
            <span className="inline sm:hidden">Create</span>
          </button>
        )}
      </div>

      {/* Main Chat Layout Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Group List */}
        <div
          className={`w-full md:w-80 lg:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 transition-all ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search groups, courses, batches..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Group List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {loadingGroups ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs font-medium">Loading chat channels...</span>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Users className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No groups found</p>
                <p className="text-[11px] text-slate-400">
                  {isFacultyOrAdmin
                    ? 'Click "Create Study Group" to start a new channel.'
                    : 'Groups will appear when created by faculty for your batch.'}
                </p>
              </div>
            ) : (
              filteredGroups.map(group => {
                const isActive = group.id === activeGroupId;
                return (
                  <div
                    key={group.id}
                    onClick={() => handleSelectGroup(group.id)}
                    className={`p-4 cursor-pointer transition-all flex items-start gap-3 relative ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/70 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800/70'
                    }`}
                  >
                    {/* Group Icon */}
                    {group.image_url || group.group_photo ? (
                      <img
                        src={group.image_url || group.group_photo}
                        alt={group.name}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-slate-200 dark:border-slate-800"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Group Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h3 className={`text-sm font-bold tracking-tight truncate ${isActive ? 'text-blue-900 dark:text-blue-300' : 'text-slate-900 dark:text-slate-100'}`}>
                          {group.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {formatMessageTime(group.lastMessageTime || group.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex-1">
                          {group.lastMessage || group.description}
                        </p>

                        {/* Unread Badge */}
                        {group.unreadCount && group.unreadCount > 0 ? (
                          <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold flex-shrink-0">
                            {group.unreadCount}
                          </span>
                        ) : null}
                      </div>

                      {/* Batches / Type Pills */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-medium border border-slate-200 dark:border-slate-800">
                          {group.type === 'course_group' ? 'Course' : group.department || 'Study Group'}
                        </span>
                        {group.batches && group.batches.length > 0 && (
                          <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-medium border border-emerald-100 dark:border-emerald-900/50">
                            Batch {group.batches.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Conversation */}
        <div
          className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 transition-all ${
            showMobileChat ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activeGroup ? (
            <>
              {/* Conversation Top Header */}
              <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {activeGroup.image_url || activeGroup.group_photo ? (
                    <img
                      src={activeGroup.image_url || activeGroup.group_photo}
                      alt={activeGroup.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-blue-500/20">
                      {activeGroup.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
                      {activeGroup.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {activeGroup.department || 'All Departments'}
                      </span>
                      {activeGroup.batches && activeGroup.batches.length > 0 && (
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                          Batches: {activeGroup.batches.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeTab === 'materials' && (
                    <button
                      onClick={() => setActiveTab('chat')}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back to Chat</span>
                    </button>
                  )}

                  {/* Info Button */}
                  <button
                    onClick={() => setIsDetailsModalOpen(true)}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
                  >
                    <Info className="w-4 h-4 text-slate-400" />
                    <span className="hidden md:inline">Group Info</span>
                  </button>
                </div>
              </div>

              {activeTab === 'materials' ? (
                <GroupMaterialsView
                  group={activeGroup}
                  currentUserProfile={currentUserProfile}
                  onBackToChat={() => setActiveTab('chat')}
                />
              ) : (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* Messages Area Wrapper */}
                  <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Messages Container */}
                    <div
                      ref={scrollContainerRef}
                      onScroll={handleScroll}
                      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
                    >
                    {loadingMessages ? (
                      <div className="h-full flex items-center justify-center text-slate-400 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-xs font-medium">Loading conversation...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-3">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No messages yet</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                          Be the first to start the conversation in this group!
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const isMe = msg.sender_id === currentUserProfile?.id;
                        const role = (msg.sender?.role || 'student').toLowerCase();

                        // Determine sender name safely (never email)
                        let displayName = msg.sender?.full_name || '';
                        if (role === 'admin') {
                          displayName = 'Admin';
                        } else if (!displayName || displayName.includes('@')) {
                          if (role === 'faculty') displayName = 'Faculty Member';
                          else displayName = 'Student';
                        }

                        if (displayName.includes('@')) {
                          displayName = role === 'admin' ? 'Admin' : role === 'faculty' ? 'Faculty Member' : 'Student';
                        }

                        // Role color mappings: Admin -> Red, Faculty -> Blue, Student -> White
                        let avatarBg = 'bg-slate-200 text-slate-700 dark:text-slate-300';
                        let bubbleStyle = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm';
                        let roleBadge = null;

                        if (role === 'admin') {
                          avatarBg = 'bg-red-600 text-white font-bold shadow-xs';
                          roleBadge = (
                            <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                              <Shield className="w-2.5 h-2.5" /> Admin
                            </span>
                          );
                          bubbleStyle = isMe
                            ? 'bg-red-600 text-white rounded-tr-none shadow-sm shadow-red-500/20'
                            : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-950 dark:text-red-100 rounded-tl-none shadow-sm';
                        } else if (role === 'faculty') {
                          avatarBg = 'bg-blue-600 text-white font-bold shadow-xs';
                          roleBadge = (
                            <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                              Faculty
                            </span>
                          );
                          bubbleStyle = isMe
                            ? 'bg-blue-600 text-white rounded-tr-none shadow-sm shadow-blue-500/20'
                            : 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 text-blue-950 dark:text-blue-100 rounded-tl-none shadow-sm';
                        } else {
                          avatarBg = 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold';
                          roleBadge = (
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[9px] font-medium px-1.5 py-0.5 rounded">
                              Student
                            </span>
                          );
                          bubbleStyle = isMe
                            ? 'bg-slate-900 text-white rounded-tr-none shadow-sm'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm';
                        }

                        return (
                          <div
                            key={msg.id || index}
                            className={`flex gap-3 max-w-xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                          >
                            {/* Avatar */}
                            {msg.sender?.avatar_url ? (
                              <img
                                src={msg.sender.avatar_url}
                                alt={displayName}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1 border border-slate-200 dark:border-slate-800"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-1 ${avatarBg}`}
                              >
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                            )}

                            {/* Message Content */}
                            <div className={`space-y-1 ${isMe ? 'items-end text-right' : 'items-start'}`}>
                              <div className={`flex items-center gap-2 text-[11px] text-slate-400 ${isMe ? 'justify-end' : ''}`}>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{displayName}</span>
                                {roleBadge}
                                <span>{formatMessageTime(msg.created_at)}</span>
                              </div>

                              <div
                                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${bubbleStyle}`}
                              >
                                {msg.content}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Jump to Recent Floating Button */}
                  {showScrollToBottom && (
                    <button
                      type="button"
                      onClick={() => scrollToBottom('smooth')}
                      className="absolute bottom-4 right-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all z-20 hover:scale-105 active:scale-95"
                    >
                      <ChevronDown className="w-4 h-4" />
                      <span>Recent messages</span>
                    </button>
                  )}
                </div>

                  {/* Message Input Footer */}
                  <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4">
                    <form onSubmit={handleSend} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder={`Message #${activeGroup.name}...`}
                        className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      <button
                        type="submit"
                        disabled={!inputText.trim() || sending}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span className="hidden sm:inline">Send</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Select a study group channel</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Choose a channel from the left sidebar to start messaging.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={modalMode === 'edit' && activeGroup ? (data) => updateGroup(activeGroup.id, data) : createGroup}
        initialData={modalMode === 'edit' ? activeGroup : null}
        mode={modalMode}
      />

      {/* Group Details Modal */}
      <GroupDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        group={activeGroup}
        members={members}
        currentUser={currentUserProfile}
        onEditGroup={() => {
          setModalMode('edit');
          setIsCreateModalOpen(true);
        }}
        onUpdateRetention={updateRetention}
        onDeleteGroup={deleteGroup}
        onUpdateGroupPhoto={updateGroupPhoto}
        onOpenMaterials={() => setActiveTab('materials')}
      />
    </div>
  );
}
