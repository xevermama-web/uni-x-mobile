import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface AttendanceRecord {
  id?: string;
  course_id: string;
  student_id: string;
  date: string;
  status: 'Present' | 'Absent';
  recorded_by: string;
}

export function useAttendance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveAttendance = async (
    sessionData: {
      department_id: string;
      batch_id: string;
      course_id: string;
      faculty_id: string;
      class_date: string;
      class_time: string;
    },
    records: { student_id: string; status: 'Present' | 'Absent' }[]
  ) => {
    setLoading(true);
    setError(null);
    try {
      // First try saving via backend API route (bypasses client RLS issues)
      try {
        const response = await fetch('/api/save-attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionData, records }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            window.dispatchEvent(new Event('unixx_notifications_updated'));
            return true;
          }
        }
      } catch (apiErr) {
        console.warn('API save-attendance failed, falling back to direct Supabase client call:', apiErr);
      }

      // 1. Clear existing records for this course and date to allow re-saving/updating
      await supabase
        .from('attendance')
        .delete()
        .eq('course_id', sessionData.course_id)
        .eq('date', sessionData.class_date);

      // 2. Create records
      const recordedBy = (sessionData.faculty_id && sessionData.faculty_id.length === 36)
        ? sessionData.faculty_id
        : null;

      const recordsToInsert = records.map(r => ({
        course_id: sessionData.course_id,
        student_id: r.student_id,
        status: r.status.toLowerCase(),
        recorded_by: recordedBy,
        date: sessionData.class_date
      }));

      const { error: recordsError } = await supabase
        .from('attendance')
        .insert(recordsToInsert);

      if (recordsError) throw recordsError;

      window.dispatchEvent(new Event('unixx_notifications_updated'));
      return true;
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      setError(err.message || 'Failed to save attendance');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStudentAttendanceStats = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          status,
          date,
          courses (
            title,
            course_code
          )
        `)
        .eq('student_id', studentId);

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error fetching student stats:', err);
      return [];
    }
  };

  return {
    loading,
    error,
    saveAttendance,
    getStudentAttendanceStats
  };
}
