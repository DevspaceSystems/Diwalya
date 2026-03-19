'use server'

import { prisma } from '@/lib/prisma'
import { Prisma, JobStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { sendNotification } from '@/lib/notifications'
import { logActivity } from './activity'

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
        status: 'ADMIN_REVIEW' as JobStatus,
      }
    })
    revalidatePath('/dashboard/admin/bookings')
    
    // Log Activity
    await logActivity({
      type: 'BOOKING_REQUEST',
      content: `New booking request for ${data.serviceType}`,
      userId: data.clientId,
      metadata: { jobId: job.id, amount: data.priceAmount }
    });
    
    // Notify Admin
    console.log(`[ADMIN NOTIFICATION] New booking request requiring review: ${job.id}`)
    
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

export async function adminApproveAndForward(jobId: string) {
    try {
        await prisma.job.update({
            where: { id: jobId },
            data: { status: 'WORKER_REVIEW' as JobStatus }
        })
        revalidatePath('/dashboard/admin/bookings')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function workerRespondToJob(jobId: string, response: 'ACCEPT' | 'REJECT' | 'RESCHEDULE', notes?: string) {
    try {
        let status: JobStatus = 'ACCEPTED' as JobStatus
        if (response === 'REJECT') status = 'CANCELLED' as JobStatus
        if (response === 'RESCHEDULE') status = 'RESCHEDULE_REQUESTED' as JobStatus

        await prisma.job.update({
            where: { id: jobId },
            data: { status }
        })
        revalidatePath('/dashboard/admin/bookings')

        // Log Activity
        await logActivity({
          type: response === 'ACCEPT' ? 'BOOKING_ACCEPTED' : 'BOOKING_REJECTED',
          content: `Worker ${response === 'ACCEPT' ? 'accepted' : 'rejected'} job for ${jobId}`,
          metadata: { jobId }
        });

        // Notify Client
        const job = await prisma.job.findUnique({ where: { id: jobId }, include: { worker: true } })
        if (job) {
            let title = ''
            let body = ''
            if (response === 'ACCEPT') {
                title = 'Booking Accepted'
                body = `Worker ${job.worker.name} has accepted your booking for ${job.serviceType}.`
            } else if (response === 'REJECT') {
                title = 'Booking Declined'
                body = `Worker ${job.worker.name} cannot fulfill your request for ${job.serviceType}.`
            } else if (response === 'RESCHEDULE') {
                title = 'Reschedule Requested'
                body = `Worker ${job.worker.name} requested to reschedule your ${job.serviceType} booking.`
            }

            await sendNotification({
                userId: job.clientId,
                title,
                body
            })

            // 2. Monitoring: Flag suspicious cancellation patterns
            if (response === 'REJECT') {
                const recentRejections = await (prisma as any).job.count({
                    where: {
                        workerId: job.workerId,
                        status: 'CANCELLED',
                        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                    }
                })

                if (recentRejections >= 3) {
                    await (prisma as any).user.update({
                        where: { id: job.workerId },
                        data: { warningCount: { increment: 1 } }
                    })
                    console.log(`[MONITORING] Worker ${job.workerId} flagged for frequent cancellations (${recentRejections} in 24h).`)
                }
            }
        }

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getAdminBookings() {
    try {
        const jobs = await prisma.job.findMany({
            include: {
                client: true,
                worker: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return { success: true, data: jobs }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getWorkerJobs(workerId: string) {
    try {
        const jobs = await prisma.job.findMany({
            where: { workerId },
            include: {
                client: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return { success: true, data: jobs }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getClientJobs(clientId: string) {
  try {
    const jobs = await prisma.job.findMany({
      where: { clientId },
      include: {
        worker: {
          include: { workerProfile: true }
        },
        estimate: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: jobs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getGlobalBookings(status?: JobStatus) {
  try {
    const jobs = await prisma.job.findMany({
      where: status ? { status } : {},
      include: {
        client: true,
        worker: {
          include: {
            workerProfile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: jobs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── INSPECTION ACTIONS ───────────────────────────────────────────────────────

export async function createInspectionRequest(data: {
  clientId: string
  workerId: string
  serviceType: string
  description: string
  location: string
  scheduledAt: Date
}) {
  try {
    let settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } })
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 'default', inspectionFee: 100.0, inspectionWorkerShare: 60.0 }
      })
    }

    const job = await prisma.job.create({
      data: {
        ...data,
        type: 'INSPECTION',
        status: 'PENDING',
        priceAmount: settings.inspectionFee,
        inspectionWorkerAmount: settings.inspectionWorkerShare,
        inspectionAdminAmount: settings.inspectionFee - settings.inspectionWorkerShare,
      }
    })

    await logActivity({
      type: 'BOOKING_REQUEST',
      content: `Inspection request submitted for ${data.serviceType} at ${data.location}`,
      userId: data.clientId,
      metadata: { jobId: job.id, type: 'INSPECTION', amount: settings.inspectionFee }
    })

    return { success: true, jobId: job.id, inspectionFee: settings.inspectionFee }
  } catch (error: any) {
    console.error('createInspectionRequest Error:', error)
    return { success: false, error: error.message }
  }
}

export async function assignInspectionWorker(
  jobId: string,
  workerId: string,
  teamMember?: string
) {
  try {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { workerId, assignedTeamMember: teamMember || null, status: 'ACCEPTED' },
      include: { client: true, worker: true }
    })

    await logActivity({
      type: 'BOOKING_ACCEPTED',
      content: `Worker assigned to inspection job ${jobId}${teamMember ? `. Team: ${teamMember}` : ''}`,
      metadata: { jobId, workerId, teamMember }
    })

    await sendNotification({
      userId: job.clientId,
      title: 'Inspection Scheduled ✅',
      body: `Worker ${job.worker.name} will conduct your inspection.${teamMember ? ` Team member ${teamMember} will also be present.` : ''}`
    })
    await sendNotification({
      userId: workerId,
      title: 'Inspection Assigned 📋',
      body: `You have been assigned an inspection for "${job.serviceType}" at ${job.location}.`
    })

    revalidatePath('/dashboard/admin/inspections')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function confirmInspection(jobId: string, notes?: string) {
  try {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { status: 'IN_PROGRESS', workerConfirmedAt: new Date(), inspectionNotes: notes || null },
      include: { client: true }
    })

    await sendNotification({
      userId: job.clientId,
      title: 'Inspection Confirmed 🔍',
      body: `The worker has confirmed your inspection for "${job.serviceType}". Awaiting admin verification.`
    })

    await logActivity({
      type: 'BOOKING_ACCEPTED',
      content: `Worker confirmed inspection for job ${jobId}`,
      metadata: { jobId, notes }
    })

    revalidatePath('/dashboard/admin/inspections')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function verifyInspection(jobId: string) {
  try {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', isInspectionVerified: true, adminVerifiedAt: new Date() },
      include: { client: true, worker: true }
    })

    if (job.inspectionWorkerAmount && job.inspectionWorkerAmount > 0) {
      const { creditWallet } = await import('@/lib/wallet')
      await creditWallet(job.workerId, job.inspectionWorkerAmount, 'INSPECTION_FEE', `inspection-${jobId}`)
    }

    await sendNotification({
      userId: job.clientId,
      title: 'Inspection Complete ✅',
      body: `Your inspection for "${job.serviceType}" is verified. You can now book the full service.`
    })
    await sendNotification({
      userId: job.workerId,
      title: 'Payment Credited 💰',
      body: `₵${job.inspectionWorkerAmount?.toFixed(2)} has been credited to your wallet for the inspection.`
    })

    await logActivity({
      type: 'PAYMENT_COMPLETED',
      content: `Admin verified inspection ${jobId}. Worker credited ₵${job.inspectionWorkerAmount}`,
      metadata: { jobId, workerAmount: job.inspectionWorkerAmount, adminAmount: job.inspectionAdminAmount }
    })

    revalidatePath('/dashboard/admin/inspections')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getInspections(status?: string) {
  try {
    const jobs = await prisma.job.findMany({
      where: { type: 'INSPECTION', ...(status ? { status: status as JobStatus } : {}) },
      include: { 
        client: true, 
        worker: { include: { workerProfile: true } },
        estimate: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, data: jobs }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ─── ESTIMATE ACTIONS ────────────────────────────────────────────────────────

export async function submitJobEstimate(data: {
  jobId: string
  laborCost: number
  materialCost: number
  estimatedDuration: string
  workerNotes?: string
}) {
  try {
    const totalCost = data.laborCost + data.materialCost
    const estimate = await prisma.jobEstimate.upsert({
      where: { jobId: data.jobId },
      update: {
        ...data,
        totalCost,
        status: 'PENDING_REVIEW',
        submittedAt: new Date(),
      },
      create: {
        ...data,
        totalCost,
        status: 'PENDING_REVIEW',
      }
    })

    await logActivity({
      type: 'ADMIN_ACTION',
      content: `Worker submitted estimate for job ${data.jobId}: ₵${totalCost}`,
      metadata: { jobId: data.jobId, estimateId: estimate.id, totalCost }
    })

    revalidatePath('/dashboard/admin/inspections')
    revalidatePath(`/dashboard/worker/estimate/${data.jobId}`)
    
    return { success: true, estimateId: estimate.id }
  } catch (error: any) {
    console.error('submitJobEstimate Error:', error)
    return { success: false, error: error.message }
  }
}

export async function adminReviewEstimate(
  adminId: string,
  jobId: string,
  approved: boolean,
  adminNotes?: string
) {
  try {
    const { ensureAdmin } = await import('./auth')
    await ensureAdmin(adminId)

    const status = approved ? 'APPROVED' : 'REJECTED'
    const estimate = await prisma.jobEstimate.update({
      where: { jobId },
      data: {
        status,
        adminNotes,
        reviewedAt: new Date()
      },
      include: {
        job: {
          include: {
            client: true,
            worker: true
          }
        }
      }
    })

    await sendNotification({
      userId: estimate.job.workerId,
      title: approved ? 'Estimate Approved ✅' : 'Estimate Rejected ❌',
      body: approved
        ? `Your estimate for "${estimate.job.serviceType}" has been approved and sent to the client.`
        : `Your estimate for "${estimate.job.serviceType}" was rejected: ${adminNotes}`
    })

    if (approved) {
      await sendNotification({
        userId: estimate.job.clientId,
        title: 'New Service Estimate ₵',
        body: `Worker ${estimate.job.worker.name} has submitted a price estimate for your request. View details to proceed.`
      })
    }

    revalidatePath('/dashboard/admin/inspections')
    revalidatePath('/bookings')

    return { success: true }
  } catch (error: any) {
    console.error('adminReviewEstimate Error:', error)
    return { success: false, error: error.message }
  }
}

export async function getJobEstimate(jobId: string) {
  try {
    const estimate = await prisma.jobEstimate.findUnique({
      where: { jobId }
    })
    return { success: true, data: estimate }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function declineEstimate(jobId: string) {
  try {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { status: 'CANCELLED' },
      include: { worker: true, client: true }
    });

    await prisma.jobEstimate.update({
      where: { jobId },
      data: { status: 'REJECTED' }
    });

    await sendNotification({
      userId: job.workerId,
      title: 'Estimate Declined',
      body: `The client declined your estimate for the ${job.serviceType} job.`
    });

    revalidatePath('/bookings');
    revalidatePath('/dashboard/worker');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function completeJobAndReleaseFunds(jobId: string) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { payment: true, worker: true, client: true }
    });

    if (!job || job.status !== 'IN_PROGRESS' || !job.payment || job.payment.status !== 'SUCCESS') {
       return { success: false, error: 'Job cannot be completed or is missing verified payment.' };
    }

    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'COMPLETED' }
    });

    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    const totalAmount = job.payment.amount;
    const platformFee = totalAmount * 0.05;
    const workerAmount = totalAmount - platformFee;

    const { creditWallet } = await import('@/lib/wallet');

    await prisma.$transaction(async (tx) => {
       await creditWallet(job.workerId, workerAmount, 'JOB_PAYMENT', job.payment!.reference, tx as any);
       if (admin) {
         await creditWallet(admin.id, platformFee, 'PLATFORM_FEE', job.payment!.reference, tx as any);
       }
    });

    await sendNotification({
      userId: job.workerId,
      title: 'Payment Released 💰',
      body: `The client has marked the job as complete. GHS ${workerAmount.toFixed(2)} has been added to your wallet.`
    });

    await logActivity({
      type: 'PAYMENT_COMPLETED',
      content: `Escrow payment of GHS ${totalAmount.toFixed(2)} released for job ${jobId}`,
      userId: job.clientId,
      metadata: { jobId }
    });

    revalidatePath('/bookings');
    revalidatePath('/dashboard/worker');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


