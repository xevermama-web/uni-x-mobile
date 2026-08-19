import re
import os

file_path = 'src/pages/dashboard/ManageStudents.tsx'
with open(file_path, 'r') as f:
    content = f.read()

content = content.replace("const { batches: formBatches, loading: formBatchesLoading } = useBatches(newStudent.department);", "const { batches: formBatches, loading: formBatchesLoading, fetchBatches: fetchFormBatches } = useBatches(newStudent.department);")
content = content.replace("const { batches: filterBatches } = useBatches(filterDept);", "const { batches: filterBatches, fetchBatches: fetchFilterBatches } = useBatches(filterDept);")

old_add_success = """      setNewStudent({ id: '', name: '', email: '', department: '', batch: '', password: '' });
      setIsCreatingNewBatch(false);
      setIsAddModalOpen(false);"""
new_add_success = """      setNewStudent({ id: '', name: '', email: '', department: '', batch: '', password: '' });
      setIsCreatingNewBatch(false);
      setIsAddModalOpen(false);
      fetchFormBatches();
      fetchFilterBatches();"""
content = content.replace(old_add_success, new_add_success)

old_edit_success = """      setIsEditModalOpen(false);
      setStudentToEdit(null);"""
new_edit_success = """      setIsEditModalOpen(false);
      setStudentToEdit(null);
      fetchFilterBatches();"""
content = content.replace(old_edit_success, new_edit_success)

with open(file_path, 'w') as f:
    f.write(content)
