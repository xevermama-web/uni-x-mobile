import re
import os

file_path = 'src/pages/dashboard/ManageMaterials.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Remove the line from current position
content = content.replace("  const { batches: newMaterialBatches } = useBatches(newMaterial.department);\n", "")
content = content.replace("  const { batches: editMaterialBatches } = useBatches(editingMaterial?.department);\n", "")

# Insert it after newMaterial declaration
state_anchor = "  const [newMaterial, setNewMaterial] = useState({"
content = content.replace(state_anchor, "  const { batches: newMaterialBatches } = useBatches(newMaterial?.department);\n  const { batches: editMaterialBatches } = useBatches(editingMaterial?.department);\n" + state_anchor)

with open(file_path, 'w') as f:
    f.write(content)
