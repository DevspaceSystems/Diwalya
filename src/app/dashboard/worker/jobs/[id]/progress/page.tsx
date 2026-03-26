'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Camera, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  Plus,
  Coins,
  Wallet
} from 'lucide-react';
import Link from 'next/link';
import { logJobProgress, completeJobAndReleaseFunds, completeInspection, getJob } from '@/app/actions/booking';
import { cn, formatGHS } from '@/lib/utils';
import { sendNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import MediaUpload from '@/components/ui/MediaUpload';
import MediaLightbox from '@/components/ui/MediaLightbox';

export default function WorkerProgressPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchJobDetails();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel(`job-progress-${jobId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'JobProgress',
        filter: `jobId=eq.${jobId}`
      }, () => {
        fetchJobDetails();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  const fetchJobDetails = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      // Fetch job using Supabase
      const { data: jobData, error: jobError } = await supabase
        .from('Job')
        .select('*, client:User!clientId(*)')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Fetch existing progress
      const { data: logs, error: logsError } = await supabase
        .from('JobProgress')
        .select('*')
        .eq('jobId', jobId);

      if (logsError) throw logsError;

      // Fetch partial payouts
      const { data: payouts, error: payoutsErr } = await supabase
        .from('PartialPayout')
        .select('*')
        .eq('jobId', jobId);

      if (payoutsErr) throw payoutsErr;

      // Unify and sort
      const unified = [
        ...(logs || []).map((l: any) => ({ ...l, timelineType: 'PROGRESS' })),
        ...(payouts || []).map((p: any) => ({ ...p, timelineType: 'FUNDS' }))
      ];

      unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTimelineEvents(unified);

    } catch (err: any) {
      console.error('Fetch Job Details Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await logJobProgress({
        jobId,
        workerId: job.workerId,
        content,
        mediaUrls: mediaUrl ? [mediaUrl] : []
      });

      if (res.success) {
        setContent('');
        setMediaUrl('');
        fetchJobDetails();
      } else {
        alert(res.error || 'Failed to log progress');
      }
    } catch (err: any) {
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!confirm('Are you sure you want to mark this job as completed? This will inform the client to release payment.')) return;
    
    setCompleting(true);
    try {
        const { error } = await supabase
            .from('Job')
            .update({ status: 'COMPLETED', completedAt: new Date().toISOString() })
            .eq('id', jobId);

        if (error) throw error;
        alert('Job marked as completed! Payment will be released once the client confirms.');
        router.push('/dashboard/worker');
    } catch (err: any) {
        alert(err.message || 'Failed to update job status');
    } finally {
        setCompleting(false);
    }
  };

  const handleCompleteInspection = async () => {
    if (!confirm('Mark this inspection as completed? You can then proceed to submit your final quote.')) return;
    setCompleting(true);
    const res = await completeInspection(jobId);
    if (res.success) {
        alert('Inspection completed! You can now submit your final quote.');
        fetchJobDetails();
    } else {
        alert(res.error || 'Failed to complete inspection');
    }
    setCompleting(false);
  };

  const handleStartJob = async () => {
    setCompleting(true);
    try {
        const { error } = await supabase
            .from('Job')
            .update({ status: 'IN_PROGRESS', startedAt: new Date().toISOString() })
            .eq('id', jobId);

        if (error) throw error;

        // Notify Client
        if (job.clientId) {
          await sendNotification({
            userId: job.clientId,
            title: 'Job Started!',
            body: `Your specialist ${job.worker?.name || ''} has started working on your ${job.serviceType} request.`,
            data: { jobId }
          });
        }

        alert('Job started! You can now log your progress.');
        fetchJobDetails();
    } catch (err: any) {
        alert(err.message || 'Failed to start job');
    } finally {
        setCompleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-24">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!job) return (
    <div className="flex flex-col items-center justify-center p-24 text-center">
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <h2 className="text-2xl font-black text-gray-900 mb-2">Job Not Found</h2>
      <p className="text-gray-700 mb-6 font-bold">The job you are looking for does not exist or you do not have permission to view it.</p>
      <Link href="/dashboard/worker" className="px-6 py-3 bg-primary text-white font-black rounded-xl">Back to Dashboard</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <MediaLightbox 
        url={selectedMedia} 
        onClose={() => setSelectedMedia(null)} 
      />
      <div className="mb-10">
        <h1 className="font-black text-2xl text-gray-900 tracking-tight leading-none">Execution Progress</h1>
        <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">ID: {jobId}</p>
      </div>

      <div className="space-y-10">
        {/* Job Summary Card */}
        <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl">
           <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Active Service</p>
           <h2 className="text-3xl font-black mb-4 tracking-tight">{job.serviceType}</h2>
           <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                 <Clock size={14} /> Scheduled: {new Date(job.scheduledAt).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-slate-700 text-xs font-bold">
                 <CheckCircle2 size={14} className="text-primary" /> Client: {job.client?.name || 'Unknown'}
              </div>
           </div>
        </div>

        {/* Update Form */}
        {job.status !== 'COMPLETED' && (
          <form onSubmit={handleLogProgress} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Work Update Log</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="e.g. Day 1: Site preparation completed..."
                  className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] min-h-[150px] font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none"
                  required
                />
             </div>
             <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Media Evidence (Proof of Work)</p>
                <MediaUpload
                   label="Upload Photos/Videos"
                   accept="image/*,video/*"
                   maxFiles={3}
                   bucket="diwalya-media"
                   folder={`jobs/${jobId}/progress`}
                   existingUrls={mediaUrl ? [mediaUrl] : []}
                   onUploadComplete={(urls: string[]) => setMediaUrl(urls[0] || '')}
                />
                <p className="text-[9px] text-gray-700 font-bold ml-1 uppercase tracking-widest italic flex items-center gap-1">
                   <AlertCircle size={10} className="text-primary" /> Supports proof of work for faster payment release
                </p>
             </div>
             <button 
               type="submit"
               disabled={submitting}
               className="w-full py-5 bg-slate-900 text-white font-black rounded-[2rem] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/10"
             >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> Broadcast Update</>}
             </button>
          </form>
        )}

        {/* Timeline */}
        <div className="space-y-6">
           <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             Project Timeline 
             <span className="w-6 h-6 bg-gray-100 flex items-center justify-center rounded-full text-[10px] text-gray-700">
               {timelineEvents.length}
             </span>
           </h3>
           
           <div className="relative pl-8 space-y-10 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
              {timelineEvents.length === 0 ? (
                <div className="py-10 text-center bg-gray-50 rounded-[2rem] ml-[-32px]">
                   <Clock size={32} className="text-gray-200 mx-auto mb-2" />
                   <p className="text-xs font-bold text-gray-700 uppercase tracking-widest tracking-tighter">No Activity Logged</p>
                </div>
              ) : (
                timelineEvents.map((event, idx) => (
                  <div key={event.id} className="relative animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                    {event.timelineType === 'FUNDS' ? (
                       <>
                         <div className="absolute left-[-21px] top-1 w-4 h-4 rounded-full bg-white border-4 border-emerald-500 shadow-sm z-10"></div>
                         <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-start gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                               <Coins size={24} />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                  <Wallet size={10} /> EARLY FUNDS DISBURSED
                                </p>
                               <h4 className="text-2xl font-black text-emerald-900 tracking-tight leading-none mb-1">
                                 +{formatGHS(event.amount)}
                               </h4>
                               <p className="text-xs font-bold text-emerald-700 leading-relaxed">
                                  {event.reason}
                               </p>
                               <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-3">
                                  {new Date(event.createdAt).toLocaleDateString()} @ {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </p>
                            </div>
                         </div>
                       </>
                    ) : (
                       <>
                         <div className="absolute left-[-21px] top-1 w-4 h-4 rounded-full bg-white border-4 border-primary shadow-sm z-10"></div>
                         <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                             <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2">
                                {new Date(event.createdAt).toLocaleDateString()} @ {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </p>
                             <p className="text-sm font-bold text-gray-900 leading-relaxed mb-4">{event.content}</p>
                             
                             {event.mediaUrls && event.mediaUrls.length > 0 && (
                               <div className="grid grid-cols-1 gap-4 mt-4">
                                  {event.mediaUrls.map((url: string, i: number) => (
                                    <div 
                                      key={i} 
                                      onClick={() => setSelectedMedia(url)}
                                      className="rounded-2xl overflow-hidden border border-gray-200 aspect-video relative group cursor-zoom-in"
                                    >
                                       <img src={url} alt="Progress" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                       <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                                          <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-slate-900 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                            <Camera size={20} />
                                          </div>
                                       </div>
                                    </div>
                                  ))}
                               </div>
                             )}
                         </div>
                       </>
                    )}
                  </div>
                ))
              )}
           </div>
        </div>
      </div>

      {/* Completion/Quote Dock */}
      {(job.status === 'IN_PROGRESS' || job.status === 'ACCEPTED') && (
        <div className="mt-12 p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 border-dashed">
            <h4 className="text-lg font-black text-emerald-900 mb-2">
              {job.type === 'INSPECTION' ? 'Inspection Phase' : 'Project Completion'}
            </h4>
            {job.status === 'ACCEPTED' ? (
              <button 
                onClick={handleStartJob}
                disabled={completing}
                className="w-full py-5 bg-primary text-white font-black rounded-[2rem] flex items-center justify-center gap-2 hover:bg-primary/90 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {completing ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20} /> Start This Job Now</>}
              </button>
            ) : job.type === 'INSPECTION' && job.status === 'IN_PROGRESS' ? (
              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleCompleteInspection}
                  disabled={completing}
                  className="w-full py-5 bg-amber-500 text-white font-black rounded-[2rem] flex items-center justify-center gap-2 hover:bg-amber-600 shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {completing ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Mark Inspection as Completed</>}
                </button>

                <Link 
                  href={`/dashboard/worker/jobs/${jobId}/review`}
                  className="w-full py-5 border-2 border-primary text-primary font-black rounded-[2rem] flex items-center justify-center gap-2 hover:bg-primary/5 transition-all text-center"
                >
                  Submit Final Project Quote
                </Link>
              </div>
            ) : (
              <button 
                onClick={handleMarkComplete}
                disabled={completing}
                className="w-full py-5 bg-emerald-600 text-white font-black rounded-[2rem] flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                 {completing ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Finalize Job & Request Payout</>}
              </button>
            )}
        </div>
      )}
    </div>
  );
}
