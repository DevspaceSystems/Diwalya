
import 'dotenv/config';
import { supabaseAdmin } from './src/lib/supabase-admin';

async function debugDB() {
  console.log('--- USERS ---');
  const { data: users, error: uError } = await supabaseAdmin
    .from('User')
    .select('id, name, email, role, profilePicture');
  if (uError) console.error(uError);
  console.table(users);

  console.log('--- WORKER PROFILES ---');
  const { data: profiles, error: pError } = await supabaseAdmin
    .from('WorkerProfile')
    .select('id, userId, businessName, verificationStatus');
  if (pError) console.error(pError);
  console.table(profiles);
}

debugDB();
