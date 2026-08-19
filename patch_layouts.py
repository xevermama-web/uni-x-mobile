import re

def patch_layout(filename, session_key, role_name):
    with open(filename, 'r') as f:
        content = f.read()
    
    check_user_pattern = re.compile(r'const checkUser = async \(\) => \{.*?setLoading\(false\);\n    \} catch \(error\) \{', re.DOTALL)
    
    new_check_user = f"""const checkUser = async () => {{
    try {{
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {{
        navigate('/login');
        return;
      }}
      
      const customSession = localStorage.getItem('{session_key}');
      if (customSession) {{
        const parsedData = JSON.parse(customSession);
        setUser({{ ...parsedData, role: '{role_name}' }});
        setLoading(false);
        return;
      }}

      const {{ data: {{ session }} }} = await supabase.auth.getSession();
      if (!session) {{
        navigate('/login');
        return;
      }}
      
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
    }} catch (error) {{"""

    content = check_user_pattern.sub(new_check_user, content)

    # Also patch handleSignOut
    signout_pattern = re.compile(r'const handleSignOut = async \(\) => \{.*?\n  \};', re.DOTALL)
    new_signout = f"""const handleSignOut = async () => {{
    localStorage.removeItem('{session_key}');
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {{
      await supabase.auth.signOut();
    }}
    navigate('/login');
  }};"""
    content = signout_pattern.sub(new_signout, content)

    with open(filename, 'w') as f:
        f.write(content)

patch_layout('src/components/layout/ModeratorDashboardLayout.tsx', 'unixx_moderator_session', 'moderator')
patch_layout('src/components/layout/FacultyDashboardLayout.tsx', 'unixx_faculty_session', 'faculty')
