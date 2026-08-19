import re
import os

file_path = 'src/hooks/useNotices.ts'
with open(file_path, 'r') as f:
    content = f.read()

# Update fetchNotices to map department
old_fetch_notices = """        const mapped = data.map((n: any) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          type: n.type || 'text',
          department: n.department_id || 'ALL',
          createdAt: n.created_at,
          tag: n.tag || 'INFO',
          tagColor: n.tag_color || 'bg-blue-100 text-blue-800'
        }));"""
new_fetch_notices = """        const mapped = data.map((n: any) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          type: n.type || 'text',
          department: n.department || 'ALL',
          createdAt: n.created_at,
          tag: n.tag || 'INFO',
          tagColor: n.tag_color || 'bg-blue-100 text-blue-800'
        }));"""
content = content.replace(old_fetch_notices, new_fetch_notices)

old_add_notice = """      const dbNotice: any = {
        title: newNotice.title,
        content: newNotice.content,
        department_id: newNotice.department === 'ALL' ? null : newNotice.department,
        author_id: user?.id
      };"""
new_add_notice = """      const dbNotice: any = {
        title: newNotice.title,
        content: newNotice.content,
        department: newNotice.department === 'ALL' ? null : newNotice.department,
        author_id: user?.id
      };"""
content = content.replace(old_add_notice, new_add_notice)

old_update_notice = """      if (updates.department !== undefined) dbUpdates.department_id = updates.department === 'ALL' ? null : updates.department;"""
new_update_notice = """      if (updates.department !== undefined) dbUpdates.department = updates.department === 'ALL' ? null : updates.department;"""
content = content.replace(old_update_notice, new_update_notice)

with open(file_path, 'w') as f:
    f.write(content)
