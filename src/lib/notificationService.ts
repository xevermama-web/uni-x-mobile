import localforage from 'localforage';
import { resolveUserProfile } from './chatUtils';
import { supabase } from './supabase';

export interface NotificationItem {
  id: string;
  type: 'notice' | 'study_group' | 'routine' | 'material' | 'low_attendance';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link: string;
  targetInfo?: string;
  badgeColor?: string;
}

// Ensure default data exists in localStorage so new users get instant notification demo context
export function ensureDefaultDataSeeded() {
  try {
    localforage.getItem('unixx_notices').then(hasNotices => {
      if (!hasNotices) {
        // No demo notices to seed by default
        localforage.setItem('unixx_notices', []);
      }
    }).catch(e => console.warn(e));

    if (!localStorage.getItem('unixx_students')) {
      const defaultStudents = [
        {
          id: 'stud-1401',
          name: 'Jane Smith',
          full_name: 'Jane Smith',
          department: 'Computer Science',
          batch: '14'
        }
      ];
      localStorage.setItem('unixx_students', JSON.stringify(defaultStudents));
    }

    if (!localStorage.getItem('unixx_attendance')) {
      const defaultAttendance = [
        { id: 'att-1', student_id: 'stud-1401', course_id: 'DBMS', status: 'absent', date: '2026-08-01' },
        { id: 'att-2', student_id: 'stud-1401', course_id: 'DBMS', status: 'absent', date: '2026-08-03' },
        { id: 'att-3', student_id: 'stud-1401', course_id: 'DBMS', status: 'present', date: '2026-08-05' },
        { id: 'att-4', student_id: 'stud-1401', course_id: 'DBMS', status: 'absent', date: '2026-08-07' }
      ];
      localStorage.setItem('unixx_attendance', JSON.stringify(defaultAttendance));
    }
  } catch (e) {
    console.warn("Error seeding default notification data:", e);
  }
}


// Synchronous notification builder for local rendering fallback
export function getUserNotifications(user: any, roleHint?: string): NotificationItem[] {
  ensureDefaultDataSeeded();

  const currentUser = resolveUserProfile(user, roleHint);
  if (!currentUser) return [];

  const readIds = getReadNotificationIds(currentUser.id);
  const notifications: NotificationItem[] = [];

  // 1. NOTICES
  try {
    const notices: any[] = [];

    notices.forEach((n: any) => {
      const noticeDept = n.department || n.dept || 'ALL';
      const isRelevantDept =
        noticeDept === 'ALL' ||
        currentUser.role === 'admin' ||
        currentUser.department === 'Administration' ||
        noticeDept.toLowerCase() === currentUser.department?.toLowerCase();

      const targetAudience = (n.targetAudience || n.tag || 'ALL').toLowerCase();
      const isRelevantAudience =
        targetAudience === 'all' ||
        targetAudience === 'info' ||
        targetAudience === 'urgent' ||
        currentUser.role === 'admin' ||
        targetAudience.includes(currentUser.role.toLowerCase());

      if (isRelevantDept && isRelevantAudience) {
        notifications.push({
          id: `notice_${n.id}`,
          type: 'notice',
          title: `📢 Notice: ${n.title}`,
          message: n.content ? (n.content.length > 90 ? n.content.substring(0, 90) + '...' : n.content) : `Notice for ${noticeDept}`,
          timestamp: n.createdAt || n.created_at || new Date().toISOString(),
          read: readIds.includes(`notice_${n.id}`),
          link: getNoticeLink(currentUser.role),
          targetInfo: noticeDept === 'ALL' ? 'All Departments' : noticeDept,
          badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
        });
      }
    });
  } catch (e) {
    console.error("Error loading notice notifications:", e);
  }

  // 2. STUDY GROUPS
  try {
    const rawGroups = localStorage.getItem('unixx_groups');
    const groups = rawGroups ? JSON.parse(rawGroups) : [];

    groups.forEach((g: any) => {
      const groupDept = g.department || 'Computer Science';
      const groupBatches: string[] = Array.isArray(g.batches) ? g.batches : [g.batch || '14'];

      let isRelevant = false;
      if (currentUser.role === 'admin' || currentUser.role === 'moderator') {
        isRelevant = true;
      } else if (currentUser.role === 'student') {
        const deptMatches = groupDept.toLowerCase() === currentUser.department?.toLowerCase() || groupDept === 'ALL';
        const batchMatches = groupBatches.includes(currentUser.batch) || groupBatches.includes('All') || groupBatches.length === 0;
        const directMember = Array.isArray(g.members) && g.members.includes(currentUser.id);

        if ((deptMatches && batchMatches) || directMember) {
          isRelevant = true;
        }
      }

      if (isRelevant) {
        notifications.push({
          id: `group_${g.id}`,
          type: 'study_group',
          title: `👥 Study Group: ${g.name}`,
          message: g.description || `New study group created for ${groupDept} (Batches: ${groupBatches.join(', ')})`,
          timestamp: g.created_at || new Date().toISOString(),
          read: readIds.includes(`group_${g.id}`),
          link: getChatLink(currentUser.role, g.id),
          targetInfo: `${groupDept} • Batch ${groupBatches.join(', ')}`,
          badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
        });
      }
    });
  } catch (e) {
    console.error("Error loading group notifications:", e);
  }

  // 3. ROUTINES
  try {
    const rawRoutines = localStorage.getItem('unixx_routines');
    const routines = rawRoutines ? JSON.parse(rawRoutines) : [];

    routines.forEach((r: any) => {
      let isRelevant = false;
      if (currentUser.role === 'admin' || currentUser.role === 'moderator') {
        isRelevant = true;
      } else if (currentUser.role === 'student') {
        const deptMatches = !r.departmentId || r.departmentId === 'ALL' || r.departmentId.toLowerCase() === currentUser.department?.toLowerCase();
        const batchMatches = !r.batch || r.batch === 'All' || r.batch === currentUser.batch;
        if (deptMatches && batchMatches) isRelevant = true;
      } else if (currentUser.role === 'faculty') {
        const facNameMatches = r.facultyName && (
          r.facultyName.toLowerCase().includes(currentUser.full_name?.toLowerCase()) ||
          currentUser.full_name?.toLowerCase().includes(r.facultyName.toLowerCase())
        );
        const deptMatches = !r.departmentId || r.departmentId === 'ALL' || r.departmentId.toLowerCase() === currentUser.department?.toLowerCase();
        if (facNameMatches || deptMatches) isRelevant = true;
      }

      if (isRelevant) {
        notifications.push({
          id: `routine_${r.id}`,
          type: 'routine',
          title: `📅 Routine: ${r.course}`,
          message: `${r.dayOfWeek || 'Scheduled'} class at ${r.startTime || ''} in ${r.room || 'Classroom'} (${r.facultyName || 'Faculty'})`,
          timestamp: r.updatedAt || r.createdAt || new Date().toISOString(),
          read: readIds.includes(`routine_${r.id}`),
          link: getRoutineLink(currentUser.role),
          targetInfo: `Batch ${r.batch} • ${r.startTime || ''}`,
          badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
        });
      }
    });
  } catch (e) {
    console.error("Error loading routine notifications:", e);
  }

  // 4. MATERIALS
  try {
    const rawMaterials = localStorage.getItem('unixx_materials');
    const materials = rawMaterials ? JSON.parse(rawMaterials) : [];

    materials.forEach((m: any) => {
      let isRelevant = false;
      if (currentUser.role === 'admin' || currentUser.role === 'faculty' || currentUser.role === 'moderator') {
        isRelevant = true;
      } else if (currentUser.role === 'student') {
        if (m.group_id) {
          const rawGroups = localStorage.getItem('unixx_groups');
          const groups = rawGroups ? JSON.parse(rawGroups) : [];
          const grp = groups.find((g: any) => g.id === m.group_id);
          if (grp) {
            const groupDept = grp.department || 'Computer Science';
            const groupBatches: string[] = Array.isArray(grp.batches) ? grp.batches : [grp.batch || '14'];
            const deptMatches = groupDept.toLowerCase() === currentUser.department?.toLowerCase();
            const batchMatches = groupBatches.includes(currentUser.batch);
            if (deptMatches && batchMatches) isRelevant = true;
          }
        } else {
          const matDept = m.department || 'General';
          const matBatch = m.batch || 'All';
          const deptMatches = matDept === 'General' || matDept.toLowerCase() === currentUser.department?.toLowerCase();
          const batchMatches = matBatch === 'All' || matBatch === currentUser.batch;
          if (deptMatches && batchMatches) isRelevant = true;
        }
      }

      if (isRelevant) {
        notifications.push({
          id: `material_${m.id}`,
          type: 'material',
          title: `📚 New Material: ${m.title}`,
          message: `${m.course || 'Course Material'} document uploaded by ${m.uploaded_by || m.uploaded_by_name || 'Faculty'}`,
          timestamp: m.created_at || new Date().toISOString(),
          read: readIds.includes(`material_${m.id}`),
          link: getMaterialLink(currentUser.role),
          targetInfo: `${m.course || 'General'} • Batch ${m.batch || 'All'}`,
          badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
        });
      }
    });
  } catch (e) {
    console.error("Error loading material notifications:", e);
  }

  // 5. LOW ATTENDANCE
  try {
    const rawStudents = localStorage.getItem('unixx_students');
    const students = rawStudents ? JSON.parse(rawStudents) : [];
    const rawAttendance = localStorage.getItem('unixx_attendance');
    const attendanceRecords = rawAttendance ? JSON.parse(rawAttendance) : [];

    if (attendanceRecords.length > 0) {
      if (currentUser.role === 'student') {
        const studentRecords = attendanceRecords.filter((a: any) => a.student_id === currentUser.id || a.studentId === currentUser.id);
        if (studentRecords.length > 0) {
          const present = studentRecords.filter((a: any) => (a.status || '').toLowerCase() === 'present').length;
          const total = studentRecords.length;
          const pct = Math.round((present / total) * 100);

          if (pct < 75) {
            notifications.push({
              id: `attendance_low_${currentUser.id}`,
              type: 'low_attendance',
              title: `⚠️ Low Attendance Warning (${pct}%)`,
              message: `Your overall attendance is currently at ${pct}%, which is below the minimum required 75% threshold.`,
              timestamp: new Date().toISOString(),
              read: readIds.includes(`attendance_low_${currentUser.id}`),
              link: getAttendanceLink(currentUser.role),
              targetInfo: `Minimum Threshold: 75% • Current: ${pct}%`,
              badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
            });
          }
        }
      } else if (currentUser.role === 'admin' || currentUser.role === 'faculty' || currentUser.role === 'moderator') {
        students.forEach((s: any) => {
          if (currentUser.role === 'faculty' && s.department !== currentUser.department) return;
          const sRecords = attendanceRecords.filter((a: any) => a.student_id === s.id || a.studentId === s.id);
          if (sRecords.length >= 2) {
            const present = sRecords.filter((a: any) => (a.status || '').toLowerCase() === 'present').length;
            const total = sRecords.length;
            const pct = Math.round((present / total) * 100);

            if (pct < 75) {
              notifications.push({
                id: `attendance_alert_${s.id}`,
                type: 'low_attendance',
                title: `⚠️ Low Attendance Alert: ${s.name || s.full_name}`,
                message: `Student ${s.name || s.full_name} (${s.department}, Batch ${s.batch}) attendance is at ${pct}%.`,
                timestamp: new Date().toISOString(),
                read: readIds.includes(`attendance_alert_${s.id}`),
                link: getAttendanceLink(currentUser.role),
                targetInfo: `${s.department} • Batch ${s.batch}`,
                badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
              });
            }
          }
        });
      }
    }
  } catch (e) {
    console.error("Error loading attendance notifications:", e);
  }

  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return notifications;
}

// Asynchronous real-time database-driven notification retriever
export async function getUserNotificationsAsync(user: any, roleHint?: string): Promise<NotificationItem[]> {
  ensureDefaultDataSeeded();

  const currentUser = resolveUserProfile(user, roleHint);
  if (!currentUser) return [];

  // Get read IDs from both local storage and Supabase
  let readIds = getReadNotificationIds(currentUser.id);
  
  if (supabase && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
    try {
      const { data: dbReads } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', currentUser.id);

      if (dbReads && dbReads.length > 0) {
        const fetchedIds = dbReads.map((r: any) => r.notification_id);
        readIds = Array.from(new Set([...readIds, ...fetchedIds]));
      }
    } catch (e) {
      // Fallback to local storage if notification_reads table isn't created
    }
  }

  const notifications: NotificationItem[] = [];

  // -------------------------------------------------------------
  // 1. NOTICES (Supabase + Local)
  // -------------------------------------------------------------
  try {
    let notices: any[] = [];
    if (supabase && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      const { data: dbNotices } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
      if (dbNotices && dbNotices.length > 0) {
        notices = dbNotices;
      }
    }

    const localNotices: any[] = [];
    
    // Merge Supabase + Local notices avoiding duplicates
    localNotices.forEach((ln: any) => {
      if (!notices.some(n => n.id === ln.id)) {
        notices.push(ln);
      }
    });

    notices.forEach((n: any) => {
      const noticeDept = n.department || n.dept || 'ALL';
      const isRelevantDept =
        noticeDept === 'ALL' ||
        currentUser.role === 'admin' ||
        currentUser.department === 'Administration' ||
        noticeDept.toLowerCase() === currentUser.department?.toLowerCase();

      const targetAudience = (n.targetAudience || n.tag || 'ALL').toLowerCase();
      const isRelevantAudience =
        targetAudience === 'all' ||
        targetAudience === 'info' ||
        targetAudience === 'urgent' ||
        currentUser.role === 'admin' ||
        targetAudience.includes(currentUser.role.toLowerCase());

      if (isRelevantDept && isRelevantAudience) {
        notifications.push({
          id: `notice_${n.id}`,
          type: 'notice',
          title: `📢 Notice: ${n.title}`,
          message: n.content ? (n.content.length > 90 ? n.content.substring(0, 90) + '...' : n.content) : `Notice for ${noticeDept}`,
          timestamp: n.createdAt || n.created_at || new Date().toISOString(),
          read: readIds.includes(`notice_${n.id}`),
          link: getNoticeLink(currentUser.role),
          targetInfo: noticeDept === 'ALL' ? 'All Departments' : noticeDept,
          badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
        });
      }
    });
  } catch (e) {
    console.error("Error fetching notices for notifications:", e);
  }

  // -------------------------------------------------------------
  // 2. STUDY GROUPS (Supabase + Local)
  // -------------------------------------------------------------
  try {
    let groups: any[] = [];
    if (supabase && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      const { data: dbGroups } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
      if (dbGroups && dbGroups.length > 0) {
        groups = dbGroups;
      }
    }

    const rawLocalGroups = localStorage.getItem('unixx_groups');
    const localGroups = rawLocalGroups ? JSON.parse(rawLocalGroups) : [];
    
    localGroups.forEach((lg: any) => {
      if (!groups.some(g => g.id === lg.id)) {
        groups.push(lg);
      }
    });

    groups.forEach((g: any) => {
      const groupDept = g.department || 'Computer Science';
      const groupBatches: string[] = Array.isArray(g.batches) ? g.batches : [g.batch || '14'];

      let isRelevant = false;
      if (currentUser.role === 'admin' || currentUser.role === 'moderator') {
        isRelevant = true;
      } else if (currentUser.role === 'student') {
        const deptMatches = groupDept.toLowerCase() === currentUser.department?.toLowerCase() || groupDept === 'ALL';
        const batchMatches = groupBatches.includes(currentUser.batch) || groupBatches.includes('All') || groupBatches.length === 0;
        const directMember = Array.isArray(g.members) && g.members.includes(currentUser.id);

        if ((deptMatches && batchMatches) || directMember) {
          isRelevant = true;
        }
      }

      if (isRelevant) {
        notifications.push({
          id: `group_${g.id}`,
          type: 'study_group',
          title: `👥 Study Group: ${g.name}`,
          message: g.description || `New study group created for ${groupDept} (Batches: ${groupBatches.join(', ')})`,
          timestamp: g.created_at || new Date().toISOString(),
          read: readIds.includes(`group_${g.id}`),
          link: getChatLink(currentUser.role, g.id),
          targetInfo: `${groupDept} • Batch ${groupBatches.join(', ')}`,
          badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
        });
      }
    });
  } catch (e) {
    console.error("Error fetching study groups for notifications:", e);
  }

  // -------------------------------------------------------------
  // 3. ROUTINES (Supabase + Local)
  // -------------------------------------------------------------
  try {
    let routines: any[] = [];
    if (supabase && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      const { data: dbRoutines } = await supabase.from('routines').select('*');
      if (dbRoutines && dbRoutines.length > 0) {
        routines = dbRoutines.map((r: any) => ({
          id: r.id,
          departmentId: r.department_id || r.departmentId,
          batch: r.batch,
          dayOfWeek: r.day_of_week || r.dayOfWeek,
          startTime: r.start_time || r.startTime,
          endTime: r.end_time || r.endTime,
          course: r.course,
          facultyName: r.faculty_name || r.facultyName,
          room: r.room,
          updatedAt: r.updated_at || r.updatedAt || r.created_at
        }));
      }
    }

    const rawLocalRoutines = localStorage.getItem('unixx_routines');
    const localRoutines = rawLocalRoutines ? JSON.parse(rawLocalRoutines) : [];

    localRoutines.forEach((lr: any) => {
      if (!routines.some(r => r.id === lr.id)) {
        routines.push(lr);
      }
    });

    routines.forEach((r: any) => {
      let isRelevant = false;
      if (currentUser.role === 'admin' || currentUser.role === 'moderator') {
        isRelevant = true;
      } else if (currentUser.role === 'student') {
        const deptMatches = !r.departmentId || r.departmentId === 'ALL' || r.departmentId.toLowerCase() === currentUser.department?.toLowerCase();
        const batchMatches = !r.batch || r.batch === 'All' || r.batch === currentUser.batch;
        if (deptMatches && batchMatches) isRelevant = true;
      } else if (currentUser.role === 'faculty') {
        const facNameMatches = r.facultyName && (
          r.facultyName.toLowerCase().includes(currentUser.full_name?.toLowerCase()) ||
          currentUser.full_name?.toLowerCase().includes(r.facultyName.toLowerCase())
        );
        const deptMatches = !r.departmentId || r.departmentId === 'ALL' || r.departmentId.toLowerCase() === currentUser.department?.toLowerCase();
        if (facNameMatches || deptMatches) isRelevant = true;
      }

      if (isRelevant) {
        notifications.push({
          id: `routine_${r.id}`,
          type: 'routine',
          title: `📅 Routine: ${r.course}`,
          message: `${r.dayOfWeek || 'Scheduled'} class at ${r.startTime || ''} in ${r.room || 'Classroom'} (${r.facultyName || 'Faculty'})`,
          timestamp: r.updatedAt || r.createdAt || new Date().toISOString(),
          read: readIds.includes(`routine_${r.id}`),
          link: getRoutineLink(currentUser.role),
          targetInfo: `Batch ${r.batch} • ${r.startTime || ''}`,
          badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
        });
      }
    });
  } catch (e) {
    console.error("Error fetching routines for notifications:", e);
  }

  // -------------------------------------------------------------
  // 4. MATERIALS (Supabase + Local)
  // -------------------------------------------------------------
  try {
    let materials: any[] = [];
    if (supabase && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      const { data: dbMaterials } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
      if (dbMaterials && dbMaterials.length > 0) {
        materials = dbMaterials;
      }
    }

    const rawLocalMaterials = localStorage.getItem('unixx_materials');
    const localMaterials = rawLocalMaterials ? JSON.parse(rawLocalMaterials) : [];

    localMaterials.forEach((lm: any) => {
      if (!materials.some(m => m.id === lm.id)) {
        materials.push(lm);
      }
    });

    materials.forEach((m: any) => {
      let isRelevant = false;
      if (currentUser.role === 'admin' || currentUser.role === 'faculty' || currentUser.role === 'moderator') {
        isRelevant = true;
      } else if (currentUser.role === 'student') {
        if (m.group_id) {
          const rawGroups = localStorage.getItem('unixx_groups');
          const groups = rawGroups ? JSON.parse(rawGroups) : [];
          const grp = groups.find((g: any) => g.id === m.group_id);
          if (grp) {
            const groupDept = grp.department || 'Computer Science';
            const groupBatches: string[] = Array.isArray(grp.batches) ? grp.batches : [grp.batch || '14'];
            const deptMatches = groupDept.toLowerCase() === currentUser.department?.toLowerCase();
            const batchMatches = groupBatches.includes(currentUser.batch);
            if (deptMatches && batchMatches) isRelevant = true;
          }
        } else {
          const matDept = m.department || 'General';
          const matBatch = m.batch || 'All';
          const deptMatches = matDept === 'General' || matDept.toLowerCase() === currentUser.department?.toLowerCase();
          const batchMatches = matBatch === 'All' || matBatch === currentUser.batch;
          if (deptMatches && batchMatches) isRelevant = true;
        }
      }

      if (isRelevant) {
        notifications.push({
          id: `material_${m.id}`,
          type: 'material',
          title: `📚 New Material: ${m.title}`,
          message: `${m.course || 'Course Material'} document uploaded by ${m.uploaded_by || m.uploaded_by_name || 'Faculty'}`,
          timestamp: m.created_at || new Date().toISOString(),
          read: readIds.includes(`material_${m.id}`),
          link: getMaterialLink(currentUser.role),
          targetInfo: `${m.course || 'General'} • Batch ${m.batch || 'All'}`,
          badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
        });
      }
    });
  } catch (e) {
    console.error("Error fetching materials for notifications:", e);
  }

  // -------------------------------------------------------------
  // 5. LOW ATTENDANCE (Supabase + Local)
  // -------------------------------------------------------------
  try {
    let attendanceRecords: any[] = [];
    if (supabase && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      const { data: dbAtt } = await supabase.from('attendance').select('*');
      if (dbAtt && dbAtt.length > 0) {
        attendanceRecords = dbAtt;
      }
    }

    const rawLocalAtt = localStorage.getItem('unixx_attendance');
    const localAtt = rawLocalAtt ? JSON.parse(rawLocalAtt) : [];

    localAtt.forEach((la: any) => {
      if (!attendanceRecords.some(a => a.id === la.id)) {
        attendanceRecords.push(la);
      }
    });

    const rawStudents = localStorage.getItem('unixx_students');
    const students = rawStudents ? JSON.parse(rawStudents) : [];

    if (attendanceRecords.length > 0) {
      if (currentUser.role === 'student') {
        const studentRecords = attendanceRecords.filter((a: any) => a.student_id === currentUser.id || a.studentId === currentUser.id);
        if (studentRecords.length > 0) {
          const present = studentRecords.filter((a: any) => (a.status || '').toLowerCase() === 'present').length;
          const total = studentRecords.length;
          const pct = Math.round((present / total) * 100);

          if (pct < 75) {
            notifications.push({
              id: `attendance_low_${currentUser.id}`,
              type: 'low_attendance',
              title: `⚠️ Low Attendance Warning (${pct}%)`,
              message: `Your overall attendance is currently at ${pct}%, which is below the minimum required 75% threshold.`,
              timestamp: new Date().toISOString(),
              read: readIds.includes(`attendance_low_${currentUser.id}`),
              link: getAttendanceLink(currentUser.role),
              targetInfo: `Minimum Threshold: 75% • Current: ${pct}%`,
              badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
            });
          }
        }
      } else if (currentUser.role === 'admin' || currentUser.role === 'faculty' || currentUser.role === 'moderator') {
        students.forEach((s: any) => {
          if (currentUser.role === 'faculty' && s.department !== currentUser.department) return;
          const sRecords = attendanceRecords.filter((a: any) => a.student_id === s.id || a.studentId === s.id);
          if (sRecords.length >= 2) {
            const present = sRecords.filter((a: any) => (a.status || '').toLowerCase() === 'present').length;
            const total = sRecords.length;
            const pct = Math.round((present / total) * 100);

            if (pct < 75) {
              notifications.push({
                id: `attendance_alert_${s.id}`,
                type: 'low_attendance',
                title: `⚠️ Low Attendance Alert: ${s.name || s.full_name}`,
                message: `Student ${s.name || s.full_name} (${s.department}, Batch ${s.batch}) attendance is at ${pct}%.`,
                timestamp: new Date().toISOString(),
                read: readIds.includes(`attendance_alert_${s.id}`),
                link: getAttendanceLink(currentUser.role),
                targetInfo: `${s.department} • Batch ${s.batch}`,
                badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
              });
            }
          }
        });
      }
    }
  } catch (e) {
    console.error("Error fetching attendance for notifications:", e);
  }

  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return notifications;
}

// Subscribe to Supabase Realtime Postgres Changes across notices, groups, routines, materials, attendance & reads
export function subscribeToRealtimeNotifications(
  user: any,
  roleHint: string | undefined,
  callback: (notifications: NotificationItem[]) => void
) {
  const currentUser = resolveUserProfile(user, roleHint);
  if (!currentUser?.id) return () => {};

  // Initial fetch
  getUserNotificationsAsync(user, roleHint).then(callback);

  const refresh = () => {
    getUserNotificationsAsync(user, roleHint).then(callback);
  };

  let channel: any = null;

  if (supabase && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
    const channelName = `realtime-notifs-${currentUser.id}-${Math.random().toString(36).substring(2, 7)}`;
    channel = supabase.channel(channelName);

    // Listen to database changes on all related academic tables
    const tables = ['notices', 'groups', 'routines', 'materials', 'attendance', 'notification_reads', 'notifications'];
    
    tables.forEach((table) => {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          refresh();
        }
      );
    });

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        refresh();
      }
    });
  }

  // Listen for local browser events
  const handleUpdate = () => refresh();
  window.addEventListener('unixx_notifications_updated', handleUpdate);
  window.addEventListener('storage', handleUpdate);
  window.addEventListener('focus', handleUpdate);

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
    window.removeEventListener('unixx_notifications_updated', handleUpdate);
    window.removeEventListener('storage', handleUpdate);
    window.removeEventListener('focus', handleUpdate);
  };
}

export function getNoticeLink(role: string) {
  if (role === 'faculty') return '/faculty-dashboard/notices';
  if (role === 'moderator') return '/moderator-dashboard/notices';
  return '/dashboard/notices';
}

function getChatLink(role: string, groupId?: string) {
  const base = role === 'faculty' ? '/faculty-dashboard/chat' : role === 'moderator' ? '/moderator-dashboard/chat' : '/dashboard/chat';
  return groupId ? `${base}?group=${groupId}` : base;
}

function getRoutineLink(role: string) {
  if (role === 'faculty') return '/faculty-dashboard/routines';
  if (role === 'moderator') return '/moderator-dashboard/routines';
  return '/dashboard/routines';
}

function getMaterialLink(role: string) {
  if (role === 'faculty') return '/faculty-dashboard/materials';
  return '/dashboard/materials';
}

function getAttendanceLink(role: string) {
  if (role === 'faculty') return '/faculty-dashboard/attendance';
  if (role === 'moderator') return '/moderator-dashboard/attendance';
  return '/dashboard/attendance';
}

export function getReadNotificationIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`unixx_notifications_read_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  try {
    const current = getReadNotificationIds(userId);
    if (!current.includes(notificationId)) {
      const updated = [...current, notificationId];
      localStorage.setItem(`unixx_notifications_read_${userId}`, JSON.stringify(updated));
      
      // Update Supabase notification_reads if database is connected
      if (supabase && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        try {
          await supabase.from('notification_reads').upsert([
            { user_id: userId, notification_id: notificationId, read_at: new Date().toISOString() }
          ], { onConflict: 'user_id,notification_id' });
        } catch (e) {
          // Table might not exist or schema issue, fallback handled safely
        }
      }

      window.dispatchEvent(new Event('unixx_notifications_updated'));
    }
  } catch (e) {}
}

export async function markAllNotificationsAsRead(userId: string, notificationIds: string[]) {
  try {
    const current = getReadNotificationIds(userId);
    const set = new Set([...current, ...notificationIds]);
    const updated = Array.from(set);
    localStorage.setItem(`unixx_notifications_read_${userId}`, JSON.stringify(updated));

    if (supabase && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
        const payload = notificationIds.map(id => ({
          user_id: userId,
          notification_id: id,
          read_at: new Date().toISOString()
        }));
        await supabase.from('notification_reads').upsert(payload, { onConflict: 'user_id,notification_id' });
      } catch (e) {}
    }

    window.dispatchEvent(new Event('unixx_notifications_updated'));
  } catch (e) {}
}
