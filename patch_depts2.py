import re
import os

file_path = 'src/hooks/useDepartments.ts'
with open(file_path, 'r') as f:
    content = f.read()

# Replace dbDept
old_dbdept = """      const dbDept = {
        id: dept.id,
        name: dept.name,
        head_name: dept.head
      };"""
new_dbdept = """      const dbDept = {
        name: dept.name,
      };"""
content = content.replace(old_dbdept, new_dbdept)

# Replace head_name references
content = content.replace("head: d.head_name", "head: ''")
content = content.replace("head: data[0].head_name", "head: ''")

# Replace edit updates
old_updates = """      const dbUpdates: any = { ...updates };
      delete dbUpdates.facultyCount;
      delete dbUpdates.studentCount;
      if (dbUpdates.head !== undefined) {
        dbUpdates.head_name = dbUpdates.head;
        delete dbUpdates.head;
      }"""
new_updates = """      const dbUpdates: any = { ...updates };
      delete dbUpdates.facultyCount;
      delete dbUpdates.studentCount;
      delete dbUpdates.head;
      delete dbUpdates.id;"""
content = content.replace(old_updates, new_updates)

with open(file_path, 'w') as f:
    f.write(content)
