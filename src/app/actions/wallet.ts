'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

// Utility to ensure a user has a wallet
async function ensureWallet(userId: string) {
    const { data: wallet, error } = await supabaseAdmin
        .from('Wallet')
        .select('*')
        .eq('userId', userId)
        .single();
        
    if (wallet) return wallet;
    if (error && error.code !== 'PGRST116') throw error;

    // Create wallet if it doesn't exist
    const { data: newWallet, error: createErr } = await supabaseAdmin
        .from('Wallet')
        .insert({
            id: `WAL-${Date.now()}`,
            userId,
            balance: 0.0
        })
        .select()
        .single();
        
    if (createErr) throw createErr;
    return newWallet;
}

export async function getWalletData(userId: string) {
  try {
    const wallet = await ensureWallet(userId)
    
    const { data: transactions, error: txnError } = await supabaseAdmin
      .from('Transaction')
      .select('*')
      .eq('walletId', wallet.id)
      .order('createdAt', { ascending: false })
      .limit(20);

    if (txnError) throw txnError;

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
        const wallet = await ensureWallet(userId);
        
        if (wallet.balance < data.amount) {
            return { success: false, error: 'Insufficient balance' }
        }

        // 1. Deduct from wallet
        const newBalance = wallet.balance - data.amount;
        const { error: walletErr } = await supabaseAdmin
            .from('Wallet')
            .update({ balance: newBalance })
            .eq('id', wallet.id);
            
        if (walletErr) throw walletErr;

        // 2. Create withdrawal request
        const { data: request, error: reqErr } = await supabaseAdmin
            .from('WithdrawalRequest')
            .insert({
                id: `WREQ-${Date.now()}`,
                userId,
                amount: data.amount,
                method: data.method,
                accountName: data.accountName,
                accountNumber: data.accountNumber,
                bankName: data.bankName,
                status: 'PENDING'
            })
            .select()
            .single();
            
        if (reqErr) throw reqErr;

        // 3. Create transaction record
        const { error: txnErr } = await supabaseAdmin
            .from('Transaction')
            .insert({
                id: `TXN-DBT-${Date.now()}`,
                walletId: wallet.id,
                amount: data.amount,
                type: 'DEBIT',
                purpose: 'WITHDRAWAL',
                reference: request.id,
                status: 'SUCCESS'
            });
            
        if (txnErr) throw txnErr;

        return { success: true, data: request }
    } catch (error: any) {
        console.error('Request Withdrawal Error:', error)
        return { success: false, error: error.message }
    }
}
