import { supabaseAdmin } from './src/lib/supabase-admin';
import { generateUniqueSlug } from './src/lib/slug';

async function backfillSlugs() {
  console.log('Starting slug backfill...');
  
  const { data: users, error } = await supabaseAdmin
    .from('User')
    .select('id, name')
    .is('slug', null);

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log(`Found ${users.length} users with no slug.`);

  for (const user of users) {
    const slug = generateUniqueSlug(user.name || 'worker');
    console.log(`Updating ${user.name} (${user.id}) with slug: ${slug}`);
    
    const { error: updateError } = await supabaseAdmin
      .from('User')
      .update({ slug })
      .eq('id', user.id);

    if (updateError) {
      console.error(`Failed to update ${user.id}:`, updateError);
    }
  }

  console.log('Backfill complete.');
}

// backfillSlugs();
