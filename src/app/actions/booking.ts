'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function createJob(data: {
  clientId: string
  workerId: string
  serviceType: string
  description: string
  location: string
  scheduledAt: Date
  priceAmount: number
}) {
  try {
    const job = await prisma.job.create({
      data: {
        ...data,
        status: 'PENDING',
      }
    })
    return { success: true, jobId: job.id }
  } catch (error: any) {
    console.error('Create Job Error:', error)
    return { success: false, error: error.message }
  }
}

export async function getWorker(id: string) {
    return await prisma.user.findUnique({
        where: { id },
        include: {
            workerProfile: true
        }
    })
}
