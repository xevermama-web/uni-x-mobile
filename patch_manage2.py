import re

with open('src/pages/dashboard/ManageStudents.tsx', 'r') as f:
    content = f.read()

# Add icons
content = content.replace(
    "FolderOpen } from 'lucide-react';",
    "FolderOpen, Edit, Trash2, Key, CheckCircle2 } from 'lucide-react';"
)

# Add hooks
content = content.replace(
    "const { students, loading: studentsLoading, fetchError: studentsFetchError, addStudent } = useStudents();",
    "const { students, loading: studentsLoading, fetchError: studentsFetchError, addStudent, updateStudent, deleteStudent, resetStudentPassword } = useStudents();"
)

# Add states
state_declarations = """  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes]"""

content = content.replace(
    "  const [expandedNodes, setExpandedNodes]",
    state_declarations
)

# Add handler functions right after handleAddStudent
handlers = """  const handleEditStudent = async (e: React.FormEvent) => {
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

  const handleResetPassword = async () => {
    setIsSubmitting(true);
    setError(null);
    
    const { error: resetError } = await resetStudentPassword(studentToEdit.email);
    
    if (resetError) {
      setError(resetError.message || 'Failed to send reset link');
    } else {
      setIsResetPassModalOpen(false);
      setSuccessMessage('Password reset link sent to student email');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setIsSubmitting(false);
  };"""

content = content.replace(
    "  const handleAddStudent = async (e: React.FormEvent) => {",
    handlers + "\n\n  const handleAddStudent = async (e: React.FormEvent) => {"
)

action_menu_ui = """                                                      <div className="relative">
                                                        <button 
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActionMenuOpen(actionMenuOpen === student.id ? null : student.id);
                                                          }}
                                                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-all"
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
                                                            className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20"
                                                            onClick={(e) => e.stopPropagation()}
                                                          >
                                                            <button
                                                              onClick={() => {
                                                                setStudentToEdit(student);
                                                                setIsEditModalOpen(true);
                                                                setActionMenuOpen(null);
                                                              }}
                                                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                            >
                                                              <Edit className="w-4 h-4" /> Edit
                                                            </button>
                                                            <button
                                                              onClick={() => {
                                                                setStudentToEdit(student);
                                                                setIsResetPassModalOpen(true);
                                                                setActionMenuOpen(null);
                                                              }}
                                                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
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
                                                      </div>"""

content = re.sub(
    r'<button className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-all">.*?<MoreVertical className="w-3\.5 h-3\.5" />.*?</button>',
    action_menu_ui,
    content,
    flags=re.DOTALL
)

modals_ui = """      {/* Success Message */}
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
              className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Edit Student</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white/50 rounded-full p-1 border border-slate-200/50">
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input 
                    type="text" required 
                    value={studentToEdit.name} onChange={e => setStudentToEdit({...studentToEdit, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Academic ID</label>
                  <input 
                    type="text" required 
                    value={studentToEdit.id} onChange={e => setStudentToEdit({...studentToEdit, id: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input 
                    type="email" required 
                    value={studentToEdit.email} onChange={e => setStudentToEdit({...studentToEdit, email: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                    <select
                      value={studentToEdit.department} onChange={e => setStudentToEdit({...studentToEdit, department: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    >
                      <option value="">Select Dept</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Batch</label>
                    <input 
                      type="text" required 
                      value={studentToEdit.batch} onChange={e => setStudentToEdit({...studentToEdit, batch: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
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
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Student?</h3>
              <p className="text-sm text-slate-500 mb-6">
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
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
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
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Reset Password</h3>
              <p className="text-sm text-slate-500 mb-6">
                Send a password reset email to <strong>{studentToEdit.email}</strong>?
              </p>
              
              {error && (
                <div className="bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-200 mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setIsResetPassModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
"""

content = content.replace(
    "    </div>\n  );\n}",
    modals_ui
)

with open('src/pages/dashboard/ManageStudents.tsx', 'w') as f:
    f.write(content)
