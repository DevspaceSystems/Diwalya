'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function getFinancialData() {
  try {
    // 1. Get all wallets
    const { data: wallets, error: walletError } = await supabaseAdmin
      .from('Wallet')
      .select('*, user:User(name, email, role)');

    if (walletError) throw walletError;

    // Transform wallet user (single object)
    const transformedWallets = wallets?.map(w => ({
      ...w,
      user: Array.isArray(w.user) ? w.user[0] : w.user
    }));

    // 2. Get recent transactions (Jobs with successful payments)
    // Supabase can query across relations if they are defined
    const { data: transactions, error: jobError } = await supabaseAdmin
      .from('Job')
      .select(`
        *,
        client:User!Job_clientId_fkey(name),
        worker:User!Job_workerId_fkey(
          name,
          workerProfile:WorkerProfile(businessName)
        ),
        payment:Payment!inner(*)
      `)
      .eq('payment.status', 'SUCCESS')
      .order('createdAt', { ascending: false })
      .limit(50);

    if (jobError) throw jobError;

    // Transform transactions (handle nested arrays from joins)
    const transformedTransactions = transactions?.map(job => ({
      ...job,
      client: Array.isArray(job.client) ? job.client[0] : job.client,
      worker: Array.isArray(job.worker) ? {
        ...job.worker[0],
        workerProfile: Array.isArray(job.worker[0]?.workerProfile) 
          ? job.worker[0].workerProfile[0] 
          : job.worker[0]?.workerProfile
      } : null,
      payment: Array.isArray(job.payment) ? job.payment[0] : job.payment
    }));

    // 3. System totals
    const totalVolume = transformedTransactions?.reduce((sum, job) => sum + (job.priceAmount || 0), 0) || 0;
    const platformCommission = totalVolume * 0.05;

    return { 
      success: true, 
      data: { 
        wallets: transformedWallets, 
        transactions: transformedTransactions,
        stats: {
          totalVolume,
          platformCommission,
          activeWallets: transformedWallets?.length || 0
        }
      } 
    };
  } catch (error: any) {
    console.error('getFinancialData Error:', error);
    return { success: false, error: error.message };
  }
}
