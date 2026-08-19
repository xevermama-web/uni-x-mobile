import re

with open('src/components/layout/DashboardLayout.tsx', 'r') as f:
    content = f.read()

old_return = """  return (
    <div className="min-h-screen font-sans flex relative overflow-hidden bg-slate-50">"""

new_return = """  // Admin route guard
  const adminOnlyPaths = ['/dashboard/students', '/dashboard/faculty', '/dashboard/moderators', '/dashboard/departments', '/dashboard/notices', '/dashboard/routines', '/dashboard/analytics'];
  const isAdminRoute = adminOnlyPaths.some(p => location.pathname.startsWith(p));
  
  if (isAdminRoute && role !== 'admin') {
    // Redirect to student dashboard if they try to access admin routes
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen font-sans flex relative overflow-hidden bg-slate-50">"""

content = content.replace(old_return, new_return)

with open('src/components/layout/DashboardLayout.tsx', 'w') as f:
    f.write(content)

