import re

with open('server.ts', 'r') as f:
    content = f.read()

# server.ts patch
old_endpoint = """  app.post('/api/admin-reset-password', async (req, res) => {
    try {
      const { userId, newPassword } = req.body;
      
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;"""

new_endpoint = """  app.post('/api/admin-reset-password', async (req, res) => {
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
      
      // Verify token
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      // Verify role in profiles table
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (profileError || !profile || profile.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      const { userId, newPassword } = req.body;"""

content = content.replace(old_endpoint, new_endpoint)
with open('server.ts', 'w') as f:
    f.write(content)

# netlify/functions/admin-reset-password.ts patch
with open('netlify/functions/admin-reset-password.ts', 'r') as f:
    n_content = f.read()

old_n_endpoint = """  try {
    const { userId, newPassword } = JSON.parse(event.body);
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;"""

new_n_endpoint = """  try {
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Missing Authorization header' }) };
    }
    const token = authHeader.split(' ')[1];

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Supabase config missing' }) };
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify token and role
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
    }
    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (profileError || !profile || profile.role !== 'admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    const { userId, newPassword } = JSON.parse(event.body);"""

n_content = n_content.replace(old_n_endpoint, new_n_endpoint)
with open('netlify/functions/admin-reset-password.ts', 'w') as f:
    f.write(n_content)

