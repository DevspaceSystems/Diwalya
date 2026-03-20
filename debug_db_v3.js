
import 'dotenv/config';
import { supabaseAdmin } from './src/lib/supabase-admin';

async function debugDB() {
  console.log('--- WORKER PROFILES ---');
  const { data: profiles, error: pError } = await supabaseAdmin
    .from('WorkerProfile')
    .select('userId, location, category, businessName');
  if (pError) console.error(pError);
  console.table(profiles);
}

debugDB();
