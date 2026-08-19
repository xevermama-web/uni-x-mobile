import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOutletContext } from 'react-router-dom';
import { Calendar as CalendarIcon, Plus, X, Trash2, Building, Clock, Users, Edit2, Upload } from 'lucide-react';
import { useRoutines, Routine } from '../../hooks/useRoutines';
import { useDepartments } from '../../hooks/useDepartments';
import { useBatches } from '../../hooks/useBatches';
import { getDhakaCurrentMinutes, getDhakaDayOfWeek, getClassStatus } from '../../utils/routineTime';
import FacultyRoutineManager from '../../components/routine/FacultyRoutineManager';
import * as XLSX from 'xlsx';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_SLOTS = [
  { label: '9:00AM-10:00AM', start: '09:00 AM', end: '10:00 AM' },
  { label: '10:00AM-11:00AM', start: '10:00 AM', end: '11:00 AM' },
  { label: '11:00AM-12:00PM', start: '11:00 AM', end: '12:00 PM' },
  { label: '12:00PM-1:00PM', start: '12:00 PM', end: '01:00 PM' },
  { label: '1:00PM-2:00PM', start: '01:00 PM', end: '02:00 PM' },
  { label: '2:00PM-3:00PM', start: '02:00 PM', end: '03:00 PM' },
  { label: '3:00PM-4:00PM', start: '03:00 PM', end: '04:00 PM' },
];

export default function ManageRoutines() {
  const { user } = useOutletContext<any>();
  const { routines, loading: routinesLoading, addRoutine, updateRoutine, removeRoutine, fetchRoutines } = useRoutines();
  const { departments, loading: deptsLoading } = useDepartments();

  // Role detection: Only admin and moderator can add, edit, delete routines
  const userRole = useMemo(() => {
    if (user?.role) return user.role.toLowerCase();
    if (user?.user_metadata?.role) return user.user_metadata.role.toLowerCase();
    if (localStorage.getItem('unixx_admin_session') === 'true') return 'admin';
    if (localStorage.getItem('unixx_moderator_session')) return 'moderator';
    if (localStorage.getItem('unixx_faculty_session')) return 'faculty';
    return 'student';
  }, [user]);

  // Special custom view for Faculty accounts
  if (userRole === 'faculty') {
    return <FacultyRoutineManager facultyUser={user} />;
  }

  const canManageRoutines = userRole === 'admin' || userRole === 'moderator';

  const [currentDhakaMinutes, setCurrentDhakaMinutes] = useState(() => getDhakaCurrentMinutes());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDhakaMinutes(getDhakaCurrentMinutes());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const dhakaToday = getDhakaDayOfWeek();

  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>(() => DAYS.includes(dhakaToday) ? dhakaToday : 'Sunday');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDept, setImportDept] = useState('');
  const [importBatch, setImportBatch] = useState('');
  const [importDay, setImportDay] = useState('');

  // Resolve department names for useBatches
  const selectedDeptName = useMemo(() => departments.find(d => d.id === selectedDept)?.name, [departments, selectedDept]);
  const importDeptName = useMemo(() => departments.find(d => d.id === importDept)?.name, [departments, importDept]);
  
  // Use batches for selected department
  const { batches: allBatches, loading: batchesLoading } = useBatches(selectedDeptName);
  
  const routineBatches = Array.from(new Set(routines.filter(r => r.departmentId === selectedDept).map(r => r.batch)));
  const allBatchesUnion = Array.from(new Set([...allBatches, ...routineBatches]));

  const batches = selectedSemester 
    ? allBatchesUnion.filter(b => b.toLowerCase().includes(selectedSemester.toLowerCase()))
    : allBatchesUnion;


  const { batches: importBatches, loading: importBatchesLoading } = useBatches(importDeptName);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Routine, 'id'>>({
    departmentId: '',
    batch: '',
    dayOfWeek: 'Saturday',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    course: '',
    facultyName: '',
    room: ''
  });

  const formDeptName = useMemo(() => departments.find(d => d.id === formData.departmentId)?.name, [departments, formData.departmentId]);
  const { batches: formBatches, loading: formBatchesLoading } = useBatches(formDeptName);

  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);

  // Initialize selectedDept when departments load
  useMemo(() => {
    if (departments.length > 0 && !selectedDept) {
      setSelectedDept(departments[0].id);
    }
  }, [departments, selectedDept]);

  const handleCellClick = (batch: string, slot: typeof TIME_SLOTS[0]) => {
    if (!canManageRoutines || !selectedDept) return;
    
    // Find if a routine exists for this batch, day, and timeslot
    const existingRoutine = routines.find(r => 
      r.departmentId === selectedDept && 
      r.dayOfWeek === selectedDay &&
      r.batch === batch &&
      r.startTime === slot.start &&
      r.endTime === slot.end
    );

    if (existingRoutine) {
      setEditingRoutineId(existingRoutine.id);
      setFormData({
        departmentId: existingRoutine.departmentId,
        batch: existingRoutine.batch,
        dayOfWeek: existingRoutine.dayOfWeek,
        startTime: existingRoutine.startTime,
        endTime: existingRoutine.endTime,
        course: existingRoutine.course,
        facultyName: existingRoutine.facultyName,
        room: existingRoutine.room,
        isPublished: existingRoutine.isPublished
      });
    } else {
      setEditingRoutineId(null);
      setFormData({
        departmentId: selectedDept,
        batch: batch,
        dayOfWeek: selectedDay,
        startTime: slot.start,
        endTime: slot.end,
        course: '',
        facultyName: '',
        room: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageRoutines) {
      setError("Permission denied: Only Admin and Moderator can manage routines.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    
    let err;
    if (editingRoutineId) {
      const result = await updateRoutine(editingRoutineId, formData);
      err = result.error;
    } else {
      const result = await addRoutine(formData);
      err = result.error;
    }
    
    setIsSubmitting(false);
    if (!err) {
      setIsModalOpen(false);
    } else {
      setError(err.message || 'Failed to save routine');
    }
  };

  const confirmDelete = async () => {
    if (!canManageRoutines || !routineToDelete) return;
    setIsSubmitting(true);
    const { error } = await removeRoutine(routineToDelete) as { error: any };
    setIsSubmitting(false);
    
    if (error) {
      setError(error.message || 'Failed to delete routine');
    } else {
      setRoutineToDelete(null);
      setIsModalOpen(false); // close form modal if open
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageRoutines) {
      setError("Permission denied: Only Admin and Moderator can import routines.");
      return;
    }
    if (!importFile || !importDept || !importBatch) {
      setError('Please fill all fields and select a file.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await importFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet) as any[];
      
      const itemsToImport: any[] = [];
      for (const row of json) {
        const day = importDay || row['Day'] || row['DayOfWeek'] || row['dayOfWeek'];
        let startTime = row['Start Time'] || row['StartTime'] || row['startTime'];
        let endTime = row['End Time'] || row['EndTime'] || row['endTime'];
        if (typeof startTime === 'string') startTime = startTime.replace(/^(\d):/, '0$1:').toUpperCase();
        if (typeof endTime === 'string') endTime = endTime.replace(/^(\d):/, '0$1:').toUpperCase();
        const course = row['Course'] || row['course'];
        const facultyName = row['Faculty Name'] || row['Faculty'] || row['facultyName'];
        const room = row['Room'] || row['room'];
        
        if (day && startTime) {
           itemsToImport.push({
              departmentId: importDept,
              batch: importBatch,
              dayOfWeek: day,
              startTime: startTime,
              endTime: endTime || '',
              course: course || '',
              facultyName: facultyName || '',
              room: room || ''
           });
        }
      }

      let userId = 'admin';
      if (localStorage.getItem('unixx_admin_session') === 'true') {
        userId = 'd3e89a79-18c7-4966-bcec-a108f305529c';
      } else if (localStorage.getItem('unixx_moderator_session')) {
        try {
          const parsed = JSON.parse(localStorage.getItem('unixx_moderator_session')!);
          userId = parsed.id || 'moderator';
        } catch {
          userId = 'moderator';
        }
      } else if (user?.id) {
        userId = user.id;
      }

      const response = await fetch('/api/routines/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userRole, items: itemsToImport })
      });

      const resData = await response.json();
      if (!response.ok || resData.error) {
        setError(resData.error || 'Failed to import routines');
      } else {
        if (fetchRoutines) await fetchRoutines();
        setIsImportModalOpen(false);
        setImportFile(null);
      }
    } catch (err: any) {
      setError(err.message || 'Error parsing Excel file');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = routinesLoading || deptsLoading || batchesLoading;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{canManageRoutines ? "Manage Routines" : "Class Routines"}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {canManageRoutines 
              ? "Create and manage class routines day-wise for each department." 
              : "View class routines day-wise for each department."}
          </p>
        </div>
        {canManageRoutines && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                 setImportDept(selectedDept || (departments[0]?.id || ''));
                 setImportBatch('');
                 setImportDay('');
                 setImportFile(null);
                 setIsImportModalOpen(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Upload className="w-5 h-5" />
              Import Routine
            </button>
            <button 
              onClick={() => {
                 setEditingRoutineId(null);
                 setFormData({
                   departmentId: selectedDept || (departments[0]?.id || ''),
                   batch: '',
                   dayOfWeek: selectedDay,
                   startTime: '09:00 AM',
                   endTime: '10:00 AM',
                   course: '',
                   facultyName: '',
                   room: ''
                 });
                 setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Routine
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Building className="w-3.5 h-3.5" /> Department
          </label>
          <select 
            value={selectedDept} 
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {departments.map(d => (
              <option key={d.id} value={d.id} className="dark:bg-slate-900 dark:text-slate-100">{d.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5" /> Day
          </label>
          <select 
            value={selectedDay} 
            onChange={(e) => setSelectedDay(e.target.value)}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {DAYS.map(d => (
              <option key={d} value={d} className="dark:bg-slate-900 dark:text-slate-100">{d}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Semester (Optional)
          </label>
          <input 
            type="text"
            value={selectedSemester} 
            onChange={(e) => setSelectedSemester(e.target.value)}
            placeholder="Filter by batch..."
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Routine Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading routines...</p>
        </div>
      ) : !selectedDept ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400">Please create a department first.</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No Batches Found</h3>
          <p className="text-slate-500 dark:text-slate-400">There are no batches in the selected department. Please add students to create batches.</p>
        </div>
      ) : (
        <>
          {/* Desktop Matrix Table View */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-max">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold text-center border-r border-slate-200 dark:border-slate-800 w-32 shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 sticky left-0 z-20">Batch</th>
                  {TIME_SLOTS.map(slot => (
                    <th key={slot.label} className="px-4 py-3 font-semibold text-center border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 min-w-[160px]">
                      {slot.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map((batch, idx) => (
                  <tr key={batch} className={`hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors ${idx !== batches.length - 1 ? 'border-b border-slate-200 dark:border-slate-800' : ''}`}>
                    <td className="px-4 py-4 font-bold text-slate-800 dark:text-slate-100 text-center border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0] dark:shadow-[1px_0_0_0_#334155]">
                      {batch}
                    </td>
                    {TIME_SLOTS.map(slot => {
                      const routine = routines.find(r => 
                        r.departmentId === selectedDept && 
                        r.dayOfWeek === selectedDay &&
                        r.batch === batch &&
                        (r.startTime === slot.start || r.startTime.replace(/^0/, '') === slot.start.replace(/^0/, ''))
                      );

                      const status = (routine && selectedDay === dhakaToday)
                        ? getClassStatus(routine.startTime, routine.endTime || slot.end, currentDhakaMinutes)
                        : null;
                      
                      return (
                        <td 
                          key={slot.label} 
                          onClick={() => canManageRoutines && handleCellClick(batch, slot)}
                          className={`px-2 py-2 border-r border-slate-200 dark:border-slate-800 align-top transition-colors relative group h-24 ${
                            canManageRoutines ? 'cursor-pointer' : 'cursor-default'
                          } ${
                            status === 'ONGOING' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60' 
                              : routine 
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/50' 
                              : (canManageRoutines ? 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60' : '')
                          }`}
                        >
                          {routine ? (
                            <div className="h-full w-full flex flex-col items-center justify-center text-center p-2 relative">
                              {status && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider mb-1 ${
                                  status === 'ONGOING' ? 'bg-emerald-600 text-white animate-pulse' :
                                  status === 'UPCOMING' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
                                  'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}>
                                  {status}
                                </span>
                              )}
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-[13px] leading-tight mb-1">{routine.course}</span>
                              <span className="text-slate-600 dark:text-slate-300 text-[11px] mb-0.5">{routine.facultyName}</span>
                              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">{routine.room}</span>
                              {canManageRoutines && (
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                </div>
                              )}
                            </div>
                          ) : (
                            canManageRoutines && (
                              <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-500">
                                <Plus className="w-4 h-4" />
                              </div>
                            )
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card-Based Schedule View */}
          <div className="block md:hidden space-y-4">
            {batches.map((batch) => {
              const batchRoutines = TIME_SLOTS.map(slot => {
                const routine = routines.find(r => 
                  r.departmentId === selectedDept && 
                  r.dayOfWeek === selectedDay &&
                  r.batch === batch &&
                  (r.startTime === slot.start || r.startTime.replace(/^0/, '') === slot.start.replace(/^0/, ''))
                );
                const status = (routine && selectedDay === dhakaToday)
                  ? getClassStatus(routine.startTime, routine.endTime || slot.end, currentDhakaMinutes)
                  : null;
                return { slot, routine, status };
              });

              return (
                <div key={batch} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Batch {batch}</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {selectedDay}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {batchRoutines.map(({ slot, routine, status }) => (
                      <div 
                        key={slot.label}
                        onClick={() => canManageRoutines && handleCellClick(batch, slot)}
                        className={`p-3 rounded-xl border transition-all ${
                          canManageRoutines ? 'cursor-pointer active:scale-[0.99]' : ''
                        } ${
                          status === 'ONGOING'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800'
                            : routine
                            ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
                            : 'bg-slate-50/50 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                          <span>{slot.label}</span>
                          {status && (
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              status === 'ONGOING' ? 'bg-emerald-600 text-white animate-pulse' :
                              status === 'UPCOMING' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
                              'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}>
                              {status}
                            </span>
                          )}
                        </div>

                        {routine ? (
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{routine.course}</h4>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{routine.facultyName}</p>
                              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">Room: {routine.room}</p>
                            </div>
                            {canManageRoutines && (
                              <button className="p-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 rounded-lg shrink-0">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 py-1">
                            <span>No Class Scheduled</span>
                            {canManageRoutines && (
                              <span className="text-blue-600 font-semibold text-[11px] flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && canManageRoutines && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl p-6 max-h-[85dvh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  {editingRoutineId ? 'Edit Class' : 'Add Class'}
                </h3>
                <div className="flex gap-2">
                  {editingRoutineId && (
                    <button type="button" onClick={() => setRoutineToDelete(editingRoutineId)} className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-950/50 rounded-full p-2 border border-red-100 dark:border-red-900/50 transition-colors" title="Delete class">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-full p-2 border border-slate-200 dark:border-slate-700 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveRoutine} className="space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 text-xs p-3 rounded-lg border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                    <select 
                      required 
                      value={formData.departmentId} 
                      onChange={e => setFormData({...formData, departmentId: e.target.value, batch: ''})}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="" disabled className="dark:bg-slate-800 dark:text-slate-100">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id} className="dark:bg-slate-800 dark:text-slate-100">{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Batch / Section</label>
                    <select
                      required 
                      value={formData.batch} 
                      onChange={e => setFormData({...formData, batch: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      disabled={!formData.departmentId || formBatchesLoading}
                    >
                      <option value="" disabled className="dark:bg-slate-800 dark:text-slate-100">
                        {!formData.departmentId 
                          ? "Select Department First" 
                          : formBatchesLoading 
                            ? "Loading batches..." 
                            : formBatches.length === 0
                              ? "No batches found"
                              : "Select Batch"}
                      </option>
                      {formBatches.map(batch => (
                        <option key={batch} value={batch} className="dark:bg-slate-800 dark:text-slate-100">{batch}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Day</label>
                    <select 
                      required 
                      value={formData.dayOfWeek} 
                      onChange={e => setFormData({...formData, dayOfWeek: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {DAYS.map(day => (
                        <option key={day} value={day} className="dark:bg-slate-800 dark:text-slate-100">{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                    <input 
                      type="text" required 
                      value={formData.startTime} 
                      onChange={e => setFormData({...formData, startTime: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="09:00 AM"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                    <input 
                      type="text" required 
                      value={formData.endTime} 
                      onChange={e => setFormData({...formData, endTime: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="10:30 AM"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Course Name & Code</label>
                  <input 
                    type="text" required 
                    value={formData.course} 
                    onChange={e => setFormData({...formData, course: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Data Structures (CS-201)"
                  />
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Faculty Name</label>
                    <input 
                      type="text" required 
                      value={formData.facultyName} 
                      onChange={e => setFormData({...formData, facultyName: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Dr. Alan Turing"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Room / Lab</label>
                    <input 
                      type="text" required 
                      value={formData.room} 
                      onChange={e => setFormData({...formData, room: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Room 301"
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : 'Save Routine'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && canManageRoutines && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 max-h-[85dvh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  Import Routine from Excel
                </h3>
                <button type="button" onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-full p-2 border border-slate-200 dark:border-slate-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleImport} className="space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 text-xs p-3 rounded-lg border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}
                
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                    <select 
                      required 
                      value={importDept} 
                      onChange={e => {
                        setImportDept(e.target.value);
                        setImportBatch('');
                      }}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="" disabled className="dark:bg-slate-800 dark:text-slate-100">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id} className="dark:bg-slate-800 dark:text-slate-100">{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Batch / Section</label>
                    <select
                      required 
                      value={importBatch} 
                      onChange={e => setImportBatch(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      disabled={!importDept || importBatchesLoading}
                    >
                      <option value="" disabled className="dark:bg-slate-800 dark:text-slate-100">
                        {!importDept 
                          ? "Select Department First" 
                          : importBatchesLoading 
                            ? "Loading batches..." 
                            : importBatches.length === 0
                              ? "No batches found"
                              : "Select Batch"}
                      </option>
                      {importBatches.map(batch => (
                        <option key={batch} value={batch} className="dark:bg-slate-800 dark:text-slate-100">{batch}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Day (Optional)</label>
                    <select 
                      value={importDay} 
                      onChange={e => setImportDay(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="" className="dark:bg-slate-800 dark:text-slate-100">Read from file</option>
                      {DAYS.map(day => (
                        <option key={day} value={day} className="dark:bg-slate-800 dark:text-slate-100">{day}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Excel File</label>
                  <input 
                    type="file" required accept=".xlsx,.xls,.csv"
                    onChange={e => setImportFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-950 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Must include columns: Day, Start Time, End Time, Course, Faculty Name, Room
                  </p>
                  <a href="data:text/csv;charset=utf-8,Day,Start Time,End Time,Course,Faculty Name,Room%0ASaturday,09:00 AM,10:00 AM,Introduction to Computer Science,John Doe,101%0ASunday,11:00 AM,12:00 PM,Data Structures,Jane Smith,102" download="routine_template.csv" className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline inline-block mt-1">
                    Download a copy
                  </a>
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsImportModalOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting || !importFile} className="px-5 py-2.5 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    {isSubmitting ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {routineToDelete && canManageRoutines && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Delete Routine Entry?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">Are you sure you want to remove this class schedule? This action cannot be undone.</p>
                {error && <p className="text-xs text-red-600 dark:text-red-400 mt-3 bg-red-50 dark:bg-red-950/60 p-2 rounded border border-red-100 dark:border-red-900/50">{error}</p>}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setRoutineToDelete(null); setError(null); }} 
                  className="flex-1 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete} 
                  disabled={isSubmitting} 
                  className="flex-1 py-2.5 bg-red-600 text-white font-medium hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
