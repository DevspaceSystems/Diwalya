'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createSpecialRequest(data: {
  userId: string
  serviceType: string
  description: string
  location: string
  preferredTime: Date
  budget?: number
}) {
  try {
    const request = await prisma.specialRequest.create({
      data: {
        userId: data.userId,
        serviceType: data.serviceType,
        description: data.description,
        location: data.location,
        preferredTime: data.preferredTime,
        budget: data.budget,
        status: 'PENDING'
      }
    })

    revalidatePath('/dashboard/admin/special-requests')
    return { success: true, data: request }
  } catch (error: any) {
    console.error('Create Special Request Error:', error)
    return { success: false, error: error.message }
  }
}

export async function getSpecialRequests() {
  try {
    const requests = await prisma.specialRequest.findMany({
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return { success: true, data: requests }
  } catch (error: any) {
    console.error('Get Special Requests Error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateSpecialRequestStatus(
  requestId: string, 
  status: string, 
  adminNotes?: string,
  assignedWorkerId?: string
) {
  try {
    const request = await prisma.specialRequest.update({
      where: { id: requestId },
      data: { 
        status, 
        adminNotes,
        assignedWorkerId
      }
    })

    revalidatePath('/dashboard/admin/special-requests')
    return { success: true, data: request }
  } catch (error: any) {
    console.error('Update Special Request Error:', error)
    return { success: false, error: error.message }
  }
}
