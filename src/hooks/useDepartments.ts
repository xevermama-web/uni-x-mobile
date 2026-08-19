import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Department {
  id: string;
  name: string;
  head: string;
  facultyCount: number;
  studentCount: number;
}

const DEFAULT_DEPARTMENTS: Department[] = [];

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDepartments = async () => {
    setLoading(true);
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      const stored = localStorage.getItem('unixx_departments');
      const localStudents = JSON.parse(localStorage.getItem('unixx_students') || '[]');
      const localFaculties = JSON.parse(localStorage.getItem('unixx_faculties') || '[]');
      
      if (stored) {
        setDepartments(JSON.parse(stored).map((d: any) => ({
          ...d,
          studentCount: localStudents.filter((s: any) => s.department === d.name).length,
          facultyCount: localFaculties.filter((f: any) => f.department === d.name).length
        })));
      } else {
        setDepartments(DEFAULT_DEPARTMENTS);
        localStorage.setItem('unixx_departments', JSON.stringify(DEFAULT_DEPARTMENTS));
      }
      setLoading(false);
      return;
    }

    try {
      const [deptRes, profilesRes] = await Promise.all([
        supabase.from('departments').select('*').order('name'),
        supabase.from('profiles').select('department, role')
      ]);
      
      if (deptRes.error) throw deptRes.error;
      const data = deptRes.data;

      if (data && data.length > 0) {
        const profiles = profilesRes.data || [];
        setDepartments(data.map((d: any) => {
          const deptProfiles = profiles.filter((p: any) => p.department === d.name || p.department === d.id);
          const studentCount = deptProfiles.filter((p: any) => p.role === 'student').length;
          const facultyCount = deptProfiles.filter((p: any) => ['faculty', 'moderator', 'admin'].includes(p.role?.toLowerCase() || '')).length;
          
          return { 
            ...d, 
            head: d.head || '', 
            facultyCount: facultyCount, 
            studentCount: studentCount 
          };
        }));
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const addDepartment = async (dept: Omit<Department, 'facultyCount' | 'studentCount'>) => {
    const newDept: Department = { ...dept, facultyCount: 0, studentCount: 0 };
    
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      const updated = [newDept, ...departments];
      setDepartments(updated);
      localStorage.setItem('unixx_departments', JSON.stringify(updated));
      return { data: newDept, error: null };
    }

    try {
      const dbDept: any = {
        name: dept.name,
        head: dept.head || ''
      };
      
      let insertRes = await supabase.from('departments').insert([dbDept]).select();
      
      if (insertRes.error && (insertRes.error.message?.includes('head') || insertRes.error.message?.includes('column') || insertRes.error.code === 'PGRST204')) {
         console.warn("Retrying without head column", insertRes.error);
         delete dbDept.head;
         insertRes = await supabase.from('departments').insert([dbDept]).select();
      }

      if (insertRes.error) throw insertRes.error;
      const data = insertRes.data;

      if (data) {
        const newD = { ...data[0], head: dbDept.head || '', facultyCount: 0, studentCount: 0 };
        setDepartments([newD, ...departments]);
        return { data: newD, error: null };
      }
    } catch (err: any) {
      return { data: null, error: err };
    }
    return { data: null, error: new Error("Unknown error") };
  };

  const removeDepartment = async (id: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      const updated = departments.filter(d => d.id !== id);
      setDepartments(updated);
      localStorage.setItem('unixx_departments', JSON.stringify(updated));
      return { error: null };
    }

    try {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
      setDepartments(departments.filter(d => d.id !== id));
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const editDepartment = async (id: string, updates: Partial<Department>) => {
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      const updated = departments.map(d => d.id === id ? { ...d, ...updates } : d);
      setDepartments(updated);
      localStorage.setItem('unixx_departments', JSON.stringify(updated));
      return { error: null };
    }

    try {
      const dbUpdates: any = { ...updates };
      delete dbUpdates.facultyCount;
      delete dbUpdates.studentCount;
      delete dbUpdates.id;
      
      let updateRes = await supabase.from('departments').update(dbUpdates).eq('id', id);
      
      if (updateRes.error && (updateRes.error.message?.includes('head') || updateRes.error.message?.includes('column') || updateRes.error.code === 'PGRST204')) {
         console.warn("Retrying without head column", updateRes.error);
         delete dbUpdates.head;
         updateRes = await supabase.from('departments').update(dbUpdates).eq('id', id);
      }

      if (updateRes.error) throw updateRes.error;
      setDepartments(departments.map(d => d.id === id ? { ...d, ...updates } : d));
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  return { departments, loading, addDepartment, removeDepartment, editDepartment, fetchDepartments };
}
