import re
import os

file_path = 'src/hooks/useDepartments.ts'
with open(file_path, 'r') as f:
    content = f.read()

# Replace fallback
old_code = """      if (data && data.length > 0) {
        setDepartments(data.map((d: any) => ({ ...d, head: d.head_name, facultyCount: d.facultyCount || 0, studentCount: d.studentCount || 0 })));
      } else {
        // Fallback to default if empty database for demo purposes
        setDepartments(DEFAULT_DEPARTMENTS);
      }"""
new_code = """      if (data && data.length > 0) {
        setDepartments(data.map((d: any) => ({ ...d, head: d.head_name, facultyCount: d.facultyCount || 0, studentCount: d.studentCount || 0 })));
      } else {
        setDepartments([]);
      }"""
content = content.replace(old_code, new_code)

old_code2 = """    } catch (err) {
      console.error("Failed to fetch departments:", err);
      // Fallback
      setDepartments(DEFAULT_DEPARTMENTS);
    } finally {"""
new_code2 = """    } catch (err) {
      console.error("Failed to fetch departments:", err);
      setDepartments([]);
    } finally {"""
content = content.replace(old_code2, new_code2)

with open(file_path, 'w') as f:
    f.write(content)
