import re
import os

file_path = 'src/pages/dashboard/ManageStudents.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Update department select mapping
old_dept_map = """                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}"""
new_dept_map = """                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}"""
content = content.replace(old_dept_map, new_dept_map)

# Replace the department ID usage with the department name in batches hook
old_batch_hook1 = "const { batches: formBatches, loading: formBatchesLoading, fetchBatches: fetchFormBatches } = useBatches(newStudent.department);"
new_batch_hook1 = "const { batches: formBatches, loading: formBatchesLoading, fetchBatches: fetchFormBatches } = useBatches(newStudent.department);"

with open(file_path, 'w') as f:
    f.write(content)
