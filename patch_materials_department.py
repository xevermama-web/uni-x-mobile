import re
import os

file_path = 'src/pages/dashboard/ManageMaterials.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Update dept name lookups
old_dept_map = """const deptName = departments.find(d => d.id === material.department)?.name || material.department;"""
new_dept_map = """const deptName = material.department;"""
content = content.replace(old_dept_map, new_dept_map)

# Change dept selects to use name instead of id
old_select_add = """                      <select
                        required
                        value={newMaterial.department}
                        onChange={(e) => setNewMaterial({ ...newMaterial, department: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="" disabled>Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>"""
new_select_add = """                      <select
                        required
                        value={newMaterial.department}
                        onChange={(e) => setNewMaterial({ ...newMaterial, department: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="" disabled>Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.name}>{dept.name}</option>
                        ))}
                      </select>"""
content = content.replace(old_select_add, new_select_add)

old_select_edit = """                      <select
                        required
                        value={editingMaterial.department}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, department: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="" disabled>Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>"""
new_select_edit = """                      <select
                        required
                        value={editingMaterial.department}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, department: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="" disabled>Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.name}>{dept.name}</option>
                        ))}
                      </select>"""
content = content.replace(old_select_edit, new_select_edit)

with open(file_path, 'w') as f:
    f.write(content)
