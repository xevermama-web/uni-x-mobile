import re
import os

file_path = 'src/pages/dashboard/StudentMaterials.tsx'
with open(file_path, 'r') as f:
    content = f.read()

content = content.replace("user.user_metadata?.semester", "user.user_metadata?.batch")
content = content.replace("studentSemester", "studentBatch")
content = content.replace("semester, and course.", "batch, and course.")
content = content.replace("their department and semester.", "their department and batch.")

with open(file_path, 'w') as f:
    f.write(content)
