import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { creditWallet } from '@/lib/wallet'
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

    const verifiedAmount = paystackData.data.amount / 100 // Paystack uses subunit (pesewas)

    // Check if the verified amount matches (allow for small float diffs if any)
    if (verifiedAmount < (totalAmount - 0.01)) {
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // 2. Platform Fee Calculation (5%)
    const platformFee = totalAmount * 0.05
    const workerAmount = totalAmount - platformFee

    // 3. Update Database using Supabase Admin

    // Find or Create Payment record
    const { data: existingPayment } = await supabaseAdmin
        .from('Payment')
        .select('id')
        .eq('reference', reference)
        .single();
        
    let paymentId = existingPayment?.id;
    
    if (!paymentId) {
        const { data: newPayment, error: paymentError } = await supabaseAdmin
            .from('Payment')
            .insert({
                id: `PAY-${Date.now()}`,
                amount: totalAmount,
                reference,
                status: 'SUCCESS',
                currency: 'GHS'
            })
            .select()
            .single();
            
        if (paymentError) throw paymentError;
        paymentId = newPayment.id;
    } else {
        await supabaseAdmin
            .from('Payment')
            .update({ status: 'SUCCESS' })
            .eq('id', paymentId);
    }

    // Update Job status
    const { data: job, error: jobError } = await supabaseAdmin
        .from('Job')
        .update({
            status: isEscrow ? 'IN_PROGRESS' : 'ACCEPTED',
            paymentId
        })
        .eq('id', jobId)
        .select()
        .single();

    if (jobError) throw jobError;

    if (!isEscrow) {
        // 4. Split Commission (5% to Admin, 95% to Worker) directly
        const { data: adminUser } = await supabaseAdmin
            .from('User')
            .select('id')
            .eq('role', 'SUPER_ADMIN')
            .single();

        if (adminUser) {
            await creditWallet(adminUser.id, platformFee, 'PLATFORM_FEE', reference)
        } else {
            console.warn('No SUPER_ADMIN found to receive platform fee. Reference:', reference)
        }

        // Credit Worker Wallet (95%)
        await creditWallet(workerId, workerAmount, 'JOB_PAYMENT', reference)
    }

    // 5. Notify Both Parties
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
          : `Payment received for ${job.serviceType}. You have been credited ${formatGHS(workerAmount)}. Check your dashboard.`
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
