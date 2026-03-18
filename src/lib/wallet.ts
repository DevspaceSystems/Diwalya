import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

export async function ensureWallet(userId: string, tx?: Prisma.TransactionClient) {
  const client = tx || prisma
  let wallet = await client.wallet.findUnique({
    where: { userId }
  })

  if (!wallet) {
    wallet = await client.wallet.create({
      data: { userId, balance: 0 }
    })
  }
  return wallet
}

export async function creditWallet(userId: string, amount: number, purpose: any, reference?: string, tx?: Prisma.TransactionClient) {
  const performCredit = async (t: Prisma.TransactionClient) => {
    const wallet = await ensureWallet(userId, t)

    // 1. Update balance
    const updatedWallet = await t.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } }
    })

    // 2. Create transaction record
    await t.transaction.create({
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
  }

  if (tx) {
    return await performCredit(tx)
  }

  return await prisma.$transaction(async (t: Prisma.TransactionClient) => {
    return await performCredit(t)
  })
}

export async function debitWallet(userId: string, amount: number, purpose: any, reference?: string, tx?: Prisma.TransactionClient) {
  const performDebit = async (t: Prisma.TransactionClient) => {
    const wallet = await ensureWallet(userId, t)

    if (wallet.balance < amount) {
      throw new Error('Insufficient wallet balance')
    }

    // 1. Update balance
    const updatedWallet = await t.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } }
    })

    // 2. Create transaction record
    await t.transaction.create({
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
  }

  if (tx) {
    return await performDebit(tx)
  }

  return await prisma.$transaction(async (t: Prisma.TransactionClient) => {
    return await performDebit(t)
  })
}
