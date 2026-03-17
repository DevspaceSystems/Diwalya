import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

export async function ensureWallet(userId: string) {
  let wallet = await prisma.wallet.findUnique({
    where: { userId }
  })

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId, balance: 0 }
    })
  }
  return wallet
}

export async function creditWallet(userId: string, amount: number, purpose: any, reference?: string) {
  const wallet = await ensureWallet(userId)

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Update balance
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } }
    })

    // 2. Create transaction record
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'CREDIT',
        purpose,
        reference,
        status: 'SUCCESS'
      }
    })

    return updatedWallet
  })
}

export async function debitWallet(userId: string, amount: number, purpose: any, reference?: string) {
  const wallet = await ensureWallet(userId)

  if (wallet.balance < amount) {
    throw new Error('Insufficient wallet balance')
  }

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Update balance
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } }
    })

    // 2. Create transaction record
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'DEBIT',
        purpose,
        reference,
        status: 'SUCCESS'
      }
    })

    return updatedWallet
  })
}
