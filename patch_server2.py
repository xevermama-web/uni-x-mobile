import re

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace("app.post('/api/admin/reset-password'", "app.post('/api/admin-reset-password'")

with open('server.ts', 'w') as f:
    f.write(content)

with open('src/hooks/useStudents.ts', 'r') as f:
    use_students = f.read()

use_students = use_students.replace("fetch('/api/admin/reset-password'", "fetch('/api/admin-reset-password'")

with open('src/hooks/useStudents.ts', 'w') as f:
    f.write(use_students)
