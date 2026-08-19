import { useState, useEffect } from 'react';
import localforage from 'localforage';
import { supabase } from '../lib/supabase';

export function useDashboardStats(role: string) {
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    courses: 0,
    notices: 0,
    departments: 0,
    moderators: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        const localStudents = JSON.parse(localStorage.getItem('unixx_students') || '[]');
        const localDepts = JSON.parse(localStorage.getItem('unixx_departments') || '[]');
        const rawNotices = await localforage.getItem('unixx_notices');
        const localNotices = rawNotices ? (typeof rawNotices === 'string' ? JSON.parse(rawNotices) : rawNotices) : [];
        setStats({
          students: localStudents.length,
          faculty: 0,
          courses: 0,
          notices: localNotices.length,
          departments: localDepts.length,
          moderators: 0
        });
        setLoading(false);
        return;
      }

      try {
        const [
          { count: studentsCount },
          { count: facultyCount },
          { count: coursesCount },
          { count: noticesCount },
          { count: deptsCount },
          { count: modsCount }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'faculty'),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('notices').select('*', { count: 'exact', head: true }),
          supabase.from('departments').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'moderator'),
        ]);

        setStats({
          students: studentsCount || 0,
          faculty: facultyCount || 0,
          courses: coursesCount || 0,
          notices: noticesCount || 0,
          departments: deptsCount || 0,
          moderators: modsCount || 0
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [role]);

  return { stats, loading };
}
