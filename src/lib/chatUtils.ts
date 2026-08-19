import { supabase } from './supabase';

export function resolveUserProfile(user: any, roleHint?: string) {
  const getCachedAvatar = (email?: string, id?: string) => {
    if (email) {
      const byEmail = localStorage.getItem(`unixx_avatar_${email}`);
      if (byEmail) return byEmail;
    }
    if (id) {
      const byId = localStorage.getItem(`unixx_avatar_${id}`);
      if (byId) return byId;
    }
    return null;
  };

  // 1. Admin session
  if (localStorage.getItem('unixx_admin_session') === 'true' || user?.role === 'admin' || user?.email === 'admin@unixx.com') {
    const email = 'admin@unixx.com';
    const id = 'd3e89a79-18c7-4966-bcec-a108f305529c';
    return {
      id,
      full_name: 'Admin',
      email,
      role: 'admin',
      department: 'Administration',
      batch: 'Admin',
      avatar_url: getCachedAvatar(email, id) || null
    };
  }

  // 2. Faculty session
  const facSession = localStorage.getItem('unixx_faculty_session');
  if (facSession) {
    try {
      const fac = JSON.parse(facSession);
      if (fac?.id) {
        return {
          id: fac.id,
          full_name: fac.name || fac.full_name || 'Faculty Member',
          email: fac.email,
          role: 'faculty',
          department: fac.department || 'Computer Science',
          batch: 'Faculty',
          avatar_url: getCachedAvatar(fac.email, fac.id) || fac.avatar_url || null
        };
      }
    } catch (e) {}
  }

  // 3. Moderator session
  const modSession = localStorage.getItem('unixx_moderator_session');
  if (modSession) {
    try {
      const mod = JSON.parse(modSession);
      if (mod?.id) {
        return {
          id: mod.id,
          full_name: mod.name || mod.full_name || 'Moderator',
          email: mod.email,
          role: 'moderator',
          department: 'Moderation',
          batch: 'Moderator',
          avatar_url: getCachedAvatar(mod.email, mod.id) || mod.avatar_url || null
        };
      }
    } catch (e) {}
  }

  // 4. Student session
  const studSession = localStorage.getItem('unixx_student_session');
  if (studSession) {
    try {
      const stud = JSON.parse(studSession);
      if (stud?.id) {
        return {
          id: stud.id,
          full_name: stud.name || stud.full_name || stud.email || 'Student User',
          email: stud.email,
          role: 'student',
          department: stud.department || 'Computer Science',
          batch: stud.batch || '14',
          avatar_url: getCachedAvatar(stud.email, stud.id) || stud.avatar_url || null
        };
      }
    } catch (e) {}
  }

  // 5. Auth user from Supabase context
  if (user) {
    const rawRole = (user.user_metadata?.role || user.role || roleHint || 'student').toLowerCase();
    const email = user.email;
    const id = user.id;
    return {
      id,
      full_name: user.user_metadata?.full_name || user.name || user.full_name || user.email || 'User',
      email,
      role: rawRole,
      department: user.department || 'Computer Science',
      batch: user.batch || '14',
      avatar_url: getCachedAvatar(email, id) || user.avatar_url || user.user_metadata?.avatar_url || null
    };
  }

  return null;
}

export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pleasant double chime sequence: D5 (587.33Hz) then A5 (880Hz)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Audio autoplay restrictions or context error ignored gracefully
  }
}

export function getLocalReadTime(userId: string, groupId: string): string | null {
  if (!userId || !groupId) return null;
  return localStorage.getItem(`chat_read_${userId}_${groupId}`);
}

export function setLocalReadTime(userId: string, groupId: string): string {
  const now = new Date().toISOString();
  if (userId && groupId) {
    localStorage.setItem(`chat_read_${userId}_${groupId}`, now);
  }
  return now;
}
