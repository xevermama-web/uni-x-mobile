import re
import os

file_path = 'src/pages/dashboard/ManageMaterials.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Remove the lines
content = content.replace("  const { batches: newMaterialBatches } = useBatches(newMaterial?.department);\n", "")
content = content.replace("  const { batches: editMaterialBatches } = useBatches(editingMaterial?.department);\n", "")

# Insert them after newMaterial
anchor = """  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    department: '',
    batch: '',
    course: ''
  });"""
content = content.replace(anchor, anchor + "\n  const { batches: newMaterialBatches } = useBatches(newMaterial?.department);\n  const { batches: editMaterialBatches } = useBatches(editingMaterial?.department);")

with open(file_path, 'w') as f:
    f.write(content)
