'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { sendNotification, notifyAdmins } from '@/lib/notifications'
import { logActivity } from './activity'
import { formatGHS } from '@/lib/utils'

// ─── JOB LIFECYCLE ACTIONS ───────────────────────────────────────────────────

export async function createJob(data: {
  clientId: string
  workerId: string
  serviceType: string
  description: string
  location: string
  scheduledAt: string | Date
  priceAmount: number
  audioUrl?: string
}) {
  try {
    const { data: job, error } = await supabaseAdmin
      .from('Job')
      .insert({
        ...data,
        id: `JOB-${Date.now()}`,
        status: 'ADMIN_REVIEW',
        priceAmount: data.priceAmount || 0,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        audioUrl: data.audioUrl || null
      })
      .select()
      .single();

    if (error) throw error;

    // Notify Admins
    await notifyAdmins({
      title: 'New Service Request',
      body: `A new ${data.serviceType} request has been submitted for ${data.location}.`,
      data: { jobId: job.id }
    });

    revalidatePath('/dashboard/admin/bookings')
    
    await logActivity({
      type: 'BOOKING_REQUEST',
      content: `New booking request for ${data.serviceType}`,
      userId: data.clientId,
      metadata: { jobId: job.id, amount: data.priceAmount }
    });
    
    return { success: true, jobId: job.id }
  } catch (error: any) {
    console.error('Create Job Error:', error)
    return { success: false, error: error.message }
  }
}

export async function getJob(jobId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('Job')
      .select('*, client:User!clientId(*), worker:User!workerId(*)')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function adminApproveAndForward(jobId: string) {
    try {
        const { error } = await supabaseAdmin
          .from('Job')
          .update({ status: 'WORKER_REVIEW' })
          .eq('id', jobId);

        if (error) throw error;
        revalidatePath('/dashboard/admin/bookings')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function assignWorker(jobId: string, workerId: string) {
    try {
        const { error } = await supabaseAdmin
          .from('Job')
          .update({ 
            status: 'WORKER_REVIEW',
            workerId: workerId 
          })
          .eq('id', jobId);

        if (error) throw error;
        revalidatePath('/dashboard/admin/bookings')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function workerRespondToJob(jobId: string, response: 'ACCEPT' | 'REJECT' | 'RESCHEDULE', notes?: string) {
    try {
        let status = 'ACCEPTED'
        if (response === 'REJECT') status = 'CANCELLED'
        if (response === 'RESCHEDULE') status = 'RESCHEDULE_REQUESTED'

        const { data: job, error: updateError } = await supabaseAdmin
          .from('Job')
          .update({ status })
          .eq('id', jobId)
          .select('*, worker:User!workerId(*)')
          .single();

        if (updateError) throw updateError;

        revalidatePath('/dashboard/admin/bookings')

        await logActivity({
          type: response === 'ACCEPT' ? 'BOOKING_ACCEPTED' : 'BOOKING_REJECTED',
          content: `Worker ${response === 'ACCEPT' ? 'accepted' : 'rejected'} job for ${jobId}`,
          metadata: { jobId }
        });

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
        }

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ─── PROGRESS TRACKING ACTIONS ───────────────────────────────────────────────

export async function logJobProgress(data: {
  jobId: string
  workerId: string
  content: string
  mediaUrls?: string[]
}) {
  try {
    const { data: progress, error } = await supabaseAdmin
      .from('JobProgress')
      .insert({
        ...data,
        id: `PRG-${Date.now()}`
      })
      .select()
      .single();

    if (error) throw error;

    // Update job status to IN_PROGRESS if it wasn't already
    await supabaseAdmin
      .from('Job')
      .update({ status: 'IN_PROGRESS' })
      .eq('id', data.jobId)
      .eq('status', 'ACCEPTED');

    // Notify Client
    const { data: job } = await supabaseAdmin.from('Job').select('clientId').eq('id', data.jobId).single();
    if (job?.clientId) {
        await sendNotification({
            userId: job.clientId,
            title: 'New Job Update',
            body: `Your specialist added a new update: "${data.content.substring(0, 50)}..."`,
            data: { jobId: data.jobId }
        });
    }

    await logActivity({
      type: 'SYSTEM_ALERT',
      content: `Job ${data.jobId}: ${data.content}`,
      userId: data.workerId,
      metadata: { jobId: data.jobId, progressId: progress.id }
    });

    revalidatePath(`/dashboard/client/jobs/${data.jobId}/track`);
    return { success: true, data: progress };
  } catch (error: any) {
    console.error('Log Progress Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getJobProgress(jobId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('JobProgress')
      .select('*')
      .eq('jobId', jobId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── COMPLETION & PAYOUT ACTIONS ─────────────────────────────────────────────

export async function completeJobAndReleaseFunds(jobId: string) {
  try {
    // 1. Fetch Job and associated Payment
    const { data: job, error: jobError } = await supabaseAdmin
      .from('Job')
      .select('*, payment:Payment(*), worker:User!workerId(*)')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;

    if (!job || job.status !== 'IN_PROGRESS' || !job.payment || job.payment.status !== 'SUCCESS') {
       return { success: false, error: 'Job cannot be completed or is missing verified payment.' };
    }

    // 2. Update Job Status
    const { error: updateError } = await supabaseAdmin
      .from('Job')
      .update({ status: 'COMPLETED', userConfirmedAt: new Date().toISOString() })
      .eq('id', jobId);

    if (updateError) throw updateError;

    // 3. Calculate 95/5 Split and Remaining Balance
    const totalAmount = job.payment.amount;
    const platformFee = totalAmount * 0.05;
    let workerAmount = totalAmount - platformFee;

    // Deduct any partial payouts
    const { data: previousPayouts } = await supabaseAdmin
      .from('PartialPayout')
      .select('amount')
      .eq('jobId', jobId);

    const alreadyPaidToWorker = (previousPayouts || []).reduce((sum, p) => sum + p.amount, 0);
    workerAmount -= alreadyPaidToWorker;

    // 4. Update Worker Wallet (if remaining amount > 0)
    const { data: workerWallet, error: wWalletErr } = await supabaseAdmin
      .from('Wallet')
      .select('*')
      .eq('userId', job.workerId)
      .single();
    
    if (wWalletErr) throw wWalletErr;

    if (workerAmount > 0) {
        const { error: wUpdateErr } = await supabaseAdmin
            .from('Wallet')
            .update({ balance: workerWallet.balance + workerAmount })
            .eq('id', workerWallet.id);
        
        if (wUpdateErr) throw wUpdateErr;
        
        // Final Worker Transaction
        await supabaseAdmin.from('Transaction').insert([
            {
                id: `TXN-W-${Date.now()}`,
                walletId: workerWallet.id,
                amount: workerAmount,
                type: 'CREDIT',
                purpose: 'JOB_PAYMENT',
                reference: job.payment.reference,
                status: 'SUCCESS'
            }
        ]);
    }

    // 5. Update Admin Wallet (for platform fee)
    const { data: adminUser, error: adminErr } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('role', 'SUPER_ADMIN')
      .single();

    if (adminUser) {
        const { data: adminWallet, error: aWalletErr } = await supabaseAdmin
          .from('Wallet')
          .select('*')
          .eq('userId', adminUser.id)
          .single();
        
        if (adminWallet) {
            await supabaseAdmin
              .from('Wallet')
              .update({ balance: adminWallet.balance + platformFee })
              .eq('id', adminWallet.id);
        }
    }

    // 6. Notifications
    await sendNotification({
      userId: job.workerId,
      title: 'Payment Released 💰',
      body: `Job complete! The remaining ${formatGHS(workerAmount)} has been added to your wallet.`
    });

    await logActivity({
      type: 'PAYMENT_COMPLETED',
      content: `Escrow release of ${formatGHS(totalAmount)} for job ${jobId}`,
      userId: job.clientId,
      metadata: { jobId }
    });

    revalidatePath('/dashboard/client/bookings');
    return { success: true };
  } catch (error: any) {
    console.error('Complete Job Error:', error);
    return { success: false, error: error.message };
  }
}

// ─── PARTIAL ESCROW PAYOUT ACTIONS ───────────────────────────────────────────

export async function adminReleasePartialFunds(data: {
  jobId: string,
  adminId: string,
  amount: number,
  reason: string
}) {
  try {
    // 1. Fetch Job and associated Payment
    const { data: job, error: jobError } = await supabaseAdmin
      .from('Job')
      .select('*, payment:Payment(*)')
      .eq('id', data.jobId)
      .single();

    if (jobError || !job) throw new Error('Job not found');

    if (job.status !== 'IN_PROGRESS' && job.status !== 'ACCEPTED') {
       return { success: false, error: 'Partial payouts can only be done while job is active.' };
    }

    const totalAmount = job.payment?.amount || 0;
    const maxWorkerShare = totalAmount * 0.95;

    // 2. Fetch existing payouts
    const { data: previousPayouts } = await supabaseAdmin
      .from('PartialPayout')
      .select('amount')
      .eq('jobId', data.jobId);

    const alreadyPaid = (previousPayouts || []).reduce((sum, p) => sum + p.amount, 0);
    const availableBalance = maxWorkerShare - alreadyPaid;

    if (data.amount > availableBalance) {
      return { success: false, error: `Requested ${formatGHS(data.amount)} exceeds remaining allowable worker balance of ${formatGHS(availableBalance)}` };
    }

    // 3. Update Worker Wallet
    const { data: workerWallet, error: wWalletErr } = await supabaseAdmin
      .from('Wallet')
      .select('*')
      .eq('userId', job.workerId)
      .single();
    
    if (wWalletErr) throw wWalletErr;

    const { error: wUpdateErr } = await supabaseAdmin
      .from('Wallet')
      .update({ balance: workerWallet.balance + data.amount })
      .eq('id', workerWallet.id);
    
    if (wUpdateErr) throw wUpdateErr;

    // 4. Create PartialPayout record
    const { data: payout, error: insertError } = await supabaseAdmin
      .from('PartialPayout')
      .insert({
        id: `PART-${Date.now()}`,
        jobId: data.jobId,
        adminId: data.adminId,
        workerId: job.workerId,
        amount: data.amount,
        reason: data.reason
      })
      .select()
      .single();
      
    if (insertError) throw insertError;

    // 5. Create Transaction Record
    await supabaseAdmin.from('Transaction').insert([
        {
            id: `TXN-W-${Date.now()}-P`,
            walletId: workerWallet.id,
            amount: data.amount,
            type: 'CREDIT',
            purpose: 'EARLY_PAYOUT',
            reference: payout.id,
            status: 'SUCCESS'
        }
    ]);

    // 6. Notifications
    await sendNotification({
      userId: job.workerId,
      title: 'Early Funds Released 💰',
      body: `Admin has released an early payout of ${formatGHS(data.amount)} for job ${data.jobId}. Reason: ${data.reason}`
    });

    await logActivity({
      type: 'PAYMENT_COMPLETED',
      content: `Admin released early payout of ${formatGHS(data.amount)} to worker for job ${data.jobId}`,
      userId: data.adminId,
      metadata: { jobId: data.jobId, amount: data.amount }
    });

    revalidatePath('/dashboard/admin/bookings');
    return { success: true };
  } catch (error: any) {
    console.error('Admin Partial Release Error:', error);
    return { success: false, error: error.message };
  }
}


// ─── DISPUTE ACTIONS ─────────────────────────────────────────────────────────

export async function raiseDispute(data: {
    jobId: string
    raisedById: string
    reason: string
    description: string
}) {
    try {
        const { data: dispute, error } = await supabaseAdmin
          .from('Dispute')
          .insert({
            ...data,
            id: `DISP-${Date.now()}`,
            status: 'OPEN'
          })
          .select()
          .single();

        if (error) throw error;

        await logActivity({
          type: 'REPORT_SUBMITTED',
          content: `Dispute raised for job ${data.jobId}: ${data.reason}`,
          userId: data.raisedById,
          metadata: { jobId: data.jobId, disputeId: dispute.id }
        });

        return { success: true, disputeId: dispute.id }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ─── FETCH ACTIONS ───────────────────────────────────────────────────────────

export async function getAdminBookings(status?: string) {
    try {
        let query = supabaseAdmin
          .from('Job')
          .select('*, client:User!clientId(*), worker:User!workerId(*)')
          .order('createdAt', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getWorkerJobs(workerId: string) {
    try {
        const { data, error } = await supabaseAdmin
          .from('Job')
          .select('*, client:User!clientId(*)')
          .eq('workerId', workerId)
          .order('createdAt', { ascending: false });

        if (error) throw error;
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function getClientJobs(clientId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('Job')
      .select('*, worker:User!workerId(*, workerProfile:WorkerProfile(*)), estimate:JobEstimate(*)')
      .eq('clientId', clientId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── INSPECTION AND ESTIMATE ACTIONS ─────────────────────────────────────────

export async function createInspectionRequest(data: {
  clientId: string
  workerId: string
  serviceType: string
  description: string
  location: string
  scheduledAt: Date
}) {
  try {
    const { data: job, error } = await supabaseAdmin
      .from('Job')
      .insert({
        ...data,
        id: `INSP-${Date.now()}`,
        status: 'PENDING',
        type: 'INSPECTION',
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        paymentId: null // Handled immediately via Paystack
      })
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      type: 'BOOKING_REQUEST',
      content: `New inspection request for ${data.serviceType}`,
      userId: data.clientId,
      metadata: { jobId: job.id, type: 'INSPECTION' }
    });
    
    return { success: true, jobId: job.id };
  } catch (error: any) {
    console.error('Create Inspection Error:', error);
    return { success: false, error: error.message };
  }
}

export async function proposeInspection(data: {
  jobId: string,
  workerId: string
}) {
  try {
    const { error } = await supabaseAdmin
      .from('Job')
      .update({ 
        status: 'INSPECTION_REQUESTED',
        type: 'INSPECTION'
      })
      .eq('id', data.jobId);

    if (error) throw error;

    // Notify Client
    const { data: job } = await supabaseAdmin.from('Job').select('clientId, serviceType').eq('id', data.jobId).single();
    if (job) {
      await sendNotification({
        userId: job.clientId,
        title: 'Inspection Requested',
        body: `Worker has requested a site inspection for your ${job.serviceType} request. The admin will review and send you the inspection fee shortly.`,
        data: { jobId: data.jobId }
      });
    }

    await logActivity({
      type: 'SYSTEM_ALERT',
      content: `Worker requested an inspection for job ${data.jobId}`,
      userId: data.workerId,
      metadata: { jobId: data.jobId }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Propose Inspection Error:', error);
    return { success: false, error: error.message };
  }
}

export async function adminSetInspectionFee(jobId: string, feeAmount: number) {
  try {
    const { error } = await supabaseAdmin
      .from('Job')
      .update({ 
        status: 'INSPECTION_PAYMENT_PENDING',
        priceAmount: feeAmount
      })
      .eq('id', jobId);

    if (error) throw error;

    // Notify Client
    const { data: job } = await supabaseAdmin.from('Job').select('clientId, serviceType').eq('id', jobId).single();
    if (job) {
      await sendNotification({
        userId: job.clientId,
        title: 'Inspection Fee Set',
        body: `The admin has set the inspection fee for your ${job.serviceType} request to ${formatGHS(feeAmount)}. Please proceed to payment.`,
        data: { jobId }
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Admin Set Inspection Fee Error:', error);
    return { success: false, error: error.message };
  }
}

export async function submitJobEstimate(data: {
  jobId: string
  workerId: string
  laborCost: number
  materialCost: number
  totalCost: number
  estimatedDuration: string
  workerNotes?: string
}) {
  try {
    const { data: estimate, error } = await supabaseAdmin
      .from('JobEstimate')
      .upsert({
        id: `EST-${Date.now()}`,
        ...data,
      }, { onConflict: 'jobId' })
      .select()
      .single();

    if (error) throw error;

    // Update job status to require admin review
    const { error: jobErr } = await supabaseAdmin
      .from('Job')
      .update({ status: 'ESTIMATE_PENDING_ADMIN_REVIEW' })
      .eq('id', data.jobId);

    if (jobErr) throw jobErr;

    await logActivity({
      type: 'SYSTEM_ALERT',
      content: `Estimate of ${formatGHS(data.totalCost)} submitted and pending admin review for job ${data.jobId}`,
      userId: data.workerId,
      metadata: { jobId: data.jobId, estimateId: estimate.id }
    });

    return { success: true, data: estimate };
  } catch (error: any) {
    console.error('Submit Estimate Error:', error);
    return { success: false, error: error.message };
  }
}


export async function scheduleInspection(jobId: string, scheduledAt: string | Date, accompanyingMemberId?: string) {
    try {
        const { error } = await supabaseAdmin
          .from('Job')
          .update({ 
            inspectionScheduledAt: new Date(scheduledAt).toISOString(),
            accompanyingMemberId: accompanyingMemberId || null,
            status: 'IN_PROGRESS' 
          })
          .eq('id', jobId);

        if (error) throw error;

        // Notify Client & Specialist
        const { data: job } = await supabaseAdmin.from('Job').select('clientId, workerId').eq('id', jobId).single();
        if (job) {
            await sendNotification({
                userId: job.clientId,
                title: 'Inspection Scheduled',
                body: `Your site inspection has been scheduled for ${new Date(scheduledAt).toLocaleString()}.`,
                data: { jobId }
            });
            if (job.workerId) {
              await sendNotification({
                  userId: job.workerId,
                  title: 'New Inspection Scheduled',
                  body: `You have an inspection scheduled for ${new Date(scheduledAt).toLocaleString()}.`,
                  data: { jobId }
              });
            }
        }

        revalidatePath('/dashboard/admin/bookings');

        await logActivity({
          type: 'SYSTEM_ALERT',
          content: `Inspection scheduled for ${new Date(scheduledAt).toLocaleDateString()}`,
          metadata: { jobId, scheduledAt }
        });

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function completeInspection(jobId: string) {
    try {
        const { error } = await supabaseAdmin
          .from('Job')
          .update({ 
            status: 'IN_PROGRESS' 
          })
          .eq('id', jobId);

        if (error) throw error;

        // Notify Client
        const { data: job } = await supabaseAdmin.from('Job').select('clientId').eq('id', jobId).single();
        if (job) {
            await sendNotification({
                userId: job.clientId,
                title: 'Inspection Completed',
                body: 'The specialist has completed the site inspection and will submit a quote shortly.',
                data: { jobId }
            });
        }

        revalidatePath('/dashboard/admin/bookings');

        await logActivity({
          type: 'SYSTEM_ALERT',
          content: `Inspection marked as completed for ${jobId}`,
          metadata: { jobId }
        });

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}


export async function adminApproveEstimate(jobId: string) {
    try {
        const { error } = await supabaseAdmin
          .from('Job')
          .update({ status: 'ESTIMATE_SUBMITTED' })
          .eq('id', jobId);

        if (error) throw error;

        // Notify Client
        const { data: job } = await supabaseAdmin.from('Job').select('clientId').eq('id', jobId).single();
        if (job) {
            await sendNotification({
                userId: job.clientId,
                title: 'Quote Ready for Review',
                body: 'The specialist has provided a final quote. Please review and pay to start the work.',
                data: { jobId }
            });
        }

        revalidatePath('/dashboard/admin/bookings');
        revalidatePath(`/dashboard/client/jobs/${jobId}/estimate`);

        await logActivity({
          type: 'SYSTEM_ALERT',
          content: `Admin approved estimate for job ${jobId}. Client notified.`,
          metadata: { jobId }
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getJobEstimate(jobId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('JobEstimate')
      .select('*')
      .eq('jobId', jobId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function declineEstimate(jobId: string) {
  try {
    const { error: jobErr } = await supabaseAdmin
      .from('Job')
      .update({ status: 'CANCELLED' })
      .eq('id', jobId);

    if (jobErr) throw jobErr;

    await logActivity({
      type: 'SYSTEM_ALERT',
      content: `Client declined the estimate for job ${jobId}. Job cancelled.`,
      metadata: { jobId }
    });

    revalidatePath('/bookings');
    return { success: true };
  } catch (error: any) {
    console.error('Decline Estimate Error:', error);
    return { success: false, error: error.message };
  }
}

export async function adminReviewEstimate(adminId: string, jobId: string, approved: boolean, adminNotes: string) {
  try {
    const status = approved ? 'APPROVED' : 'REJECTED';
    const jobStatus = approved ? 'AWAITING_PAYMENT' : 'CANCELLED';

    const { error: estErr } = await supabaseAdmin
      .from('JobEstimate')
      .update({ 
        status, 
        reviewedAt: new Date().toISOString(),
        adminNotes 
      })
      .eq('jobId', jobId);

    if (estErr) throw estErr;

    const { error: jobErr } = await supabaseAdmin
      .from('Job')
      .update({ status: jobStatus })
      .eq('id', jobId);

    if (jobErr) throw jobErr;

    await logActivity({
      type: 'SYSTEM_ALERT',
      content: `Admin ${approved ? 'approved' : 'rejected'} estimate for job ${jobId}`,
      userId: adminId,
      metadata: { jobId, approved, adminNotes }
    });

    revalidatePath('/dashboard/admin/inspections');
    return { success: true };
  } catch (error: any) {
    console.error('Admin Review Estimate Error:', error);
    return { success: false, error: error.message };
  }
}

export async function recordPaymentSuccess(data: {
  jobId: string,
  reference: string,
  amount: number,
  type: 'INSPECTION' | 'JOB'
}) {
  try {
    const nextStatus = data.type === 'INSPECTION' ? 'IN_PROGRESS' : 'ACCEPTED';
    const { data: job, error: jobErr } = await supabaseAdmin
      .from('Job')
      .update({ 
        status: nextStatus,
        paidAt: new Date().toISOString(),
        paymentReference: data.reference
      })
      .eq('id', data.jobId)
      .select('*, client:User!clientId(*), worker:User!workerId(*)')
      .single();

    if (jobErr) throw jobErr;

    // Notify Worker
    if (job.workerId) {
      await sendNotification({
        userId: job.workerId,
        title: 'Payment Received!',
        body: `The client has paid for the ${data.type === 'INSPECTION' ? 'inspection' : 'job'}. You can now proceed.`,
        data: { jobId: data.jobId }
      });
    }

    // Notify Admins
    await notifyAdmins({
      title: 'New Payment Confirmed',
      body: `Payment of ${formatGHS(data.amount)} received for job ${data.jobId} (${job.serviceType})`,
      data: { jobId: data.jobId }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Record Payment Success Error:', error);
    return { success: false, error: error.message };
  }
}

export async function adminReleaseFinalPayout(jobId: string, workerAmount: number) {
    try {
        // Fetch job and worker
        const { data: job, error: jobErr } = await supabaseAdmin
          .from('Job')
          .select('*, worker:User!workerId(*)')
          .eq('id', jobId)
          .single();

        if (jobErr) throw jobErr;
        if (!job.worker) throw new Error('Worker not found');

        // 1. Update Worker Wallet
        const newBalance = (job.worker.walletBalance || 0) + workerAmount;
        const { error: walletErr } = await supabaseAdmin
          .from('User')
          .update({ walletBalance: newBalance })
          .eq('id', job.workerId);

        if (walletErr) throw walletErr;

        // 2. Mark job as fully settled
        const { error: updateErr } = await supabaseAdmin
          .from('Job')
          .update({ payoutReleasedAt: new Date().toISOString(), status: 'COMPLETED' }) // Ensure it's completed
          .eq('id', jobId);

        if (updateErr) throw updateErr;

        // Notify Worker & Admins
        await sendNotification({
            userId: job.workerId,
            title: 'Final Payout Released 💰',
            body: `The final payout of ${formatGHS(workerAmount)} has been added to your wallet. Great job!`,
            data: { jobId }
        });
        await notifyAdmins({
            title: 'Funds Disbursed',
            body: `Final payout of ${formatGHS(workerAmount)} was released to ${job.worker.name} for job ${jobId}.`,
            data: { jobId }
        });

        // 3. Log Payout Transaction
        await logActivity({
          type: 'FUNDS_RELEASED',
          content: `Final payout of ${formatGHS(workerAmount)} released to ${job.worker.name}`,
          metadata: { jobId, amount: workerAmount, totalJobCost: job.priceAmount }
        });

        revalidatePath('/dashboard/admin/bookings');
        return { success: true };
    } catch (error: any) {
        console.error('Final Payout Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getInspections(status?: string) {
    try {
        let query = supabaseAdmin
          .from('Job')
          .select('*, client:User!clientId(*), worker:User!workerId(*), estimate:JobEstimate(*)')
          .eq('type', 'INSPECTION')
          .order('createdAt', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { success: true, data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function assignInspectionWorker(jobId: string, workerId: string, teamMember?: string) {
    try {
        const { error } = await supabaseAdmin
          .from('Job')
          .update({ 
            workerId, 
            assignedTeamMember: teamMember,
            status: 'IN_PROGRESS' 
          })
          .eq('id', jobId);

        if (error) throw error;
        revalidatePath('/dashboard/admin/inspections');
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function verifyInspection(jobId: string) {
    try {
        const { error } = await supabaseAdmin
          .from('Job')
          .update({ 
            isInspectionVerified: true,
            status: 'COMPLETED',
            adminVerifiedAt: new Date().toISOString()
          })
          .eq('id', jobId);

        if (error) throw error;
        revalidatePath('/dashboard/admin/inspections');
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function workerCancelJob(jobId: string, workerId: string, reason: string = 'Not specified') {
  try {
    const { data: job, error: fetchError } = await supabaseAdmin
      .from('Job')
      .select('workerId, clientId, serviceType')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      throw new Error('Job not found');
    }

    if (job.workerId !== workerId) {
      throw new Error('Unauthorized');
    }

    const { error: updateError } = await supabaseAdmin
      .from('Job')
      .update({ status: 'CANCELLED' })
      .eq('id', jobId);

    if (updateError) throw updateError;

    // Import inside to avoid circular deps
    const { sendNotification } = await import('@/lib/notifications');
    await sendNotification({
      userId: job.clientId,
      title: 'Job Request Declined',
      body: `The specialist has declined your ${job.serviceType} request. Reason: "${reason}". They are no longer assigned to this job.`
    });

    const { logActivity } = await import('@/app/actions/activity');
    logActivity({
      userId: workerId,
      type: 'JOB_CANCELLED_BY_WORKER',
      content: `Worker declined the ${job.serviceType} request`,
      metadata: { jobId }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Worker Cancel Job Error:', error);
    return { success: false, error: error.message };
  }
}
