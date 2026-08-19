import OpenAI from 'openai';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Materials API Routes (Directly integrated with Supabase Database and Supabase Storage)
  app.post('/api/materials/upload', async (req, res) => {
    try {
      const {
        fileBase64,
        fileName,
        fileType,
        title,
        description,
        department,
        batch,
        course,
        uploadedBy,
        groupId
      } = req.body;

      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Supabase credentials missing' });
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      const matId = `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      let filePath = `demo/${matId}_${fileName || 'file'}`;
      let publicUrl = '';
      let fileBuffer: Buffer | null = null;

      if (fileBase64 && fileBase64.startsWith('data:')) {
        const matches = fileBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          fileBuffer = Buffer.from(matches[2], 'base64');
        } else {
          const base64Data = fileBase64.split(',')[1] || fileBase64;
          fileBuffer = Buffer.from(base64Data, 'base64');
        }
      } else if (fileBase64) {
        fileBuffer = Buffer.from(fileBase64, 'base64');
      }

      if (fileBuffer) {
        const deptFolder = (department || 'General').replace(/[^a-zA-Z0-9_-]/g, '_');
        const courseFolder = (course || 'General').replace(/[^a-zA-Z0-9_-]/g, '_');
        const safeFileName = (fileName || 'document.pdf').replace(/[^a-zA-Z0-9_.-]/g, '_');
        filePath = `${deptFolder}/${courseFolder}/${matId}_${safeFileName}`;

        // Ensure storage bucket 'materials' exists
        try {
          await supabaseAdmin.storage.createBucket('materials', { public: true });
        } catch (e) {
          // ignore if bucket already exists
        }

        let uploadRes = await supabaseAdmin.storage.from('materials').upload(filePath, fileBuffer, {
          contentType: fileType || 'application/octet-stream',
          upsert: true
        });

        if (uploadRes.error && uploadRes.error.message?.includes('not found')) {
          try {
            await supabaseAdmin.storage.createBucket('materials', { public: true });
            uploadRes = await supabaseAdmin.storage.from('materials').upload(filePath, fileBuffer, {
              contentType: fileType || 'application/octet-stream',
              upsert: true
            });
          } catch (e) {}
        }

        if (uploadRes.error) {
          console.warn('Supabase storage upload notice:', uploadRes.error.message);
        }

        const { data: pubData } = supabaseAdmin.storage.from('materials').getPublicUrl(filePath);
        publicUrl = pubData?.publicUrl || '';
      }

      // Only store base64 data in database JSON if file is small (< 300KB) to avoid exceeding DB row/payload limit
      const includeBase64 = fileBase64 && fileBase64.length < 300000;

      const metaObj = {
        url: publicUrl,
        group_id: groupId || null,
        description: description || '',
        department: department || 'General',
        course: course || 'General',
        batch: batch || 'All',
        file_type: fileType || 'application/octet-stream',
        file_size: fileBuffer ? fileBuffer.length : 0,
        file_path: filePath,
        uploaded_by_name: uploadedBy || 'Uploader',
        file_data: includeBase64 ? fileBase64 : null
      };

      const { data, error } = await supabaseAdmin.from('materials').insert([{
        title: title || fileName || 'Course Material',
        file_url: JSON.stringify(metaObj)
      }]).select().single();

      if (error) {
        console.error('Database insert material error:', error);
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Materials Upload Error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload material' });
    }
  });

  app.post('/api/materials/delete', async (req, res) => {
    try {
      const { id, filePath } = req.body;
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Supabase configuration missing' });
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      if (filePath) {
        await supabaseAdmin.storage.from('materials').remove([filePath]);
      }

      const { error } = await supabaseAdmin.from('materials').delete().eq('id', id);
      if (error) throw error;

      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete Material Error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete material' });
    }
  });

  app.post('/api/materials/edit', async (req, res) => {
    try {
      const { id, updates } = req.body;
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Supabase configuration missing' });
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      const { data: row, error: fetchErr } = await supabaseAdmin.from('materials').select('*').eq('id', id).single();
      if (fetchErr || !row) {
        return res.status(404).json({ error: 'Material not found' });
      }

      let parsedMeta: any = {};
      try {
        parsedMeta = JSON.parse(row.file_url);
      } catch (e) {
        parsedMeta = { url: row.file_url };
      }

      if (updates.description !== undefined) parsedMeta.description = updates.description;
      if (updates.course !== undefined) parsedMeta.course = updates.course;
      if (updates.department !== undefined) parsedMeta.department = updates.department;
      if (updates.batch !== undefined) parsedMeta.batch = updates.batch;

      const newTitle = updates.title || row.title;
      const newFileUrl = JSON.stringify(parsedMeta);

      const { data, error } = await supabaseAdmin
        .from('materials')
        .update({ title: newTitle, file_url: newFileUrl })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Edit Material Error:', error);
      res.status(500).json({ error: error.message || 'Failed to edit material' });
    }
  });



  app.post('/api/admin-reset-password', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }
      
      const token = authHeader.split(' ')[1];
      
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Supabase Service Role Key is not configured.' });
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (profileError || !profile || profile.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      const { userId, newPassword } = req.body;
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (error) throw error;
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Reset Password Error:', error);
      res.status(500).json({ error: error.message || 'Failed to reset password' });
    }
  });

  app.post('/api/save-attendance', async (req, res) => {
    try {
      const { sessionData, records } = req.body;
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Supabase configuration missing' });
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      // 1. Delete existing attendance records for this course and date
      await supabaseAdmin
        .from('attendance')
        .delete()
        .eq('course_id', sessionData.course_id)
        .eq('date', sessionData.class_date);

      // 2. Insert new records
      const recordedBy = (sessionData.faculty_id && sessionData.faculty_id.length === 36)
        ? sessionData.faculty_id
        : null;

      const recordsToInsert = records.map((r: any) => ({
        course_id: sessionData.course_id,
        student_id: r.student_id,
        status: (r.status || 'present').toLowerCase(),
        recorded_by: recordedBy,
        date: sessionData.class_date
      }));

      const { data, error } = await supabaseAdmin
        .from('attendance')
        .insert(recordsToInsert)
        .select('*');

      if (error) {
        console.error('Supabase save attendance error:', error);
        throw error;
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Save Attendance Error:', error);
      res.status(500).json({ error: error.message || 'Failed to save attendance' });
    }
  });

  // Routine Management API Endpoints with Role Enforcement (Admin / Moderator / Faculty)
  const verifyRoutineManagerRole = async (userId: string, requestedRole?: string, userEmail?: string, userName?: string) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return { isAuthorized: false, role: 'unknown', supabaseAdmin: null };
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    let dbRole = '';

    if (userId) {
      if (userId === 'admin') {
        dbRole = 'admin';
      } else if (userId === 'moderator') {
        dbRole = 'moderator';
      } else if (userId === 'faculty' || requestedRole === 'faculty') {
        dbRole = 'faculty';
      } else {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.role) {
          dbRole = profile.role.toLowerCase();
        } else {
          // Check faculties table
          const { data: faculty } = await supabaseAdmin
            .from('faculties')
            .select('id, name, email')
            .or(`id.eq.${userId},email.eq.${userEmail || ''}`)
            .maybeSingle();
          if (faculty) {
            dbRole = 'faculty';
          }
        }
      }
    }

    if (!dbRole && (requestedRole === 'faculty' || requestedRole === 'admin' || requestedRole === 'moderator')) {
      dbRole = requestedRole;
    }

    const isAuthorized = dbRole === 'admin' || dbRole === 'moderator' || dbRole === 'faculty';
    return { isAuthorized, role: dbRole, supabaseAdmin };
  };

  app.post('/api/routines/add', async (req, res) => {
    try {
      const { userId, userRole, userEmail, userName, routine } = req.body;
      const { isAuthorized, supabaseAdmin } = await verifyRoutineManagerRole(userId, userRole, userEmail, userName);

      if (!isAuthorized || !supabaseAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only Admin, Moderator, and Faculty can add routines.' });
      }

      const dbRoutine = {
        department_id: routine.departmentId,
        batch: routine.batch,
        day_of_week: routine.dayOfWeek,
        start_time: routine.startTime,
        end_time: routine.endTime,
        course: routine.course,
        faculty_name: routine.facultyName,
        room: routine.room,
        is_published: routine.isPublished ?? true
      };

      const { data, error } = await supabaseAdmin.from('routines').insert([dbRoutine]).select();
      if (error) throw error;

      res.json({ success: true, data: data[0] });
    } catch (error: any) {
      console.error('Add Routine API Error:', error);
      res.status(500).json({ error: error.message || 'Failed to add routine' });
    }
  });

  app.post('/api/routines/update', async (req, res) => {
    try {
      const { userId, userRole, userEmail, userName, id, updates } = req.body;
      const { isAuthorized, supabaseAdmin } = await verifyRoutineManagerRole(userId, userRole, userEmail, userName);

      if (!isAuthorized || !supabaseAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only Admin, Moderator, and Faculty can edit routines.' });
      }

      const dbUpdates: any = {};
      if (updates.departmentId !== undefined) dbUpdates.department_id = updates.departmentId;
      if (updates.batch !== undefined) dbUpdates.batch = updates.batch;
      if (updates.dayOfWeek !== undefined) dbUpdates.day_of_week = updates.dayOfWeek;
      if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
      if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
      if (updates.course !== undefined) dbUpdates.course = updates.course;
      if (updates.facultyName !== undefined) dbUpdates.faculty_name = updates.facultyName;
      if (updates.room !== undefined) dbUpdates.room = updates.room;
      if (updates.isPublished !== undefined) dbUpdates.is_published = updates.isPublished;

      const { error } = await supabaseAdmin.from('routines').update(dbUpdates).eq('id', id);
      if (error) throw error;

      res.json({ success: true });
    } catch (error: any) {
      console.error('Update Routine API Error:', error);
      res.status(500).json({ error: error.message || 'Failed to update routine' });
    }
  });

  app.post('/api/routines/delete', async (req, res) => {
    try {
      const { userId, userRole, userEmail, userName, id } = req.body;
      const { isAuthorized, supabaseAdmin } = await verifyRoutineManagerRole(userId, userRole, userEmail, userName);

      if (!isAuthorized || !supabaseAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only Admin, Moderator, and Faculty can delete routines.' });
      }

      const { error } = await supabaseAdmin.from('routines').delete().eq('id', id);
      if (error) throw error;

      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete Routine API Error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete routine' });
    }
  });

  app.post('/api/routines/import', async (req, res) => {
    try {
      const { userId, userRole, items } = req.body;
      const { isAuthorized, supabaseAdmin } = await verifyRoutineManagerRole(userId, userRole);

      if (!isAuthorized || !supabaseAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only Admin and Moderator can import routines.' });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'No routine items provided for import' });
      }

      const results = [];
      for (const r of items) {
        const dbRoutine = {
          department_id: r.departmentId,
          batch: r.batch,
          day_of_week: r.dayOfWeek,
          start_time: r.startTime,
          end_time: r.endTime || '',
          course: r.course || '',
          faculty_name: r.facultyName || '',
          room: r.room || '',
          is_published: r.isPublished || false
        };

        // Check if existing routine for this dept, batch, day, start_time
        const { data: existing } = await supabaseAdmin
          .from('routines')
          .select('id')
          .eq('department_id', r.departmentId)
          .eq('batch', r.batch)
          .eq('day_of_week', r.dayOfWeek)
          .eq('start_time', r.startTime)
          .maybeSingle();

        if (existing) {
          await supabaseAdmin.from('routines').update(dbRoutine).eq('id', existing.id);
        } else {
          await supabaseAdmin.from('routines').insert([dbRoutine]);
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Import Routine API Error:', error);
      res.status(500).json({ error: error.message || 'Failed to import routines' });
    }
  });

  // Chat API Routes
  // Background cleanup for expired messages
  const runMessageRetentionCleanup = async () => {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !serviceRoleKey) return;

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      const { data: groups } = await supabaseAdmin.from('study_groups').select('id, description');
      if (!groups) return;

      const now = Date.now();
      for (const g of groups) {
        let retention = '7_days';
        if (g.description && g.description.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(g.description);
            if (parsed.message_retention) retention = parsed.message_retention;
          } catch (e) {}
        }

        let days = 7;
        if (retention === '1_month') days = 30;
        if (retention === '6_months') days = 180;

        const cutoffIso = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
        await supabaseAdmin
          .from('messages')
          .delete()
          .eq('group_id', g.id)
          .lt('created_at', cutoffIso);
      }
    } catch (err) {
      console.error('Error running message retention cleanup:', err);
    }
  };

  // Run cleanup periodically every 5 minutes and on startup
  setInterval(runMessageRetentionCleanup, 5 * 60 * 1000);
  runMessageRetentionCleanup();

  function isValidUuid(id: any): boolean {
    return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }

  function cleanBatchNumber(str: string): string {
    if (!str) return '';
    const clean = String(str).toLowerCase().trim();
    const numMatch = clean.match(/\d+/);
    if (numMatch) return numMatch[0];
    return clean.replace(/^(cs\s*|cse\s*|batch\s*|-)+/i, '').trim();
  }

  function isDepartmentMatch(studentDept: string, targetDeptList: string[]): boolean {
    if (!targetDeptList || targetDeptList.length === 0) return true;
    const sDept = (studentDept || '').trim().toLowerCase();
    if (!sDept) return false;

    return targetDeptList.some(target => {
      const t = target.trim().toLowerCase();
      if (!t) return true;
      if (sDept === t) return true;
      if (sDept.includes(t) || t.includes(sDept)) return true;

      const abbrevMap: Record<string, string[]> = {
        'cse': ['computer science', 'software engineering', 'computer science and engineering'],
        'eee': ['electrical', 'electronics', 'electrical and electronic engineering'],
        'bba': ['business', 'business administration'],
        'swe': ['software engineering'],
        'ce': ['civil engineering'],
        'me': ['mechanical engineering']
      };

      if (abbrevMap[sDept]) {
        if (abbrevMap[sDept].some(full => t.includes(full) || full.includes(t))) return true;
      }
      if (abbrevMap[t]) {
        if (abbrevMap[t].some(full => sDept.includes(full) || full.includes(sDept))) return true;
      }

      return false;
    });
  }

  function isBatchMatch(studentBatch: string, targetBatchList: string[]): boolean {
    if (!targetBatchList || targetBatchList.length === 0) return true;
    const sRaw = String(studentBatch || '').trim().toLowerCase();
    if (!sRaw) return false;

    const sClean = cleanBatchNumber(sRaw);

    return targetBatchList.some(target => {
      const tRaw = String(target || '').trim().toLowerCase();
      if (!tRaw) return true;
      if (sRaw === tRaw) return true;

      const tClean = cleanBatchNumber(tRaw);
      if (sClean && tClean && sClean === tClean) return true;

      if (sRaw.endsWith(tClean) || tRaw.endsWith(sClean)) return true;
      if (sRaw.includes(tRaw) || tRaw.includes(sRaw)) return true;

      return false;
    });
  }

  // Helper function to resolve user role and profile from database tables (profiles, faculties, moderators)
  async function resolveUserRoleAndProfile(supabaseAdmin: any, userId: string, userEmail?: string, fallbackRole?: string) {
    if (!userId && !userEmail) return { role: 'student', profile: null };

    if (userId === 'd3e89a79-18c7-4966-bcec-a108f305529c' || userEmail === 'admin@unixx.com') {
      return {
        role: 'admin',
        profile: {
          id: 'd3e89a79-18c7-4966-bcec-a108f305529c',
          full_name: 'Admin',
          email: 'admin@unixx.com',
          role: 'admin',
          department: 'Administration'
        }
      };
    }

    // 1. Query profiles table
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .or(`id.eq.${userId || ''},email.eq.${userEmail || ''}`)
      .maybeSingle();

    if (profile && profile.role) {
      const role = profile.role.toLowerCase();
      return { role, profile };
    }

    // 2. Query faculties table
    let { data: faculty } = await supabaseAdmin
      .from('faculties')
      .select('*')
      .or(`id.eq.${userId || ''},email.eq.${userEmail || ''}`)
      .maybeSingle();

    if (faculty) {
      return {
        role: 'faculty',
        profile: {
          id: userId || faculty.id,
          full_name: faculty.name || faculty.full_name || 'Faculty Member',
          email: faculty.email || userEmail || '',
          role: 'faculty',
          department: faculty.department || 'Computer Science'
        }
      };
    }

    // 3. Query moderators table
    let { data: moderator } = await supabaseAdmin
      .from('moderators')
      .select('*')
      .or(`id.eq.${userId || ''},email.eq.${userEmail || ''}`)
      .maybeSingle();

    if (moderator) {
      return {
        role: 'moderator',
        profile: {
          id: userId || moderator.id,
          full_name: moderator.name || moderator.full_name || 'Moderator',
          email: moderator.email || userEmail || '',
          role: 'moderator',
          department: 'Moderation'
        }
      };
    }

    // 4. Fallback role check
    const cleanFallback = (fallbackRole || '').toLowerCase();
    if (['admin', 'faculty', 'moderator', 'student'].includes(cleanFallback)) {
      return {
        role: cleanFallback,
        profile: {
          id: userId,
          email: userEmail || '',
          full_name: 'User',
          role: cleanFallback,
          department: 'Computer Science'
        }
      };
    }

    return { role: 'student', profile: null };
  }

  app.post('/api/chat/groups/create', async (req, res) => {
    try {
      const { name, description, department, batches, createdBy, creatorEmail, creatorRole, creatorName, type, courseId, message_retention, image_url, group_photo } = req.body;
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Supabase configuration missing' });
      }

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Group name is required.' });
      }

      if (!createdBy) {
        return res.status(400).json({ error: 'Creator ID is required.' });
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      // Verify creator's actual role
      const { role: userRole, profile: creatorProfile } = await resolveUserRoleAndProfile(supabaseAdmin, createdBy, creatorEmail, creatorRole);

      if (userRole === 'student') {
        return res.status(403).json({ error: 'Students are not permitted to create study groups. Only Admin, Moderator, and Faculty members can create groups.' });
      }

      if (!['admin', 'moderator', 'faculty'].includes(userRole)) {
        return res.status(403).json({ error: 'Permission denied: Invalid user role for creating study groups.' });
      }

      // Ensure creator profile is present in profiles table if createdBy is a valid UUID
      if (isValidUuid(createdBy)) {
        const resolvedName = creatorName || creatorProfile?.full_name || (userRole === 'admin' ? 'Admin' : userRole === 'faculty' ? 'Faculty Member' : 'Moderator');
        const resolvedEmail = creatorEmail || creatorProfile?.email || '';
        const resolvedDept = typeof department === 'string'
          ? (department.split(',')[0] || 'Computer Science').trim()
          : 'Computer Science';

        try {
          await supabaseAdmin.from('profiles').upsert([
            {
              id: createdBy,
              email: resolvedEmail,
              full_name: resolvedName,
              role: userRole,
              department: resolvedDept
            }
          ], { onConflict: 'id', ignoreDuplicates: true });
        } catch (err) {
          // ignore profile upsert error
        }
      }

      const photoUrl = image_url || group_photo || '';

      // Encode metadata into description JSON string to guarantee compatibility
      const metaDescription = JSON.stringify({
        description: description || '',
        department: department || '',
        batches: batches || [],
        type: type || 'study_group',
        message_retention: message_retention || '7_days',
        image_url: photoUrl,
        group_photo: photoUrl,
        created_by: createdBy,
        created_by_role: userRole
      });

      // Insert group (only valid schema columns: name, description, created_by, course_id)
      const insertObj: any = {
        name: name.trim(),
        description: metaDescription,
        created_by: createdBy
      };

      if (courseId) insertObj.course_id = courseId;

      const { data: group, error: groupErr } = await supabaseAdmin
        .from('study_groups')
        .insert([insertObj])
        .select()
        .single();

      if (groupErr) {
        console.error('Error inserting study group:', groupErr);
        return res.status(500).json({ error: `Failed to create group: ${groupErr.message || groupErr.details || 'Database insert error'}` });
      }

      // Find ALL matching students for auto-enrollment
      let studentIds: string[] = [];
      const { data: allProfiles } = await supabaseAdmin
        .from('profiles')
        .select('id, department, batch, role, academic_id');

      if (allProfiles && allProfiles.length > 0) {
        const deptList = typeof department === 'string'
          ? department.split(',').map(d => d.trim()).filter(Boolean)
          : (Array.isArray(department) ? department.map((d: any) => String(d).trim()).filter(Boolean) : []);

        const batchList = Array.isArray(batches)
          ? batches.map((b: any) => String(b).trim()).filter(Boolean)
          : [];

        const studentProfiles = allProfiles.filter(p => {
          const r = (p.role || '').toLowerCase();
          return r === 'student' || (!r && p.academic_id) || (!['admin', 'faculty', 'moderator'].includes(r));
        });

        studentIds = studentProfiles.filter(s => {
          const matchesDept = isDepartmentMatch(s.department || '', deptList);
          const matchesBatch = isBatchMatch(s.batch || '', batchList);
          return matchesDept && matchesBatch;
        }).map(s => s.id);
      }

      // Add creator as member
      const memberRows: any[] = [];
      if (createdBy && isValidUuid(createdBy)) {
        memberRows.push({
          group_id: group.id,
          user_id: createdBy
        });
      }

      // Add matching student members
      for (const sid of studentIds) {
        if (sid && isValidUuid(sid) && sid !== createdBy && !memberRows.some(m => m.user_id === sid)) {
          memberRows.push({
            group_id: group.id,
            user_id: sid
          });
        }
      }

      if (memberRows.length > 0) {
        const { error: memErr } = await supabaseAdmin
          .from('group_members')
          .upsert(memberRows, { onConflict: 'group_id,user_id' });

        if (memErr) {
          console.error('Error inserting group members:', memErr);
        }
      }

      return res.json({ success: true, group, addedStudentCount: studentIds.length });
    } catch (error: any) {
      console.error('Create Group Error:', error);
      return res.status(500).json({ error: error.message || 'An unexpected error occurred while creating group.' });
    }
  });

  app.post('/api/chat/groups/update', async (req, res) => {
    try {
      const { groupId, userId, name, description, department, batches, message_retention, image_url, group_photo } = req.body;
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Supabase configuration missing' });
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      // Fetch existing group to retain type, current retention, or photo if not passed
      const { data: existing } = await supabaseAdmin.from('study_groups').select('*').eq('id', groupId).single();
      if (!existing) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Check user permission
      if (userId) {
        const { role: userRole } = await resolveUserRoleAndProfile(supabaseAdmin, userId);

        if (userRole === 'faculty' && existing.created_by !== userId) {
          return res.status(403).json({ error: 'Permission denied: Faculty members can only update groups they personally created.' });
        }
      }

      let prevType = 'study_group';
      let prevRetention = '7_days';
      let prevPhoto = '';
      if (existing?.description && existing.description.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(existing.description);
          if (parsed.type) prevType = parsed.type;
          if (parsed.message_retention) prevRetention = parsed.message_retention;
          if (parsed.image_url) prevPhoto = parsed.image_url;
          if (parsed.group_photo) prevPhoto = parsed.group_photo;
        } catch(e) {}
      }

      const photoUrl = image_url !== undefined ? image_url : (group_photo !== undefined ? group_photo : prevPhoto);

      const metaDescription = JSON.stringify({
        description: description || '',
        department: department || '',
        batches: batches || [],
        type: prevType,
        message_retention: message_retention || prevRetention,
        image_url: photoUrl,
        group_photo: photoUrl
      });

      const { data: group, error: groupErr } = await supabaseAdmin
        .from('study_groups')
        .update({
          name: name.trim(),
          description: metaDescription
        })
        .eq('id', groupId)
        .select()
        .single();

      if (groupErr) throw groupErr;

      // Sync members for target department & batches
      if (batches && batches.length > 0) {
        const { data: allProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id, department, batch, role, academic_id');

        if (allProfiles && allProfiles.length > 0) {
          const deptList = typeof department === 'string'
            ? department.split(',').map(d => d.trim()).filter(Boolean)
            : (Array.isArray(department) ? department.map((d: any) => String(d).trim()).filter(Boolean) : []);

          const batchList = Array.isArray(batches)
            ? batches.map((b: any) => String(b).trim()).filter(Boolean)
            : [];

          const studentProfiles = allProfiles.filter(p => {
            const r = (p.role || '').toLowerCase();
            return r === 'student' || (!r && p.academic_id) || (!['admin', 'faculty', 'moderator'].includes(r));
          });

          const matchingStudents = studentProfiles.filter(s => {
            const matchesDept = isDepartmentMatch(s.department || '', deptList);
            const matchesBatch = isBatchMatch(s.batch || '', batchList);
            return matchesDept && matchesBatch;
          });

          if (matchingStudents.length > 0) {
            const memberRows = matchingStudents
              .filter(s => s.id && isValidUuid(s.id))
              .map(s => ({
                group_id: groupId,
                user_id: s.id
              }));

            if (memberRows.length > 0) {
              const { error: memErr } = await supabaseAdmin
                .from('group_members')
                .upsert(memberRows, { onConflict: 'group_id,user_id' });

              if (memErr) {
                console.error('Error updating group members:', memErr);
              }
            }
          }
        }
      }

      // Trigger message retention cleanup immediately
      runMessageRetentionCleanup();

      res.json({ success: true, group });
    } catch (error: any) {
      console.error('Update Group Error:', error);
      res.status(500).json({ error: error.message || 'Failed to update group' });
    }
  });

  // Update Group Photo Endpoint (Admin, Moderator, Faculty ONLY - Not student)
  app.post('/api/chat/groups/update-photo', async (req, res) => {
    try {
      const { groupId, userId, image_url, group_photo } = req.body;
      const photoUrl = image_url || group_photo || '';

      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Supabase configuration missing' });
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      // Verify user permissions
      let userRole = '';
      if (userId === 'd3e89a79-18c7-4966-bcec-a108f305529c') {
        userRole = 'admin';
      } else {
        const { data: userProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', userId).maybeSingle();
        userRole = (userProfile?.role || '').toLowerCase();
      }

      const { data: group } = await supabaseAdmin.from('study_groups').select('*').eq('id', groupId).single();
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const isAllowed = userRole === 'admin' || userRole === 'moderator' || (userRole === 'faculty' && group.created_by === userId);
      if (!isAllowed) {
        return res.status(403).json({ error: 'Permission denied: Faculty members can only change group photos for study groups they created.' });
      }

      let parsedMeta: any = {};
      if (group.description && group.description.trim().startsWith('{')) {
        try {
          parsedMeta = JSON.parse(group.description);
        } catch(e) {}
      } else {
        parsedMeta = { description: group.description || '' };
      }

      parsedMeta.image_url = photoUrl;
      parsedMeta.group_photo = photoUrl;
      const updatedMetaStr = JSON.stringify(parsedMeta);

      const { data: updatedGroup, error: updateErr } = await supabaseAdmin
        .from('study_groups')
        .update({ description: updatedMetaStr })
        .eq('id', groupId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      res.json({ success: true, group: updatedGroup });
    } catch (error: any) {
      console.error('Update Group Photo Error:', error);
      res.status(500).json({ error: error.message || 'Failed to update group photo' });
    }
  });

  // Update Retention Settings Endpoint
  app.post('/api/chat/groups/update-retention', async (req, res) => {
    try {
      const { groupId, userId, message_retention } = req.body;
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Supabase configuration missing' });
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      // Verify user permissions
      const { data: userProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', userId).maybeSingle();
      const userRole = (userProfile?.role || '').toLowerCase();

      const { data: group } = await supabaseAdmin.from('study_groups').select('*').eq('id', groupId).single();
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const isAdmin = userRole === 'admin';
      const isOwnerFaculty = userRole === 'faculty' && group.created_by === userId;

      if (!isAdmin && !isOwnerFaculty) {
        return res.status(403).json({ error: 'Only group owner or admin can update retention settings' });
      }

      let parsedMeta: any = {};
      if (group.description && group.description.trim().startsWith('{')) {
        try {
          parsedMeta = JSON.parse(group.description);
        } catch(e) {}
      } else {
        parsedMeta = { description: group.description || '' };
      }

      parsedMeta.message_retention = message_retention;
      const updatedMetaStr = JSON.stringify(parsedMeta);

      const { data: updatedGroup, error: updateErr } = await supabaseAdmin
        .from('study_groups')
        .update({ description: updatedMetaStr })
        .eq('id', groupId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Trigger immediate message retention cleanup
      runMessageRetentionCleanup();

      res.json({ success: true, group: updatedGroup });
    } catch (error: any) {
      console.error('Update Retention Error:', error);
      res.status(500).json({ error: error.message || 'Failed to update retention setting' });
    }
  });

  // Delete Group Endpoint (supports POST /api/chat/groups/delete and DELETE /api/chat/groups/delete or /api/chat/groups/:groupId)
  const handleDeleteGroup = async (req: express.Request, res: express.Response) => {
    try {
      const body = req.body || {};
      const targetGroupId = body.groupId || req.params.groupId;
      const userId = body.userId;
      const userEmail = body.userEmail;
      const clientRole = body.userRole;

      if (!targetGroupId) {
        return res.status(400).json({ success: false, error: 'Group ID is required' });
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ success: false, error: 'Supabase configuration missing' });
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      // Verify user role against profiles, faculties, and moderators tables
      const { role: resolvedRole } = await resolveUserRoleAndProfile(supabaseAdmin, userId, userEmail, clientRole);
      const userRole = (resolvedRole || '').toLowerCase();

      const isAdmin = userRole === 'admin';
      const isModerator = userRole === 'moderator';
      const isFaculty = userRole === 'faculty';

      if (!isAdmin && !isModerator && !isFaculty) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied. Student accounts cannot delete study groups.'
        });
      }

      // Fetch group to verify existence
      const { data: group } = await supabaseAdmin.from('study_groups').select('id').eq('id', targetGroupId).maybeSingle();
      if (!group) {
        // Group is already deleted
        return res.json({ success: true, groupId: targetGroupId, message: 'Group already deleted or does not exist' });
      }

      // Safe deletion sequence to clean up related records
      await supabaseAdmin.from('messages').delete().eq('group_id', targetGroupId);
      await supabaseAdmin.from('group_members').delete().eq('group_id', targetGroupId);
      await supabaseAdmin.from('materials').delete().eq('group_id', targetGroupId);

      const { error: delErr } = await supabaseAdmin.from('study_groups').delete().eq('id', targetGroupId);

      if (delErr) {
        console.error('Supabase group deletion error:', delErr);
        throw delErr;
      }

      return res.json({ success: true, groupId: targetGroupId });
    } catch (error: any) {
      console.error('Delete Group Endpoint Error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to delete study group' });
    }
  };

  app.post('/api/chat/groups/delete', handleDeleteGroup);
  app.delete('/api/chat/groups/delete', handleDeleteGroup);
  app.delete('/api/chat/groups/:groupId', handleDeleteGroup);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
