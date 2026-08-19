import re
import os

file_path = 'src/pages/dashboard/ManageStudents.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Add edit state
if 'isEditingNewBatch' not in content:
    state_anchor = "const [isCreatingNewBatch, setIsCreatingNewBatch] = useState(false);"
    content = content.replace(state_anchor, state_anchor + "\n  const [isEditingNewBatch, setIsEditingNewBatch] = useState(false);\n  const { batches: editBatches, loading: editBatchesLoading } = useBatches(studentToEdit?.department);")

# Update batch input in edit modal
old_batch_edit = """                    <input 
                      type="text" required 
                      value={studentToEdit.batch} onChange={e => setStudentToEdit({...studentToEdit, batch: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />"""
new_batch_edit = """                    {!isEditingNewBatch ? (
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
                        className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                          className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="Enter new batch name (e.g. 2024)"
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsEditingNewBatch(false);
                            setStudentToEdit({...studentToEdit, batch: ''});
                          }}
                          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}"""
content = content.replace(old_batch_edit, new_batch_edit)

with open(file_path, 'w') as f:
    f.write(content)
