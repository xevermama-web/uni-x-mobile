import re
import os

file_path = 'src/pages/dashboard/ManageDepartments.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Replace newDepartment initial state
content = content.replace("useState({ id: '', name: '', head: '' })", "useState({ id: 'new', name: '', head: '' })")
content = content.replace("setNewDepartment({ id: '', name: '', head: '' })", "setNewDepartment({ id: 'new', name: '', head: '' })")

# Remove the ID input from Add Modal
id_input_add = """                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department Code</label>
                  <input 
                    type="text" required 
                    value={newDepartment.id} onChange={e => setNewDepartment({...newDepartment, id: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                    placeholder="e.g. CE"
                  />
                </div>"""
content = content.replace(id_input_add, "")

# Remove the ID input from Edit Modal
id_input_edit = """                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department Code</label>
                  <input 
                    type="text" required disabled
                    value={editingDepartment.id}
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed uppercase"
                  />
                </div>"""
content = content.replace(id_input_edit, "")

with open(file_path, 'w') as f:
    f.write(content)
