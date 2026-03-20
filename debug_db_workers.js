const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function debug() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const url = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/\"/g, '');
  const key = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim().replace(/\"/g, '');

  const supabase = createClient(url, key);

  // Check WorkerProfile
  const { data: workers, error: workerError } = await supabase.from('WorkerProfile').select('*').limit(5);
  console.log('WorkerProfile result:', { workers, error: workerError });

  const { count: workerCount } = await supabase.from('WorkerProfile').select('*', { count: 'exact', head: true });
  console.log('Total WorkerProfile count:', workerCount);

  // Check User one more time but maybe without limit?
  const { count: userCount } = await supabase.from('User').select('*', { count: 'exact', head: true });
  console.log('Total User count:', userCount);
}

debug();
