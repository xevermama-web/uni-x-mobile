import re
import os

file_path = 'src/pages/dashboard/ManageMaterials.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Add import
if 'useBatches' not in content:
    content = content.replace("import { useStudents } from '../../hooks/useStudents';", "import { useStudents } from '../../hooks/useStudents';\nimport { useBatches } from '../../hooks/useBatches';")

# Remove students hook if not used elsewhere, or just keep it
content = content.replace("const existingBatches = Array.from(new Set(students.map(s => s.batch).filter(Boolean)));", "")

# Add hooks
state_anchor = "const [editingMaterial, setEditingMaterial] = useState<any>(null);"
content = content.replace(state_anchor, state_anchor + "\n  const { batches: newMaterialBatches } = useBatches(newMaterial.department);\n  const { batches: editMaterialBatches } = useBatches(editingMaterial?.department);")

# Update new material batch datalist
old_new_batch = """                      <datalist id="existing-batches">
                        {existingBatches.map(batch => (
                          <option key={batch} value={batch} />
                        ))}
                      </datalist>"""
new_new_batch = """                      <datalist id="existing-batches">
                        {newMaterialBatches.map(batch => (
                          <option key={batch} value={batch} />
                        ))}
                      </datalist>"""
content = content.replace(old_new_batch, new_new_batch)

# Update edit material batch datalist
old_edit_batch = """                      <datalist id="existing-batches-edit">
                        {existingBatches.map(batch => (
                          <option key={batch} value={batch} />
                        ))}
                      </datalist>"""
new_edit_batch = """                      <datalist id="existing-batches-edit">
                        {editMaterialBatches.map(batch => (
                          <option key={batch} value={batch} />
                        ))}
                      </datalist>"""
content = content.replace(old_edit_batch, new_edit_batch)

with open(file_path, 'w') as f:
    f.write(content)
