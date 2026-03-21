import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ijjwonaqazkejglezcdr.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqandvbmFxYXprZWpnbGV6Y2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUxNzg0MywiZXhwIjoyMDg5MDkzODQzfQ.Lm3dAhypQV_Eyt2N_SifJ-yszSCEiyd_r0BXz_9JPOA";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkUsers() {
  const { data: users, error } = await supabase.from('User').select('id, name, email, role, profilePicture').limit(20);
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Users found:', JSON.stringify(users, null, 2));
  }
}

checkUsers();
