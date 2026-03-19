'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { sendNotification } from '@/lib/notifications'
import { ensureAdmin, logAdminAction } from './auth'
import { formatGHS } from '@/lib/utils'

export async function getWithdrawalRequests() {
  try {
    const requests = await prisma.withdrawalRequest.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    })
    return { success: true, requests }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateWithdrawalStatus(requestId: string, status: 'APPROVED' | 'REJECTED' | 'PROCESSED', adminId: string, adminNotes?: string) {
  try {
    await ensureAdmin(adminId)
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const request = await tx.withdrawalRequest.update({
        where: { id: requestId },
        data: { 
          status, 
          adminNotes,
          processedAt: status === 'PROCESSED' || status === 'APPROVED' ? new Date() : null
        }
      })

      // If REJECTED, refund the worker's wallet
      if (status === 'REJECTED') {
        const wallet = await tx.wallet.findUnique({ where: { userId: request.userId } })
        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: request.amount } }
          })

          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              amount: request.amount,
              type: 'CREDIT',
              purpose: 'REFUND',
              reference: request.id,
              status: 'SUCCESS',
              metadata: 'Withdrawal Rejected'
            }
          })
        }
      }

      return request
    })

    // Notify Worker
    const request = await prisma.withdrawalRequest.findUnique({ where: { id: requestId } })
    if (request) {
        await sendNotification({
            userId: request.userId,
            title: `Withdrawal ${status.toLowerCase()}`,
            body: `Your withdrawal request for ${formatGHS(request.amount)} has been ${status.toLowerCase()}. ${adminNotes ? `Note: ${adminNotes}` : ''}`
        })
    }

    await logAdminAction(adminId, `Updated withdrawal ${requestId} status to ${status}`, { requestId, status });
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getPlatformStats() {
  try {
    // 1. Calculate Total Commission (Sum of all PLATFORM_FEE transactions)
    const commissionStats = await prisma.transaction.aggregate({
      where: { purpose: 'PLATFORM_FEE', status: 'SUCCESS' },
      _sum: { amount: true }
    })

    // 2. Calculate Total Processing Revenue (Sum of all successful payments)
    const totalRevenue = await prisma.payment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    })

    // 3. Count Active Bookings
    const activeBookingsCount = await prisma.job.count({
      where: { status: { in: ['ACCEPTED', 'IN_PROGRESS', 'PENDING'] } }
    })

    // 4. Count Total Workers
    const totalWorkers = await prisma.user.count({
      where: { role: 'WORKER' }
    })

    return {
      success: true,
      stats: {
        commission: commissionStats._sum.amount || 0,
        totalRevenue: totalRevenue._sum.amount || 0,
        activeBookings: activeBookingsCount,
        totalWorkers: totalWorkers
      }
    }
  } catch (error: any) {
    console.error('Get Platform Stats Error:', error)
    return { success: false, error: error.message }
  }
}
