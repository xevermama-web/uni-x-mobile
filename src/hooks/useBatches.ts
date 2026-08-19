import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useBatches(department?: string) {
  const [batches, setBatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    setLoading(true);
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      const stored = localStorage.getItem('unixx_students');
      if (stored) {
        const students = JSON.parse(stored);
        const filtered = department && department !== 'ALL' ? students.filter((s: any) => s.department === department) : students;
        const uniqueBatches = Array.from(new Set(filtered.map((s: any) => s.batch).filter(Boolean)));
        setBatches(uniqueBatches as string[]);
      } else {
        setBatches(['2023', '2024']);
      }
      setLoading(false);
      return;
    }

    try {
      let query = supabase.from('profiles').select('batch').eq('role', 'student');
      if (department && department !== 'ALL') {
        query = query.eq('department', department);
      }
      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        const uniqueBatches = Array.from(new Set(data.map((p: any) => p.batch).filter(Boolean)));
        setBatches(uniqueBatches.sort().reverse());
      }
    } catch (err) {
      console.error("Failed to fetch batches:", err);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [department]);

  return { batches, loading, fetchBatches };
}
