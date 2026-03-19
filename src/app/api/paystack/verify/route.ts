import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { creditWallet } from '@/lib/wallet'
import { Prisma } from '@prisma/client'
import { sendNotification } from '@/lib/notifications';
import { logActivity } from '@/app/actions/activity';
import { formatGHS } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const { reference, jobId, workerId, totalAmount, isEscrow } = await req.json()

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
                status: isEscrow ? 'IN_PROGRESS' : 'ACCEPTED',
                paymentId: payment.id
            }
        })

        if (!isEscrow) {
            // 4. Split Commission (5% to Admin, 95% to Worker)
            const admin = await tx.user.findFirst({
                where: { role: 'ADMIN' }
            })

            if (admin) {
                await creditWallet(admin.id, platformFee, 'PLATFORM_FEE', reference, tx)
            } else {
                console.warn('No admin found to receive platform fee. Reference:', reference)
            }

            // Credit Worker Wallet (95%)
            await creditWallet(workerId, workerAmount, 'JOB_PAYMENT', reference, tx)
        }

        return { job, payment, workerAmount, platformFee }
    })

    // 5. Notify Both Parties
    const { job } = result;

    // Notify Client
    await sendNotification({
        userId: job.clientId,
        title: 'Payment Successful',
        body: `Your payment for ${job.serviceType} was successful. The booking is now confirmed.`
    })

    // Notify Worker
    await sendNotification({
        userId: job.workerId,
        title: isEscrow ? 'Escrow Funded & Job Started' : 'Booking Confirmed',
        body: isEscrow 
          ? `Client has paid ${formatGHS(totalAmount)} into escrow. The job is now IN PROGRESS. Funds release upon completion.` 
          : `Payment received for ${job.serviceType}. You have been credited ${formatGHS(result.workerAmount)}. Check your dashboard.`
    })
    // Log Activity
    await logActivity({
      type: 'PAYMENT_COMPLETED',
      content: `Payment of ${formatGHS(totalAmount)} completed for job ${jobId}`,
      userId: job.clientId,
      metadata: { jobId, amount: totalAmount, reference }
    });

    return NextResponse.json({ success: true, data: job });

  } catch (error: any) {
    console.error('Paystack Verify Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
