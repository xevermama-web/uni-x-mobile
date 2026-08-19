import re
import os

file_path = 'src/pages/dashboard/ManageMaterials.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Import useStudents
content = content.replace("import { useDepartments } from '../../hooks/useDepartments';", 
                          "import { useDepartments } from '../../hooks/useDepartments';\nimport { useStudents } from '../../hooks/useStudents';")

# 2. Add useStudents hook
content = content.replace("const { departments, loading: deptsLoading } = useDepartments();", 
                          "const { departments, loading: deptsLoading } = useDepartments();\n  const { students } = useStudents();\n  const existingBatches = Array.from(new Set(students.map(s => s.batch).filter(Boolean)));")

# 3. Replace semester with batch
content = content.replace("semester: '',", "batch: '',")
content = content.replace("semester: newMaterial.semester,", "batch: newMaterial.batch,")
content = content.replace("semester: '', course: ''", "batch: '', course: ''")
content = content.replace("semester: editingMaterial.semester,", "batch: editingMaterial.batch,")
content = content.replace("{material.semester}", "{material.batch}")

# 4. Replace the semester input with batch input + datalist
batch_input = """                      <label className="block text-sm font-medium text-slate-700 mb-1">Batch (comma separated for multiple)</label>
                      <input
                        type="text"
                        required
                        list="existing-batches"
                        value={newMaterial.batch}
                        onChange={(e) => setNewMaterial({ ...newMaterial, batch: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="e.g. Fall 2024, Spring 2025"
                      />
                      <datalist id="existing-batches">
                        {existingBatches.map(batch => (
                          <option key={batch} value={batch} />
                        ))}
                      </datalist>"""
                      
old_semester_input = """                      <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                      <input
                        type="text"
                        required
                        value={newMaterial.semester}
                        onChange={(e) => setNewMaterial({ ...newMaterial, semester: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="e.g. Fall 2024"
                      />"""

content = content.replace(old_semester_input, batch_input)

edit_batch_input = """                      <label className="block text-sm font-medium text-slate-700 mb-1">Batch (comma separated for multiple)</label>
                      <input
                        type="text"
                        required
                        list="existing-batches-edit"
                        value={editingMaterial.batch}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, batch: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <datalist id="existing-batches-edit">
                        {existingBatches.map(batch => (
                          <option key={batch} value={batch} />
                        ))}
                      </datalist>"""
                      
old_edit_semester_input = """                      <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                      <input
                        type="text"
                        required
                        value={editingMaterial.semester}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, semester: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />"""

content = content.replace(old_edit_semester_input, edit_batch_input)
content = content.replace('<th className="p-4 font-medium hidden lg:table-cell">Semester</th>', '<th className="p-4 font-medium hidden lg:table-cell">Batch</th>')

with open(file_path, 'w') as f:
    f.write(content)
