'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendNotification } from '@/lib/notifications'
import { ensureAdmin, logAdminAction } from './auth'
import { formatGHS } from '@/lib/utils'

export async function getWithdrawalRequests() {
  try {
    const { data, error } = await supabaseAdmin
      .from('WithdrawalRequest')
      .select('*, user:User(*)')
      .order('createdAt', { ascending: false })

    if (error) throw error;
    
    return { success: true, requests: data }
  } catch (error: any) {
    console.error('Get Withdrawals Error:', error);
    return { success: false, error: error.message }
  }
}

export async function updateWithdrawalStatus(requestId: string, status: 'APPROVED' | 'REJECTED' | 'PROCESSED', adminId: string, adminNotes?: string) {
  try {
    await ensureAdmin(adminId)
    
    // 1. Get the request first
    const { data: request, error: fetchReqError } = await supabaseAdmin
      .from('WithdrawalRequest')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchReqError) throw fetchReqError;

    // 2. Update the status
    const { error: updateError } = await supabaseAdmin
      .from('WithdrawalRequest')
      .update({ 
        status, 
        adminNotes,
        processedAt: status === 'PROCESSED' || status === 'APPROVED' ? new Date().toISOString() : null
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // 3. If REJECTED, refund the worker's wallet
    if (status === 'REJECTED') {
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('Wallet')
        .select('*')
        .eq('userId', request.userId)
        .single();

      if (walletError && walletError.code !== 'PGRST116') throw walletError; // PGRST116 is no rows found

      if (wallet) {
        const newBalance = wallet.balance + request.amount;
        
        // Update Wallet Balance
        const { error: walletUpdateErr } = await supabaseAdmin
          .from('Wallet')
          .update({ balance: newBalance })
          .eq('id', wallet.id);
        
        if (walletUpdateErr) throw walletUpdateErr;

        // Create Transaction Record
        const { error: txnError } = await supabaseAdmin
          .from('Transaction')
          .insert({
            id: `TXN-REF-${Date.now()}`, // Simple ID generation for now
            walletId: wallet.id,
            amount: request.amount,
            type: 'CREDIT',
            purpose: 'REFUND',
            reference: request.id,
            status: 'SUCCESS',
            metadata: 'Withdrawal Rejected'
          });
          
        if (txnError) throw txnError;
      }
    }

    // 4. Notify Worker
    await sendNotification({
        userId: request.userId,
        title: `Withdrawal ${status.toLowerCase()}`,
        body: `Your withdrawal request for ${formatGHS(request.amount)} has been ${status.toLowerCase()}. ${adminNotes ? `Note: ${adminNotes}` : ''}`
    });

    await logAdminAction(adminId, `Updated withdrawal ${requestId} status to ${status}`, { requestId, status });
    return { success: true }
  } catch (error: any) {
    console.error('Update Withdrawal Status Error:', error);
    return { success: false, error: error.message }
  }
}

export async function getPlatformStats() {
  try {
    // 1. Commission (PLATFORM_FEE)
    const { data: commissionData, error: commissionError } = await supabaseAdmin
      .from('Transaction')
      .select('amount')
      .eq('purpose', 'PLATFORM_FEE')
      .eq('status', 'SUCCESS');

    if (commissionError) throw commissionError;
    const commission = commissionData.reduce((sum, item) => sum + item.amount, 0);

    // 2. Revenue (Successful Payments)
    const { data: revenueData, error: revenueError } = await supabaseAdmin
      .from('Payment')
      .select('amount')
      .eq('status', 'SUCCESS');

    if (revenueError) throw revenueError;
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0);

    // 3. Active Bookings
    const { count: activeBookings, error: bookingsError } = await supabaseAdmin
      .from('Job')
      .select('*', { count: 'exact', head: true })
      .in('status', ['ACCEPTED', 'IN_PROGRESS', 'PENDING']);

    if (bookingsError) throw bookingsError;

    // 4. Total Workers
    const { count: totalWorkers, error: workersError } = await supabaseAdmin
      .from('User')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'WORKER');

    if (workersError) throw workersError;

    return {
      success: true,
      stats: {
        commission,
        totalRevenue: totalRevenue,
        activeBookings: activeBookings || 0,
        totalWorkers: totalWorkers || 0
      }
    }
  } catch (error: any) {
    console.error('Get Platform Stats Error:', error)
    return { success: false, error: error.message }
  }
}

export async function getAdminByEmail(email: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('User')
      .select('id, name, role')
      .eq('email', email)
      .single();

    if (error) throw error;
    return { success: true, user: data }
  } catch (error: any) {
    console.error('Get Admin By Email Error:', error);
    return { success: false, error: error.message }
  }
}

export async function generateSystemReport() {
  try {
    const stats = await getPlatformStats();
    if (!stats.success) throw new Error(stats.error);

    // In a real app, this would generate a PDF/CSV
    // For now, we return the summary data
    await logAdminAction('admin', 'Generated system report');
    
    return { 
      success: true, 
      data: {
        ...stats.stats,
        generatedAt: new Date().toISOString(),
        reportId: `REP-${Date.now()}`
      } 
    };
  } catch (error: any) {
    console.error('Generate Report Error:', error);
    return { success: false, error: error.message };
  }
}
