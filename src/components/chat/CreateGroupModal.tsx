import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Check, Loader2, Building2, GraduationCap, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { GroupFormData, ChatGroup } from '../../types/chat';
import { useDepartments } from '../../hooks/useDepartments';
import { supabase } from '../../lib/supabase';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GroupFormData) => Promise<boolean | { success: boolean; error?: string } | any>;
  initialData?: ChatGroup | null;
  mode?: 'create' | 'edit';
}

interface DeptBatchInfo {
  batch: string;
  count: number;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = 'create'
}) => {
  const { departments: hookDepartments } = useDepartments();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedBatchesByDept, setSelectedBatchesByDept] = useState<Record<string, string[]>>({});
  const [type, setType] = useState<'study_group' | 'course_group'>('study_group');
  const [messageRetention, setMessageRetention] = useState<'7_days' | '1_month' | '6_months'>('7_days');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingBatches, setFetchingBatches] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time batch map: deptName -> DeptBatchInfo[]
  const [realtimeDeptBatches, setRealtimeDeptBatches] = useState<Record<string, DeptBatchInfo[]>>({});

  // Compute unified list of real department names only
  const allDepartmentNames = useMemo(() => {
    const namesSet = new Set<string>();

    hookDepartments.forEach(d => {
      if (d.name) namesSet.add(d.name);
    });

    Object.keys(realtimeDeptBatches).forEach(deptKey => {
      if (deptKey && deptKey !== 'N/A' && deptKey !== 'Unknown' && deptKey !== 'Unassigned') {
        namesSet.add(deptKey);
      }
    });

    return Array.from(namesSet).sort();
  }, [hookDepartments, realtimeDeptBatches]);

  // Fetch real-time student batches grouped by department
  const fetchRealtimeDeptBatches = useCallback(async () => {
    setFetchingBatches(true);
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        // Fallback to local storage student profiles
        const stored = localStorage.getItem('unixx_students');
        const deptMap: Record<string, Record<string, number>> = {};

        if (stored) {
          const students = JSON.parse(stored);
          students.forEach((s: any) => {
            const dept = s.department;
            const batch = String(s.batch || '').trim();
            if (dept && batch) {
              if (!deptMap[dept]) deptMap[dept] = {};
              deptMap[dept][batch] = (deptMap[dept][batch] || 0) + 1;
            }
          });
        }

        const formatted: Record<string, DeptBatchInfo[]> = {};
        Object.entries(deptMap).forEach(([dept, batchCounts]) => {
          formatted[dept] = Object.entries(batchCounts).map(([batch, count]) => ({ batch, count }));
        });

        setRealtimeDeptBatches(formatted);
        setFetchingBatches(false);
        return;
      }

      // Supabase query to get student profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('department, batch')
        .eq('role', 'student');

      if (error) throw error;

      if (data) {
        const deptMap: Record<string, Record<string, number>> = {};
        data.forEach((p: any) => {
          const dept = p.department;
          const batch = String(p.batch || '').trim();
          if (dept && batch) {
            if (!deptMap[dept]) deptMap[dept] = {};
            deptMap[dept][batch] = (deptMap[dept][batch] || 0) + 1;
          }
        });

        const formatted: Record<string, DeptBatchInfo[]> = {};
        Object.entries(deptMap).forEach(([dept, batchCounts]) => {
          formatted[dept] = Object.entries(batchCounts).map(([batch, count]) => ({ batch, count }));
        });

        setRealtimeDeptBatches(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch realtime student batches:', err);
    } finally {
      setFetchingBatches(false);
    }
  }, []);

  // Set up real-time subscription for student profiles to update batches dynamically
  useEffect(() => {
    if (!isOpen) return;

    fetchRealtimeDeptBatches();

    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      return;
    }

    const channel = supabase
      .channel('realtime-group-modal-batches')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchRealtimeDeptBatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, fetchRealtimeDeptBatches]);

  // Populate or reset form state when modal opens/initialData changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialData && mode === 'edit') {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setType(initialData.type || 'study_group');
      setMessageRetention(initialData.message_retention || '7_days');
      setImageUrl(initialData.image_url || initialData.group_photo || '');

      // Parse multi-department string
      const rawDeptStr = initialData.department || '';
      const depts = rawDeptStr
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);
      const selectedDepts = depts.length > 0 ? depts : (allDepartmentNames[0] ? [allDepartmentNames[0]] : []);
      setSelectedDepartments(selectedDepts);

      // Distribute batches
      const initialBatches = initialData.batches || [];
      const newBatchesByDept: Record<string, string[]> = {};
      selectedDepts.forEach(dept => {
        newBatchesByDept[dept] = [...initialBatches];
      });
      setSelectedBatchesByDept(newBatchesByDept);
    } else {
      setName('');
      setDescription('');
      setImageUrl('');
      const defaultDept = allDepartmentNames[0] || hookDepartments[0]?.name;
      if (defaultDept) {
        setSelectedDepartments([defaultDept]);
        const existingBatches = realtimeDeptBatches[defaultDept]?.map(b => b.batch) || [];
        setSelectedBatchesByDept({
          [defaultDept]: existingBatches
        });
      } else {
        setSelectedDepartments([]);
        setSelectedBatchesByDept({});
      }
      setType('study_group');
      setMessageRetention('7_days');
    }
    setError(null);
  }, [initialData, mode, isOpen, hookDepartments, allDepartmentNames]);

  // Toggle department selection
  const toggleDepartment = (deptName: string) => {
    setSelectedDepartments(prev => {
      if (prev.includes(deptName)) {
        // Deselecting department
        const updated = prev.filter(d => d !== deptName);
        return updated;
      } else {
        // Selecting department
        const updated = [...prev, deptName];
        // Initialize existing real-time batches for this department if not set
        setSelectedBatchesByDept(prevBatches => {
          if (!prevBatches[deptName] || prevBatches[deptName].length === 0) {
            const existingForDept = realtimeDeptBatches[deptName]?.map(b => b.batch) || [];
            return { ...prevBatches, [deptName]: existingForDept };
          }
          return prevBatches;
        });
        return updated;
      }
    });
  };

  // Toggle all departments
  const toggleAllDepartments = () => {
    if (selectedDepartments.length === allDepartmentNames.length) {
      // Clear all except first if exists
      setSelectedDepartments(allDepartmentNames[0] ? [allDepartmentNames[0]] : []);
    } else {
      // Select all
      setSelectedDepartments([...allDepartmentNames]);
      // Initialize batches for all departments
      const updatedBatches = { ...selectedBatchesByDept };
      allDepartmentNames.forEach(deptName => {
        if (!updatedBatches[deptName] || updatedBatches[deptName].length === 0) {
          const existingForDept = realtimeDeptBatches[deptName]?.map(b => b.batch) || [];
          updatedBatches[deptName] = existingForDept;
        }
      });
      setSelectedBatchesByDept(updatedBatches);
    }
  };

  // Toggle batch selection under a specific department
  const toggleBatchForDept = (deptName: string, batch: string) => {
    setSelectedBatchesByDept(prev => {
      const currentList = prev[deptName] || [];
      const isSelected = currentList.includes(batch);
      const updatedList = isSelected
        ? currentList.filter(b => b !== batch)
        : [...currentList, batch];

      return {
        ...prev,
        [deptName]: updatedList
      };
    });
  };

  // Select/Deselect all batches for a specific department
  const toggleAllBatchesForDept = (deptName: string, availableBatches: string[]) => {
    setSelectedBatchesByDept(prev => {
      const currentList = prev[deptName] || [];
      if (currentList.length === availableBatches.length) {
        // Clear batches for this dept
        return { ...prev, [deptName]: [] };
      } else {
        // Select all available batches for this dept
        return { ...prev, [deptName]: [...availableBatches] };
      }
    });
  };

  // Total flat list of selected batches across all selected departments
  const allSelectedBatches = useMemo(() => {
    const batchSet = new Set<string>();
    selectedDepartments.forEach(dept => {
      const deptBatches = selectedBatchesByDept[dept] || [];
      deptBatches.forEach(b => batchSet.add(b));
    });
    return Array.from(batchSet);
  }, [selectedDepartments, selectedBatchesByDept]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a group name.');
      return;
    }

    if (selectedDepartments.length === 0) {
      setError('Please select at least one target department.');
      return;
    }

    if (type === 'study_group' && allSelectedBatches.length === 0) {
      setError('Please select at least one batch for the study group.');
      return;
    }

    setLoading(true);
    setError(null);

    const deptString = selectedDepartments.join(', ');

    const res = await onSubmit({
      name: name.trim(),
      description: description.trim(),
      department: deptString,
      batches: allSelectedBatches,
      type,
      message_retention: messageRetention,
      image_url: imageUrl.trim(),
      group_photo: imageUrl.trim()
    });

    setLoading(false);
    const isSuccess = typeof res === 'boolean' ? res : Boolean(res && (res as any).success);
    if (isSuccess) {
      onClose();
    } else {
      const errMsg = (typeof res === 'object' && res && (res as any).error) ? (res as any).error : 'Failed to save group. Please try again.';
      setError(errMsg);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-xl w-full overflow-hidden"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  {mode === 'edit' ? 'Edit Group Settings' : 'Create New Study Group'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select departments and real-time student batches for this channel
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-medium flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            {/* Group Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Group Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., CS & EEE Joint Discussion Group"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Briefly describe the purpose of this study group..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none"
              />
            </div>

            {/* Group Photo URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Group Photo URL (Optional)
                </label>
                <span className="text-[10px] text-slate-400 font-medium italic">
                  Only Admin, Moderator & Faculty
                </span>
              </div>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://example.com/group-photo.png"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium"
              />
              {imageUrl.trim() && (
                <div className="mt-2 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/70 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                  <img src={imageUrl.trim()} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Photo Preview</span>
                </div>
              )}
            </div>

            {/* TARGET DEPARTMENTS (Multi-Select) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Target Department(s) *
                  </label>
                </div>
                {allDepartmentNames.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAllDepartments}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1"
                  >
                    {selectedDepartments.length === allDepartmentNames.length ? (
                      <>
                        <Square className="w-3 h-3" /> Clear Selection
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-3 h-3" /> Select All ({allDepartmentNames.length})
                      </>
                    )}
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose one or multiple departments for this study group.
              </p>

              {allDepartmentNames.length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 italic text-center">
                  No existing departments found in system.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {allDepartmentNames.map(deptName => {
                    const isSelected = selectedDepartments.includes(deptName);
                    const existingBatchesCount = realtimeDeptBatches[deptName]?.length || 0;

                    return (
                      <button
                        key={deptName}
                        type="button"
                        onClick={() => toggleDepartment(deptName)}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-medium text-left transition-all flex items-center justify-between gap-2 border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className={`p-1 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">{deptName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {existingBatchesCount > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300'
                            }`}>
                              {existingBatchesCount} batch{existingBatchesCount > 1 ? 'es' : ''}
                            </span>
                          )}
                          {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* REAL-TIME BATCHES UNDER DEPARTMENTS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Target Student Batches by Department *
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchRealtimeDeptBatches}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                    title="Refresh real-time student batches"
                  >
                    <RefreshCw className={`w-3 h-3 ${fetchingBatches ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh Batches</span>
                  </button>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                    {allSelectedBatches.length} batch(es) selected
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                All students in the selected batches will be automatically enrolled as members of this group.
              </p>

              {selectedDepartments.length === 0 ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 rounded-xl text-xs font-medium text-center">
                  Please select at least one department above to view and choose student batches.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDepartments.map(deptName => {
                    const realBatchesForDept = realtimeDeptBatches[deptName] || [];
                    const realBatchNames = realBatchesForDept
                      .map(b => b.batch)
                      .sort((a, b) => {
                        const numA = parseInt(a, 10) || 0;
                        const numB = parseInt(b, 10) || 0;
                        return numA - numB;
                      });

                    const selectedForThisDept = selectedBatchesByDept[deptName] || [];
                    const isAllSelectedForThisDept = realBatchNames.length > 0 && selectedForThisDept.length === realBatchNames.length;

                    return (
                      <div key={deptName} className="p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{deptName}</span>
                            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              {realBatchesForDept.length} Live Batch{realBatchesForDept.length !== 1 ? 'es' : ''}
                            </span>
                          </div>
                          {realBatchNames.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleAllBatchesForDept(deptName, realBatchNames)}
                              className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                            >
                              {isAllSelectedForThisDept ? 'Clear Dept Batches' : 'Select All Dept Batches'}
                            </button>
                          )}
                        </div>

                        {/* Batch Pills */}
                        {realBatchNames.length === 0 ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic py-1">
                            No live student batches found for this department.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {realBatchNames.map(batchName => {
                              const isSelected = selectedForThisDept.includes(batchName);
                              const realMatch = realBatchesForDept.find(b => b.batch === batchName);
                              const studentCount = realMatch ? realMatch.count : 0;

                              return (
                                <button
                                  key={`${deptName}-${batchName}`}
                                  type="button"
                                  onClick={() => toggleBatchForDept(deptName, batchName)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                                  <span>Batch {batchName}</span>
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                                  }`}>
                                    {studentCount} student{studentCount !== 1 ? 's' : ''}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Message Disappearing / Retention */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Message Disappearing / Retention Setting
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Messages older than this period will be automatically deleted from the group.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '7_days', label: '7 Days' },
                  { id: '1_month', label: '1 Month' },
                  { id: '6_months', label: '6 Months' }
                ].map(opt => {
                  const isSelected = messageRetention === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMessageRetention(opt.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Group...</span>
                  </>
                ) : (
                  <span>{mode === 'edit' ? 'Update Group' : 'Create Group'}</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
