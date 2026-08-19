import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Routine {
  id: string;
  departmentId: string;
  batch: string;
  dayOfWeek: string; // 'Monday', 'Tuesday', etc.
  startTime: string; // e.g. '09:00 AM'
  endTime: string; // e.g. '10:30 AM'
  course: string;
  facultyName: string;
  room: string;
  isPublished?: boolean;
}

const DEFAULT_ROUTINES: Routine[] = [];

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoutines = async () => {
    setLoading(true);
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      const stored = localStorage.getItem('unixx_routines');
      if (stored) {
        setRoutines(JSON.parse(stored));
      } else {
        setRoutines(DEFAULT_ROUTINES);
        localStorage.setItem('unixx_routines', JSON.stringify(DEFAULT_ROUTINES));
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from('routines').select('*');
      if (error) throw error;

      if (data && data.length > 0) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          departmentId: r.department_id,
          batch: r.batch,
          dayOfWeek: r.day_of_week,
          startTime: r.start_time,
          endTime: r.end_time,
          course: r.course,
          facultyName: r.faculty_name,
          room: r.room,
          isPublished: r.is_published || false
        }));
        setRoutines(mapped);
      } else {
        setRoutines([]);
      }
    } catch (err) {
      console.error("Failed to fetch routines:", err);
      // Fallback
      const stored = localStorage.getItem('unixx_routines');
      if (stored) {
        setRoutines(JSON.parse(stored));
      } else {
        setRoutines([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  const getCurrentUser = () => {
    try {
      if (localStorage.getItem('unixx_admin_session') === 'true') {
        return { id: 'd3e89a79-18c7-4966-bcec-a108f305529c', role: 'admin' };
      }
      const modStr = localStorage.getItem('unixx_moderator_session');
      if (modStr) {
        try {
          const parsed = JSON.parse(modStr);
          return { id: parsed.id || 'moderator', role: 'moderator' };
        } catch {
          return { id: 'moderator', role: 'moderator' };
        }
      }
      const facStr = localStorage.getItem('unixx_faculty_session');
      if (facStr) {
        try {
          const parsed = JSON.parse(facStr);
          return { id: parsed.id || 'faculty', role: 'faculty', name: parsed.name, email: parsed.email };
        } catch {
          return { id: 'faculty', role: 'faculty' };
        }
      }
      const studStr = localStorage.getItem('unixx_student_session');
      if (studStr) {
        try {
          const parsed = JSON.parse(studStr);
          return { id: parsed.id, role: 'student' };
        } catch {}
      }
    } catch (e) {}
    return { id: '', role: 'student' };
  };

  const addRoutine = async (routine: Omit<Routine, 'id'>) => {
    const user = getCurrentUser();
    if (user.role !== 'admin' && user.role !== 'moderator' && user.role !== 'faculty') {
      return { data: null, error: new Error('Permission denied: Only Admin, Moderator, and Faculty can add routines.') };
    }

    try {
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const response = await fetch('/api/routines/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, userRole: user.role, userEmail: (user as any).email, userName: (user as any).name, routine })
        });

        const resData = await response.json();
        if (response.ok && resData.data) {
          const insertedRoutine: Routine = {
            id: resData.data.id,
            departmentId: resData.data.department_id,
            batch: resData.data.batch,
            dayOfWeek: resData.data.day_of_week,
            startTime: resData.data.start_time,
            endTime: resData.data.end_time,
            course: resData.data.course,
            facultyName: resData.data.faculty_name,
            room: resData.data.room,
            isPublished: resData.data.is_published
          };

          setRoutines(prev => [insertedRoutine, ...prev]);
          window.dispatchEvent(new Event('unixx_notifications_updated'));
          return { data: insertedRoutine, error: null };
        }
      }

      // Local / direct fallback
      const newRoutine: Routine = {
        id: 'rot-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        ...routine,
        isPublished: true
      };

      const updated = [newRoutine, ...routines];
      setRoutines(updated);
      localStorage.setItem('unixx_routines', JSON.stringify(updated));
      window.dispatchEvent(new Event('unixx_notifications_updated'));
      return { data: newRoutine, error: null };
    } catch (err: any) {
      console.error("addRoutine exception:", err);
      // Local fallback
      const newRoutine: Routine = {
        id: 'rot-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        ...routine,
        isPublished: true
      };
      const updated = [newRoutine, ...routines];
      setRoutines(updated);
      localStorage.setItem('unixx_routines', JSON.stringify(updated));
      return { data: newRoutine, error: null };
    }
  };

  const removeRoutine = async (id: string) => {
    const user = getCurrentUser();
    if (user.role !== 'admin' && user.role !== 'moderator' && user.role !== 'faculty') {
      return { error: new Error('Permission denied: Only Admin, Moderator, and Faculty can delete routines.') };
    }

    try {
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const response = await fetch('/api/routines/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, userRole: user.role, userEmail: (user as any).email, userName: (user as any).name, id })
        });

        const resData = await response.json();
        if (response.ok && !resData.error) {
          setRoutines(prev => prev.filter(r => r.id !== id));
          window.dispatchEvent(new Event('unixx_notifications_updated'));
          return { error: null };
        }
      }

      // Local fallback
      const updated = routines.filter(r => r.id !== id);
      setRoutines(updated);
      localStorage.setItem('unixx_routines', JSON.stringify(updated));
      window.dispatchEvent(new Event('unixx_notifications_updated'));
      return { error: null };
    } catch (err: any) {
      console.error("removeRoutine exception:", err);
      const updated = routines.filter(r => r.id !== id);
      setRoutines(updated);
      localStorage.setItem('unixx_routines', JSON.stringify(updated));
      return { error: null };
    }
  };

  const publishBatchRoutines = async (departmentId: string, batch: string) => {
    const user = getCurrentUser();
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return { error: new Error('Permission denied: Only Admin and Moderator can manage routines.') };
    }

    try {
      const { error } = await supabase
        .from('routines')
        .update({ is_published: true })
        .match({ department_id: departmentId, batch: batch });

      setRoutines(prev => prev.map(r => 
        (r.departmentId === departmentId && r.batch === batch) 
          ? { ...r, isPublished: true } 
          : r
      ));
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const updateRoutine = async (id: string, updates: Partial<Routine>) => {
    const user = getCurrentUser();
    if (user.role !== 'admin' && user.role !== 'moderator' && user.role !== 'faculty') {
      return { error: new Error('Permission denied: Only Admin, Moderator, and Faculty can edit routines.') };
    }

    try {
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const response = await fetch('/api/routines/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, userRole: user.role, userEmail: (user as any).email, userName: (user as any).name, id, updates })
        });

        const resData = await response.json();
        if (response.ok && !resData.error) {
          setRoutines(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
          return { error: null };
        }
      }

      // Local fallback
      const updated = routines.map(r => r.id === id ? { ...r, ...updates } : r);
      setRoutines(updated);
      localStorage.setItem('unixx_routines', JSON.stringify(updated));
      return { error: null };
    } catch (err: any) {
      console.error("updateRoutine exception:", err);
      const updated = routines.map(r => r.id === id ? { ...r, ...updates } : r);
      setRoutines(updated);
      localStorage.setItem('unixx_routines', JSON.stringify(updated));
      return { error: null };
    }
  };

  return { routines, loading, addRoutine, updateRoutine, removeRoutine, publishBatchRoutines, fetchRoutines };
}
