import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { checkEmailAvailable } from '../utils/checkEmailAvailable';

export interface Student {
  profile_id?: string;
  id: string;
  name: string;
  email: string;
  department: string;
  batch: string;
  status: string;
  cgpa: number;
  created_at: string;
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    setFetchError(null);
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      const stored = localStorage.getItem('unixx_students');
      if (stored) {
        setStudents(JSON.parse(stored));
      } else {
        const defaultStudents: Student[] = [];
        setStudents(defaultStudents);
        localStorage.setItem('unixx_students', JSON.stringify(defaultStudents));
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped = data.map((s: any) => ({
          id: s.academic_id || s.id,
          profile_id: s.id,
          name: s.full_name || 'Unknown',
          email: s.email || 'N/A',
          department: s.department || 'N/A',
          batch: s.batch || 'N/A',
          status: 'Active',
          cgpa: 0.0,
          created_at: s.created_at || new Date().toISOString()
        }));
        setStudents(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err); setFetchError(err.message || JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const addStudent = async (newStudent: any, password: string) => {
    if (!newStudent.id) {
      return { data: null, error: new Error("Student ID is required.") };
    }

    // Check email uniqueness and admin@unixx.com block
    const emailCheck = await checkEmailAvailable(newStudent.email);
    if (!emailCheck.available) {
      return { data: null, error: new Error(emailCheck.error || "An account with this email address already exists.") };
    }

    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      const existing = students.find(s => s.id === newStudent.id);
      if (existing) {
        return { data: null, error: new Error("Student ID already exists.") };
      }
      const student = { ...newStudent, status: 'Active', cgpa: 0.0, created_at: new Date().toISOString() };
      setStudents(prev => [student, ...prev]);
      localStorage.setItem('unixx_students', JSON.stringify([student, ...students]));
      return { data: student, error: null };
    }

    try {
      // Check if student ID already exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('academic_id', newStudent.id)
        .maybeSingle();
      
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        throw new Error("Database error: " + (profileCheckError.message || JSON.stringify(profileCheckError)));
      }
      if (existingProfile) {
        throw new Error("Student ID already exists.");
      }

      // Create a temporary client that doesn't persist the session so we don't log the admin out
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        }
      );

      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: newStudent.email,
        password: password,
        options: {
          data: {
            full_name: newStudent.name,
            role: 'student',
            department: newStudent.department,
            batch: newStudent.batch,
            academic_id: newStudent.id,
          }
        }
      });

      if (authError) throw authError;

      if (authData?.user) {
        // Explicitly ensure the profile is created using the main client
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ 
            id: authData.user.id,
            full_name: newStudent.name,
            role: 'student',
            department: newStudent.department,
            batch: newStudent.batch,
            academic_id: newStudent.id,
            email: newStudent.email
          });
          
        if (upsertError) {
          console.error("Profile upsert error:", upsertError);
          // If upsert failed, the profile wasn't created properly
          throw new Error("Profile creation failed: " + (upsertError.message || JSON.stringify(upsertError)));
        }
      }

      // Note: A trigger might insert into profiles automatically. We can just refetch.
      await fetchStudents();
      return { data: authData, error: null };
    } catch (err: any) {
      console.error('addStudent error:', err); return { data: null, error: err && Object.keys(err).length === 0 && !err.message ? new Error('Database Trigger Error. Please execute fix_profiles.sql in Supabase SQL editor. Details: ' + String(err)) : err };
    }
  };
  
  const updateStudent = async (profileId: string, updates: Partial<Student>) => {
    if (updates.email) {
      const emailCheck = await checkEmailAvailable(updates.email, profileId);
      if (!emailCheck.available) {
        return { error: new Error(emailCheck.error || "An account with this email address already exists.") };
      }
    }

    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      const updatedStudents = students.map(s => s.profile_id === profileId || s.id === profileId ? { ...s, ...updates } : s);
      setStudents(updatedStudents);
      localStorage.setItem('unixx_students', JSON.stringify(updatedStudents));
      return { error: null };
    }

    try {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.full_name = updates.name;
      if (updates.department) dbUpdates.department = updates.department;
      if (updates.batch) dbUpdates.batch = updates.batch;
      if (updates.id) dbUpdates.academic_id = updates.id;
      if (updates.email) dbUpdates.email = updates.email;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', profileId);

      if (error) throw error;
      await fetchStudents();
      return { error: null };
    } catch (err: any) {
      console.error('updateStudent error:', err);
      return { error: err };
    }
  };

  const deleteStudent = async (profileId: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      const updatedStudents = students.filter(s => s.profile_id !== profileId && s.id !== profileId);
      setStudents(updatedStudents);
      localStorage.setItem('unixx_students', JSON.stringify(updatedStudents));
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;
      await fetchStudents();
      return { error: null };
    } catch (err: any) {
      console.error('deleteStudent error:', err);
      return { error: err };
    }
  };

  const resetStudentPassword = async (profileId: string, email: string, newPassword: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      return { error: null };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/admin-reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userId: profileId, newPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      return { error: null };
    } catch (err: any) {
      console.error('resetStudentPassword error:', err);
      return { error: err };
    }
  };

  return { students, loading, fetchError, addStudent, updateStudent, deleteStudent, resetStudentPassword, fetchStudents };
}
