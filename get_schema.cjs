require('dotenv').config();
const fs = require('fs');
fetch(process.env.VITE_SUPABASE_URL + '/rest/v1/', {
  headers: { 'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY }
})
.then(res => res.json())
.then(data => fs.writeFileSync('schema.json', JSON.stringify(data, null, 2)));
