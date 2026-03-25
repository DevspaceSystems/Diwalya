'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  DollarSign,
  Briefcase,
  MapPin,
  Calendar,
  ShieldCheck,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { formatGHS } from '@/lib/utils';
import { getJob, getJobEstimate, declineEstimate, recordPaymentSuccess } from '@/app/actions/booking';

const PaystackButton = dynamic(() => import('@/components/booking/PaystackButton'), { ssr: false });

export default function ClientEstimateReviewPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [estimate, setEstimate] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
      setUser(session.user);

      const { data: jobData, error: jobError } = await supabase
        .from('Job')
        .select('*, worker:User!workerId(*)')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      if (jobData.status === 'ESTIMATE_SUBMITTED') {
        const res = await getJobEstimate(jobId);
        if (res.success) {
          setEstimate(res.data);
        } else {
          throw new Error(res.error);
        }
      } else if (jobData.status === 'INSPECTION_REQUESTED') {
        // For inspections, we use the priceAmount on the job itself
        setEstimate({
          totalCost: jobData.priceAmount,
          laborCost: jobData.priceAmount,
          materialCost: 0,
          estimatedDuration: 'Inspection',
          workerNotes: 'This is a request for a paid physical inspection to determine the final project scope.'
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load estimate');
    } finally {
      setLoading(false);
    }
  };

  const onSuccess = async (reference: any) => {
    setProcessing(true);
    try {
        const res = await recordPaymentSuccess({
          jobId,
          reference: reference.reference,
          amount: job.status === 'INSPECTION_REQUESTED' ? (job.priceAmount || 0) : estimate.totalCost,
          type: job.status === 'INSPECTION_REQUESTED' ? 'INSPECTION' : 'JOB'
        });

        if (!res.success) throw new Error(res.error);
        
        alert('Payment Successful! The specialist has been notified.');
        router.push(`/dashboard/client/jobs/${jobId}/track`);
    } catch (err: any) {
        alert(err.message || 'Payment processed but failed to update job status. Please contact support.');
    } finally {
        setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this quote? This will cancel the job request.')) return;
    setProcessing(true);
    const res = await declineEstimate(jobId);
    if (res.success) {
        alert('Quote declined and job cancelled.');
        router.push('/dashboard/client/bookings');
    } else {
        alert(res.error || 'Failed to decline quote');
    }
    setProcessing(false);
  };

  const onClose = () => {
    console.log('Payment closed');
  };

  if (loading) return (
    <div className="flex items-center justify-center p-24">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!job || !estimate) return (
    <div className="text-center p-24">
      <h2 className="text-2xl font-black">Quote/Inspection Not Found</h2>
      <Link href="/dashboard/client" className="text-primary hover:underline mt-4 block">Back to Dashboard</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-10 flex items-center gap-4">
        <Link href="/dashboard/client" className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center hover:bg-gray-50 transition-all text-slate-900 border border-gray-100">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-black text-3xl text-gray-900 tracking-tight leading-none">
            {job.status === 'INSPECTION_REQUESTED' ? 'Review Inspection Fee' : 'Review Quote'}
          </h1>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-2">{job.serviceType} for {formatGHS(estimate.totalCost)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Summary */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl space-y-10">
              <div className="flex justify-between items-start">
                 <div>
                   <h2 className="text-4xl font-black text-gray-900 tracking-tight">{formatGHS(estimate.totalCost)}</h2>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                     {job.status === 'INSPECTION_REQUESTED' ? 'Platform Inspection Fee' : 'Total Fixed Quote'}
                   </p>
                 </div>
                 <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2">
                    <ShieldCheck size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Safe-pay Enabled</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-10 border-t border-gray-50">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Labor Cost</p>
                    <p className="text-xl font-black text-gray-900">{formatGHS(estimate.laborCost)}</p>
                 </div>
                 
                 {(job.status === 'ESTIMATE_SUBMITTED' || job.status === 'INSPECTION_REQUESTED') && (
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Materials/Parts</p>
                       <p className="text-xl font-black text-gray-900">{formatGHS(estimate.materialCost)}</p>
                    </div>
                 )}
              </div>

              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                   {job.status === 'INSPECTION_REQUESTED' ? 'Inspection Details' : "Worker's Notes & Duration"}
                 </p>
                 <div className="flex items-center gap-3 mb-4">
                    <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                       <Clock size={16} className="text-primary" />
                       <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{estimate.estimatedDuration}</span>
                    </div>
                 </div>
                 <p className="text-sm font-medium text-gray-600 leading-relaxed italic">
                    "{estimate.workerNotes || 'No specific notes provided.'}"
                 </p>
              </div>
           </div>

           <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex items-center justify-between">
              <div>
                 <h4 className="font-black text-lg mb-1 leading-none">Job Details</h4>
                 <p className="text-slate-400 text-xs font-bold">{job.description}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Location</p>
                 <p className="text-sm font-black text-primary">{job.location}</p>
              </div>
           </div>
        </div>

        {/* Right: Payment Sidebar */}
        <div className="lg:col-span-1">
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl sticky top-24 space-y-8">
              <div className="text-center">
                 <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-4 border border-primary/10">
                    <ShieldCheck size={40} />
                 </div>
                 <h3 className="text-xl font-black text-gray-900 tracking-tight">Accept & Invest</h3>
                 <p className="text-xs text-gray-400 font-bold mt-2 leading-relaxed">
                    Protect your funds with Diwalya Escrow. We only release payment when the job is done.
                 </p>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform Fee</span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Included</span>
                 </div>
                 <div className="flex justify-between items-center px-2 pb-6 border-b border-gray-50">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mediation</span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Free</span>
                 </div>
                 <div className="flex justify-between items-end px-2 pt-2">
                    <span className="font-black text-gray-900">Total to Pay</span>
                    <span className="text-3xl font-black text-primary tracking-tighter">{formatGHS(estimate.totalCost)}</span>
                 </div>
              </div>

              <div className="space-y-3">
                 <PaystackButton 
                    email={user?.email || ''}
                    amount={estimate.totalCost * 100}
                    metadata={{ jobId, type: job.status === 'INSPECTION_REQUESTED' ? 'INSPECTION' : 'QUOTE' }}
                    onSuccess={onSuccess}
                    onClose={onClose}
                    loading={false}
                 />
                  <button 
                    onClick={handleDecline}
                    disabled={processing}
                    className="w-full py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : (job.status === 'IN_PROGRESS' ? 'Cancel Job' : 'Decline Quote')}
                  </button>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
                 <CreditCard size={18} className="text-gray-400" />
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-tight">
                    Secure payment via Mobile Money or Bank Card
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
