'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  ArrowLeft, 
  Smartphone, 
  Building2,
  Loader2,
  AlertCircle,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { getWithdrawalRequests, updateWithdrawalStatus } from '@/app/actions/admin';
import { formatGHS } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function AdminWithdrawalsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    async function getAdmin() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
            const { getAdminByEmail } = await import('@/app/actions/admin');
            const res = await getAdminByEmail(session.user.email);
            if (res.success && res.user) {
                setAdminId(res.user.id);
            }
        }
    }
    getAdmin();
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getWithdrawalRequests();
      if (res.success) {
        setRequests(res.requests || []);
        setError('');
      } else {
        setError(res.error || 'Failed to load requests');
      }
    } catch (err: any) {
      setError('An error occurred while fetching requests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED' | 'PROCESSED') => {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this withdrawal?`)) return;
    
    setProcessing(id);
    try {
      const res = await updateWithdrawalStatus(id, status, adminId || '');
      if (res.success) {
        fetchRequests();
      } else {
        alert(res.error || 'Failed to update status');
      }
    } catch (err: any) {
      alert('An error occurred while updating status');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center text-center">
       <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mb-6 animate-pulse">
         <Loader2 className="animate-spin text-primary" size={32} />
       </div>
       <h2 className="text-xl font-black text-slate-900 tracking-tight">Syncing Withdrawal Queue</h2>
       <p className="text-slate-400 font-medium text-xs mt-2 uppercase tracking-widest font-mono">Connecting to financial ledger...</p>
    </div>
  );

  return (
    <div className="p-10 max-w-[1200px] mx-auto space-y-10 pb-32">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Fund Disbursal</h1>
          <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest font-black mt-2 ml-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            Global Withdrawal Management
          </p>
        </div>
        <button 
          onClick={fetchRequests} 
          className="px-6 py-3 bg-white border border-slate-200 hover:border-primary text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 shadow-sm flex items-center gap-2"
        >
          <Activity size={14} /> Refresh Queue
        </button>
      </div>

      {error && (
        <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-sm">
              <AlertCircle size={24} />
           </div>
           <div>
              <p className="text-xs font-black text-red-400 uppercase tracking-widest">Connectivity Warning</p>
              <div className="text-red-900 font-bold leading-tight break-all max-w-2xl">
                {error}
              </div>
              <p className="text-[9px] text-emerald-400 mt-2 font-black uppercase tracking-widest">
                Network Mode: Supabase Secure API (HTTPS)
              </p>
           </div>
        </div>
      )}

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                 <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Worker / Recipient</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-100">Details</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                       <td className="px-8 py-8">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-slate-900/10">
                                {req.user.name.charAt(0)}
                             </div>
                             <div>
                                <p className="font-black text-slate-900 leading-none mb-1">{req.user.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{req.user.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-8">
                          <p className="font-black text-emerald-600 text-2xl tracking-tighter">₵{req.amount.toFixed(2)}</p>
                          <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            req.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            req.status === 'APPROVED' || req.status === 'PROCESSED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            {req.status}
                          </span>
                       </td>
                       <td className="px-8 py-8">
                          <div className="flex items-center gap-2 text-slate-600">
                             {req.method === 'MOMO' ? <Smartphone size={18} className="text-primary" /> : <Building2 size={18} className="text-blue-500" />}
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-0.5">{req.method}</p>
                                <p className="text-[9px] font-bold text-slate-400 italic">FIN-LINK</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-8 border-l border-slate-50 bg-slate-50/30">
                          <div className="space-y-1">
                             <p className="text-xs font-black text-slate-900">{req.accountName}</p>
                             <p className="text-[11px] font-bold text-slate-500 font-mono tracking-tight">{req.accountNumber}</p>
                             {req.bankName && (
                               <div className="flex items-center gap-1.5 mt-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                  <span className="text-[9px] text-primary uppercase font-black tracking-widest">{req.bankName}</span>
                               </div>
                             )}
                          </div>
                       </td>
                       <td className="px-8 py-8 text-right">
                          {req.status === 'PENDING' ? (
                            <div className="flex justify-end gap-3 translate-x-2">
                               <button 
                                 onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                                 disabled={processing === req.id}
                                 className="w-12 h-12 bg-white text-emerald-600 hover:bg-emerald-600 hover:text-white border border-slate-100 rounded-2xl transition-all flex items-center justify-center shadow-sm hover:shadow-emerald-200 group/btn"
                               >
                                  {processing === req.id ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={22} className="group-hover/btn:scale-125 transition-transform" />}
                               </button>
                               <button 
                                 onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                                 disabled={processing === req.id}
                                 className="w-12 h-12 bg-white text-red-600 hover:bg-red-600 hover:text-white border border-slate-100 rounded-2xl transition-all flex items-center justify-center shadow-sm hover:shadow-red-200 group/btn"
                               >
                                  {processing === req.id ? <Loader2 className="animate-spin" size={20} /> : <XCircle size={22} className="group-hover/btn:scale-125 transition-transform" />}
                               </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end pr-2 opacity-50">
                               <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                                  <CheckCircle size={16} className="text-slate-400" />
                                </div>
                               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{req.status}</p>
                               <p className="text-[9px] text-slate-400 mt-0.5">{new Date(req.updatedAt).toLocaleDateString()}</p>
                            </div>
                          )}
                       </td>
                    </tr>
                 ))}
                 {requests.length === 0 && !loading && (
                    <tr>
                       <td colSpan={5} className="px-8 py-32 text-center">
                          <div className="max-w-xs mx-auto">
                            <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                               <Clock size={40} />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 tracking-tight">Queue Empty</h4>
                            <p className="text-slate-400 font-medium text-sm mt-1 leading-relaxed">No withdrawal requests are currently pending processing.</p>
                            <button onClick={fetchRequests} className="mt-8 text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Manual Sync</button>
                          </div>
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}
