import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import localforage from 'localforage';

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'image';
  department: string;
  createdAt: string;
  expiresAt?: string;
  tag: string;
  tagColor: string;
}

async function getNoticeMeta(id: string): Promise<Partial<Notice> | null> {
  try {
    const raw = await localforage.getItem(`unixx_notice_meta_${id}`);
    if (raw) return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {}
  return null;
}

async function saveNoticeMeta(id: string, meta: Partial<Notice>) {
  try {
    const existing = await getNoticeMeta(id) || {};
    const updated = { ...existing, ...meta };
    await localforage.setItem(`unixx_notice_meta_${id}`, updated);
  } catch (e) {}
}

async function getLocalNotices(): Promise<Notice[]> {
  try {
    const stored = await localforage.getItem('unixx_notices');
    if (stored) {
      return typeof stored === 'string' ? JSON.parse(stored) : stored as Notice[];
    }
  } catch (e) {}
  return [];
}

async function setLocalNotices(notices: Notice[]) {
  try {
    await localforage.setItem('unixx_notices', notices);
  } catch(e) {}
}

export function useNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    setLoading(true);
    let localNotices = await getLocalNotices();
    // Filter out demo notices
    const demoIds = ['notice-1', 'notice-2'];
    if (localNotices.some(n => demoIds.includes(n.id))) {
       localNotices = localNotices.filter(n => !demoIds.includes(n.id));
       await setLocalNotices(localNotices);
    }

    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      setNotices(localNotices);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
      if (error) {
        console.warn("Failed to fetch notices from Supabase, using local storage:", error);
        setNotices(localNotices);
      } else if (data && data.length > 0) {
        // Map database fields to Notice interface with local meta fallback
        const mapped = await Promise.all(data.map(async (n: any) => {
          const meta = await getNoticeMeta(n.id) || localNotices.find(ln => ln.id === n.id) || {};
          return {
            id: n.id,
            title: n.title || meta.title || 'Untitled Notice',
            content: n.content || meta.content || '',
            type: (((n.content || '').includes('/storage/v1/object/public/') || (n.content || '').startsWith('data:image/') || (n.content || '').match(/data:application\/|\.pdf|\.doc/i)) ? 'image' : (n.type || meta.type || 'text')),
            department: n.department || n.dept || meta.department || 'ALL',
            createdAt: n.created_at || meta.createdAt || new Date().toISOString(),
            expiresAt: n.expires_at || meta.expiresAt,
            tag: n.tag || meta.tag || 'INFO',
            tagColor: n.tag_color || meta.tagColor || 'bg-blue-100 text-blue-800'
          };
        }));

        // Merge Supabase notices with any local notices that haven't synced
        const supabaseIds = new Set(mapped.map(m => m.id));
        const purelyLocal = localNotices.filter(ln => !supabaseIds.has(ln.id));
        const combined = [...mapped, ...purelyLocal].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setNotices(combined);
      } else {
        setNotices(localNotices);
      }
    } catch (err) {
      console.warn("Failed to fetch notices:", err);
      setNotices(localNotices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const addNotice = async (notice: Omit<Notice, 'id' | 'createdAt'>) => {
    const noticeId = Math.random().toString(36).substring(2, 9);
    const newNotice: Notice = {
      ...notice,
      id: noticeId,
      createdAt: new Date().toISOString()
    };
    
    const currentStored = await getLocalNotices();
    const updatedLocal = [newNotice, ...currentStored.filter(n => n.id !== noticeId)];
    await setLocalNotices(updatedLocal);
    await saveNoticeMeta(noticeId, newNotice);
    window.dispatchEvent(new Event('unixx_notifications_updated'));

    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      setNotices(prev => [newNotice, ...prev.filter(n => n.id !== noticeId)]);
      return { data: newNotice, error: null };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const dbNotice: any = {
        title: newNotice.title,
        content: newNotice.content,
        author_id: user?.id,
        type: newNotice.type,
        tag: newNotice.tag,
        tag_color: newNotice.tagColor
      };
      
      if (newNotice.department && newNotice.department !== 'ALL') {
        dbNotice.department = newNotice.department;
      }

      let insertRes = await supabase.from('notices').insert([dbNotice]).select();

      if (insertRes.error && (
        insertRes.error.message?.includes('tag') ||
        insertRes.error.message?.includes('type') ||
        insertRes.error.message?.includes('tag_color') ||
        insertRes.error.message?.includes('department') ||
        insertRes.error.message?.includes('schema cache') ||
        insertRes.error.message?.includes('column') ||
        insertRes.error.code === 'PGRST204'
      )) {
        console.warn("Retrying notice insert without extra columns:", insertRes.error.message);
        delete dbNotice.department;
        delete dbNotice.type;
        delete dbNotice.tag;
        delete dbNotice.tag_color;
        insertRes = await supabase.from('notices').insert([dbNotice]).select();
      }

      if (insertRes.error && (
        insertRes.error.message?.includes('author_id') ||
        insertRes.error.message?.includes('schema cache') ||
        insertRes.error.message?.includes('column')
      )) {
        insertRes = await supabase.from('notices').insert([{
          title: newNotice.title,
          content: newNotice.content
        }]).select();
      }

      if (insertRes.error) {
        console.warn("Supabase insert failed, using local storage notice:", insertRes.error);
        setNotices(prev => [newNotice, ...prev.filter(n => n.id !== noticeId)]);
        return { data: newNotice, error: null };
      }

      if (insertRes.data && insertRes.data.length > 0) {
        const dbId = insertRes.data[0].id;
        const insertedNotice = { ...newNotice, id: dbId };
        
        await saveNoticeMeta(dbId, insertedNotice);

        setNotices(prev => [insertedNotice, ...prev.filter(n => n.id !== noticeId && n.id !== dbId)]);
        
        const finalStored = [insertedNotice, ...updatedLocal.filter(n => n.id !== noticeId && n.id !== dbId)];
        await setLocalNotices(finalStored);

        return { data: insertedNotice, error: null };
      }
    } catch (err: any) {
      console.warn("Notice add exception, using local fallback:", err);
      setNotices(prev => [newNotice, ...prev.filter(n => n.id !== noticeId)]);
      return { data: newNotice, error: null };
    }

    setNotices(prev => [newNotice, ...prev.filter(n => n.id !== noticeId)]);
    return { data: newNotice, error: null };
  };

  const updateNotice = async (id: string, updates: Partial<Omit<Notice, 'id' | 'createdAt'>>) => {
    const currentStored = await getLocalNotices();
    const updatedNotices = currentStored.map(n => n.id === id ? { ...n, ...updates } : n);
    await setLocalNotices(updatedNotices);
    await saveNoticeMeta(id, updates);
    window.dispatchEvent(new Event('unixx_notifications_updated'));

    setNotices(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));

    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      return { error: null };
    }
    
    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.department !== undefined) dbUpdates.department = updates.department === 'ALL' ? null : updates.department;
      
      let updateRes = await supabase.from('notices').update(dbUpdates).eq('id', id);
      
      if (updateRes.error && (
        updateRes.error.message?.includes('department') ||
        updateRes.error.message?.includes('schema cache') ||
        updateRes.error.message?.includes('column')
      )) {
        delete dbUpdates.department;
        if (Object.keys(dbUpdates).length > 0) {
          updateRes = await supabase.from('notices').update(dbUpdates).eq('id', id);
        }
      }
      
      return { error: null };
    } catch (err: any) {
      console.warn("Notice update exception:", err);
      return { error: null };
    }
  };

  const removeNotice = async (id: string) => {
    const currentStored = await getLocalNotices();
    const updated = currentStored.filter(n => n.id !== id);
    await setLocalNotices(updated);
    await localforage.removeItem(`unixx_notice_meta_${id}`);
    window.dispatchEvent(new Event('unixx_notifications_updated'));

    setNotices(prev => prev.filter(n => n.id !== id));

    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      return { error: null };
    }

    try {
      const { error } = await supabase.from('notices').delete().eq('id', id);
      if (error) {
        console.warn("Failed to delete notice from Supabase:", error);
      }
      return { error: null };
    } catch (err: any) {
      console.warn("Notice delete exception:", err);
      return { error: null };
    }
  };

  const activeNotices = notices.filter(n => {
    if (n.type === 'image' && n.expiresAt) {
      return new Date(n.expiresAt) > new Date();
    }
    return true;
  });

  return { notices: activeNotices, loading, addNotice, updateNotice, removeNotice, fetchNotices };
}
