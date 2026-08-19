import re
import os

file_path = 'src/hooks/useMaterials.ts'
with open(file_path, 'r') as f:
    content = f.read()

# Replace semester with batch
content = content.replace("semester: string;", "batch: string;")
content = content.replace("semesterFilter?: string", "batchFilter?: string")
content = content.replace("semesterFilter", "batchFilter")
content = content.replace("query.eq('semester'", "query.eq('batch'")
content = content.replace("departmentFilter, batchFilter, courseFilter", "departmentFilter, batchFilter, courseFilter")

with open(file_path, 'w') as f:
    f.write(content)
