import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOutletContext } from 'react-router-dom';
import { Users, Search, Plus, MoreVertical, Mail, BookOpen, Shield, X, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useDepartments } from '../../hooks/useDepartments';
import { checkEmailAvailable } from '../../utils/checkEmailAvailable';

export default function ManageFaculty() {
  const { user } = useOutletContext<any>();
  const { departments } = useDepartments();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [faculty, setFaculty] = useState<any[]>([]);

  // 3-dot menu and edit/delete state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [newFaculty, setNewFaculty] = useState({ name: '', email: '', department: '', role: 'Faculty', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Faculty state
  const [editingFaculty, setEditingFaculty] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', department: '', role: 'Faculty', status: 'Active', password: '' });

  // Delete Faculty state
  const [deletingFaculty, setDeletingFaculty] = useState<any | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      const stored = localStorage.getItem('unixx_faculties');
      setFaculty(stored ? JSON.parse(stored) : []);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from('faculties').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setFaculty(data || []);
    } catch (err) {
      console.error("Failed to fetch faculty:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const emailCheck = await checkEmailAvailable(newFaculty.email);
    if (!emailCheck.available) {
      setError(emailCheck.error || "An account with this email address already exists.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        const id = `F-${Math.floor(2000 + Math.random() * 1000)}`;
        const updated = [{ ...newFaculty, id, status: 'Active', created_at: new Date().toISOString() }, ...faculty];
        setFaculty(updated);
        localStorage.setItem('unixx_faculties', JSON.stringify(updated));
        setNewFaculty({ name: '', email: '', department: '', role: 'Faculty', password: '' });
        setIsAddModalOpen(false);
        setIsSubmitting(false);
        return;
      }

      const { data, error: insertError } = await supabase.from('faculties').insert([
        {
          name: newFaculty.name,
          email: newFaculty.email,
          password: newFaculty.password,
          department: newFaculty.department,
          status: 'Active',
          role: newFaculty.role
        }
      ]).select();

      if (insertError) throw insertError;

      if (data) {
        setFaculty([data[0], ...faculty]);
        setNewFaculty({ name: '', email: '', department: '', role: 'Faculty', password: '' });
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      if (err?.code === 'PGRST205') {
        setError('Schema cache error. Please run: NOTIFY pgrst, \'reload schema\'; in Supabase SQL editor.');
      } else {
        setError(err.message || err.error_description || 'Failed to create faculty');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (member: any) => {
    setEditingFaculty(member);
    setEditFormData({
      name: member.name || '',
      email: member.email || '',
      department: member.department || '',
      role: member.role || 'Faculty',
      status: member.status || 'Active',
      password: ''
    });
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setIsSubmitting(true);
    setError(null);

    const emailCheck = await checkEmailAvailable(editFormData.email, editingFaculty.id);
    if (!emailCheck.available) {
      setError(emailCheck.error || "An account with this email address already exists.");
      setIsSubmitting(false);
      return;
    }

    try {
      const updatedObj: any = {
        name: editFormData.name,
        email: editFormData.email,
        department: editFormData.department,
        role: editFormData.role,
        status: editFormData.status,
      };
      if (editFormData.password.trim()) {
        updatedObj.password = editFormData.password.trim();
      }

      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        const updatedList = faculty.map(f => f.id === editingFaculty.id ? { ...f, ...updatedObj } : f);
        setFaculty(updatedList);
        localStorage.setItem('unixx_faculties', JSON.stringify(updatedList));
        setIsEditModalOpen(false);
        setEditingFaculty(null);
        setIsSubmitting(false);
        return;
      }

      const { error: updateErr } = await supabase
        .from('faculties')
        .update(updatedObj)
        .eq('id', editingFaculty.id);

      if (updateErr) throw updateErr;

      const updatedList = faculty.map(f => f.id === editingFaculty.id ? { ...f, ...updatedObj } : f);
      setFaculty(updatedList);
      localStorage.setItem('unixx_faculties', JSON.stringify(updatedList));
      setIsEditModalOpen(false);
      setEditingFaculty(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update faculty member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteConfirm = (member: any) => {
    setDeletingFaculty(member);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteFaculty = async () => {
    if (!deletingFaculty) return;
    setIsDeleting(true);

    try {
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        const updatedList = faculty.filter(f => f.id !== deletingFaculty.id);
        setFaculty(updatedList);
        localStorage.setItem('unixx_faculties', JSON.stringify(updatedList));
        setIsDeleteConfirmOpen(false);
        setDeletingFaculty(null);
        setIsDeleting(false);
        return;
      }

      const { error: deleteErr } = await supabase
        .from('faculties')
        .delete()
        .eq('id', deletingFaculty.id);

      if (deleteErr) {
        console.warn("Failed to delete faculty from Supabase, removing locally:", deleteErr);
      }

      const updatedList = faculty.filter(f => f.id !== deletingFaculty.id);
      setFaculty(updatedList);
      localStorage.setItem('unixx_faculties', JSON.stringify(updatedList));
      setIsDeleteConfirmOpen(false);
      setDeletingFaculty(null);
    } catch (err: any) {
      console.error("Error deleting faculty:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100dvh-8rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-6 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">Manage Faculty</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">View, add, and assign roles to faculty members.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto justify-center flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Faculty
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900/70 backdrop-blur-md rounded-[24px] shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-white/40 flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="p-3 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-white dark:bg-slate-900/30 shrink-0">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search faculty..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
            />
          </div>
          <div className="flex gap-2 text-sm">
            <button className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800/70">Filter</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-5">
          <table className="hidden md:table w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/60 dark:border-slate-800">
                <th className="pb-3 font-medium">Faculty Name</th>
                <th className="pb-3 font-medium">Employee ID</th>
                <th className="pb-3 font-medium">Department</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {faculty.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map((member) => (
                <tr key={member.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{member.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-slate-600 dark:text-slate-300">{member.id}</td>
                  <td className="py-4 text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    {member.department}
                  </td>
                  <td className="py-4">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 w-fit rounded-full text-xs font-semibold ${
                      member.role === 'Moderator' ? 'bg-purple-100 text-purple-700 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {member.role === 'Moderator' && <Shield className="w-3 h-3" />}
                      {member.role}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700 dark:text-amber-300'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="relative inline-block text-left">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === member.id ? null : member.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === member.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-20" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                            }} 
                          />
                          <div 
                            className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-1 z-30 text-left"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                handleOpenEditModal(member);
                              }}
                              className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800/70 flex items-center gap-2 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                              Edit Faculty
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                handleOpenDeleteConfirm(member);
                              }}
                              className="w-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Faculty
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card List View */}
          <div className="block md:hidden space-y-3">
            {faculty.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map((member) => (
              <div key={member.id} className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{member.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    member.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-950/80 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                  }`}>
                    {member.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
                  <span className="font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-800">
                    ID: {member.id}
                  </span>
                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-800">
                    <BookOpen className="w-3 h-3 text-slate-400" />
                    {member.department}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {member.role}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleOpenEditModal(member)}
                    className="flex-1 py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-500" /> Edit
                  </button>
                  <button
                    onClick={() => handleOpenDeleteConfirm(member)}
                    className="py-1.5 px-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Faculty Modal */}
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
              className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Add New Faculty</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50 rounded-full p-1 border border-slate-200 dark:border-slate-800/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddFaculty} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input 
                    type="text" required 
                    value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Dr. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input 
                    type="email" required 
                    value={newFaculty.email} onChange={e => setNewFaculty({...newFaculty, email: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="john.doe@unixx.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                  <input 
                    type="password" required minLength={6}
                    value={newFaculty.password} onChange={e => setNewFaculty({...newFaculty, password: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Create a strong password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <select 
                    required 
                    value={newFaculty.department} onChange={e => setNewFaculty({...newFaculty, department: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 dark:text-slate-300"
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select 
                    required 
                    value={newFaculty.role} onChange={e => setNewFaculty({...newFaculty, role: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 dark:text-slate-300"
                  >
                    <option value="Faculty">Faculty</option>
                    <option value="Moderator">Moderator</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl transition-colors disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : 'Save Faculty'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Faculty Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingFaculty && (
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
              className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Edit Faculty Member</h3>
                <button 
                  onClick={() => { setIsEditModalOpen(false); setEditingFaculty(null); }} 
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50 rounded-full p-1 border border-slate-200 dark:border-slate-800/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateFaculty} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input 
                    type="text" required 
                    value={editFormData.name} 
                    onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input 
                    type="email" required 
                    value={editFormData.email} 
                    onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password (Optional)</label>
                  <input 
                    type="password"
                    value={editFormData.password} 
                    onChange={e => setEditFormData({...editFormData, password: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
                    placeholder="Leave blank to keep current"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <select 
                    required 
                    value={editFormData.department} 
                    onChange={e => setEditFormData({...editFormData, department: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 dark:text-slate-300"
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select 
                    required 
                    value={editFormData.role} 
                    onChange={e => setEditFormData({...editFormData, role: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 dark:text-slate-300"
                  >
                    <option value="Faculty">Faculty</option>
                    <option value="Moderator">Moderator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select 
                    required 
                    value={editFormData.status} 
                    onChange={e => setEditFormData({...editFormData, status: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 dark:text-slate-300"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setIsEditModalOpen(false); setEditingFaculty(null); }} 
                    disabled={isSubmitting} 
                    className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 text-sm"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && deletingFaculty && (
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
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Delete Faculty Member</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">{deletingFaculty.name}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => { setIsDeleteConfirmOpen(false); setDeletingFaculty(null); }}
                  disabled={isDeleting}
                  className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteFaculty}
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-red-600 text-white font-medium hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 text-sm"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Faculty'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
