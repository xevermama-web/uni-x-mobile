import re
import os

file_path = 'src/pages/dashboard/ManageStudents.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Add import
if 'useBatches' not in content:
    content = content.replace("import { useStudents } from '../../hooks/useStudents';", "import { useStudents } from '../../hooks/useStudents';\nimport { useBatches } from '../../hooks/useBatches';")

# Add state
if 'isCreatingNewBatch' not in content:
    state_anchor = "const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);"
    content = content.replace(state_anchor, state_anchor + "\n  const [isCreatingNewBatch, setIsCreatingNewBatch] = useState(false);\n  const { batches: formBatches, loading: formBatchesLoading } = useBatches(newStudent.department);\n  const { batches: filterBatches } = useBatches(filterDept);")

# Update batch input in add modal
old_batch_add = """                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Batch</label>
                  <input 
                    type="text" required 
                    value={newStudent.batch} onChange={e => setNewStudent({...newStudent, batch: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 2024"
                  />
                </div>"""
new_batch_add = """                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Batch</label>
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
                      className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                        className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Enter new batch name (e.g. 2024)"
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsCreatingNewBatch(false);
                          setNewStudent({...newStudent, batch: ''});
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  {!newStudent.department && !isCreatingNewBatch && (
                    <p className="text-xs text-slate-500 mt-1">Please select a department first.</p>
                  )}
                </div>"""
content = content.replace(old_batch_add, new_batch_add)

# Update reset logic in handleAddStudent
old_add_reset = """      setNewStudent({ id: '', name: '', email: '', department: '', batch: '', password: '' });
      setIsAddModalOpen(false);"""
new_add_reset = """      setNewStudent({ id: '', name: '', email: '', department: '', batch: '', password: '' });
      setIsCreatingNewBatch(false);
      setIsAddModalOpen(false);"""
content = content.replace(old_add_reset, new_add_reset)

# Update batch filter options
old_filter_options = """              {Array.from(new Set(students.map(s => s.batch).filter(Boolean))).sort().map(b => (
                <option key={b} value={b}>{b}</option>
              ))}"""
new_filter_options = """              {filterBatches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}"""
content = content.replace(old_filter_options, new_filter_options)

with open(file_path, 'w') as f:
    f.write(content)
