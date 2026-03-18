'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter, 
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  User,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { getFinancialData } from '@/app/actions/finance';
import { cn } from '@/lib/utils';

export default function FinancialLedgerPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await getFinancialData();
    if (res.success) setData(res.data);
    setLoading(false);
  };

  if (loading || !data) {
     return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-slate-400 uppercase tracking-widest text-xs animate-pulse">Auditing platform finances...</div>;
  }

  const { stats, transactions, wallets } = data;

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-10">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financial Ledger</h1>
            <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest font-black">Platform-wide economics</p>
          </div>
          <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] transition-all">
            <Download size={16} /> Export Reconciliation
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#0F172A] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-white/10 rounded-2xl">
                        <TrendingUp size={28} className="text-emerald-400" />
                    </div>
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Transaction Volume</p>
                <p className="text-4xl font-black">₵{stats.totalVolume.toLocaleString()}</p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-primary/5 rounded-2xl text-primary">
                        <Zap size={28} />
                    </div>
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Platform Commission (5%)</p>
                <p className="text-4xl font-black text-slate-900">₵{stats.platformCommission.toLocaleString()}</p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                        <Wallet size={28} />
                    </div>
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Active User Wallets</p>
                <p className="text-4xl font-black text-slate-900">{stats.activeWallets}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {/* Recent Transactions */}
            <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                   <CreditCard className="text-primary" /> Audit Trail
                </h2>
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="max-h-[600px] overflow-y-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 sticky top-0 border-b border-slate-100 backdrop-blur-md">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Reference</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-medium">
                                {transactions.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-5">
                                            <p className="text-sm font-black text-slate-900">Ref: {t.payment?.reference.slice(-12) || 'N/A'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{t.serviceType}</p>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-black text-slate-900">₵{t.priceAmount}</td>
                                        <td className="px-6 py-5">
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                                SUCCESS
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Wallet Balances */}
            <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                   <Wallet className="text-indigo-600" /> Wallet Balances
                </h2>
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="max-h-[600px] overflow-y-auto no-scrollbar">
                        <div className="p-8 space-y-4">
                            {wallets.map((w: any) => (
                                <div key={w.id} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-inner border border-slate-100 flex items-center justify-center font-black text-slate-400">
                                            {w.user.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900">{w.user.name}</p>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                                w.user.role === 'WORKER' ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"
                                            )}>
                                                {w.user.role}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-900 tracking-tight">₵{w.balance.toFixed(2)}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Funds</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
