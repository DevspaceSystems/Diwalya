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
    
    // Transform data to match Prisma's output (single object for 1-to-1)
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
    const { data: workers, error } = await supabaseAdmin
      .from('User')
      .select('*, workerProfile(*)')
      .eq('role', 'WORKER')
      .order('name', { ascending: true });

    if (error) throw error;

    const transformedWorkers = workers?.map(u => ({
      ...u,
      workerProfile: Array.isArray(u.workerProfile) ? u.workerProfile[0] : u.workerProfile
    }));

    return { success: true, data: transformedWorkers };
  } catch (error: any) {
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
  workerData?: {
    category: string;
    bio?: string;
    location: string;
    experienceYears: number;
    hourlyRate?: number;
  }
}) {
  try {
    // 1. Update basic User info
    const { error: userError } = await supabaseAdmin
      .from('User')
      .update({
        name: data.name,
        ...(data.phone ? { phone: data.phone } : {})
      })
      .eq('id', userId);

    if (userError) throw userError;

    // 2. Update WorkerProfile if role is WORKER
    if (data.role === 'WORKER' && data.workerData) {
      const workerProfileData = {
        category: data.workerData.category,
        bio: data.workerData.bio,
        location: data.workerData.location,
        experienceYears: data.workerData.experienceYears,
        hourlyRate: data.workerData.hourlyRate
      };

      // Check if profile exists
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
        full_name: data.name
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
    return { success: false, error: error.message };
  }
}
