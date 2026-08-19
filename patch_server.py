import re

with open('server.ts', 'r') as f:
    content = f.read()

endpoint = """
  app.post('/api/admin/reset-password', async (req, res) => {
    try {
      const { userId, newPassword } = req.body;
      
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Supabase Service Role Key is not configured on the server. Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables.' });
      }

      // We need to import createClient here or at the top
      const { createClient } = require('@supabase/supabase-js');
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (error) throw error;
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Reset Password Error:', error);
      res.status(500).json({ error: error.message || 'Failed to reset password' });
    }
  });

  // Vite middleware for development"""

content = content.replace("  // Vite middleware for development", endpoint)

with open('server.ts', 'w') as f:
    f.write(content)
