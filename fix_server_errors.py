import re

with open('server.ts', 'r') as f:
    content = f.read()

# I will replace the internal declarations so they are block scoped or unique
content = content.replace("const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;", "const srvRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;")
content = content.replace("const { createClient } = require('@supabase/supabase-js');", "const supabaseMod = require('@supabase/supabase-js');")
content = content.replace("createClient(supabaseUrl, serviceRoleKey)", "supabaseMod.createClient(supabaseUrl, srvRoleKey)")
content = content.replace("createClient(supabaseUrl, srvRoleKey)", "supabaseMod.createClient(supabaseUrl, srvRoleKey)")

with open('server.ts', 'w') as f:
    f.write(content)
