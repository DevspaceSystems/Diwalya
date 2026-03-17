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
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { getWithdrawalRequests, updateWithdrawalStatus } from '@/app/actions/admin';

export default function AdminWithdrawalsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getWithdrawalRequests();
      if (res.success) {
        setRequests(res.requests || []);
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
      const res = await updateWithdrawalStatus(id, status);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-primary mx-auto mb-4" size={48} />
        <p className="text-gray-500 font-bold">Loading requests...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b h-20 flex items-center justify-between px-8 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin" className="p-2 hover:bg-gray-100 rounded-full transition-all">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-black text-gray-900">Withdrawal Requests</h1>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={fetchRequests} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl font-bold text-sm transition-all">
             Refresh
           </button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto w-full">
        {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-2xl flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="font-bold">{error}</p>
            </div>
        )}

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                   <tr>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Worker</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Details</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                         <td className="px-6 py-6">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black">
                                  {req.user.name.charAt(0)}
                               </div>
                               <div>
                                  <p className="font-bold text-gray-900">{req.user.name}</p>
                                  <p className="text-xs text-gray-400 font-medium">{req.user.email}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-6">
                            <p className="font-black text-gray-900 text-lg">₵{req.amount.toFixed(2)}</p>
                         </td>
                         <td className="px-6 py-6">
                            <div className="flex items-center gap-2 text-gray-600 font-bold text-sm bg-gray-100 px-3 py-1 rounded-full w-fit">
                               {req.method === 'MOMO' ? <Smartphone size={14} /> : <Building2 size={14} />}
                               <span className="text-[10px] font-black uppercase tracking-tighter">{req.method}</span>
                            </div>
                         </td>
                         <td className="px-6 py-6">
                            <p className="text-sm font-bold text-gray-900">{req.accountName}</p>
                            <p className="text-xs text-gray-500 font-medium">{req.accountNumber}</p>
                            {req.bankName && <p className="text-[10px] text-primary uppercase font-black mt-1 tracking-wider">{req.bankName}</p>}
                         </td>
                         <td className="px-6 py-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                              req.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                              req.status === 'APPROVED' || req.status === 'PROCESSED' ? 'bg-green-50 text-green-600 border-green-100' :
                              'bg-red-50 text-red-600 border-red-100'
                            }`}>
                              {req.status}
                            </span>
                         </td>
                         <td className="px-6 py-6 text-right">
                            {req.status === 'PENDING' ? (
                              <div className="flex justify-end gap-2">
                                 <button 
                                   onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                                   disabled={processing === req.id}
                                   className="p-2.5 text-green-600 hover:bg-green-50 rounded-xl transition-all border border-transparent hover:border-green-100"
                                   title="Approve"
                                 >
                                    {processing === req.id ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={22} />}
                                 </button>
                                 <button 
                                   onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                                   disabled={processing === req.id}
                                   className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                                   title="Reject"
                                 >
                                    {processing === req.id ? <Loader2 className="animate-spin" size={20} /> : <XCircle size={22} />}
                                 </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end">
                                 <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Completed</span>
                                 <p className="text-[9px] text-gray-400 mt-0.5">{new Date(req.updatedAt).toLocaleDateString()}</p>
                              </div>
                            )}
                         </td>
                      </tr>
                   ))}
                   {requests.length === 0 && (
                      <tr>
                         <td colSpan={6} className="px-6 py-24 text-center">
                            <div className="max-w-xs mx-auto">
                              <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <Clock size={32} />
                              </div>
                              <p className="text-gray-500 font-bold">No withdrawal requests found.</p>
                              <p className="text-xs text-gray-400 mt-1">Pending requests from workers will appear here.</p>
                            </div>
                         </td>
                    </tr>
                 )}
              </tbody>
           </table>
           </div>
        </div>
      </main>
    </div>
  );
}
