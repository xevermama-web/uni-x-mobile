import re

with open('src/hooks/useStudents.ts', 'r') as f:
    content = f.read()

old_fetch = """      const response = await fetch('/api/admin-reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: profileId, newPassword }),
      });"""

new_fetch = """      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/admin-reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userId: profileId, newPassword }),
      });"""

content = content.replace(old_fetch, new_fetch)

with open('src/hooks/useStudents.ts', 'w') as f:
    f.write(content)

