'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  Banknote,
  Briefcase,
  MapPin,
  Calendar,
  Search,
  Send,
  FileText,
  Volume2,
  ChevronRight,
  ClipboardList,
  Eye,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatGHS } from '@/lib/utils';
import { submitJobEstimate } from '@/app/actions/booking';

export default function WorkerJobReviewPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [laborCost, setLaborCost] = useState(0);
  const [materialCost, setMaterialCost] = useState(0);
  const [duration, setDuration] = useState('1 Day');
  const [notes, setNotes] = useState('');
  const [inspectionFee, setInspectionFee] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [proposingInspection, setProposingInspection] = useState(false);
  const [decision, setDecision] = useState<'NONE' | 'QUOTE' | 'INSPECTION' | 'DECLINE'>('NONE');
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      const { data, error } = await supabase
        .from('Job')
        .select('*, client:User!clientId(*)')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (err: any) {
      console.error('Fetch Job Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await submitJobEstimate({
        jobId,
        workerId: job.workerId,
        laborCost,
        materialCost,
        totalCost: laborCost + materialCost,
        estimatedDuration: duration,
        workerNotes: notes
      });

      if (res.success) {
        alert('Quote submitted successfully! The client will be notified.');
        router.push('/dashboard/worker/jobs');
      } else {
        alert(res.error || 'Failed to submit quote');
      }
    } catch (err: any) {
      alert('An error occurred while submitting the quote.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProposeInspection = async () => {
    setProposingInspection(true);
    try {
      const { proposeInspection } = await import('@/app/actions/booking');
      const res = await proposeInspection({
        jobId,
        workerId: job.workerId
      });

      if (res.success) {
        alert('Inspection proposal sent! The client will be notified.');
        router.push('/dashboard/worker/jobs');
      } else {
        alert(res.error || 'Failed to propose inspection');
      }
    } catch (err: any) {
      alert('An error occurred');
    } finally {
      setProposingInspection(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!declineReason) return alert('Please select a reason for declining.');
    setSubmitting(true);
    try {
      const { workerCancelJob } = await import('@/app/actions/booking');
      const res = await workerCancelJob(jobId, job.workerId, declineReason);

      if (res.success) {
        alert('Job request declined successfully.');
        router.push('/dashboard/worker/jobs');
      } else {
        alert(res.error || 'Failed to decline request');
      }
    } catch (err: any) {
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-24">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!job) return (
    <div className="text-center p-24">
      <h2 className="text-2xl font-black">Job Not Found</h2>
      <Link href="/dashboard/worker/jobs" className="text-primary hover:underline mt-4 block">Back to Dashboard</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="mb-10 flex items-center gap-4">
        <Link href="/dashboard/worker/jobs" className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center hover:bg-gray-50 transition-all">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-black text-3xl text-gray-900 tracking-tight">Review Job Request</h1>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Status: {job.status}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col: Job Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
             <Briefcase className="text-secondary mb-4" size={32} />
             <h3 className="text-2xl font-black mb-1">{job.serviceType}</h3>
             <p className="text-slate-700 text-sm font-bold mb-6 italic leading-relaxed">"{job.description}"</p>
             
             <div className="space-y-4 pt-4 border-t border-slate-800 text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2 text-slate-700"><MapPin size={14} className="text-primary" /> {job.location}</div>
                <div className="flex items-center gap-2 text-slate-700"><Calendar size={14} className="text-primary" /> {new Date(job.scheduledAt).toLocaleDateString()}</div>
             </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
             <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-4 italic">Client Information</p>
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-primary font-black text-xl">
                   {job.client?.name?.charAt(0) || '?'}
                </div>
                <div>
                   <p className="font-black text-gray-900 text-sm">{job.client?.name || 'Protected User'}</p>
                   <p className="text-[9px] font-black text-gray-700 uppercase tracking-tighter">Verified Client</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Col: Quote Form or Decision Selection */}
        <div className="md:col-span-2 space-y-8">
           {/* Audio Player Section if exists */}
           {job.audioUrl && (
             <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                      <Volume2 size={24} />
                   </div>
                   <div>
                      <h4 className="font-black text-slate-900 tracking-tight">Audio Description</h4>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">Listen to the client's request</p>
                   </div>
                </div>
                <audio src={job.audioUrl} controls className="h-10" />
             </div>
           )}

           {job.status === 'CANCELLED' ? (
             <div className="bg-red-50 p-10 rounded-[3rem] border border-red-100 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-xl">
                 <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <XCircle size={40} />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Job Cancelled</h3>
                 <p className="text-sm text-slate-600 font-bold max-w-sm mb-6 leading-relaxed">
                    This job request was cancelled by the client. You can no longer submit an estimate or manage this job.
                 </p>
                 <Link href="/dashboard/worker/jobs" className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-50 transition-all text-sm shadow-sm border border-slate-100">
                    Return to Dashboard
                 </Link>
             </div>
           ) : decision === 'NONE' ? (
             <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-4">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">How would you like to proceed?</h3>
                   <p className="text-sm text-slate-700 font-bold mt-1">Select the best option based on the job details.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <button 
                     onClick={() => setDecision('QUOTE')}
                     className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 hover:border-primary transition-all text-left group hover:shadow-2xl hover:shadow-primary/10"
                   >
                      <div className="w-16 h-16 bg-primary/5 text-primary rounded-[2rem] flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                         <Banknote size={32} />
                      </div>
                      <h4 className="text-xl font-black text-slate-900 mb-2">Direct Pricing</h4>
                      <p className="text-xs text-slate-700 font-bold leading-relaxed mb-6">I understand the job requirements and can provide a fixed price immediately.</p>
                      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                         Set Price <ChevronRight size={14} />
                      </div>
                   </button>

                   <button 
                     onClick={() => setDecision('INSPECTION')}
                     className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 hover:border-amber-500 transition-all text-left group hover:shadow-2xl hover:shadow-amber-500/10"
                   >
                      <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mb-6 group-hover:bg-amber-500 group-hover:text-white transition-all">
                         <Eye size={32} />
                      </div>
                      <h4 className="text-xl font-black text-slate-900 mb-2">Site Inspection</h4>
                      <p className="text-xs text-slate-700 font-bold leading-relaxed mb-6">This job is complex. I need to visit the site before I can give a final price.</p>
                      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500">
                         Request Access <ChevronRight size={14} />
                      </div>
                   </button>
                </div>

                 <div className="mt-4">
                    <button 
                      onClick={() => setDecision('DECLINE')}
                      className="w-full bg-red-50 p-6 rounded-[2rem] border-2 border-red-100 hover:border-red-500 hover:bg-red-100 transition-all text-center group hover:shadow-2xl hover:shadow-red-500/10"
                    >
                      <h4 className="text-xl font-black text-red-600 mb-2 flex items-center justify-center gap-2">
                         <XCircle size={24} className="group-hover:scale-110 transition-transform" /> Decline Request
                      </h4>
                      <p className="text-xs text-red-400 font-bold">I am not available or cannot fulfill this request at this time.</p>
                    </button>
                 </div>
              </div>
           ) : decision === 'DECLINE' ? (
             <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <button 
                  onClick={() => setDecision('NONE')}
                  className="text-[10px] font-black text-slate-700 uppercase tracking-widest hover:text-red-500 transition-all mb-4 flex items-center gap-1"
                >
                   <ArrowLeft size={12} /> Back to options
                </button>
                <div className="bg-white p-10 rounded-[3rem] border border-red-100 shadow-2xl text-center space-y-6">
                   <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto">
                     <XCircle size={40} />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black text-slate-900 tracking-tight">Decline this Request?</h3>
                     <p className="text-sm text-slate-700 font-bold mt-2 leading-relaxed max-w-sm mx-auto">
                        This will permanently remove the job from your list and notify the client to search for another specialist.
                     </p>
                   </div>
                                       <div className="text-left space-y-2 mt-2">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">
                        Reason for declining <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black text-black focus:ring-2 focus:ring-red-500/20 outline-none cursor-pointer"
                      >
                        <option value="">-- Select a reason --</option>
                        <option value="Not available at requested time">Not available at requested time</option>
                        <option value="Job is outside my service area">Job is outside my service area</option>
                        <option value="Job is outside my specialty">Job is outside my specialty</option>
                        <option value="Insufficient job details provided">Insufficient job details provided</option>
                        <option value="Cannot meet requested timeline">Cannot meet requested timeline</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
<button 
                     onClick={handleDeclineRequest}
                     disabled={submitting || !declineReason}
                     className="w-full py-5 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 active:scale-95 transition-all uppercase tracking-widest text-sm shadow-xl shadow-red-500/20 disabled:opacity-40 flex items-center justify-center gap-3 "
                   >
                     {submitting ? <Loader2 className="animate-spin" size={24} /> : 'Confirm Decline'}
                   </button>
                </div>
             </div>
           ) : decision === 'QUOTE' ? (
             <div className="animate-in fade-in slide-in-from-right-4 duration-500">
               <button 
                 onClick={() => setDecision('NONE')}
                 className="text-[10px] font-black text-slate-700 uppercase tracking-widest hover:text-primary transition-all mb-4 flex items-center gap-1"
               >
                  <ArrowLeft size={12} /> Back to options
               </button>
               <form onSubmit={handleSubmitQuote} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl space-y-8">
                  <div className="mb-2">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                      <ClipboardList size={24} className="text-primary" /> Provide Your Quote
                    </h3>
                    <p className="text-sm text-gray-700 font-bold mt-1">Set your price based on the job requirements.</p>
                  </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1 mb-2 block">Labor Cost (GHS)</label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-bold text-lg">₵</div>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={laborCost}
                      onChange={(e) => setLaborCost(Number(e.target.value))}
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1 mb-2 block">Materials (GHS)</label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 font-bold text-lg">₵</div>
                    <input 
                      type="number" 
                      min="0"
                      value={materialCost}
                      onChange={(e) => setMaterialCost(Number(e.target.value))}
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1 mb-2 block">Estimated Work Duration</label>
                  <div className="relative">
                    <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={20} />
                    <input 
                      type="text"
                      required
                      list="duration-options"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 1-2 Hours, 1 Day..."
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl font-black text-lg text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                    <datalist id="duration-options">
                      <option value="1-2 Hours" />
                      <option value="Half Day" />
                      <option value="1 Day" />
                      <option value="2-3 Days" />
                      <option value="Flexible / Ongoing" />
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1 mb-2 block">Breakdown / Final Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide details about the quote, what's included, and any assumptions..."
                    className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] min-h-[120px] font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none"
                    required
                  />
                </div>
              </div>

              <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10">
                <div className="flex justify-between items-center mb-1">
                   <p className="text-[10px] font-black text-primary uppercase tracking-widest">Total Project Estimate</p>
                   <p className="bg-white px-3 py-1 rounded-full text-[9px] font-black text-primary border border-primary/10">5% Service Fee Deducted</p>
                </div>
                <div className="flex justify-between items-end">
                   <p className="text-4xl font-black text-gray-900 tracking-tight">{formatGHS(laborCost + materialCost)}</p>
                   <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic mb-1">Net Payout: {formatGHS((laborCost + materialCost) * 0.95)}</p>
                </div>
              </div>

              <div className="flex gap-4">
                 <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] py-6 bg-slate-900 text-white font-black rounded-[2rem] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-slate-900/20"
                 >
                   {submitting ? <Loader2 className="animate-spin" size={24} /> : <><Send size={24} /> Dispatch Quote</>}
                 </button>
              </div>
            </form>
          </div>
           ) : (
             <div className="animate-in fade-in slide-in-from-right-4 duration-500">
               <button 
                 onClick={() => setDecision('NONE')}
                 className="text-[10px] font-black text-slate-700 uppercase tracking-widest hover:text-primary transition-all mb-6 flex items-center gap-1"
               >
                  <ArrowLeft size={12} /> Back to options
               </button>
               {/* Inspection Request Card */}
               <div className="bg-white rounded-[3rem] p-10 border-2 border-amber-200 text-center space-y-8 shadow-lg">
                   <div className="w-20 h-20 bg-amber-100 rounded-[2rem] flex items-center justify-center text-amber-600 mx-auto">
                     <Eye size={40} />
                   </div>

                   <div className="space-y-3">
                     <h4 className="text-2xl font-black text-slate-900">Request Site Inspection</h4>
                     <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-sm mx-auto">
                        You need to visit the site before giving a final price. The admin will review your request, set the inspection fee, and notify the client.
                     </p>
                   </div>

                   <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left space-y-3">
                     <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">What happens next</p>
                     <div className="flex items-start gap-3">
                       <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</div>
                       <p className="text-sm font-bold text-slate-700">Admin reviews your inspection request</p>
                     </div>
                     <div className="flex items-start gap-3">
                       <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</div>
                       <p className="text-sm font-bold text-slate-700">Admin sets the inspection fee &amp; notifies the client</p>
                     </div>
                     <div className="flex items-start gap-3">
                       <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</div>
                       <p className="text-sm font-bold text-slate-700">Client pays &amp; you visit the site to give a final quote</p>
                     </div>
                   </div>

                   <button 
                     onClick={handleProposeInspection}
                     disabled={proposingInspection}
                     className="w-full py-5 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-600 active:scale-95 transition-all uppercase tracking-widest text-sm shadow-xl shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                   >
                      {proposingInspection ? <Loader2 className="animate-spin" size={24} /> : <><Send size={20} /> Send Inspection Request</>}
                   </button>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
