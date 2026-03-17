import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { creditWallet } from '@/lib/wallet'
import { Prisma } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const { reference, jobId, workerId, totalAmount } = await req.json()

    if (!reference || !jobId || !workerId || !totalAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Verify with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    const paystackData = await paystackRes.json()

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json({ 
        error: 'Payment verification failed', 
        details: paystackData.message 
      }, { status: 400 })
    }

    const verifiedAmount = paystackData.data.amount / 100 // Paystack uses subunit (pesewas/kobo)

    // Check if the verified amount matches (allow for small float diffs if any)
    if (verifiedAmount < (totalAmount - 0.01)) {
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // 2. Platform Fee Calculation (5%)
    const platformFee = totalAmount * 0.05
    const workerAmount = totalAmount - platformFee

    // 3. Update Database and Wallets
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Find or Create Payment record
        const payment = await tx.payment.upsert({
            where: { reference },
            update: { status: 'SUCCESS' },
            create: {
                amount: totalAmount,
                reference,
                status: 'SUCCESS',
                currency: 'GHS'
            }
        })

        // Update Job status
        const job = await tx.job.update({
            where: { id: jobId },
            data: {
                status: 'ACCEPTED',
                paymentId: payment.id
            }
        })

        // Credit Worker Wallet (95%)
        // We use the top-level helper but pass the transaction context if we can. 
        // Since creditWallet uses tx internally if implemented that way, but here we just call the helper.
        // To be safe within a transaction, we'll manually do it here or refactor creditWallet to accept tx.
        
        // Manual implementation for transaction safety:
        let wallet = await tx.wallet.findUnique({ where: { userId: workerId } })
        if (!wallet) {
            wallet = await tx.wallet.create({ data: { userId: workerId, balance: 0 } })
        }

        await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: workerAmount } }
        })

        await tx.transaction.create({
            data: {
                walletId: wallet.id,
                amount: workerAmount,
                type: 'CREDIT',
                purpose: 'JOB_PAYMENT' as any,
                reference: reference,
                status: 'SUCCESS'
            }
        })

        return { job, payment, workerAmount, platformFee }
    })

    return NextResponse.json({ success: true, data: result })

  } catch (error: any) {
    console.error('Paystack Verify Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
