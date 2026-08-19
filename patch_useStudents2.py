import re

with open('src/hooks/useStudents.ts', 'r') as f:
    content = f.read()

old_reset = """  const resetStudentPassword = async (email: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error('resetStudentPassword error:', err);
      return { error: err };
    }
  };"""

new_reset = """  const resetStudentPassword = async (profileId: string, email: string, newPassword: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
      return { error: null };
    }

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: profileId, newPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      return { error: null };
    } catch (err: any) {
      console.error('resetStudentPassword error:', err);
      return { error: err };
    }
  };"""

content = content.replace(old_reset, new_reset)

with open('src/hooks/useStudents.ts', 'w') as f:
    f.write(content)
