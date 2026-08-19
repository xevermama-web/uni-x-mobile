import re

with open('src/hooks/useMaterials.ts', 'r') as f:
    content = f.read()

if "editMaterial" not in content:
    content = content.replace(
        "const deleteMaterial",
        "const editMaterial = async (id: string, updates: Partial<CourseMaterial>) => {\n    const { data, error } = await supabase.from('course_materials').update(updates).eq('id', id).select().single();\n    if (!error && data) {\n      setMaterials(materials.map(m => m.id === id ? data : m));\n    }\n    return { data, error };\n  };\n\n  const deleteMaterial"
    )
    content = content.replace(
        "return { materials, loading, addMaterial, deleteMaterial, fetchMaterials, getPublicUrl };",
        "return { materials, loading, addMaterial, editMaterial, deleteMaterial, fetchMaterials, getPublicUrl };"
    )

with open('src/hooks/useMaterials.ts', 'w') as f:
    f.write(content)

with open('src/pages/dashboard/ManageMaterials.tsx', 'r') as f:
    content = f.read()

if "isEditModalOpen" not in content:
    content = content.replace(
        "const { materials, loading, addMaterial, deleteMaterial, getPublicUrl } = useMaterials(selectedDept);",
        "const { materials, loading, addMaterial, editMaterial, deleteMaterial, getPublicUrl } = useMaterials(selectedDept);"
    )
    content = content.replace(
        "const [isSubmitting, setIsSubmitting] = useState(false);",
        "const [isSubmitting, setIsSubmitting] = useState(false);\n  const [isEditModalOpen, setIsEditModalOpen] = useState(false);\n  const [editingMaterial, setEditingMaterial] = useState<any>(null);"
    )

    handle_edit = """
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const { error: err } = await editMaterial(editingMaterial.id, {
      title: editingMaterial.title,
      description: editingMaterial.description,
      department: editingMaterial.department,
      semester: editingMaterial.semester,
      course: editingMaterial.course
    });
    setIsSubmitting(false);
    if (!err) {
      setIsEditModalOpen(false);
      setEditingMaterial(null);
    } else {
      setError(err.message || 'Failed to update material');
    }
  };
"""
    content = content.replace(
        "const handleDelete = async",
        handle_edit + "\n  const handleDelete = async"
    )
    
    # Add Edit button
    edit_btn = """
                          {canEdit && (
                            <button
                              onClick={() => { setEditingMaterial(material); setIsEditModalOpen(true); }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                          )}
"""
    content = content.replace(
        "{canEdit && (",
        edit_btn + "\n                          {canEdit && ("
    )

    # Add Edit Modal rendering (simple duplicate of Add Modal with modifications)
    content = content.replace(
        "import { BookOpen, Search, Plus, X, Trash2, FileText, Download, FileArchive, File, UploadCloud, AlertCircle } from 'lucide-react';",
        "import { BookOpen, Search, Plus, X, Trash2, Edit2, FileText, Download, FileArchive, File, UploadCloud, AlertCircle } from 'lucide-react';"
    )

    # I'll just append it before `</div>\n  );\n}`
    edit_modal = """
      <AnimatePresence>
        {isEditModalOpen && editingMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => !isSubmitting && setIsEditModalOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Edit Material</h2>
                  <p className="text-sm text-slate-500 mt-1">Update details for this material</p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="edit-form" onSubmit={handleEdit} className="space-y-4">
                  {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>{error}</div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={editingMaterial.title}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                      value={editingMaterial.description || ''}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-24"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                      <select
                        required
                        value={editingMaterial.department}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, department: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      >
                        <option value="">Select Dept</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                      <input
                        type="text"
                        required
                        value={editingMaterial.semester}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, semester: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Course Name/Code</label>
                    <input
                      type="text"
                      required
                      value={editingMaterial.course}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, course: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-form"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
"""
    content = content.replace("</AnimatePresence>\n    </div>", "</AnimatePresence>\n" + edit_modal + "    </div>")
    
with open('src/pages/dashboard/ManageMaterials.tsx', 'w') as f:
    f.write(content)

