import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Course {
  id: string;
  course_code: string;
  title: string;
}

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const { data, error } = await supabase.from('courses').select('id, course_code, title').order('title');
        if (error) throw error;
        setCourses(data || []);
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  return { courses, loading };
}
