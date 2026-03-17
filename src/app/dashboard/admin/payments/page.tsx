'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Search, 
  Filter, 
  Download,
  Users,
  CheckCircle2,
  ShieldCheck,
  MoreHorizontal
} from 'lucide-react';

export default function AdminPaymentManagement() {
  const transactions = [
    { id: 'TX-1004', type: 'Payout', user: 'Kwame Mensah', amount: '-₵160.00', status: 'Completed', date: 'Oct 24, 09:12', method: 'MTN MoMo' },
    { id: 'BK-7215', type: 'Payment', user: 'John Mensah', amount: '+₵850.00', status: 'In Escrow', date: 'Oct 24, 10:15', method: 'Visa Card' },
    { id: 'TX-1002', type: 'Payout', user: 'Sarah Mensah', amount: '-₵420.00', status: 'Pending', date: 'Oct 23, 18:00', method: 'Vodafone Cash' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Placeholder */}
      <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col fixed inset-y-0 z-50">
        <div className="p-8">
           <div className="bg-white p-2 rounded-lg inline-block">
              <Image src="/diwalya-logo.png" alt="Diwalya Admin" width={120} height={30} className="object-contain" />
           </div>
        </div>
        <nav className="flex-grow px-4 space-y-1">
          <Link href="/dashboard/admin" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <ShieldCheck size={20} /> Overview
          </Link>
          <Link href="/dashboard/admin/workers" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <Users size={20} /> Manage Workers
          </Link>
          <Link href="/dashboard/admin/bookings" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <CheckCircle2 size={20} /> Oversight
          </Link>
          <Link href="/dashboard/admin/payments" className="flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-xl font-bold transition-all">
            <CreditCard size={20} /> Payments
          </Link>
        </nav>
      </aside>

      <main className="flex-grow ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">Payment Management</h1>
              <p className="text-gray-500">Manage platform commissions, escrow funds, and payouts.</p>
            </div>
            <button className="bg-white px-6 py-3 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
              Export CSV <Download size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
             <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total in Escrow</p>
                <h3 className="text-4xl font-black text-gray-900">₵14,280</h3>
                <div className="mt-4 flex items-center gap-2 text-green-500 font-bold text-xs">
                   <ArrowUpRight size={14} /> +₵1.2k today
                </div>
             </div>
             <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Platform Commission</p>
                <h3 className="text-4xl font-black text-primary">₵2,140</h3>
                <p className="mt-4 text-xs font-bold text-gray-400">Net revenue this month</p>
             </div>
             <div className="bg-slate-900 p-8 rounded-3xl text-white">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Payouts</p>
                <h3 className="text-4xl font-black">24</h3>
                <button className="mt-6 w-full py-3 bg-secondary text-white font-black rounded-xl text-xs hover:scale-105 transition-all">
                  Process All Payouts
                </button>
             </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div className="flex gap-4">
                   <button className="bg-white border rounded-xl px-4 py-2 text-xs font-bold text-primary border-primary">All Transactions</button>
                   <button className="bg-white border rounded-xl px-4 py-2 text-xs font-bold text-gray-400 border-gray-100 hover:border-gray-200">Payouts</button>
                   <button className="bg-white border rounded-xl px-4 py-2 text-xs font-bold text-gray-400 border-gray-100 hover:border-gray-200">Payments</button>
                </div>
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                   <input type="text" placeholder="Search Trans ID..." className="pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary w-48" />
                </div>
             </div>

             <div className="divide-y divide-gray-50">
                {transactions.map((txn) => (
                   <div key={txn.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-6">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${txn.type === 'Payout' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                            {txn.type === 'Payout' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                         </div>
                         <div>
                            <h4 className="font-black text-gray-900 flex items-center gap-2">
                               {txn.user}
                               <span className="text-[10px] font-bold text-gray-400 font-mono tracking-tighter">{txn.id}</span>
                            </h4>
                            <p className="text-xs text-gray-500 font-bold">{txn.date} • {txn.method}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-12">
                         <div className="text-right">
                            <p className={`text-xl font-black ${txn.amount.startsWith('-') ? 'text-gray-900' : 'text-green-600'}`}>{txn.amount}</p>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                               txn.status === 'Completed' ? 'text-green-500' : 
                               txn.status === 'In Escrow' ? 'text-blue-500' : 'text-orange-500'
                            }`}>{txn.status}</span>
                         </div>
                         <button className="p-2 text-gray-300 hover:text-gray-600">
                            <MoreHorizontal size={20} />
                         </button>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
