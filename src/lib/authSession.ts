import { supabase } from './supabase';

/**
 * List of all session keys used across the app in localStorage and sessionStorage.
 */
const SESSION_KEYS = [
  'unixx_admin_session',
  'unixx_moderator_session',
  'unixx_faculty_session',
  'unixx_student_session',
  'unixx_user',
  'unixx_role',
  'unixx_avatar_url'
];

/**
 * Clears all local storage, session storage, and custom cache keys associated with user authentication.
 */
export const clearSessionData = () => {
  SESSION_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove session key ${key}:`, e);
    }
  });

  // Clear any specific avatar or profile cache entries
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('unixx_avatar_') || key.startsWith('unixx_notifications_read_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Error clearing dynamic cache keys:', e);
  }
};

/**
 * Fully signs out the active user from Supabase and clears all local session data.
 */
export const logoutUser = async () => {
  // Clear local session data first
  clearSessionData();

  // If Supabase is configured, sign out from Supabase Auth
  if (
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co'
  ) {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.warn('Error during Supabase auth signOut:', err);
    }
  }
};
