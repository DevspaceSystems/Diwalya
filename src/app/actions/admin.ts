'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

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

export async function updateWithdrawalStatus(requestId: string, status: 'APPROVED' | 'REJECTED' | 'PROCESSED', adminNotes?: string) {
  try {
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

    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
