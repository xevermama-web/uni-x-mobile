import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface CourseMaterial {
  id: string;
  title: string;
  description: string;
  department: string;
  batch: string;
  course: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_by_name?: string;
  created_at: string;
  group_id?: string;
  file_data?: string;
  url?: string;
}

export function useMaterials(
  groupIdOrDept?: string,
  batchFilter?: string,
  courseFilter?: string,
  options?: { isGroup?: boolean }
) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Explicit check for group context
  const isGroupId = options?.isGroup ?? Boolean(
    groupIdOrDept &&
    groupIdOrDept !== 'ALL' &&
    (
      groupIdOrDept.includes('-') ||
      groupIdOrDept.startsWith('group') ||
      groupIdOrDept.startsWith('sg') ||
      groupIdOrDept.length > 15
    )
  );

  const fetchMaterials = async () => {
    if (!groupIdOrDept) {
      setMaterials([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const parsedList: CourseMaterial[] = data.map((item: any) => {
          let meta: any = {};
          if (item.file_url) {
            try {
              meta = JSON.parse(item.file_url);
            } catch (e) {
              meta = { url: item.file_url };
            }
          }

          return {
            id: item.id,
            title: item.title || 'Course Material',
            description: meta.description || '',
            department: meta.department || 'General',
            batch: meta.batch || 'All',
            course: meta.course || 'General',
            file_path: meta.file_path || '',
            file_type: meta.file_type || 'application/pdf',
            file_size: meta.file_size || 0,
            uploaded_by: meta.uploaded_by_name || item.uploaded_by || 'Member',
            created_at: item.created_at,
            group_id: meta.group_id || undefined,
            file_data: meta.file_data || meta.url || undefined,
            url: meta.url || undefined
          };
        });

        let filtered = parsedList;

        if (isGroupId) {
          filtered = parsedList.filter(m => m.group_id === groupIdOrDept);
        } else if (groupIdOrDept && groupIdOrDept !== 'ALL') {
          filtered = parsedList.filter(m =>
            !m.group_id && (m.department === groupIdOrDept || groupIdOrDept === 'ALL')
          );
        } else {
          filtered = parsedList.filter(m => !m.group_id);
        }

        if (batchFilter) {
          filtered = filtered.filter(m => m.batch === batchFilter || m.batch === 'All');
        }
        if (courseFilter) {
          filtered = filtered.filter(m => m.course === courseFilter);
        }

        setMaterials(filtered);
      } else {
        setMaterials([]);
      }
    } catch (err) {
      console.error('Error fetching materials from database:', err);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();

    // Realtime Postgres Subscription to synchronize across devices/accounts instantly
    const channel = supabase
      .channel(`materials_sync_${groupIdOrDept || 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => {
        fetchMaterials();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupIdOrDept, batchFilter, courseFilter, isGroupId]);

  const addMaterial = async (
    materialData: Omit<CourseMaterial, 'id' | 'created_at' | 'file_path'>,
    file?: File | null
  ) => {
    let fileBase64: string | undefined = undefined;
    if (file) {
      try {
        fileBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      } catch (e) {}
    }

    const assignedGroupId = materialData.group_id || (isGroupId ? groupIdOrDept : undefined);

    const payload = {
      fileBase64: fileBase64 || null,
      fileName: file ? file.name : 'material.pdf',
      fileType: materialData.file_type || (file ? file.type : 'application/pdf'),
      title: materialData.title,
      description: materialData.description || '',
      department: materialData.department || 'General',
      batch: materialData.batch || 'All',
      course: materialData.course || 'General',
      uploadedBy: materialData.uploaded_by || 'Uploader',
      groupId: assignedGroupId || null
    };

    try {
      const res = await fetch('/api/materials/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let json: any = {};
      try {
        json = await res.json();
      } catch (e) {
        json = { error: 'Invalid response from server' };
      }

      if (!res.ok || json.error) {
        // Client-side fallback insert if backend upload endpoint encountered an issue
        if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
          try {
            const includeBase64 = fileBase64 && fileBase64.length < 300000;
            const metaObj = {
              url: '',
              group_id: assignedGroupId || null,
              description: materialData.description || '',
              department: materialData.department || 'General',
              course: materialData.course || 'General',
              batch: materialData.batch || 'All',
              file_type: materialData.file_type || (file ? file.type : 'application/pdf'),
              file_size: file ? file.size : 0,
              file_path: file ? `materials/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}` : '',
              uploaded_by_name: materialData.uploaded_by || 'Uploader',
              file_data: includeBase64 ? fileBase64 : null
            };

            const { data: dbData, error: dbErr } = await supabase
              .from('materials')
              .insert([{
                title: materialData.title,
                file_url: JSON.stringify(metaObj)
              }])
              .select()
              .single();

            if (!dbErr && dbData) {
              await fetchMaterials();
              window.dispatchEvent(new Event('unixx_notifications_updated'));
              return { data: dbData, error: null };
            }
          } catch (e) {}
        }

        throw new Error(json.error || 'Failed to upload material');
      }

      await fetchMaterials();
      window.dispatchEvent(new Event('unixx_notifications_updated'));
      return { data: json.data, error: null };
    } catch (err: any) {
      console.error('Upload Error:', err);
      return { data: null, error: err.message || 'Upload failed' };
    }
  };

  const editMaterial = async (id: string, updates: Partial<CourseMaterial>) => {
    try {
      const res = await fetch('/api/materials/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to edit material');
      }

      await fetchMaterials();
      window.dispatchEvent(new Event('unixx_notifications_updated'));
      return { data: json.data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Edit failed' };
    }
  };

  const deleteMaterial = async (id: string, filePath: string) => {
    try {
      const res = await fetch('/api/materials/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, filePath })
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to delete material');
      }

      await fetchMaterials();
      window.dispatchEvent(new Event('unixx_notifications_updated'));
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Delete failed' };
    }
  };

  const getPublicUrl = (filePath: string) => {
    if (!filePath) return '#';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
    const { data } = supabase.storage.from('materials').getPublicUrl(filePath);
    return data?.publicUrl || '#';
  };

  return { materials, loading, addMaterial, editMaterial, deleteMaterial, fetchMaterials, getPublicUrl };
}
