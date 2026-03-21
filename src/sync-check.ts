import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ijjwonaqazkejglezcdr.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqandvbmFxYXprZWpnbGV6Y2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUxNzg0MywiZXhwIjoyMDg5MDkzODQzfQ.Lm3dAhypQV_Eyt2N_SifJ-yszSCEiyd_r0BXz_9JPOA";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function syncCheck() {
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const { data: dbUsers } = await supabase.from('User').select('id, email');

  console.log(`AUTH USERS TOTAL: ${authUsers?.users?.length || 0}`);
  console.log(`DB USERS TOTAL: ${dbUsers?.length || 0}`);
  
  if (authUsers?.users && dbUsers) {
    const missingInDb = authUsers.users.filter(au => !dbUsers.find(du => du.id === au.id));
    console.log(`MISSING IN DB: ${missingInDb.length}`);
    missingInDb.forEach(u => console.log(` - ${u.email} (${u.id})`));
  }
}

syncCheck();
