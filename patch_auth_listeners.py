import re
import os

files = [
    'src/components/layout/FacultyDashboardLayout.tsx',
    'src/components/layout/ModeratorDashboardLayout.tsx'
]

for file in files:
    if not os.path.exists(file): continue
    with open(file, 'r') as f:
        content = f.read()

    # Find the onAuthStateChange section and ignore if we are in local session
    if file == 'src/components/layout/FacultyDashboardLayout.tsx':
        auth_change_code = """    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (localStorage.getItem('unixx_faculty_session')) return;
      
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') return;
      if (!session?.user) {
        setUser(null);
        navigate('/login');
      }
    });"""
        content = re.sub(r'    const \{ data: \{ subscription \} \} = supabase.auth.onAuthStateChange\(\(_event, session\) => \{.*?\n    \}\);', auth_change_code, content, flags=re.DOTALL)

    if file == 'src/components/layout/ModeratorDashboardLayout.tsx':
        auth_change_code = """    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (localStorage.getItem('unixx_moderator_session')) return;
      
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') return;
      if (!session?.user) {
        setUser(null);
        navigate('/login');
      }
    });"""
        content = re.sub(r'    const \{ data: \{ subscription \} \} = supabase.auth.onAuthStateChange\(\(_event, session\) => \{.*?\n    \}\);', auth_change_code, content, flags=re.DOTALL)

    with open(file, 'w') as f:
        f.write(content)
