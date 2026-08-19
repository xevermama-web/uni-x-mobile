import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOutletContext } from 'react-router-dom';
import { Users, Search, Plus, MoreVertical, Mail, BookOpen, X, ChevronDown, ChevronRight, Folder, FolderOpen, Edit, Trash2, Key, CheckCircle2 } from 'lucide-react';
import { useDepartments } from '../../hooks/useDepartments';
import { useStudents } from '../../hooks/useStudents';
import { useBatches } from '../../hooks/useBatches';
import { Loader2 } from 'lucide-react';

export default function ManageStudents() {
  const { user } = useOutletContext<any>();
  const { departments } = useDepartments();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState<'name' | 'id' | 'cgpa' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const { students, loading: studentsLoading, fetchError: studentsFetchError, addStudent, updateStudent, deleteStudent, resetStudentPassword } = useStudents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newStudent, setNewStudent] = useState({ id: '', name: '', email: '', department: '', batch: '', password: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [isCreatingNewBatch, setIsCreatingNewBatch] = useState(false);
  const [isEditingNewBatch, setIsEditingNewBatch] = useState(false);
  const { batches: formBatches, loading: formBatchesLoading, fetchBatches: fetchFormBatches } = useBatches(newStudent.department);
  const { batches: filterBatches, fetchBatches: fetchFilterBatches } = useBatches(filterDept);
  const [studentToEdit, setStudentToEdit] = useState<any>(null);
  const { batches: editBatches, loading: editBatchesLoading, fetchBatches: fetchEditBatches } = useBatches(studentToEdit?.department);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const groupedStudents = students
    .filter(s => {
      const q = searchQuery.toLowerCase();
      const matchSearch = s.name.toLowerCase().includes(q) || (s.id && s.id.toLowerCase().includes(q)) || (s.email && s.email.toLowerCase().includes(q));
      const matchDept = filterDept ? s.department === filterDept : true;
      const matchBatch = filterBatch ? s.batch === filterBatch : true;
      const matchStatus = filterStatus ? s.status === filterStatus : true;
      return matchSearch && matchDept && matchBatch && matchStatus;
    })
    .reduce((acc, student) => {
      const dept = student.department || 'Unknown Department';
      const batch = student.batch ? `${student.batch} Batch` : 'Unknown Batch';
      
      if (!acc[dept]) acc[dept] = {};
      if (!acc[dept][batch]) acc[dept][batch] = [];
      acc[dept][batch].push(student);
      
      return acc;
    }, {} as Record<string, Record<string, any[]>>);

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const { error: updateError } = await updateStudent(studentToEdit.profile_id || studentToEdit.id, {
      name: studentToEdit.name,
      department: studentToEdit.department,
      batch: studentToEdit.batch,
      id: studentToEdit.id,
      email: studentToEdit.email,
    });
    
    if (updateError) {
      setError(updateError.message || 'Failed to update student');
    } else {
      setIsEditModalOpen(false);
      setSuccessMessage('Student updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setIsSubmitting(false);
  };

  const handleDeleteStudent = async () => {
    setIsSubmitting(true);
    setError(null);
    
    const { error: deleteError } = await deleteStudent(studentToEdit.profile_id || studentToEdit.id);
    
    if (deleteError) {
      setError(deleteError.message || 'Failed to delete student');
    } else {
      setIsDeleteModalOpen(false);
      setSuccessMessage('Student deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setIsSubmitting(false);
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    // Pass ID, Email, and the New Password
    const { error: resetError } = await resetStudentPassword(studentToEdit.profile_id || studentToEdit.id, studentToEdit.email, newPassword);
    
    if (resetError) {
      setError(resetError.message || 'Failed to reset password');
    } else {
      { setIsResetPassModalOpen(false); setNewPassword(''); setConfirmPassword(''); setError(null); };
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Password reset successfully. Student can now login with the new password.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setIsSubmitting(false);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const { password, ...studentData } = newStudent;
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsSubmitting(false);
      return;
    }

    const { error: err } = await addStudent(studentData, password);
    setIsSubmitting(false);

    if (err) {
      console.error("ManageStudents handleAddStudent err:", err);
      let errMsg = 'An unknown error occurred';
      if (typeof err === 'string') errMsg = err;
      else if (err.message) errMsg = err.message;
      else if (err.error_description) errMsg = err.error_description;
      else if (err.name) errMsg = err.name;
      else if (JSON.stringify(err) !== '{}') errMsg = JSON.stringify(err);
      
      // Additional fallback for weird empty objects
      if (errMsg === '{}') errMsg = 'Database Error or Permission Denied. Check console.';
      
      setError(errMsg);
    } else {
      setNewStudent({ id: '', name: '', email: '', department: '', batch: '', password: '' });
      setIsCreatingNewBatch(false);
      setIsAddModalOpen(false);
      fetchFormBatches();
      fetchFilterBatches();
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100dvh-8rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-6 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">Manage Students</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">View, add, and manage student records.</p>
        </div>
        {(user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'moderator') && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto justify-center flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900/70 backdrop-blur-md rounded-[24px] shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-white/40 flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="p-3 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-white dark:bg-slate-900/30 shrink-0">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <select 
              value={filterDept} 
              onChange={e => setFilterDept(e.target.value)}
              className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:border-blue-500 shadow-sm"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
            <select 
              value={filterBatch} 
              onChange={e => setFilterBatch(e.target.value)}
              className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:border-blue-500 shadow-sm"
            >
              <option value="">All Batches</option>
              {filterBatches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:border-blue-500 shadow-sm"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
              <select 
                value={sortField} 
                onChange={e => setSortField(e.target.value as any)}
                className="px-2.5 sm:px-3 py-1.5 bg-transparent text-slate-600 dark:text-slate-300 focus:outline-none border-r border-slate-200 dark:border-slate-800"
              >
                <option value="name">Name</option>
                <option value="id">Student ID</option>
                <option value="cgpa">CGPA</option>
                <option value="created_at">Date Created</option>
              </select>
              <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-2.5 sm:px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800/70 font-medium transition-colors"
                title="Toggle Sort Order"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {studentsFetchError && (
            <div className="m-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <p className="font-bold mb-1">Database Error</p>
              <p>{studentsFetchError}</p>
              <p className="mt-2 text-red-600 font-medium">Please ensure you have run the `supabase-schema.sql` script in your Supabase SQL Editor.</p>
            </div>
          )}
          {Object.keys(groupedStudents).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No students found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedStudents)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dept, batches]) => {
                  const isDeptExpanded = expandedNodes[dept] !== false; // Default true
                  return (
                    <div key={dept} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                      <button 
                        onClick={() => toggleNode(dept)}
                        className="w-full flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-b border-slate-200 dark:border-slate-800 rounded-t-xl"
                      >
                        {isDeptExpanded ? <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                        {isDeptExpanded ? <FolderOpen className="w-5 h-5 text-indigo-500" /> : <Folder className="w-5 h-5 text-indigo-500" />}
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{dept}</span>
                        <span className="ml-auto text-xs font-medium bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                          {Object.values(batches).flat().length} Students
                        </span>
                      </button>

                      <AnimatePresence>
                        {isDeptExpanded && (
                          <motion.div
                            initial={{ height: 0, overflow: 'hidden' }}
                            animate={{ height: 'auto', overflow: 'visible', transitionEnd: { overflow: 'visible' } }}
                            exit={{ height: 0, overflow: 'hidden' }}
                          >
                            <div className="p-2 space-y-2">
                              {Object.entries(batches)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([batch, studentsInBatch]) => {
                                  const batchNodeId = `${dept}-${batch}`;
                                  const isBatchExpanded = expandedNodes[batchNodeId] !== false; // Default true
                                  return (
                                    <div key={batch} className="ml-6 bg-slate-50/60 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg">
                                      <button 
                                        onClick={() => toggleNode(batchNodeId)}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 rounded-t-lg"
                                      >
                                        {isBatchExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                        {isBatchExpanded ? <FolderOpen className="w-4 h-4 text-blue-400" /> : <Folder className="w-4 h-4 text-blue-400" />}
                                        <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">{batch}</span>
                                        <span className="ml-auto text-[10px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                                          {studentsInBatch.length}
                                        </span>
                                      </button>
                                      
                                      <AnimatePresence>
                                        {isBatchExpanded && (
                                          <motion.div
                            initial={{ height: 0, overflow: 'hidden' }}
                            animate={{ height: 'auto', overflow: 'visible', transitionEnd: { overflow: 'visible' } }}
                            exit={{ height: 0, overflow: 'hidden' }}
                                          >
                                            <div className="p-2">
                                              <div className="ml-2 sm:ml-6 space-y-1.5 relative before:absolute before:inset-y-2 before:left-[-10px] sm:before:left-[-15px] before:w-px before:bg-slate-200 dark:before:bg-slate-700/80">
                                                {studentsInBatch
                                                  .sort((a, b) => {
                                                    let comparison = 0;
                                                    if (sortField === 'name') {
                                                      comparison = a.name.localeCompare(b.name);
                                                    } else if (sortField === 'id') {
                                                      comparison = (a.id || '').localeCompare(b.id || '');
                                                    } else if (sortField === 'cgpa') {
                                                      comparison = (a.cgpa || 0) - (b.cgpa || 0);
                                                    } else if (sortField === 'created_at') {
                                                      comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
                                                    }
                                                    return sortOrder === 'asc' ? comparison : -comparison;
                                                  })
                                                  .map((student) => (
                                                  <div key={student.id} onClick={() => setSelectedStudent(student)} className={`cursor-pointer relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl group transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700/60 before:absolute before:top-1/2 before:left-[-10px] sm:before:left-[-15px] before:w-[8px] sm:before:w-[11px] before:h-px before:bg-slate-200 dark:before:bg-slate-700/80 ${actionMenuOpen === student.id ? "z-50 bg-slate-100 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700" : "z-0"}`}>
                                                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                                      <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0 border border-indigo-100 dark:border-indigo-900/50">
                                                        {student.name.charAt(0)}
                                                      </div>
                                                      <div className="min-w-0">
                                                        <p className="font-medium text-slate-800 dark:text-slate-200 text-xs sm:text-sm truncate">{student.name}</p>
                                                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300">{student.id}</span>
                                                          <span className="hidden sm:inline">•</span>
                                                          <span className="flex items-center gap-0.5 truncate"><Mail className="w-2.5 h-2.5 shrink-0" /> <span className="truncate">{student.email}</span></span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                                                      <div className="flex items-center gap-1.5">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                          student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                                        }`}>
                                                          {student.status}
                                                        </span>
                                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                          CGPA: {student.cgpa?.toFixed(2) || '0.00'}
                                                        </span>
                                                      </div>
                                                                                                            <div className="relative">
                                                        <button 
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActionMenuOpen(actionMenuOpen === student.id ? null : student.id);
                                                          }}
                                                          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                                        >
                                                          <MoreVertical className="w-3.5 h-3.5" />
                                                        </button>
                                                        
                                                        <AnimatePresence>
                                                        {actionMenuOpen === student.id && (
                                                          <motion.div 
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            transition={{ duration: 0.1 }}
                                                            className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 py-1 z-20"
                                                            onClick={(e) => e.stopPropagation()}
                                                          >
                                                            <button
                                                              onClick={() => {
                                                                setStudentToEdit(student);
                                                                setIsEditModalOpen(true);
                                                                setActionMenuOpen(null);
                                                              }}
                                                              className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800/70 flex items-center gap-2"
                                                            >
                                                              <Edit className="w-4 h-4" /> Edit
                                                            </button>
                                                            <button
                                                              onClick={() => {
                                                                setStudentToEdit(student);
                                                                setIsResetPassModalOpen(true);
                                                                setActionMenuOpen(null);
                                                              }}
                                                              className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800/70 flex items-center gap-2"
                                                            >
                                                              <Key className="w-4 h-4" /> Reset Password
                                                            </button>
                                                            <button
                                                              onClick={() => {
                                                                setStudentToEdit(student);
                                                                setIsDeleteModalOpen(true);
                                                                setActionMenuOpen(null);
                                                              }}
                                                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                            >
                                                              <Trash2 className="w-4 h-4" /> Delete
                                                            </button>
                                                          </motion.div>
                                                        )}
                                                        </AnimatePresence>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
      {/* View Student Profile Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 w-full max-w-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white text-center relative">
                <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white dark:bg-slate-900/10 hover:bg-white dark:bg-slate-900/20 rounded-full p-1.5 transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 text-indigo-600 flex items-center justify-center font-bold text-3xl mx-auto shadow-lg mb-3">
                  {selectedStudent.name.charAt(0)}
                </div>
                <h3 className="text-2xl font-bold">{selectedStudent.name}</h3>
                <p className="text-blue-100 font-medium">{selectedStudent.department} • Batch {selectedStudent.batch}</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">Student ID</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedStudent.id}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">Status</p>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      selectedStudent.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      {selectedStudent.status}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">Email Address</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {selectedStudent.email}
                  </p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">Current CGPA</p>
                  <p className="text-2xl font-bold text-indigo-600">{selectedStudent.cgpa?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 w-full max-w-md p-5 sm:p-6 max-h-[85dvh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Add New Student</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50 rounded-full p-1 border border-slate-200 dark:border-slate-800/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddStudent} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student ID</label>
                  <input 
                    type="text" required 
                    value={newStudent.id} onChange={e => setNewStudent({...newStudent, id: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 0742420005101007"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input 
                    type="text" required 
                    value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input 
                    type="email" required 
                    value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="john.doe@unixx.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                  <input 
                    type="password" required 
                    value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Set student password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <select 
                    required 
                    value={newStudent.department} onChange={e => setNewStudent({...newStudent, department: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 dark:text-slate-300"
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Batch</label>
                  {!isCreatingNewBatch ? (
                    <select
                      required
                      value={newStudent.batch}
                      onChange={e => {
                        if (e.target.value === 'NEW_BATCH') {
                          setIsCreatingNewBatch(true);
                          setNewStudent({...newStudent, batch: ''});
                        } else {
                          setNewStudent({...newStudent, batch: e.target.value});
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="" disabled>Select Batch</option>
                      {newStudent.department && formBatchesLoading ? (
                        <option disabled>Loading batches...</option>
                      ) : (
                        formBatches.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))
                      )}
                      {newStudent.department && (
                        <option value="NEW_BATCH">+ Add New Batch...</option>
                      )}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" required autoFocus
                        value={newStudent.batch} 
                        onChange={e => setNewStudent({...newStudent, batch: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Enter new batch name (e.g. 2024)"
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsCreatingNewBatch(false);
                          setNewStudent({...newStudent, batch: ''});
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  {!newStudent.department && !isCreatingNewBatch && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Please select a department first.</p>
                  )}
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save Student
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {isEditModalOpen && studentToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/20 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Edit Student</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50 rounded-full p-1 border border-slate-200 dark:border-slate-800/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleEditStudent} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input 
                    type="text" required 
                    value={studentToEdit.name} onChange={e => setStudentToEdit({...studentToEdit, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Academic ID</label>
                  <input 
                    type="text" required 
                    value={studentToEdit.id} onChange={e => setStudentToEdit({...studentToEdit, id: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input 
                    type="email" required 
                    value={studentToEdit.email} onChange={e => setStudentToEdit({...studentToEdit, email: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                    <select
                      value={studentToEdit.department} onChange={e => setStudentToEdit({...studentToEdit, department: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    >
                      <option value="">Select Dept</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Batch</label>
                    {!isEditingNewBatch ? (
                      <select
                        required
                        value={studentToEdit.batch}
                        onChange={e => {
                          if (e.target.value === 'NEW_BATCH') {
                            setIsEditingNewBatch(true);
                            setStudentToEdit({...studentToEdit, batch: ''});
                          } else {
                            setStudentToEdit({...studentToEdit, batch: e.target.value});
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="" disabled>Select Batch</option>
                        {studentToEdit.department && editBatchesLoading ? (
                          <option disabled>Loading batches...</option>
                        ) : (
                          editBatches.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))
                        )}
                        {studentToEdit.department && (
                          <option value="NEW_BATCH">+ Add New Batch...</option>
                        )}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" required autoFocus
                          value={studentToEdit.batch} 
                          onChange={e => setStudentToEdit({...studentToEdit, batch: e.target.value})}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="Enter new batch name (e.g. 2024)"
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsEditingNewBatch(false);
                            setStudentToEdit({...studentToEdit, batch: ''});
                          }}
                          className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Student Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && studentToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/20 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Delete Student?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to delete <strong>{studentToEdit.name}</strong>? This action cannot be undone.
              </p>
              
              {error && (
                <div className="bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-200 mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStudent}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors flex justify-center items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Reset Password Modal */}
      <AnimatePresence>
        {isResetPassModalOpen && studentToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/20 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Reset Password</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Enter a new password for <strong>{studentToEdit.name}</strong>.
              </p>
              
              <form onSubmit={handleResetPassword} className="space-y-4 text-left">
                {error && (
                  <div className="bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                  <input 
                    type="password" required 
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                  <input 
                    type="password" required 
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsResetPassModalOpen(false); setNewPassword(''); setConfirmPassword(''); setError(null); }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800/70 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Reset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

