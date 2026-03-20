const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function debug() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const url = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/\"/g, '');
  const key = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim().replace(/\"/g, '');

  console.log('Connecting to:', url);
  const supabase = createClient(url, key);

  // Check 'User' table
  const { data: users, error: userError } = await supabase.from('User').select('id, name, role').limit(5);
  console.log('User table result:', { users, error: userError });

  // Check 'users' table (plural)
  const { data: usersPlural, error: userErrorPlural } = await supabase.from('users').select('id').limit(5);
  console.log('users plural table result:', { usersPlural, error: userErrorPlural });

  // List all tables
  const { data: tables, error: tableError } = await supabase.rpc('get_tables'); // Won't work without RPC
  // Alternative: query the schema cache indirectly
  const { data: schemaCheck, error: schemaError } = await supabase.from('_prisma_migrations').select('*').limit(1);
  console.log('Migration check:', { schemaCheck, error: schemaError });

  // Check counts
  const { count: userCount } = await supabase.from('User').select('*', { count: 'exact', head: true });
  console.log('Total User count:', userCount);
}

debug();
