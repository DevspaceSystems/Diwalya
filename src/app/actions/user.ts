'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateSlug } from '@/lib/slug'

export async function getUsers(query?: string, role?: string) {
  try {
    let queryBuilder = supabaseAdmin
      .from('User')
      .select('*')
      .order('createdAt', { ascending: false });

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,email.ilike.%${query}%,id.ilike.%${query}%`);
    }

    if (role) {
      console.log(`[getUsers] Filtering by role: ${role}`);
      queryBuilder = queryBuilder.eq('role', role.toUpperCase());
    }

    const { data: users, error: userError } = await queryBuilder;
    if (userError) throw userError;
    
    // Fetch profiles and wallets separately to avoid schema cache relationship errors
    const { data: profiles } = await supabaseAdmin.from('WorkerProfile').select('*');
    const { data: wallets } = await supabaseAdmin.from('Wallet').select('*');

    const transformedUsers = users?.map(u => {
      const profile = profiles?.find(p => p.userId === u.id);
      const wallet = wallets?.find(w => w.userId === u.id);
      return {
        ...u,
        workerProfile: profile || null,
        wallet: wallet || null
      };
    }).filter(u => {
      // If user has WORKER role, they MUST have a workerProfile to be included in general listings
      // This prevents "Profile Incomplete" ghost entries
      if (u.role === 'WORKER' && !u.workerProfile) return false;
      return true;
    });

    return { success: true, data: transformedUsers };
  } catch (error: any) {
    console.error('[getUsers] Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getWorkers() {
  try {
    console.log('[getWorkers] Fetching users with role WORKER...');
    const { data: users, error: userError } = await supabaseAdmin
      .from('User')
      .select('*')
      .eq('role', 'WORKER')
      .order('name', { ascending: true });

    if (userError) throw userError;

    console.log(`[getWorkers] Found ${users?.length || 0} users. Fetching profiles...`);
    
    // Manual join for robustness
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('WorkerProfile')
      .select('*');

    if (profileError) console.error('[getWorkers] Profile fetch error:', profileError);

    const transformedWorkers = users?.map(u => ({
      ...u,
      workerProfile: profiles?.find(p => p.userId === u.id) || null
    })).filter(w => w.workerProfile !== null) || [];

    console.log(`[getWorkers] Successfully joined and filtered ${transformedWorkers.length} valid workers.`);
    return { success: true, data: transformedWorkers };
  } catch (error: any) {
    console.error('[getWorkers] Fatal Error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateUser(userId: string, data: any) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('User')
      .update(data)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    revalidatePath('/dashboard/admin/users');
    return { success: true, data: user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserProfile(userId: string, data: {
  name: string;
  phone?: string;
  role: string;
  profilePicture?: string;
  workerData?: {
    businessName: string;
    location: string;
    category: string;
    bio: string;
    experienceYears: number;
    hourlyRate?: number;
    ghanaCardUrl?: string;
  }
}) {
  try {
    // 1. Update/Upsert User table
    const { error: userError } = await supabaseAdmin
      .from('User')
      .upsert({
        id: userId,
        name: data.name,
        phone: data.phone,
        slug: generateSlug(data.name),
        profilePicture: data.profilePicture,
        updatedAt: new Date().toISOString()
      }, { onConflict: 'id' });

    if (userError) throw userError;

    // 2. Update WorkerProfile if data exists
    if (data.workerData) {
      const workerProfileData = {
        businessName: data.workerData.businessName,
        location: data.workerData.location,
        category: data.workerData.category,
        bio: data.workerData.bio,
        experienceYears: data.workerData.experienceYears,
        hourlyRate: data.workerData.hourlyRate,
        ghanaCardUrl: data.workerData.ghanaCardUrl
      };

      const { data: existing } = await supabaseAdmin
        .from('WorkerProfile')
        .select('id')
        .eq('userId', userId)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabaseAdmin
          .from('WorkerProfile')
          .update(workerProfileData)
          .eq('userId', userId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabaseAdmin
          .from('WorkerProfile')
          .insert({ 
            id: `WP-${userId}`,
            userId, 
            ...workerProfileData 
          });
        if (insertError) throw insertError;
      }
    }

    // 3. Keep Supabase auth metadata in sync
    // Ensure the role is updated in Auth metadata only after successful DB updates
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        full_name: data.name,
        profilePicture: data.profilePicture,
        role: data.role, // Set the final role (e.g. WORKER) in metadata
        onboardingComplete: true
      }
    });

    // 4. Update the User role in the database to finalize the transition
    if (data.role === 'WORKER') {
      await supabaseAdmin.from('User').update({ role: 'WORKER' }).eq('id', userId);
    }

    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    console.error('Update Profile Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}


export async function deleteUser(userId: string) {
  try {
    console.log(`[deleteUser] Starting full deletion for user: ${userId}`);
    
    // 1. Delete from related logic tables first (manual cascade if DB doesn't have it)
    await Promise.all([
      supabaseAdmin.from('WorkerProfile').delete().eq('userId', userId),
      supabaseAdmin.from('Wallet').delete().eq('userId', userId),
      supabaseAdmin.from('Notification').delete().eq('userId', userId),
      supabaseAdmin.from('Booking').delete().eq('clientId', userId),
      supabaseAdmin.from('Booking').delete().eq('workerId', userId),
      supabaseAdmin.from('Payout').delete().eq('userId', userId),
      supabaseAdmin.from('PlatformReport').delete().eq('targetUserId', userId),
      supabaseAdmin.from('PlatformReport').delete().eq('reporterId', userId),
    ]);

    // 2. Delete from User table
    const { error: dbError } = await supabaseAdmin
      .from('User')
      .delete()
      .eq('id', userId);
    
    if (dbError) throw dbError;

    // 3. Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    console.log(`[deleteUser] Full deletion successful for ${userId}`);
    revalidatePath('/dashboard/admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('[deleteUser] Fatal Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userError) throw userError;
    if (!user) return { success: false, error: 'User not found' };
    
    const { data: profile } = await supabaseAdmin
      .from('WorkerProfile')
      .select('*')
      .eq('userId', userId)
      .maybeSingle();

    const transformedUser = {
      ...user,
      workerProfile: profile || null
    };

    return { success: true, data: transformedUser };
  } catch (error: any) {
    console.error('Get User Profile Error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateFcmToken(userId: string, token: string) {
  try {
    const { error } = await supabaseAdmin
      .from('User')
      .update({ fcmToken: token })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[updateFcmToken] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

