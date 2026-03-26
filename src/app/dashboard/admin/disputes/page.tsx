'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileText,
  Search,
  Filter,
  ArrowRight,
  Loader2,
  Scale
} from 'lucide-react';
import { cn, formatGHS } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import MediaLightbox from '@/components/ui/MediaLightbox';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [progressLogs, setProgressLogs] = useState<any[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Dispute')
        .select('*, job:Job(*, client:User!clientId(*), worker:User!workerId(*), payment:Payment(*))')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setDisputes(data || []);
    } catch (err: any) {
      console.error('Fetch Disputes Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobProgress = async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('JobProgress')
        .select('*')
        .eq('jobId', jobId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setProgressLogs(data || []);
    } catch (err: any) {
      console.error('Fetch Progress Error:', err);
    }
  };

  const handleResolve = async (resolution: string, adminNotes: string) => {
    if (!selectedDispute) return;
    setResolving(true);
    try {
        // 1. Update Dispute
        const { error: dispError } = await supabase
            .from('Dispute')
            .update({ 
                status: 'RESOLVED', 
                resolution, 
                adminNotes,
                updatedAt: new Date().toISOString()
            })
            .eq('id', selectedDispute.id);

        if (dispError) throw dispError;

        // 2. Log Admin Action
        const { logAdminAction } = await import('@/app/actions/auth');
        await logAdminAction('admin', `Resolved dispute ${selectedDispute.id} with resolution: ${resolution}`);

        // 3. Optional: Trigger payout/refund logic here based on resolution
        // (For brevity, we'll just alert that it's resolved. In production, 
        // this would call another action to split the escrow funds)

        alert(`Dispute ${selectedDispute.id} marked as RESOLVED.`);
        setSelectedDispute(null);
        fetchDisputes();
    } catch (err: any) {
        alert('Failed to resolve dispute: ' + err.message);
    } finally {
        setResolving(false);
    }
  };

  const statusColors: any = {
    'OPEN': 'bg-red-50 text-red-600 border-red-100',
    'UNDER_REVIEW': 'bg-blue-50 text-blue-600 border-blue-100',
    'RESOLVED': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'CLOSED': 'bg-gray-50 text-gray-400 border-gray-100'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <MediaLightbox 
        url={selectedMedia} 
        onClose={() => setSelectedMedia(null)} 
      />
      <main className="flex-grow p-8">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-red-600/20">
                 <ShieldAlert size={30} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dispute Resolution</h1>
                <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mt-1">Platform Integrity Hub</p>
              </div>
           </div>
           
           <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
              <button className="px-6 py-2 bg-slate-900 text-white font-black rounded-xl text-xs uppercase tracking-widest">Active Cases</button>
              <button className="px-6 py-2 text-gray-700 font-bold rounded-xl text-xs uppercase tracking-widest hover:text-gray-800">Archived</button>
           </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
           {/* Dispute List */}
           <div className="xl:col-span-2 space-y-4">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-dashed border-gray-200">
                   <Loader2 className="animate-spin text-primary mb-4" />
                   <p className="text-xs font-bold text-gray-700 uppercase tracking-widest leading-none">Scanning for disputes...</p>
                </div>
              ) : disputes.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-dashed border-gray-200">
                   <CheckCircle2 size={40} className="text-emerald-500 mb-4" />
                   <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Everything is peaceful</p>
                </div>
              ) : (
                disputes.map((dispute) => (
                  <div 
                    key={dispute.id}
                    onClick={() => {
                        setSelectedDispute(dispute);
                        fetchJobProgress(dispute.jobId);
                    }}
                    className={cn(
                        "bg-white p-6 rounded-[2rem] border transition-all cursor-pointer group hover:shadow-xl hover:scale-[1.01]",
                        selectedDispute?.id === dispute.id ? "border-red-500 ring-2 ring-red-500/10 shadow-xl" : "border-gray-100 shadow-sm"
                    )}
                  >
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-800">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-gray-900 text-lg tracking-tight leading-none mb-1">{dispute.reason}</h4>
                                <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    Ref: {dispute.id} <span className="w-1 h-1 bg-gray-300 rounded-full"></span> {new Date(dispute.createdAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <span className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                            statusColors[dispute.status]
                        )}>
                            {dispute.status}
                        </span>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-gray-50 p-4 rounded-2xl">
                           <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-1">Claimant</p>
                           <p className="text-xs font-black text-gray-900">{dispute.job?.client?.name}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border-l-4 border-red-500">
                           <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-1">Target</p>
                           <p className="text-xs font-black text-gray-900">{dispute.job?.worker?.name}</p>
                        </div>
                     </div>
                  </div>
                ))
              )}
           </div>

           {/* Resolution Sidebar */}
           <div className="relative">
              {!selectedDispute ? (
                <div className="bg-white p-10 rounded-[2.5rem] border border-dashed border-gray-200 text-center h-[600px] flex flex-col items-center justify-center">
                    <Scale size={48} className="text-gray-100 mb-4" />
                    <p className="text-sm font-bold text-gray-700 uppercase tracking-widest max-w-[200px] leading-relaxed">
                        Select a case from the list to begin arbitration
                    </p>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl sticky top-8 space-y-8 max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-black text-red-600 tracking-tight leading-none">Case Arbitration</h3>
                            <button onClick={() => setSelectedDispute(null)} className="p-1 text-gray-700 hover:text-gray-900"><XCircle size={20} /></button>
                        </div>
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-6">Arbitrator: Administrative Oversight</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Dispute Narrative</p>
                            <div className="p-4 bg-red-50/30 rounded-2xl border border-red-100">
                                <p className="text-xs font-bold text-gray-700 leading-relaxed italic">"{selectedDispute.description}"</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                           <div className="flex items-center justify-between">
                              <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Evidence Analysis</p>
                              <span className="text-[9px] font-black text-primary uppercase tracking-widest">{progressLogs.length} LOGS</span>
                           </div>
                           <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                              {progressLogs.length === 0 ? (
                                <div className="p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                   <p className="text-xs font-bold text-gray-800 uppercase tracking-widest">No progress logs found for this job</p>
                                </div>
                              ) : (
                                progressLogs.map((log) => (
                                    <div key={log.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-blue-200 transition-all">
                                        <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-1">{new Date(log.createdAt).toLocaleDateString()}</p>
                                        <p className="text-xs font-bold text-gray-800 leading-tight mb-3">{log.content}</p>
                                        {log.mediaUrls && log.mediaUrls.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                                {log.mediaUrls.map((url: string, i: number) => (
                                                    <img 
                                                      key={i} 
                                                      src={url} 
                                                      onClick={() => setSelectedMedia(url)}
                                                      className="w-16 h-16 rounded-lg object-cover border border-gray-200 hover:scale-110 transition-all cursor-zoom-in" 
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                              )}
                           </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 space-y-4">
                            <h4 className="font-black text-gray-900 tracking-tight text-lg mb-2">Final Resolution</h4>
                            <div className="grid grid-cols-1 gap-2">
                                <button 
                                  onClick={() => handleResolve('FULL_PAYMENT', 'After review of log evidence, work was found to be complete.')}
                                  className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={18} /> Payout Worker (100%)
                                </button>
                                <button 
                                  onClick={() => handleResolve('PARTIAL_REFUND', 'Work was partially completed. Payout split.')}
                                  className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl hover:bg-orange-600 shadow-xl shadow-orange-500/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <ArrowRight size={18} /> Partial Payout (50/50)
                                </button>
                                <button 
                                  onClick={() => handleResolve('FULL_REFUND', 'No work evidence found. Refund to client.')}
                                  className="w-full py-4 border-2 border-red-500 text-red-600 font-black rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <XCircle size={18} /> Full Refund to Client
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
              )}
           </div>
        </div>
      </main>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        
        @keyframes scale-in-center {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .scale-in-center { animation: scale-in-center 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
      `}</style>
    </div>
  );
}
