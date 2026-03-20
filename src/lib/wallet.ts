import { supabaseAdmin } from './supabase-admin'

export async function ensureWallet(userId: string) {
  let { data: wallet, error } = await supabaseAdmin
    .from('Wallet')
    .select('*')
    .eq('userId', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
      throw error;
  }

  if (!wallet) {
    const { data: newWallet, error: createError } = await supabaseAdmin
      .from('Wallet')
      .insert({
        id: `WAL-${Date.now()}`,
        userId,
        balance: 0
      })
      .select()
      .single()

    if (createError) throw createError;
    wallet = newWallet;
  }
  return wallet
}

export async function creditWallet(userId: string, amount: number, purpose: string, reference?: string) {
  const wallet = await ensureWallet(userId)

  // 1. Update balance
  const { data: updatedWallet, error: updateError } = await supabaseAdmin
    .from('Wallet')
    .update({ balance: wallet.balance + amount })
    .eq('id', wallet.id)
    .select()
    .single()
    
  if (updateError) throw updateError;

  // 2. Create transaction record
  const { error: txnError } = await supabaseAdmin
    .from('Transaction')
    .insert({
      id: `TXN-CRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      walletId: wallet.id,
      amount,
      type: 'CREDIT',
      purpose,
      reference,
      status: 'SUCCESS'
    })

  if (txnError) throw txnError;

  return updatedWallet
}

export async function debitWallet(userId: string, amount: number, purpose: string, reference?: string) {
  const wallet = await ensureWallet(userId)

  if (wallet.balance < amount) {
    throw new Error('Insufficient wallet balance')
  }

  // 1. Update balance
  const { data: updatedWallet, error: updateError } = await supabaseAdmin
    .from('Wallet')
    .update({ balance: wallet.balance - amount })
    .eq('id', wallet.id)
    .select()
    .single()

  if (updateError) throw updateError;

  // 2. Create transaction record
  const { error: txnError } = await supabaseAdmin
    .from('Transaction')
    .insert({
      id: `TXN-DBT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      walletId: wallet.id,
      amount,
      type: 'DEBIT',
      purpose,
      reference,
      status: 'SUCCESS'
    })

  if (txnError) throw txnError;

  return updatedWallet
}
