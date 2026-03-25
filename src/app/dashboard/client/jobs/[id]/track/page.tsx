'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  ShieldCheck,
  MessageSquare,
  History,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { getJobProgress, completeJobAndReleaseFunds, raiseDispute } from '@/app/actions/booking';
import { supabase } from '@/lib/supabase';
import { formatGHS } from '@/lib/utils';
import MediaLightbox from '@/components/ui/MediaLightbox';

export default function ClientTrackPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [progressLogs, setProgressLogs] = useState<any[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');

  useEffect(() => {
    fetchJobData();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel(`client-job-track-${jobId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'JobProgress',
        filter: `jobId=eq.${jobId}`
      }, () => {
        fetchJobData();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'Job',
        filter: `id=eq.${jobId}`
      }, () => {
        fetchJobData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  const fetchJobData = async () => {
    setLoading(true);
    try {
      const { data: jobData, error: jobError } = await supabase
        .from('Job')
        .select('*, worker:User!workerId(*), payment:Payment(*)')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      const logsRes = await getJobProgress(jobId);
      if (logsRes.success) setProgressLogs(logsRes.data || []);

    } catch (err: any) {
      console.error('Fetch Job Data Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayment = async () => {
    if (!confirm('Are you sure you want to release the payment? This action is irreversible and confirms you are satisfied with the work.')) return;
    
    setReleasing(true);
    try {
      const res = await completeJobAndReleaseFunds(jobId);
      if (res.success) {
        alert('Payment released successfully! Thank you for using Diwalya.');
        router.push('/dashboard/client');
      } else {
        alert(res.error || 'Failed to release payment');
      }
    } catch (err: any) {
        alert('An error occurred during payment release');
    } finally {
      setReleasing(false);
    }
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const res = await raiseDispute({
            jobId,
            raisedById: job.clientId,
            reason: disputeReason,
            description: disputeDesc
        });
        if (res.success) {
            alert('Dispute raised. An admin will review the progress logs and media evidence shortly.');
            setShowDisputeModal(false);
            fetchJobData();
        }
    } catch (err: any) {
        alert('Failed to raise dispute');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!job) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <h2 className="text-2xl font-black text-gray-900 mb-2">Job Not Found</h2>
      <Link href="/dashboard/client" className="px-6 py-3 bg-primary text-white font-black rounded-xl">Back to Dashboard</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <MediaLightbox 
        url={selectedMedia} 
        onClose={() => setSelectedMedia(null)} 
      />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b z-50 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/client" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} className="text-gray-900" />
          </Link>
          <div>
            <h1 className="font-black text-xl text-gray-900 tracking-tight leading-none">Job Tracking</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Ref: {jobId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Link href={`/chat/${job.id}`} className="p-2 text-gray-400 hover:text-primary transition-colors">
              <MessageSquare size={24} />
           </Link>
        </div>
      </header>

      <main className="pt-28 px-6 max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Job Info & Timeline */}
        <div className="lg:col-span-2 space-y-10">
           {/* Job Card */}
           <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Service Overview</p>
              <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">{job.serviceType}</h2>
              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Worker</p>
                    <p className="font-black text-gray-900 flex items-center gap-2">
                       {job.worker.name} 
                       <ShieldCheck size={14} className="text-blue-500" />
                    </p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                       <Clock size={10} /> {job.status}
                    </span>
                 </div>
              </div>
           </div>

           {/* Timeline Section */}
           <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                   Work Execution Log
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 bg-slate-50 px-2 py-1 rounded-lg">Real-Time</span>
                 </h3>
                 <History size={20} className="text-gray-300" />
              </div>

              <div className="relative pl-8 space-y-12 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                {progressLogs.length === 0 ? (
                  <div className="py-20 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                     <Loader2 size={32} className="text-gray-200 mx-auto mb-2 animate-spin" />
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Awaiting first update from worker...</p>
                  </div>
                ) : (
                  progressLogs.map((log, idx) => (
                    <div key={log.id} className="relative animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                      <div className="absolute left-[-21px] top-1 w-4 h-4 rounded-full bg-white border-4 border-emerald-500 shadow-sm z-10"></div>
                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                               {new Date(log.createdAt).toLocaleDateString()} @ {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                         </div>
                         <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                            <p className="text-sm font-bold text-gray-900 leading-relaxed mb-4">{log.content}</p>
                            {log.mediaUrls && log.mediaUrls.length > 0 && (
                               <div className="grid grid-cols-2 gap-3">
                                  {log.mediaUrls.map((url: string, i: number) => (
                                    <div 
                                      key={i} 
                                      onClick={() => setSelectedMedia(url)}
                                      className="rounded-xl overflow-hidden aspect-video relative group cursor-zoom-in border border-gray-200 shadow-sm"
                                    >
                                       <img src={url} alt="Proof" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                          <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-slate-900 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                            <Info size={16} />
                                          </div>
                                       </div>
                                    </div>
                                  ))}
                               </div>
                            )}
                         </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>

        {/* Right Column: Escrow & Payout */}
        <div className="space-y-6">
           <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full -translate-y-20 translate-x-20 blur-3xl"></div>
              <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-6 text-emerald-400">
                    <ShieldCheck size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Escrow Protected Payout</span>
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Budget Secured</p>
                 <p className="text-4xl font-black mb-10 tracking-tight">{formatGHS(job.payment?.amount || 0)}</p>
                 
                 <div className="space-y-6">
                    <div className="flex items-start gap-4">
                       <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold leading-none shrink-0">1</div>
                       <p className="text-xs text-slate-400 leading-relaxed">Funds are held by **Diwalya Escrow** until you confirm completion.</p>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold leading-none shrink-0">2</div>
                       <p className="text-xs text-slate-400 leading-relaxed">Once satisfied, click the release button below to pay the worker.</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
              <h4 className="font-black text-gray-900 flex items-center gap-2 tracking-tight">
                 <Info size={18} className="text-primary" /> Help & Support
              </h4>
              <p className="text-xs text-gray-500 font-bold leading-relaxed">
                 Having issues with the quality of work? Do not release payment. Instead, raise a dispute for admin review.
              </p>
              <button 
                onClick={() => setShowDisputeModal(true)}
                className="w-full py-4 border-2 border-dashed border-red-100 text-red-500 font-bold rounded-2xl hover:bg-red-50 hover:border-red-200 transition-all text-sm uppercase tracking-widest"
              >
                Raise a Dispute
              </button>
           </div>
        </div>
      </main>

      {/* Payment Release Dock */}
      {job.status === 'COMPLETED' && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t z-50">
           <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                 <p className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">Confirm Service Completion</p>
                 <p className="text-xs font-bold text-gray-400 tracking-tighter">Clicking release will transfer {formatGHS(job.payment?.amount || 0)} to the worker.</p>
              </div>
              <button 
                onClick={handleReleasePayment}
                disabled={releasing}
                className="w-full md:w-auto px-12 py-5 bg-emerald-600 text-white font-black rounded-[2rem] flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all text-lg"
              >
                 {releasing ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={24} /> Confirm & Release Payment</>}
              </button>
           </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden p-8 space-y-6 scale-in-center">
              <div className="text-center">
                 <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 tracking-tight">Raise a Dispute</h3>
                 <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">Ref: {jobId}</p>
              </div>

              <form onSubmit={handleRaiseDispute} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dispute Reason</label>
                    <select 
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      required
                    >
                       <option value="">Select a reason...</option>
                       <option value="INCOMPLETE_WORK">Work is incomplete</option>
                       <option value="POOR_QUALITY">Poor quality of work</option>
                       <option value="MISLEADING_ESTIMATE">Estimate mismatch</option>
                       <option value="WORKER_NO_SHOW">Worker did not show up</option>
                       <option value="OTHER">Other Issue</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Evidence Details</label>
                    <textarea 
                      value={disputeDesc}
                      onChange={(e) => setDisputeDesc(e.target.value)}
                      placeholder="Please describe the issue in detail. Admins will review the progress logs."
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl min-h-[120px] font-bold text-gray-900 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none"
                      required
                    />
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowDisputeModal(false)}
                      className="flex-1 py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                    >
                       Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all transition-all"
                    >
                       Submit Dispute
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
