import re
import os

file_path = 'src/pages/dashboard/ManageNotices.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Update dept name lookups
old_dept_map = """{notice.department === 'ALL' ? 'All Departments' : departments.find(d => d.id === notice.department)?.name || notice.department}"""
new_dept_map = """{notice.department === 'ALL' ? 'All Departments' : notice.department}"""
content = content.replace(old_dept_map, new_dept_map)

# Change dept selects to use name instead of id
old_select_add = """                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}"""
new_select_add = """                      {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}"""
content = content.replace(old_select_add, new_select_add)

with open(file_path, 'w') as f:
    f.write(content)
