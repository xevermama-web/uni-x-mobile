import re
import os

file_path = 'src/components/layout/DashboardLayout.tsx'
with open(file_path, 'r') as f:
    content = f.read()

old_code = """  const adminOnlyPaths = ['/dashboard/students', '/dashboard/faculty', '/dashboard/moderators', '/dashboard/departments', '/dashboard/notices', '/dashboard/routines', '/dashboard/analytics'];
  const isAdminRoute = adminOnlyPaths.some(p => location.pathname.startsWith(p));
  
  if (isAdminRoute && role !== 'admin') {
    // Redirect to student dashboard if they try to access admin routes
    navigate('/dashboard');
    return null;
  }"""

new_code = """  const adminOnlyPaths = ['/dashboard/students', '/dashboard/faculty', '/dashboard/moderators', '/dashboard/departments', '/dashboard/notices', '/dashboard/routines', '/dashboard/analytics'];
  const isAdminRoute = adminOnlyPaths.some(p => location.pathname.startsWith(p));
  
  useEffect(() => {
    if (isAdminRoute && role !== 'admin' && role !== 'faculty' && role !== 'moderator') {
      navigate('/dashboard');
    }
  }, [isAdminRoute, role, navigate]);
  
  if (isAdminRoute && role !== 'admin' && role !== 'faculty' && role !== 'moderator') {
    return null;
  }"""

content = content.replace(old_code, new_code)

with open(file_path, 'w') as f:
    f.write(content)
