import re
import os

file_path = 'src/pages/dashboard/StudentMaterials.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Update dept name lookups
old_dept_map = """const deptName = departments.find(d => d.id === material.department)?.name || material.department;"""
new_dept_map = """const deptName = material.department;"""
content = content.replace(old_dept_map, new_dept_map)

with open(file_path, 'w') as f:
    f.write(content)
