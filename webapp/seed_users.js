require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// extract USERS_LIST from setup-users/route.ts
const content = fs.readFileSync('app/api/setup-users/route.ts', 'utf-8');
const match = content.match(/const USERS_LIST = (\[.*?\]);/s);
if (!match) {
  console.error("Could not find USERS_LIST in route.ts");
  process.exit(1);
}

const USERS_LIST = JSON.parse(match[1]);

async function run() {
  console.log(`Starting to insert ${USERS_LIST.length} users...`);
  
  const usersToInsert = [];
  
  for (const u of USERS_LIST) {
    const email = `${u.phone}@vnpt.vn`;
    const password_hash = await bcrypt.hash(u.phone, 10);
    usersToInsert.push({
      email,
      name: u.name,
      password_hash
    });
  }

  // Supabase upsert has a limit of 1000 rows, our 147 is well within limit
  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert(usersToInsert, { onConflict: 'email' })
    .select();

  if (error) {
    console.error("Error inserting users:", error);
    process.exit(1);
  }

  console.log(`Successfully seeded ${usersToInsert.length} users.`);
}

run();
