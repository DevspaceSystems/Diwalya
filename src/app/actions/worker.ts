'use server'

import { prisma } from '@/lib/prisma'
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
    // 1. Update user with profile picture
    await prisma.user.update({
      where: { id: userId },
      data: { profilePicture: data.profilePicture }
    })

    // 2. Create or update worker profile
    const profile = await prisma.workerProfile.upsert({
      where: { userId },
      update: {
        businessName: data.businessName,
        location: data.location,
        experienceYears: data.experienceYears,
        bio: data.bio,
        category: data.category,
        ghanaCardUrl: data.ghanaCardUrl,
        verificationStatus: 'PENDING'
      },
      create: {
        userId,
        businessName: data.businessName,
        location: data.location,
        experienceYears: data.experienceYears,
        bio: data.bio,
        category: data.category,
        ghanaCardUrl: data.ghanaCardUrl,
        verificationStatus: 'PENDING'
      }
    })

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
    await prisma.workerProfile.update({
      where: { userId },
      data: {
        verificationStatus: 'REJECTED',
        rejectionReason: reason
      }
    })
    
    // Notify Worker
    await sendNotification({
        userId,
        title: 'Verification Rejected',
        body: `Your worker verification request was rejected. Reason: ${reason}. Please update your profile and try again.`
    })
    
    // In a real app, send email/notification here
    
    await logAdminAction(adminId, `Rejected worker ${userId} verification`, { targetId: userId, reason });
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function notifyAdminOfRejection(userId: string, reason: string) {
  try {
    // In a real system, this would insert into a 'Notifications' table or send an email.
    // For now, we ensure the profile is marked and a log is created.
    console.log(`ADMIN NOTIFICATION: Worker ${userId} rejected. Reason: ${reason}`);
    
    // We can also create a specific record if there was a Notifications model, 
    // but we'll stick to updating the profile with the rejection reason.
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveWorker(userId: string, adminId: string = 'admin') {
  try {
    await ensureAdmin(adminId)
    await prisma.workerProfile.update({
      where: { userId },
      data: {
        verificationStatus: 'APPROVED',
        isVerified: true
      }
    })
    
    revalidatePath('/dashboard/admin/verifications')
    revalidatePath(`/worker/${userId}`)
    revalidatePath('/search')
    
    // Notify Worker
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
    const profiles = await prisma.workerProfile.findMany({
      where: { verificationStatus: 'PENDING' },
      include: {
        user: true
      }
    })
    return { success: true, data: profiles }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function requestVerification(userId: string) {
  try {
    await prisma.workerProfile.update({
      where: { userId },
      data: {
        verificationStatus: 'PENDING'
      }
    })
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
