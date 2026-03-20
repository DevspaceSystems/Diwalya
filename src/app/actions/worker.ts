'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { sendNotification } from '@/lib/notifications'
import { logActivity } from './activity'
import { ensureAdmin, logAdminAction } from './auth'

export async function createWorkerProfile(userId: string, data: {
  businessName: string
  location: string
  experienceYears: number
  bio: string
  category: string
  profilePicture: string
  ghanaCardUrl: string
}) {
  try {
    // 1. Ensure User record exists (upsert instead of update)
    // This prevents foreign key constraint errors if the sync failed at signup
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    await supabaseAdmin
      .from('User')
      .upsert({ 
        id: userId,
        profilePicture: data.profilePicture,
        name: userData?.user?.user_metadata?.full_name || 'Worker',
        email: userData?.user?.email || 'worker@diwalya.com',
        role: 'WORKER',
        updatedAt: new Date().toISOString()
      }, { onConflict: 'id' });

    // 1b. Sync to Auth Metadata to ensure Navbar and other client-side components see it
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        profilePicture: data.profilePicture,
        role: 'WORKER'
      }
    });

    // 2. Create or update worker profile
    const { data: profile, error } = await supabaseAdmin
      .from('WorkerProfile')
      .upsert({
        id: `WP-${userId}`,
        userId,
        businessName: data.businessName,
        location: data.location,
        experienceYears: data.experienceYears,
        bio: data.bio,
        category: data.category,
        ghanaCardUrl: data.ghanaCardUrl,
        verificationStatus: 'PENDING'
      }, { onConflict: 'userId' })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/worker')

    // Log Activity
    await logActivity({
      type: 'REGISTRATION',
      content: `User ${userId} created a worker profile for ${data.businessName}`,
      userId,
      metadata: { profileId: profile.id, category: data.category }
    });

    return { success: true, profile }
  } catch (error: any) {
    console.error('Create Worker Profile Error:', error)
    return { success: false, error: error.message }
  }
}

export async function rejectWorker(userId: string, reason: string, adminId: string = 'admin') {
  try {
    await ensureAdmin(adminId)
    const { error } = await supabaseAdmin
      .from('WorkerProfile')
      .update({
        verificationStatus: 'REJECTED',
        rejectionReason: reason
      })
      .eq('userId', userId);

    if (error) throw error;
    
    // Notify Worker
    await sendNotification({
        userId,
        title: 'Verification Rejected',
        body: `Your worker verification request was rejected. Reason: ${reason}. Please update your profile and try again.`
    })
    
    await logAdminAction(adminId, `Rejected worker ${userId} verification`, { targetId: userId, reason });
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function approveWorker(userId: string, adminId: string = 'admin') {
  try {
    await ensureAdmin(adminId)
    const { error } = await supabaseAdmin
      .from('WorkerProfile')
      .update({
        verificationStatus: 'APPROVED',
        isVerified: true
      })
      .eq('userId', userId);

    if (error) throw error;
    
    revalidatePath('/dashboard/admin/verifications')
    revalidatePath(`/worker/${userId}`)
    revalidatePath('/search')
    
    await sendNotification({
        userId,
        title: 'Verification Approved!',
        body: 'Congratulations! Your worker profile has been verified. You now have the verified badge and will rank higher in search results.'
    })

    await logAdminAction(adminId, `Approved worker ${userId} verification`, { targetId: userId });
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getPendingVerifications() {
  try {
    const { data, error } = await supabaseAdmin
      .from('WorkerProfile')
      .select('*, user:User(*)')
      .eq('verificationStatus', 'PENDING');

    if (error) throw error;
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function requestVerification(userId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('WorkerProfile')
      .update({ verificationStatus: 'PENDING' })
      .eq('userId', userId);

    if (error) throw error;
    revalidatePath('/dashboard/worker')

    // Log Activity
    await logActivity({
      type: 'VERIFICATION_REQUEST',
      content: `Worker ${userId} requested verification`,
      userId,
      metadata: { status: 'PENDING' }
    });

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getWorkerProfile(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('WorkerProfile')
      .select('*')
      .eq('userId', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getWorkerById(id: string) {
  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .select('*, workerProfile:WorkerProfile(*)')
      .eq('id', id)
      .single();

    if (userError) throw userError;
    return { success: true, data: user };
  } catch (error: any) {
    console.error('Get Worker By ID Error:', error);
    return { success: false, error: error.message };
  }
}
export async function notifyAdminOfRejection(userId: string, reason: string) {
  try {
    // Log the rejection as a system alert or admin action
    await logActivity({
      type: 'SYSTEM_ALERT',
      content: `Automatic rejection for user ${userId}: ${reason}`,
      userId,
      metadata: { reason, autoRejected: true }
    });

    console.log(`[ADMIN ALERT] User ${userId} auto-rejected: ${reason}`);

    return { success: true };
  } catch (error: any) {
    console.error('Notify Admin Error:', error);
    return { success: false, error: error.message };
  }
}
