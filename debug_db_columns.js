const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function debug() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const url = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/\"/g, '');
  const key = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim().replace(/\"/g, '');

  const supabase = createClient(url, key);

  // Check one user with all columns
  const { data: user, error } = await supabase.from('User').select('*').limit(1);
  console.log('Single User Sample:', { user, error });

  if (user && user.length > 0) {
    console.log('Columns in User table:', Object.keys(user[0]));
  }

  // Check counts by role
  const { count: workerCount } = await supabase.from('User').select('*', { count: 'exact', head: true }).eq('role', 'WORKER');
  const { count: clientCount } = await supabase.from('User').select('*', { count: 'exact', head: true }).eq('role', 'CLIENT');
  console.log('Counts:', { workerCount, clientCount });
}

debug();
