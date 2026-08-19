import re
import os

def patch_layout(filename, role_name):
    if not os.path.exists(filename):
        return

    with open(filename, 'r') as f:
        content = f.read()

    # 1. Update fetchUserRole & checkUser
    old_fetch = """  const fetchUserRole = async (sessionUser: any) => {"""
    
    # We will replace checkUser to fetch profile directly and verify role
    # Since we can just simplify it:
    
    check_user_regex = re.compile(r'const checkUser = async \(\) => \{.*?\};', re.DOTALL)
    
    new_check_user = f"""const checkUser = async () => {{
    try {{
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {{
        navigate('/login');
        return;
      }}
      
      const {{ data: {{ session }} }} = await supabase.auth.getSession();
      if (!session) {{
        navigate('/login');
        return;
      }}
      
      // Fetch profile to get real role
      const {{ data, error }} = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error || !data) {{
        navigate('/login');
        return;
      }}
      
      const realRole = data.role || 'student';
      if (realRole !== '{role_name}') {{
        navigate('/dashboard');
        return;
      }}
      
      const loggedInUser = {{ ...session.user }};
      loggedInUser.user_metadata = {{ ...loggedInUser.user_metadata, ...data, role: realRole }};
      setUser(loggedInUser);
      setLoading(false);
    }} catch (error) {{
      console.error(error);
      setLoading(false);
      navigate('/login');
    }}
  }};"""

    content = check_user_regex.sub(new_check_user, content)

    # 2. Update useEffect
    use_effect_regex = re.compile(r'useEffect\(\(\) => \{.*?return \(\) => subscription\.unsubscribe\(\);\n  \}, \[navigate\]\);', re.DOTALL)
    new_use_effect = """useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') return;

      if (!session?.user) {
        setUser(null);
        navigate('/login');
      } else {
        checkUser(); // Re-verify role on auth change
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);"""
  
    content = use_effect_regex.sub(new_use_effect, content)

    # 3. Update handleSignOut
    signout_regex = re.compile(r'const handleSignOut = async \(\) => \{.*?\};', re.DOTALL)
    new_signout = """const handleSignOut = async () => {
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      await supabase.auth.signOut();
    }
    navigate('/login');
  };"""

    content = signout_regex.sub(new_signout, content)

    # Also remove any leftover fetchUserRole function if it exists
    fetch_role_regex = re.compile(r'const fetchUserRole = async \(.*?\) => \{.*?\};\n', re.DOTALL)
    content = fetch_role_regex.sub('', content)
    
    with open(filename, 'w') as f:
        f.write(content)

patch_layout('src/components/layout/ModeratorDashboardLayout.tsx', 'moderator')
patch_layout('src/components/layout/FacultyDashboardLayout.tsx', 'faculty')

