import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Routine {
  id: string;
  department_id: string;
  batch: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  course: string;
  faculty_name: string;
  room: string;
}

export function useRoutinesForAttendance(departmentId: string, batch: string, classDate: string, facultyName: string) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchRoutines() {
      if (!departmentId || !batch || !classDate) {
        setRoutines([]);
        return;
      }

      setLoading(true);
      try {
        const dateObj = new Date(classDate);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

        let query = supabase.from('routines')
          .select('*')
          .eq('department_id', departmentId)
          .eq('batch', batch)
          .eq('day_of_week', dayOfWeek);
        
        if (facultyName && facultyName !== 'Admin User') {
          query = query.eq('faculty_name', facultyName);
        }

        const { data, error } = await query;
        if (error) throw error;
        setRoutines(data || []);
      } catch (err: any) {
        console.error('Error fetching routines:', err);
        setRoutines([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRoutines();
  }, [departmentId, batch, classDate, facultyName]);

  return { routines, loading };
}
