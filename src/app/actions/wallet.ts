'use server'

import { prisma } from '@/lib/prisma'
import { ensureWallet } from '@/lib/wallet'

export async function getWalletData(userId: string) {
  try {
    const wallet = await ensureWallet(userId)
    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return { success: true, balance: wallet.balance, transactions }
  } catch (error: any) {
    console.error('Get Wallet Data Error:', error)
    return { success: false, error: error.message }
  }
}

export async function requestWithdrawal(userId: string, data: {
    amount: number,
    method: 'MOMO' | 'BANK',
    accountName: string,
    accountNumber: string,
    bankName?: string
}) {
    try {
        const wallet = await prisma.wallet.findUnique({ where: { userId } })
        if (!wallet || wallet.balance < data.amount) {
            return { success: false, error: 'Insufficient balance' }
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Deduct from wallet
            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: data.amount } }
            })

            // 2. Create withdrawal request
            // Note: WithdrawalMethod is an enum in Prisma. Ensure strings match case.
            const request = await tx.withdrawalRequest.create({
                data: {
                    userId,
                    amount: data.amount,
                    method: data.method === 'MOMO' ? 'MOMO' : 'BANK',
                    accountName: data.accountName,
                    accountNumber: data.accountNumber,
                    bankName: data.bankName,
                    status: 'PENDING'
                }
            })

            // 3. Create transaction record
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    amount: data.amount,
                    type: 'DEBIT',
                    purpose: 'WITHDRAWAL',
                    reference: request.id,
                    status: 'SUCCESS'
                }
            })

            return request
        })

        return { success: true, data: result }
    } catch (error: any) {
        console.error('Request Withdrawal Error:', error)
        return { success: false, error: error.message }
    }
}
