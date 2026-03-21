import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ijjwonaqazkejglezcdr.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqandvbmFxYXprZWpnbGV6Y2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUxNzg0MywiZXhwIjoyMDg5MDkzODQzfQ.Lm3dAhypQV_Eyt2N_SifJ-yszSCEiyd_r0BXz_9JPOA";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function performSync() {
  console.log('Fetching auth users...');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error listing users:', authError);
    return;
  }

  console.log(`Found ${authUsers.users.length} users in Auth. Syncing to public.User...`);

  for (const user of authUsers.users) {
    const { error: dbError } = await supabase.from('User').upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || 'User',
      role: user.user_metadata?.role || 'CLIENT',
      updatedAt: new Date().toISOString()
    });

    if (dbError) {
      console.error(`Error syncing user ${user.email}:`, dbError);
    } else {
      console.log(`Synced: ${user.email}`);
    }
  }

  console.log('Sync complete.');
}

performSync();
