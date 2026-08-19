import { supabase } from '../lib/supabase';

export interface EmailCheckResult {
  available: boolean;
  error?: string;
}

export async function checkEmailAvailable(email: string, excludeUserId?: string): Promise<EmailCheckResult> {
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail) {
    return { available: false, error: 'Email address is required.' };
  }

  // 1. Permanently block admin@unixx.com from being used for creating or assigning accounts
  if (cleanEmail === 'admin@unixx.com') {
    return {
      available: false,
      error: 'admin@unixx.com is a system administrator account and cannot be registered or assigned to any account.'
    };
  }

  // 2. Check LocalStorage fallback if Supabase is not configured
  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
    const studentsStr = localStorage.getItem('unixx_students');
    if (studentsStr) {
      try {
        const students = JSON.parse(studentsStr);
        if (students.some((s: any) => (s.email || '').trim().toLowerCase() === cleanEmail && s.id !== excludeUserId && s.profile_id !== excludeUserId)) {
          return { available: false, error: 'An account with this email address already exists.' };
        }
      } catch {}
    }

    const facultiesStr = localStorage.getItem('unixx_faculties');
    if (facultiesStr) {
      try {
        const faculties = JSON.parse(facultiesStr);
        if (faculties.some((f: any) => (f.email || '').trim().toLowerCase() === cleanEmail && f.id !== excludeUserId)) {
          return { available: false, error: 'An account with this email address already exists.' };
        }
      } catch {}
    }

    const moderatorsStr = localStorage.getItem('unixx_moderators');
    if (moderatorsStr) {
      try {
        const moderators = JSON.parse(moderatorsStr);
        if (moderators.some((m: any) => (m.email || '').trim().toLowerCase() === cleanEmail && m.id !== excludeUserId)) {
          return { available: false, error: 'An account with this email address already exists.' };
        }
      } catch {}
    }

    return { available: true };
  }

  // 3. Supabase mode - query profiles, faculties, and moderators tables
  try {
    const [{ data: profs }, { data: facs }, { data: mods }] = await Promise.all([
      supabase.from('profiles').select('id, academic_id').ilike('email', cleanEmail),
      supabase.from('faculties').select('id').ilike('email', cleanEmail),
      supabase.from('moderators').select('id').ilike('email', cleanEmail)
    ]);

    const matchingProf = profs?.find(p => p.id !== excludeUserId && p.academic_id !== excludeUserId);
    const matchingFac = facs?.find(f => f.id !== excludeUserId);
    const matchingMod = mods?.find(m => m.id !== excludeUserId);

    if (matchingProf || matchingFac || matchingMod) {
      return { available: false, error: 'An account with this email address already exists.' };
    }

    return { available: true };
  } catch (err: any) {
    console.error("Error checking email availability:", err);
    if (cleanEmail === 'admin@unixx.com') {
      return { available: false, error: 'admin@unixx.com is permanently blocked for account creation.' };
    }
    return { available: true };
  }
}
