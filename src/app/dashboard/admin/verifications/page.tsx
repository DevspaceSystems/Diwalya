'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  User, 
  MapPin, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  FileText,
  Clock,
  Briefcase
} from 'lucide-react';
import { getPendingVerifications, approveWorker, rejectWorker } from '@/app/actions/worker';
import { cn } from '@/lib/utils';

export default function VerificationCenterPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const res = await getPendingVerifications();
    if (res.success) setRequests(res.data || []);
    setLoading(false);
  };

  const handleAction = async (userId: string, action: 'APPROVE' | 'REJECT') => {
    const reason = action === 'REJECT' ? prompt('Enter rejection reason:') : '';
    if (action === 'REJECT' && !reason) return;

    setProcessing(userId);
    const res = action === 'APPROVE' ? await approveWorker(userId) : await rejectWorker(userId, reason!);
    
    if (res.success) {
      alert(`Worker ${action.toLowerCase()}d successfully`);
      fetchRequests();
    } else {
      alert(`Error: ${res.error}`);
    }
    setProcessing(null);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Verification Center</h1>
          <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest font-black">Worker Approval Queue</p>
        </div>

        <div className="space-y-6">
          {loading ? (
             <div className="py-20 text-center font-black text-slate-400 animate-pulse">Syncing verification requests...</div>
          ) : requests.length === 0 ? (
             <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-200">
               <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 size={40} />
               </div>
               <h3 className="text-xl font-black text-slate-900">All caught up!</h3>
               <p className="text-slate-500 font-medium mt-2">No pending worker verifications.</p>
             </div>
          ) : requests.map((req) => (
            <div key={req.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-xl transition-all group">
              <div className="p-8 flex-grow space-y-8">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center font-black text-2xl text-slate-400 overflow-hidden">
                        {req.user.profilePicture ? <img src={req.user.profilePicture} className="w-full h-full object-cover" /> : req.user.name[0]}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{req.businessName || req.user.name}</h3>
                        <div className="flex items-center gap-4 mt-1">
                           <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><User size={14}/> {req.user.name}</span>
                           <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Briefcase size={14}/> {req.category}</span>
                        </div>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-yellow-100 mb-2">
                        <Clock size={12} /> Pending Review
                      </div>
                      <p className="text-[10px] font-bold text-slate-400">{new Date(req.user.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Location & Experience</p>
                    <div className="space-y-3">
                       <p className="text-sm font-bold flex items-center gap-2 text-slate-700 font-black"><MapPin size={16} className="text-primary"/> {req.location}</p>
                       <p className="text-sm font-bold flex items-center gap-2 text-slate-700 font-black"><Clock size={16} className="text-primary"/> {req.experienceYears} Years Exp.</p>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 col-span-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Worker Bio</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3 italic">"{req.bio || 'No bio provided'}"</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  {req.ghanaCardUrl && (
                    <a 
                      href={req.ghanaCardUrl} 
                      target="_blank" 
                      className="inline-flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-slate-900/10"
                    >
                      <FileText size={18} /> View ID Documentation <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>

              <div className="bg-slate-50/50 p-8 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col justify-center gap-4 min-w-[240px]">
                <button 
                  disabled={!!processing}
                  onClick={() => handleAction(req.userId, 'APPROVE')}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-600/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} /> Approve
                </button>
                <button 
                  disabled={!!processing}
                  onClick={() => handleAction(req.userId, 'REJECT')}
                  className="w-full py-4 bg-white text-red-600 border border-red-100 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle size={18} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
