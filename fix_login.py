import re

with open('src/pages/LoginPage.tsx', 'r') as f:
    content = f.read()

# regex to replace handleLogin
handle_login_pattern = re.compile(r'const handleLogin = async \(e: React\.FormEvent\) => \{.*?\n  \};', re.DOTALL)

new_handle_login = """const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let email = loginId;

    try {
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        throw new Error("Supabase is not configured.");
      }

      if (!email.includes('@')) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('academic_id', email)
          .maybeSingle();
        
        if (profileError || !profileData || !profileData.email) {
          throw new Error("Student ID not found.");
        }
        email = profileData.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };"""

content = handle_login_pattern.sub(new_handle_login, content)

with open('src/pages/LoginPage.tsx', 'w') as f:
    f.write(content)
