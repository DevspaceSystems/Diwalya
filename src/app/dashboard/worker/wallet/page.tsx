'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Smartphone,
  Building2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getWalletData, requestWithdrawal } from '@/app/actions/wallet';
import { formatGHS } from '@/lib/utils';

export default function WorkerWalletPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);
  
  // Withdrawal Form
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'MOMO' | 'BANK'>('MOMO');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const res = await getWalletData(user.id);
      if (res.success) {
        setData(res);
      } else {
        setError(res.error || 'Failed to load wallet data');
      }
    }
    setLoading(false);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await requestWithdrawal(user.id, {
        amount: parseFloat(amount),
        method,
        accountName,
        accountNumber,
        bankName: method === 'BANK' ? bankName : 'Mobile Money'
    });

    if (res.success) {
        setShowWithdraw(false);
        setAmount('');
        fetchData(); // Refresh balance
        alert('Withdrawal request submitted successfully!');
    } else {
        setError(res.error || 'Withdrawal failed');
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <header className="bg-white border-b h-20 flex items-center px-8 sticky top-0 z-40">
        <Link href="/dashboard/worker" className="p-2 hover:bg-gray-100 rounded-full transition-all mr-4">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Wallet & Earnings</h1>
      </header>

      <div className="p-8 max-w-4xl mx-auto">
        {/* Balance Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-900/20 mb-10 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
           
           <div className="relative z-10">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">Available Balance</p>
              <h2 className="text-6xl font-black mb-10">{formatGHS(data?.balance)}</h2>
              
              <div className="flex flex-wrap gap-4">
                 <button 
                   onClick={() => setShowWithdraw(true)}
                   className="px-8 py-4 bg-secondary text-white font-black rounded-2xl shadow-lg shadow-orange-500/30 hover:scale-105 transition-all text-lg"
                 >
                   Withdraw Funds
                 </button>
                 <div className="px-6 py-4 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3">
                    <TrendingUp className="text-green-400" size={20} />
                    <span className="font-bold">+₵0.00 this week</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-black text-gray-900 text-lg">Recent Transactions</h3>
              <Clock className="text-gray-300" size={20} />
           </div>
           
           <div className="divide-y divide-gray-50">
              {data?.transactions?.length > 0 ? (
                data.transactions.map((tx: any) => (
                  <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          tx.type === 'CREDIT' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                           {tx.type === 'CREDIT' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                        </div>
                        <div>
                           <h4 className="font-bold text-gray-900">{tx.purpose.replace('_', ' ')}</h4>
                           <p className="text-xs text-gray-400 font-bold">{new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                     </div>
                     <p className={`text-lg font-black ${
                       tx.type === 'CREDIT' ? 'text-green-600' : 'text-gray-900'
                     }`}>
                       {tx.type === 'CREDIT' ? '+' : '-'}{formatGHS(tx.amount)}
                     </p>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-400 italic font-medium">
                   No transactions recorded yet. Your earnings will appear here.
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8">
                 <h3 className="text-2xl font-black text-gray-900 mb-2">Withdraw Funds</h3>
                 <p className="text-gray-500 text-sm mb-8 font-medium">Funds will be sent to your account within 24 hours.</p>

                 {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm flex items-center gap-2 border border-red-100">
                       <AlertCircle size={18} /> {error}
                    </div>
                 )}

                 <form onSubmit={handleWithdraw} className="space-y-6">
                    <div>
                       <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Amount (₵)</label>
                       <input 
                         type="number" 
                         required 
                         min="10"
                         step="0.01"
                         value={amount}
                         onChange={(e) => setAmount(e.target.value)}
                         className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all font-black text-2xl text-gray-900"
                         placeholder="0.00"
                       />
                    </div>

                    <div>
                       <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Withdrawal Method</label>
                       <div className="grid grid-cols-2 gap-3">
                          <button 
                            type="button"
                            onClick={() => setMethod('MOMO')}
                            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                              method === 'MOMO' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400'
                            }`}
                          >
                             <Smartphone size={24} />
                             <span className="font-bold text-xs uppercase tracking-tighter">Mobile Money</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => setMethod('BANK')}
                            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                              method === 'BANK' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400'
                            }`}
                          >
                             <Building2 size={24} />
                             <span className="font-bold text-xs uppercase tracking-tighter">Bank Transfer</span>
                          </button>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <input 
                         type="text" 
                         required 
                         value={accountName}
                         onChange={(e) => setAccountName(e.target.value)}
                         placeholder="Account Holder Name" 
                         className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none text-sm font-bold text-gray-900"
                       />
                       <input 
                         type="text" 
                         required 
                         value={accountNumber}
                         onChange={(e) => setAccountNumber(e.target.value)}
                         placeholder={method === 'MOMO' ? 'Momo Number (024...)' : 'Account Number'} 
                         className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none text-sm font-bold text-gray-900"
                       />
                       {method === 'BANK' && (
                         <input 
                           type="text" 
                           required 
                           value={bankName}
                           onChange={(e) => setBankName(e.target.value)}
                           placeholder="Bank Name (e.g. GCB, Ecobank)" 
                           className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none text-sm font-bold text-gray-900"
                         />
                       )}
                    </div>

                    <div className="flex gap-4 pt-4">
                       <button 
                         type="button"
                         onClick={() => setShowWithdraw(false)}
                         className="flex-grow py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all shadow-sm"
                       >
                         Cancel
                       </button>
                       <button 
                         type="submit"
                         disabled={submitting}
                         className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                       >
                         {submitting ? <Loader2 className="animate-spin mx-auto text-white" /> : 'Request Withdrawal'}
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
