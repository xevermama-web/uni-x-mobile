import re

with open('server.ts', 'r') as f:
    content = f.read()

endpoint_pattern = re.compile(r"app\.post\('/api/admin-reset-password'.*?\}\);", re.DOTALL)

new_endpoint = """app.post('/api/admin-reset-password', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }
      
      const token = authHeader.split(' ')[1];
      
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Supabase Service Role Key is not configured.' });
      }

      const { createClient } = require('@supabase/supabase-js');
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (profileError || !profile || profile.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      const { userId, newPassword } = req.body;
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
  });"""

content = endpoint_pattern.sub(new_endpoint, content)

with open('server.ts', 'w') as f:
    f.write(content)
