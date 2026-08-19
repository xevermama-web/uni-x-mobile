import re
import os

files = [
    'src/components/layout/DashboardLayout.tsx',
    'src/components/layout/FacultyDashboardLayout.tsx',
    'src/components/layout/ModeratorDashboardLayout.tsx'
]

for file in files:
    if not os.path.exists(file): continue
    with open(file, 'r') as f:
        content = f.read()

    # DashboardLayout
    if file == 'src/components/layout/DashboardLayout.tsx':
        auth_change_code = """    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (localStorage.getItem('unixx_admin_session') === 'true') return;
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') return;
      
      if (_event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/login');
      } else if (session?.user && _event === 'SIGNED_IN') {
        fetchUserRole(session.user);
      }
    });"""
        content = re.sub(r'    const \{ data: \{ subscription \} \} = supabase.auth.onAuthStateChange\(\(_event, session\) => \{.*?\n    \}\);', auth_change_code, content, flags=re.DOTALL)

    # FacultyDashboardLayout
    if file == 'src/components/layout/FacultyDashboardLayout.tsx':
        auth_change_code = """    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (localStorage.getItem('unixx_faculty_session')) return;
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') return;
      
      if (_event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/login');
      }
    });"""
        content = re.sub(r'    const \{ data: \{ subscription \} \} = supabase.auth.onAuthStateChange\(\(_event, session\) => \{.*?\n    \}\);', auth_change_code, content, flags=re.DOTALL)

    # ModeratorDashboardLayout
    if file == 'src/components/layout/ModeratorDashboardLayout.tsx':
        auth_change_code = """    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (localStorage.getItem('unixx_moderator_session')) return;
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') return;
      
      if (_event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/login');
      }
    });"""
        content = re.sub(r'    const \{ data: \{ subscription \} \} = supabase.auth.onAuthStateChange\(\(_event, session\) => \{.*?\n    \}\);', auth_change_code, content, flags=re.DOTALL)

    with open(file, 'w') as f:
        f.write(content)
