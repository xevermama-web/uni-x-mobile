import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useOutletContext } from 'react-router-dom';
import { Users, Search, Plus, MoreVertical, Mail, BookOpen, X, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { useDepartments } from '../../hooks/useDepartments';
import { useStudents } from '../../hooks/useStudents';
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
  const { students, loading: studentsLoading, fetchError: studentsFetchError, addStudent } = useStudents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newStudent, setNewStudent] = useState({ id: '', name: '', email: '', department: '', batch: '', password: '' });
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
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Students</h1>
          <p className="text-slate-500 mt-1 text-sm">View, add, and manage student records.</p>
        </div>
        {(user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'moderator') && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        )}
      </div>

      <div className="bg-white/70 backdrop-blur-md rounded-[24px] shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-white/40 flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="p-5 border-b border-white/40 flex justify-between items-center bg-white/30 shrink-0">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
            />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <select 
              value={filterDept} 
              onChange={e => setFilterDept(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:border-blue-500 shadow-sm"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
            <select 
              value={filterBatch} 
              onChange={e => setFilterBatch(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:border-blue-500 shadow-sm"
            >
              <option value="">All Batches</option>
              {Array.from(new Set(students.map(s => s.batch).filter(Boolean))).sort().map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:border-blue-500 shadow-sm"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <select 
                value={sortField} 
                onChange={e => setSortField(e.target.value as any)}
                className="px-3 py-1.5 bg-transparent text-slate-600 focus:outline-none border-r border-slate-200"
              >
                <option value="name">Name</option>
                <option value="id">Student ID</option>
                <option value="cgpa">CGPA</option>
                <option value="created_at">Date Created</option>
              </select>
              <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                title="Toggle Sort Order"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 shadow-sm">Export</button>
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
              <p className="text-slate-500">No students found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedStudents)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dept, batches]) => {
                  const isDeptExpanded = expandedNodes[dept] !== false; // Default true
                  return (
                    <div key={dept} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <button 
                        onClick={() => toggleNode(dept)}
                        className="w-full flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
                      >
                        {isDeptExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                        {isDeptExpanded ? <FolderOpen className="w-5 h-5 text-indigo-500" /> : <Folder className="w-5 h-5 text-indigo-500" />}
                        <span className="font-semibold text-slate-800">{dept}</span>
                        <span className="ml-auto text-xs font-medium bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                          {Object.values(batches).flat().length} Students
                        </span>
                      </button>

                      <AnimatePresence>
                        {isDeptExpanded && (
                          <motion.div 
                            initial={{ height: 0 }} 
                            animate={{ height: 'auto' }} 
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-2 space-y-2">
                              {Object.entries(batches)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([batch, studentsInBatch]) => {
                                  const batchNodeId = `${dept}-${batch}`;
                                  const isBatchExpanded = expandedNodes[batchNodeId] !== false; // Default true
                                  return (
                                    <div key={batch} className="ml-6 bg-slate-50/50 border border-slate-100 rounded-lg overflow-hidden">
                                      <button 
                                        onClick={() => toggleNode(batchNodeId)}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 transition-colors border-b border-slate-100"
                                      >
                                        {isBatchExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                        {isBatchExpanded ? <FolderOpen className="w-4 h-4 text-blue-400" /> : <Folder className="w-4 h-4 text-blue-400" />}
                                        <span className="font-medium text-slate-700 text-sm">{batch}</span>
                                        <span className="ml-auto text-[10px] font-medium bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full">
                                          {studentsInBatch.length}
                                        </span>
                                      </button>
                                      
                                      <AnimatePresence>
                                        {isBatchExpanded && (
                                          <motion.div 
                                            initial={{ height: 0 }} 
                                            animate={{ height: 'auto' }} 
                                            exit={{ height: 0 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="p-2">
                                              <div className="ml-6 space-y-1 relative before:absolute before:inset-y-2 before:left-[-15px] before:w-px before:bg-slate-200">
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
                                                  <div key={student.id} onClick={() => setSelectedStudent(student)} className="cursor-pointer relative flex items-center justify-between p-2 hover:bg-white rounded-lg group transition-colors before:absolute before:top-1/2 before:left-[-15px] before:w-[11px] before:h-px before:bg-slate-200">
                                                    <div className="flex items-center gap-3">
                                                      <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0 border border-indigo-100">
                                                        {student.name.charAt(0)}
                                                      </div>
                                                      <div>
                                                        <p className="font-medium text-slate-800 text-sm">{student.name}</p>
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                                          <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">{student.id}</span>
                                                          <span>•</span>
                                                          <span className="flex items-center gap-0.5"><Mail className="w-2.5 h-2.5" /> {student.email}</span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                        student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                                      }`}>
                                                        {student.status}
                                                      </span>
                                                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                                        {student.cgpa?.toFixed(2) || '0.00'}
                                                      </span>
                                                      <button className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-all">
                                                        <MoreVertical className="w-3.5 h-3.5" />
                                                      </button>
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
              className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 w-full max-w-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white text-center relative">
                <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <div className="w-20 h-20 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold text-3xl mx-auto shadow-lg mb-3">
                  {selectedStudent.name.charAt(0)}
                </div>
                <h3 className="text-2xl font-bold">{selectedStudent.name}</h3>
                <p className="text-blue-100 font-medium">{selectedStudent.department} • Batch {selectedStudent.batch}</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Student ID</p>
                    <p className="font-semibold text-slate-800">{selectedStudent.id}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Status</p>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      selectedStudent.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedStudent.status}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Email Address</p>
                  <p className="font-medium text-slate-800 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {selectedStudent.email}
                  </p>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Current CGPA</p>
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
              className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Add New Student</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white/50 rounded-full p-1 border border-slate-200/50">
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
                  <input 
                    type="text" required 
                    value={newStudent.id} onChange={e => setNewStudent({...newStudent, id: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 0742420005101007"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input 
                    type="text" required 
                    value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input 
                    type="email" required 
                    value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="john.doe@unixx.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input 
                    type="password" required 
                    value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Set student password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Batch</label>
                  <input 
                    type="text" required 
                    value={newStudent.batch} onChange={e => setNewStudent({...newStudent, batch: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select 
                    required 
                    value={newStudent.department} onChange={e => setNewStudent({...newStudent, department: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700"
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
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
    </div>
  );
}
