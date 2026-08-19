import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
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

    const { userId, newPassword } = JSON.parse(event.body);

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error: any) {
    console.error('Reset Password Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to reset password' })
    };
  }
};
