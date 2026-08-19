import re
import os

file_path = 'src/hooks/useNotices.ts'
with open(file_path, 'r') as f:
    content = f.read()

# Replace dbNotice in addNotice
old_db_notice = """      const dbNotice: any = {
        title: newNotice.title,
        content: newNotice.content,
        type: newNotice.type,
        department_id: newNotice.department,
        tag: newNotice.tag,
        tag_color: newNotice.tagColor,
        author_id: user?.id
      };"""
new_db_notice = """      const dbNotice: any = {
        title: newNotice.title,
        content: newNotice.content,
        department_id: newNotice.department === 'ALL' ? null : newNotice.department,
        author_id: user?.id
      };"""
content = content.replace(old_db_notice, new_db_notice)

# Replace dbUpdates in updateNotice
old_db_updates = """      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.department !== undefined) dbUpdates.department_id = updates.department;
      if (updates.tag !== undefined) dbUpdates.tag = updates.tag;
      if (updates.tagColor !== undefined) dbUpdates.tag_color = updates.tagColor;"""
new_db_updates = """      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.department !== undefined) dbUpdates.department_id = updates.department === 'ALL' ? null : updates.department;"""
content = content.replace(old_db_updates, new_db_updates)

with open(file_path, 'w') as f:
    f.write(content)
