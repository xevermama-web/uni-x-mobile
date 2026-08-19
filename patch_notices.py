import re
import os

file_path = 'src/hooks/useNotices.ts'
with open(file_path, 'r') as f:
    content = f.read()

# Remove mapping of expires_at
content = content.replace("          expiresAt: n.expires_at,\n", "")

# Remove inserting expires_at
content = content.replace("        expires_at: newNotice.expiresAt,\n", "")

# Remove updating expires_at
content = content.replace("      if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt;\n", "")

with open(file_path, 'w') as f:
    f.write(content)
