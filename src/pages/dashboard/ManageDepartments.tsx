import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOutletContext } from 'react-router-dom';
import { BookOpen, Search, Plus, MoreVertical, Users, Calendar, X, Trash2, Edit2 } from 'lucide-react';
import { useDepartments } from '../../hooks/useDepartments';

export default function ManageDepartments() {
  const { user } = useOutletContext<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { departments, loading, addDepartment, removeDepartment, editDepartment } = useDepartments();

  const [newDepartment, setNewDepartment] = useState({ id: 'new', name: '', head: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState({ id: 'new', name: '', head: '' });

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const { error: err } = await addDepartment(newDepartment);
    setIsSubmitting(false);
    if (!err) {
      setNewDepartment({ id: 'new', name: '', head: '' });
      setIsAddModalOpen(false);
    } else {
      setError(err.message || 'Failed to add department');
    }
  };

  const handleEditDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const { error: err } = await editDepartment(editingDepartment.id, {
      name: editingDepartment.name,
      head: editingDepartment.head,
    });
    setIsSubmitting(false);
    if (!err) {
      setIsEditModalOpen(false);
    } else {
      setError(err.message || 'Failed to update department');
    }
  };

  const openEditModal = (dept: any) => {
    setEditingDepartment({ id: dept.id, name: dept.name, head: dept.head });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this department?')) {
      await removeDepartment(id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100dvh-8rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-6 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">Departments</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">Manage university departments and academic routines.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto justify-center flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900/70 backdrop-blur-md rounded-[24px] shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-white/40 flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="p-3 sm:p-5 border-b border-white/40 flex justify-between items-center bg-white dark:bg-slate-900/30 shrink-0">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search departments..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-5">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {departments.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).map((dept, i) => (
                <motion.div 
                  key={dept.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                      <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(dept)} className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-950/50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(dept.id)} className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-1">{dept.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Code: {dept.id}</p>
                  
                  <div className="space-y-2 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Head of Dept:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{dept.head || 'Not Assigned'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Faculty Members:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{dept.facultyCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Enrolled Students:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{dept.studentCount}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors flex justify-center items-center gap-1.5">
                      <Users className="w-4 h-4" /> Staff
                    </button>
                    <button className="flex-1 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 py-2 rounded-lg text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors flex justify-center items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> Routines
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Add Department Modal */}
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
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Add New Department</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50 rounded-full p-1 border border-slate-200 dark:border-slate-800/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddDepartment} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department Name</label>
                  <input 
                    type="text" required 
                    value={newDepartment.name} onChange={e => setNewDepartment({...newDepartment, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Civil Engineering"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Head of Department (Optional)</label>
                  <input 
                    type="text" 
                    value={newDepartment.head} onChange={e => setNewDepartment({...newDepartment, head: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Dr. John Doe"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : 'Save Department'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Department Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
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
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Edit Department</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50 rounded-full p-1 border border-slate-200 dark:border-slate-800/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditDepartment} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department Name</label>
                  <input 
                    type="text" required 
                    value={editingDepartment.name} onChange={e => setEditingDepartment({...editingDepartment, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Head of Department (Optional)</label>
                  <input 
                    type="text" 
                    value={editingDepartment.head} onChange={e => setEditingDepartment({...editingDepartment, head: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
