'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { sendNotification } from '@/lib/notifications'
import { logActivity } from './activity'
import { ensureAdmin, logAdminAction } from './auth'
import { generateUniqueSlug } from '@/lib/slug'

export async function createWorkerProfile(userId: string, data: {
  businessName: string
  location: string
  experienceYears: number
  bio: string
  category: string
  profilePicture: string
  ghanaCardUrl: string
  phone: string
}) {
  try {
    // 1. Ensure User record exists (upsert instead of update)
    // This prevents foreign key constraint errors if the sync failed at signup
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = authData?.user?.email;

    if (!email) {
      console.error('[createWorkerProfile] No email found for user in Auth:', userId);
      throw new Error('Critical: Your account email could not be verified. Please contact support.');
    }

    // Check for ghost records: if another ID has this email, we must remove it 
    // to avoid unique constraint violations on email during the final sync.
    const { data: conflictUser } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .maybeSingle();

    // Check for existing user with THIS ID to preserve their set name if available
    const { data: existingUser } = await supabaseAdmin
      .from('User')
      .select('name, slug')
      .eq('id', userId)
      .maybeSingle();

    if (conflictUser) {
      console.warn(`[createWorkerProfile] Found ghost record for email ${email} with ID ${conflictUser.id}. Removing...`);
      // Delete old ghost record to clear the email constraint
      await supabaseAdmin.from('User').delete().eq('id', conflictUser.id);
    }

    const { error: userError } = await supabaseAdmin
      .from('User')
      .upsert({ 
        id: userId,
        profilePicture: data.profilePicture,
        name: existingUser?.name || authData?.user?.user_metadata?.full_name || 'Worker',
        slug: existingUser?.slug || generateUniqueSlug(existingUser?.name || authData?.user?.user_metadata?.full_name || 'Worker'),
        email: email,
        phone: data.phone,
        // Role is NOT set to 'WORKER' yet. We keep their current role (e.g. 'CLIENT' or 'USER')
        // until the WorkerProfile is successfully created.
        updatedAt: new Date().toISOString()
      }, { onConflict: 'id' });

    if (userError) {
      console.error('[createWorkerProfile] User Sync Error:', userError);
      throw new Error(`Critical: Failed to sync user record. ${userError.message}`);
    }

    // 1b. Sync to Auth Metadata to ensure Navbar and other client-side components see it
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        profilePicture: data.profilePicture,
        phone: data.phone,
        role: 'WORKER',
        onboardingComplete: true
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

    // 2b. FINALIZE: Now upgrade the User role to 'WORKER' to make them officially a professional
    console.log(`[createWorkerProfile] Profile created. Finalizing role upgrade for ${userId}...`);
    const { error: roleError } = await supabaseAdmin
      .from('User')
      .update({ role: 'WORKER' })
      .eq('id', userId);

    if (roleError) {
      console.error('[createWorkerProfile] Final Role Upgrade Error:', roleError);
      throw new Error(`Critical: Profile created but failed to finalize role. ${roleError.message}`);
    }

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

export async function rejectWorker(userId: string, reason: string) {
  try {
    const admin = await ensureAdmin()
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
    
    await logAdminAction(admin.id, `Rejected worker ${userId} verification`, { targetId: userId, reason });
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function approveWorker(userId: string) {
  try {
    const admin = await ensureAdmin()
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

    await logAdminAction(admin.id, `Approved worker ${userId} verification`, { targetId: userId });
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
      .select('*, user:User(profilePicture, name)')
      .eq('userId', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    // Flatten profilePicture up to top level for easy access
    const profile = data ? {
      ...data,
      profilePicture: data.user?.profilePicture || null,
      displayName: data.user?.name || null,
    } : null;
    return { success: true, data: profile };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getWorkerById(id: string) {
  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .select('*, workerProfile:WorkerProfile(*)')
      .or(`id.eq.${id},slug.eq.${id}`)
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

export async function toggleLove(targetId: string, userId: string) {
  try {
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('Love')
      .select('id')
      .match({ userId, targetId })
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      await supabaseAdmin.from('Love').delete().match({ userId, targetId });
      return { success: true, loved: false };
    } else {
      await supabaseAdmin.from('Love').insert({ userId, targetId });
      return { success: true, loved: true };
    }
  } catch (error: any) {
    console.error('Toggle Love Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getWorkerStats(workerId: string, currentUserId?: string) {
  try {
    const { count: lovedCount, error: countError } = await supabaseAdmin
      .from('Love')
      .select('*', { count: 'exact', head: true })
      .eq('targetId', workerId);

    if (countError) throw countError;

    let isLoved = false;
    if (currentUserId) {
      const { data, error: userLoveError } = await supabaseAdmin
        .from('Love')
        .select('id')
        .match({ userId: currentUserId, targetId: workerId })
        .maybeSingle();
      if (userLoveError) throw userLoveError;
      isLoved = !!data;
    }

    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('Review')
      .select('rating')
      .eq('targetId', workerId);

    if (reviewsError) throw reviewsError;

    const reviewCount = reviews?.length || 0;
    const avgRating = reviewCount > 0 
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount 
      : 0;

    return { success: true, lovedCount, isLoved, reviewCount, avgRating };
  } catch (error: any) {
    console.error('Get Worker Stats Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getWorkerReviews(workerId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('Review')
      .select('*, author:User(name, profilePicture)')
      .eq('targetId', workerId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Get Worker Reviews Error:', error);
    return { success: false, error: error.message };
  }
}
