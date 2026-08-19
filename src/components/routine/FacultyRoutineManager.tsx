import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Trash2, Edit2, Calendar, Clock, Building, BookOpen, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { useRoutines, Routine } from '../../hooks/useRoutines';
import { useDepartments } from '../../hooks/useDepartments';
import { useBatches } from '../../hooks/useBatches';
import { getDhakaCurrentMinutes, getDhakaDayOfWeek, getClassStatus } from '../../utils/routineTime';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_SLOTS = [
  { label: '09:00 AM - 10:00 AM', start: '09:00 AM', end: '10:00 AM' },
  { label: '10:00 AM - 11:00 AM', start: '10:00 AM', end: '11:00 AM' },
  { label: '11:00 AM - 12:00 PM', start: '11:00 AM', end: '12:00 PM' },
  { label: '12:00 PM - 01:00 PM', start: '12:00 PM', end: '01:00 PM' },
  { label: '01:00 PM - 02:00 PM', start: '01:00 PM', end: '02:00 PM' },
  { label: '02:00 PM - 03:00 PM', start: '02:00 PM', end: '03:00 PM' },
  { label: '03:00 PM - 04:00 PM', start: '03:00 PM', end: '04:00 PM' },
  { label: '04:00 PM - 05:00 PM', start: '04:00 PM', end: '05:00 PM' },
];

interface FacultyRoutineManagerProps {
  facultyUser?: any;
}

export default function FacultyRoutineManager({ facultyUser }: FacultyRoutineManagerProps) {
  const { routines, loading: routinesLoading, addRoutine, updateRoutine, removeRoutine, fetchRoutines } = useRoutines();
  const { departments, loading: deptsLoading } = useDepartments();

  // Get faculty name from prop or local session
  const currentFaculty = useMemo(() => {
    if (facultyUser?.name) return facultyUser;
    try {
      const facStr = localStorage.getItem('unixx_faculty_session');
      if (facStr) return JSON.parse(facStr);
    } catch {}
    return { name: 'Faculty Member', department: '' };
  }, [facultyUser]);

  const [currentDhakaMinutes, setCurrentDhakaMinutes] = useState(() => getDhakaCurrentMinutes());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDhakaMinutes(getDhakaCurrentMinutes());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const dhakaToday = getDhakaDayOfWeek();

  // Filter routines belonging to this faculty
  const myRoutines = useMemo(() => {
    if (!currentFaculty?.name) return [];
    const facNameClean = currentFaculty.name.trim().toLowerCase();
    return routines.filter(r => 
      r.facultyName && r.facultyName.trim().toLowerCase().includes(facNameClean)
    );
  }, [routines, currentFaculty]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Routine, 'id'>>({
    departmentId: '',
    batch: '',
    dayOfWeek: 'Sunday',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    course: '',
    facultyName: currentFaculty?.name || 'Faculty Member',
    room: ''
  });

  // Keep facultyName updated
  useEffect(() => {
    if (currentFaculty?.name) {
      setFormData(prev => ({ ...prev, facultyName: currentFaculty.name }));
    }
  }, [currentFaculty]);

  const selectedDeptName = useMemo(() => 
    departments.find(d => d.id === formData.departmentId)?.name, 
    [departments, formData.departmentId]
  );
  
  const { batches: formBatches, loading: formBatchesLoading } = useBatches(selectedDeptName);

  // Set default department if not set
  useEffect(() => {
    if (departments.length > 0 && !formData.departmentId) {
      setFormData(prev => ({ ...prev, departmentId: departments[0].id }));
    }
  }, [departments]);

  const handleCellClick = (day: string, slot: typeof TIME_SLOTS[0]) => {
    // Check if there is an existing class for this faculty on this day & time slot
    const existing = myRoutines.find(r => 
      r.dayOfWeek.toLowerCase() === day.toLowerCase() &&
      (
        r.startTime.replace(/^0/, '').toLowerCase() === slot.start.replace(/^0/, '').toLowerCase() ||
        r.startTime.toLowerCase().includes(slot.start.substring(0, 5).toLowerCase())
      )
    );

    if (existing) {
      setEditingRoutineId(existing.id);
      setFormData({
        departmentId: existing.departmentId,
        batch: existing.batch,
        dayOfWeek: existing.dayOfWeek,
        startTime: existing.startTime,
        endTime: existing.endTime,
        course: existing.course,
        facultyName: existing.facultyName || currentFaculty?.name || 'Faculty Member',
        room: existing.room,
        isPublished: existing.isPublished
      });
    } else {
      setEditingRoutineId(null);
      setFormData({
        departmentId: formData.departmentId || (departments[0]?.id || ''),
        batch: formBatches[0] || 'Batch 15 - Sec A',
        dayOfWeek: day,
        startTime: slot.start,
        endTime: slot.end,
        course: '',
        facultyName: currentFaculty?.name || 'Faculty Member',
        room: ''
      });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentId || !formData.course) {
      setError("Please fill in all required fields (Department, Course Name, Batch).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let err;
    if (editingRoutineId) {
      const res = await updateRoutine(editingRoutineId, formData);
      err = res.error;
    } else {
      const res = await addRoutine(formData);
      err = res.error;
    }

    setIsSubmitting(false);
    if (!err) {
      setIsModalOpen(false);
    } else {
      setError(err.message || "Failed to save class routine.");
    }
  };

  const handleDelete = async () => {
    if (!routineToDelete) return;
    setIsSubmitting(true);
    const { error } = await removeRoutine(routineToDelete) as { error: any };
    setIsSubmitting(false);

    if (error) {
      setError(error.message || "Failed to delete routine.");
    } else {
      setRoutineToDelete(null);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-4 sm:p-6 lg:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-white/20">
              <Calendar className="w-3.5 h-3.5 text-cyan-300" />
              Faculty Personal Class Schedule
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Faculty Weekly Routine Matrix
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-2xl">
              Add, edit, or remove your individual class routines. Click on any cell in the weekly table matrix below to manage classes.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingRoutineId(null);
              setFormData({
                departmentId: departments[0]?.id || '',
                batch: 'Batch 15 - Sec A',
                dayOfWeek: 'Sunday',
                startTime: '09:00 AM',
                endTime: '10:00 AM',
                course: '',
                facultyName: currentFaculty?.name || 'Faculty Member',
                room: ''
              });
              setError(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-white text-blue-800 font-bold px-5 py-3 rounded-2xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5 text-blue-700" />
            Add Individual Class
          </button>
        </div>
      </div>

      {/* Routine Grid Table */}
      {routinesLoading || deptsLoading ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading your faculty routine matrix...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[900px]">
              {/* First Row: Day Names */}
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-4 px-4 font-extrabold text-center border-r border-slate-200 dark:border-slate-700 w-44 sticky left-0 bg-slate-200 dark:bg-slate-800 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-center gap-2 text-slate-800 dark:text-slate-100">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Time / Day</span>
                    </div>
                  </th>
                  {DAYS.map(day => {
                    const isToday = day === dhakaToday;
                    return (
                      <th 
                        key={day} 
                        className={`py-4 px-3 font-extrabold text-center border-r border-slate-200 dark:border-slate-700 min-w-[140px] ${
                          isToday 
                            ? 'bg-blue-600 text-white shadow-inner' 
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-sm tracking-wide">{day}</span>
                          {isToday && (
                            <span className="text-[10px] bg-white/20 text-white font-semibold px-2 py-0.5 rounded-full mt-0.5 uppercase tracking-wider">
                              Today
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Table Body: First Column is Time */}
              <tbody>
                {TIME_SLOTS.map((slot, rowIndex) => (
                  <tr 
                    key={slot.label} 
                    className={`transition-colors ${
                      rowIndex % 2 === 0 
                        ? 'bg-white dark:bg-slate-900' 
                        : 'bg-slate-50/50 dark:bg-slate-850/40'
                    } hover:bg-blue-50/30 dark:hover:bg-slate-800/40`}
                  >
                    {/* First Column: Time Slot */}
                    <td className="py-4 px-3 font-bold text-center border-r border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      <span className="block text-xs font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/50">
                        {slot.label}
                      </span>
                    </td>

                    {/* Columns for each Day */}
                    {DAYS.map(day => {
                      // Match class routine for this faculty on this day & start time
                      const routine = myRoutines.find(r => 
                        r.dayOfWeek.toLowerCase() === day.toLowerCase() &&
                        (
                          r.startTime.replace(/^0/, '').toLowerCase() === slot.start.replace(/^0/, '').toLowerCase() ||
                          r.startTime.toLowerCase().includes(slot.start.substring(0, 5).toLowerCase())
                        )
                      );

                      const isToday = day === dhakaToday;
                      const status = (routine && isToday)
                        ? getClassStatus(routine.startTime, routine.endTime || slot.end, currentDhakaMinutes)
                        : null;

                      const deptObj = departments.find(d => d.id === routine?.departmentId);

                      return (
                        <td 
                          key={`${day}-${slot.label}`}
                          onClick={() => handleCellClick(day, slot)}
                          className={`p-2 border-r border-b border-slate-200 dark:border-slate-800 align-top cursor-pointer transition-all relative group h-28 ${
                            status === 'ONGOING'
                              ? 'bg-emerald-500/10 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-500/20'
                              : routine
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100/80 dark:hover:bg-blue-900/60 border-blue-100 dark:border-blue-900/40'
                              : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          {routine ? (
                            <div className="h-full w-full flex flex-col justify-between p-2 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs group-hover:shadow-md transition-all relative">
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-md truncate max-w-[100px]">
                                    {deptObj?.name || 'CSE'} • {routine.batch}
                                  </span>
                                  {status && (
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                      status === 'ONGOING' ? 'bg-emerald-600 text-white animate-pulse' :
                                      status === 'UPCOMING' ? 'bg-indigo-600 text-white' :
                                      'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}>
                                      {status}
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs leading-snug line-clamp-2">
                                  {routine.course}
                                </h4>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 mt-1">
                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                  🏢 {routine.room}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCellClick(day, slot);
                                    }}
                                    className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50 rounded-lg"
                                    title="Edit Class"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRoutineToDelete(routine.id);
                                    }}
                                    className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-900/50 rounded-lg"
                                    title="Delete Class"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-semibold flex items-center gap-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 shadow-xs">
                                <Plus className="w-3.5 h-3.5" /> Add Class
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl p-4 sm:p-6 lg:p-8 max-h-[85dvh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {editingRoutineId ? 'Edit Faculty Class' : 'Add Faculty Class Routine'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure individual course class schedule in your routine table.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {editingRoutineId && (
                    <button 
                      type="button" 
                      onClick={() => setRoutineToDelete(editingRoutineId)}
                      className="p-2 text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/50 rounded-xl border border-red-100 dark:border-red-900/40 transition-colors"
                      title="Delete class routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 text-xs p-3.5 rounded-2xl border border-red-200 dark:border-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Day of Week
                    </label>
                    <select
                      required
                      value={formData.dayOfWeek}
                      onChange={e => setFormData({...formData, dayOfWeek: e.target.value})}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {DAYS.map(day => (
                        <option key={day} value={day} className="dark:bg-slate-800 dark:text-slate-100">{day}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Faculty Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.facultyName}
                      onChange={e => setFormData({...formData, facultyName: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
                      placeholder="e.g. Dr. Alan Turing"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Start Time
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.startTime}
                      onChange={e => setFormData({...formData, startTime: e.target.value})}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="09:00 AM"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      End Time
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.endTime}
                      onChange={e => setFormData({...formData, endTime: e.target.value})}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="10:00 AM"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Department
                    </label>
                    <select
                      required
                      value={formData.departmentId}
                      onChange={e => setFormData({...formData, departmentId: e.target.value, batch: ''})}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="" disabled className="dark:bg-slate-800 dark:text-slate-100">Select Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id} className="dark:bg-slate-800 dark:text-slate-100">{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Batch / Section
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.batch}
                      onChange={e => setFormData({...formData, batch: e.target.value})}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Batch 15 - Sec A"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Course Title & Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.course}
                    onChange={e => setFormData({...formData, course: e.target.value})}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    placeholder="e.g. Advanced Algorithms (CS-302)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Room / Lab Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.room}
                    onChange={e => setFormData({...formData, room: e.target.value})}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Lab 304 / Building B"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isSubmitting ? 'Saving...' : 'Save Routine'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {routineToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-4 sm:p-6 lg:p-8 text-center"
            >
              <div className="w-14 h-14 bg-red-100 dark:bg-red-950/60 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Delete Class Routine?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to remove this class routine? This action will save immediately to the database.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setRoutineToDelete(null)}
                  className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete Routine'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
