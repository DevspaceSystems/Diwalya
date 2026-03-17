'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
    return { success: true, profile }
  } catch (error: any) {
    console.error('Create Worker Profile Error:', error)
    return { success: false, error: error.message }
  }
}

export async function rejectWorker(userId: string, reason: string) {
  try {
    await prisma.workerProfile.update({
      where: { userId },
      data: {
        verificationStatus: 'REJECTED',
        rejectionReason: reason
      }
    })
    
    // In a real app, send email/notification here
    
    revalidatePath('/dashboard/admin/workers')
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
