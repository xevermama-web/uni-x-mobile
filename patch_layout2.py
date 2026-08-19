import re
import os

file_path = 'src/components/layout/DashboardLayout.tsx'
with open(file_path, 'r') as f:
    content = f.read()

old_code = """  const adminOnlyPaths = ['/dashboard/students', '/dashboard/faculty', '/dashboard/moderators', '/dashboard/departments', '/dashboard/notices', '/dashboard/routines', '/dashboard/analytics'];
  const isAdminRoute = adminOnlyPaths.some(p => location.pathname.startsWith(p));
  
  useEffect(() => {
    if (isAdminRoute && role !== 'admin' && role !== 'faculty' && role !== 'moderator') {
      navigate('/dashboard');
    }
  }, [isAdminRoute, role, navigate]);
  
  if (isAdminRoute && role !== 'admin' && role !== 'faculty' && role !== 'moderator') {
    return null;
  }"""

new_code = """  // Allow components to handle their own access control or just basic role checks
  const restrictedPaths = ['/dashboard/moderators', '/dashboard/analytics'];
  const isRestrictedRoute = restrictedPaths.some(p => location.pathname.startsWith(p));
  
  useEffect(() => {
    if (isRestrictedRoute && role !== 'admin') {
      navigate('/dashboard');
    }
  }, [isRestrictedRoute, role, navigate]);
  
  if (isRestrictedRoute && role !== 'admin') {
    return null;
  }"""

content = content.replace(old_code, new_code)

with open(file_path, 'w') as f:
    f.write(content)
