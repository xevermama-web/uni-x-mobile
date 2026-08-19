import re

# Patch 1: LoginPage.tsx
with open('src/pages/LoginPage.tsx', 'r') as f:
    content = f.read()

# Replace the handleLogin function in LoginPage.tsx
old_login = """  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let email = loginId;

    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (email === 'admin@unixx.com' && password === 'admin@3bsk') {
        localStorage.setItem('unixx_admin_session', 'true');
        navigate('/dashboard');
        return;
      }

      // Check moderators table
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const { data: moderator, error: modError } = await supabase
          .from('moderators')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .maybeSingle();
          
        if (moderator) {
          localStorage.setItem('unixx_moderator_session', JSON.stringify(moderator));
          navigate('/moderator-dashboard');
          return;
        }

        const { data: faculty, error: facError } = await supabase
          .from('faculties')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .maybeSingle();

        if (faculty) {
          localStorage.setItem('unixx_faculty_session', JSON.stringify(faculty));
          navigate('/faculty-dashboard');
          return;
        }
      }

      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        // Fallback for preview mode login if other credentials are used
        if (email === 'preview@uni-x.edu') {
          navigate('/dashboard');
          return;
        }
        throw new Error("Supabase is not configured. Please use the permanent admin account (admin@unixx.com / admin@3bsk) to explore.");
      }

      // Local preview fallback check for students
      const isLocal = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co';
      
      if (isLocal) {
        const stored = localStorage.getItem('unixx_students');
        if (stored) {
          const students = JSON.parse(stored);
          const student = students.find((s: any) => s.id === email || s.email === email);
          if (student && password) { 
            navigate('/dashboard'); 
            return;
          }
        }
      }

      // If it's not an email, assume it's a student ID and lookup the email
      if (!email.includes('@') && !isLocal) {
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

new_login = """  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let email = loginId;

    try {
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        throw new Error("Supabase is not configured.");
      }

      // If it's not an email, assume it's a student ID and lookup the email
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

content = content.replace(old_login, new_login)
with open('src/pages/LoginPage.tsx', 'w') as f:
    f.write(content)

