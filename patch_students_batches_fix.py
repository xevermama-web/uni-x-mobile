import re
import os

file_path = 'src/pages/dashboard/ManageStudents.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Remove the line from current position
content = content.replace("  const { batches: editBatches, loading: editBatchesLoading } = useBatches(studentToEdit?.department);\n", "")

# Insert it after studentToEdit declaration
state_anchor = "const [studentToEdit, setStudentToEdit] = useState<any>(null);"
content = content.replace(state_anchor, state_anchor + "\n  const { batches: editBatches, loading: editBatchesLoading, fetchBatches: fetchEditBatches } = useBatches(studentToEdit?.department);")

with open(file_path, 'w') as f:
    f.write(content)
