import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { creditWallet } from '@/lib/wallet';
import { sendNotification } from '@/lib/notifications';
import { logActivity } from '@/app/actions/activity';
import { formatGHS } from '@/lib/utils';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // 1. Verify Signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('[Paystack Webhook] Invalid signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);
    
    // Only process successful charges
    if (event.event !== 'charge.success') {
      return new Response('Event not handled', { status: 200 });
    }

    const data = event.data;
    const reference = data.reference;
    const metadata = data.metadata || {};
    const jobId = metadata.job_id;
    const workerId = metadata.worker_id;
    const isEscrow = metadata.is_escrow;
    const totalAmount = data.amount / 100; // Rescale from pesewas

    console.log(`[Paystack Webhook] Processing reference: ${reference}, Job: ${jobId}`);

    if (!jobId || !workerId) {
       console.warn('[Paystack Webhook] Missing jobId or workerId in metadata. Reference:', reference);
       // Attempt to recover from reference-embedded ID if necessary, 
       // but metadata is preferred.
    }

    // 2. Check for Duplicate (Idempotency)
    const { data: existingPayment } = await supabaseAdmin
      .from('Payment')
      .select('id, status')
      .eq('reference', reference)
      .maybeSingle();

    if (existingPayment?.status === 'SUCCESS') {
      console.log(`[Paystack Webhook] Reference ${reference} already processed.`);
      return new Response('Success (Duplicate)', { status: 200 });
    }

    // 3. Process Transaction (Wallet & Status Updates)
    // Create/Update Payment record
    let paymentId = existingPayment?.id;
    if (!paymentId) {
      const { data: newPayment, error: pErr } = await supabaseAdmin
        .from('Payment')
        .insert({
          id: `PAY-WH-${Date.now()}`,
          amount: totalAmount,
          reference,
          status: 'SUCCESS',
          currency: 'GHS'
        })
        .select()
        .single();
      if (pErr) throw pErr;
      paymentId = newPayment.id;
    } else {
      await supabaseAdmin.from('Payment').update({ status: 'SUCCESS' }).eq('id', paymentId);
    }

    // Update Job status
    if (jobId) {
      const { data: job, error: jErr } = await supabaseAdmin
        .from('Job')
        .update({
          status: isEscrow ? 'IN_PROGRESS' : 'ACCEPTED',
          paymentId
        })
        .eq('id', jobId)
        .select()
        .single();

      if (!jErr && job) {
        if (!isEscrow) {
          // Direct Payout Split (95/5)
          // Find first active SUPER_ADMIN
          const { data: admins } = await supabaseAdmin
            .from('User')
            .select('id')
            .eq('role', 'SUPER_ADMIN')
            .limit(1);

          const platformAdminId = admins?.[0]?.id;
          const platformFee = totalAmount * 0.05;
          const workerAmount = totalAmount - platformFee;

          if (platformAdminId) {
            await creditWallet(platformAdminId, platformFee, 'PLATFORM_FEE', reference);
          }
          await creditWallet(workerId, workerAmount, 'JOB_PAYMENT', reference);
        }

        // Notify
        await sendNotification({
          userId: job.clientId,
          title: 'Payment Confirmed',
          body: `We've confirmed your payment of ${formatGHS(totalAmount)}. Your request is now active.`
        });
        
        await sendNotification({
          userId: job.workerId,
          title: isEscrow ? 'Job Funded' : 'Job Confirmed',
          body: isEscrow ? `Escrow funded for ${job.serviceType}. You can begin work.` : `Payment received for ${job.serviceType}. Check your wallet.`
        });

        await logActivity({
          type: 'PAYMENT_COMPLETED',
          content: `Paystack Webhook: Finalized payment of ${formatGHS(totalAmount)} for job ${jobId}`,
          userId: job.clientId,
          metadata: { reference, jobId }
        });
      }
    }

    return new Response('Webhook processed', { status: 200 });
  } catch (error: any) {
    console.error('[Paystack Webhook] Error:', error);
    return new Response('Internal Error', { status: 500 });
  }
}
