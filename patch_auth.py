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
        check_user_code = """  const checkUser = async () => {
    try {
      if (localStorage.getItem('unixx_admin_session') === 'true') {
        await fetchUserRole({ email: 'admin@unixx.com' });
        return;
      }
      
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        navigate('/login');
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        await fetchUserRole(session.user);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      navigate('/login');
    }
  };"""
        content = re.sub(r'  const checkUser = async \(\) => \{.*?\n  \};\n', check_user_code + '\n', content, flags=re.DOTALL)

    # FacultyDashboardLayout
    if file == 'src/components/layout/FacultyDashboardLayout.tsx':
        check_user_code = """  const checkUser = async () => {
    try {
      const facSession = localStorage.getItem('unixx_faculty_session');
      if (facSession) {
        setUser(JSON.parse(facSession));
        setLoading(false);
        return;
      }
      navigate('/login');
    } catch (error) {
      console.error(error);
      setLoading(false);
      navigate('/login');
    }
  };"""
        content = re.sub(r'  const checkUser = async \(\) => \{.*?\n  \};\n', check_user_code + '\n', content, flags=re.DOTALL)

    # ModeratorDashboardLayout
    if file == 'src/components/layout/ModeratorDashboardLayout.tsx':
        check_user_code = """  const checkUser = async () => {
    try {
      const modSession = localStorage.getItem('unixx_moderator_session');
      if (modSession) {
        setUser(JSON.parse(modSession));
        setLoading(false);
        return;
      }
      navigate('/login');
    } catch (error) {
      console.error(error);
      setLoading(false);
      navigate('/login');
    }
  };"""
        content = re.sub(r'  const checkUser = async \(\) => \{.*?\n  \};\n', check_user_code + '\n', content, flags=re.DOTALL)

    with open(file, 'w') as f:
        f.write(content)
