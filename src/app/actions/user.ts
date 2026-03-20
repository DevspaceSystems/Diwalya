'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function getUsers(query?: string, role?: string) {
  try {
    let queryBuilder = supabaseAdmin
      .from('User')
      .select('*, workerProfile(*), wallet(*)')
      .order('createdAt', { ascending: false });

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,email.ilike.%${query}%,id.ilike.%${query}%`);
    }

    if (role) {
      queryBuilder = queryBuilder.eq('role', role);
    }

    const { data: users, error } = await queryBuilder;
    if (error) throw error;
    
    const transformedUsers = users?.map(u => ({
      ...u,
      workerProfile: Array.isArray(u.workerProfile) ? u.workerProfile[0] : u.workerProfile,
      wallet: Array.isArray(u.wallet) ? u.wallet[0] : u.wallet
    }));

    return { success: true, data: transformedUsers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getWorkers() {
  try {
    console.log('[getWorkers] Querying Users with role WORKER...');
    const { data: workers, error } = await supabaseAdmin
      .from('User')
      .select('*, workerProfile(*)')
      .eq('role', 'WORKER')
      .order('name', { ascending: true });

    if (error) {
       console.error('[getWorkers] Supabase Error:', error);
       throw error;
    }

    console.log(`[getWorkers] Retrieved ${workers?.length || 0} users with role WORKER.`);

    const transformedWorkers = workers?.map(u => ({
      ...u,
      workerProfile: Array.isArray(u.workerProfile) ? u.workerProfile[0] : u.workerProfile
    })) || [];

    console.log(`[getWorkers] Successfully transformed ${transformedWorkers.length} workers.`);
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
  }
}) {
  try {
    // 1. Update User table
    const { error: userError } = await supabaseAdmin
      .from('User')
      .update({
        name: data.name,
        profilePicture: data.profilePicture
      })
      .eq('id', userId);

    if (userError) throw userError;

    // 2. Update WorkerProfile if data exists
    if (data.workerData) {
      const workerProfileData = {
        businessName: data.workerData.businessName,
        location: data.workerData.location,
        category: data.workerData.category,
        bio: data.workerData.bio,
        experienceYears: data.workerData.experienceYears,
        hourlyRate: data.workerData.hourlyRate
      };

      const { data: existing } = await supabaseAdmin
        .from('WorkerProfile')
        .select('id')
        .eq('userId', userId)
        .single();

      if (existing) {
        const { error: updateError } = await supabaseAdmin
          .from('WorkerProfile')
          .update(workerProfileData)
          .eq('userId', userId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabaseAdmin
          .from('WorkerProfile')
          .insert({ userId, ...workerProfileData });
        if (insertError) throw insertError;
      }
    }

    // 3. Keep Supabase auth metadata in sync
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        full_name: data.name,
        profilePicture: data.profilePicture,
        role: data.role
      }
    });

    revalidatePath('/profile');
    return { success: true };
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('User')
      .select('*, workerProfile(*)')
      .eq('id', userId)
      .single();

    if (error) throw error;
    
    const transformedUser = {
      ...user,
      workerProfile: Array.isArray(user.workerProfile) ? user.workerProfile[0] : user.workerProfile
    };

    return { success: true, data: transformedUser };
  } catch (error: any) {
    console.error('Get User Profile Error:', error);
    return { success: false, error: error.message };
  }
}
