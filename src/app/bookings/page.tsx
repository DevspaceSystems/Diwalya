'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Briefcase, Calendar, MapPin, Clock, ChevronRight, 
  Filter, AlertCircle, CheckCircle2, XCircle, ShieldAlert, 
  Flag, Send, Loader2, FileText, Calculator
} from 'lucide-react';
import { createReport } from '@/app/actions/report';
import { getClientJobs, declineEstimate, completeJobAndReleaseFunds } from '@/app/actions/booking';
import dynamic from 'next/dynamic';
const PaystackButton = dynamic(() => import('react-paystack').then(mod => mod.PaystackButton), { ssr: false });
import { supabase } from '@/lib/supabase';
import { cn, formatGHS } from '@/lib/utils';
import ChatWindow from '@/components/Chat/ChatWindow';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [reportingJob, setReportingJob] = useState<any>(null);
  const [reportForm, setReportForm] = useState({ reason: 'CONDUCT', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUser(user);
      const res = await getClientJobs(user.id);
      if (res.success && res.data) {
        setBookings(res.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    const result = await createReport({
      reporterId: user.id, 
      targetId: reportingJob.workerId || 'unknown',
      jobId: reportingJob.id,
      reason: reportForm.reason,
      description: reportForm.description
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Report submitted successfully. Admins will review it.' });
      setTimeout(() => {
        setReportingJob(null);
        setReportForm({ reason: 'CONDUCT', description: '' });
        setMessage(null);
      }, 3000);
    } else {
      setMessage({ type: 'error', text: 'Failed to submit report. Please try again.' });
    }
    setIsSubmitting(false);
  };

  const handleDecline = async (jobId: string) => {
    if (!confirm('Are you sure you want to decline this estimate?')) return;
    setIsProcessing(jobId);
    await declineEstimate(jobId);
    const res = await getClientJobs(user.id);
    if (res.success && res.data) setBookings(res.data);
    setIsProcessing(null);
  };

  const handlePaymentSuccess = async (reference: any, jobId: string, totalAmount: number) => {
    setIsProcessing(jobId);
    try {
      const res = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: reference.reference,
          jobId,
          workerId: bookings.find(b => b.id === jobId)?.workerId,
          totalAmount,
          isEscrow: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Payment successful! Escrow funded and work will begin.' });
        const resJobs = await getClientJobs(user.id);
        if (resJobs.success && resJobs.data) setBookings(resJobs.data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Payment verification failed' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'An error occurred during payment verification' });
    }
    setIsProcessing(null);
  };

  const handleCompleteJob = async (jobId: string) => {
    if (!confirm('Has the worker completed the job to your satisfaction? This will release their payment.')) return;
    setIsProcessing(jobId);
    const result = await completeJobAndReleaseFunds(jobId);
    if (result.success) {
        setMessage({ type: 'success', text: 'Job marked as completed. Funds have been released to the worker!' });
        const resJobs = await getClientJobs(user.id);
        if (resJobs.success && resJobs.data) setBookings(resJobs.data);
    } else {
        setMessage({ type: 'error', text: result.error || 'Failed to complete job' });
    }
    setIsProcessing(null);
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'ACTIVE') return ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'ADMIN_REVIEW', 'WORKER_REVIEW'].includes(booking.status);
    return booking.status === activeFilter;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING':
      case 'ADMIN_REVIEW':
      case 'WORKER_REVIEW':
        return 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'IN_PROGRESS':
      case 'COMPLETED':
        return <CheckCircle2 size={14} />;
      case 'PENDING':
      case 'ADMIN_REVIEW':
      case 'WORKER_REVIEW':
        return <AlertCircle size={14} />;
      case 'CANCELLED':
        return <XCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-4">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">My Bookings</h1>
            <p className="text-gray-500 font-medium">Keep track of your service requests and their status</p>
          </div>
          
          <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
            {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeFilter === f 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filteredBookings.map((booking) => (
            <div 
              key={booking.id}
              className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/10 transition-colors">
                    <Briefcase size={36} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{booking.worker?.name || 'Unassigned Worker'}</h3>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status.replace('_', ' ')}
                      </div>
                      {booking.type === 'INSPECTION' && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-purple-100 text-purple-700 border-purple-200">
                          Inspection
                        </div>
                      )}
                    </div>
                    <p className="text-primary font-black text-lg mb-4">{booking.serviceType}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
                      <div className="flex items-center gap-2.5 text-sm text-gray-500 font-bold">
                        <Calendar size={18} className="text-gray-400" />
                        {new Date(booking.scheduledAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-gray-500 font-bold">
                        <Clock size={18} className="text-gray-400" />
                        {new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) ? (
                        <div className="flex items-center gap-2.5 text-sm text-gray-500 font-bold col-span-full">
                          <MapPin size={18} className="text-gray-400" />
                          {booking.location}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 text-[10px] text-orange-600 font-black uppercase tracking-widest col-span-full bg-orange-50 px-3 py-1 rounded-lg border border-orange-100 italic">
                          <ShieldAlert size={14} /> Contact details hidden until accepted
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end border-t md:border-t-0 pt-6 md:pt-0 border-gray-50">
                  <div className="text-right mb-6 md:mb-0">
                    <p className="text-3xl font-black text-gray-900 leading-none">{formatGHS(booking.priceAmount || 0)}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                      {booking.type === 'INSPECTION' ? 'Inspection Fee' : 'Service Fee'}
                    </p>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto mt-6 md:mt-0">
                    <button 
                      onClick={() => setReportingJob(booking)}
                      className="flex items-center justify-center gap-2 text-red-400 hover:text-red-500 hover:bg-red-50 px-4 py-3 rounded-2xl font-black text-[10px] uppercase transition-all"
                    >
                      <Flag size={14} /> Report
                    </button>
                    {booking.worker && (
                      <button 
                        onClick={() => setActiveChat(booking)}
                        className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-2xl font-bold transition-all group/btn"
                      >
                        Chat & Details <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Estimate Details */}
              {booking.estimate && booking.estimate.status === 'APPROVED' && (
                <div className="mt-6 p-5 bg-emerald-50 rounded-2xl border border-emerald-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                  <h4 className="text-sm font-black text-emerald-800 mb-4 flex items-center gap-2">
                    <Calculator size={16} className="text-emerald-600" />
                    Approved Project Quote
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">Labor</p>
                      <p className="text-sm font-black text-emerald-900">{formatGHS(booking.estimate.laborCost)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">Materials</p>
                      <p className="text-sm font-black text-emerald-900">{formatGHS(booking.estimate.materialCost)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">Duration</p>
                      <p className="text-sm font-black text-emerald-900">{booking.estimate.estimatedDuration}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">Total Cost</p>
                      <p className="text-lg font-black text-emerald-700">{formatGHS(booking.estimate.totalCost)}</p>
                    </div>
                  </div>

                  {booking.estimate.workerNotes && (
                    <div className="mb-5 p-3 bg-white/60 rounded-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">Worker Notes</p>
                      <p className="text-xs text-emerald-800 italic">"{booking.estimate.workerNotes}"</p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-4 border-t border-emerald-100/50 pt-4">
                    {booking.status !== 'IN_PROGRESS' && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                       <>
                         <PaystackButton
                           text={isProcessing === booking.id ? "Processing..." : "Proceed to Payment"}
                           className="flex-1 py-3 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 text-center"
                           reference={(new Date()).getTime().toString() + '_' + booking.id}
                           email={user?.email || ''}
                           amount={Math.round(booking.estimate.totalCost * 100)}
                           publicKey={process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ''}
                           onSuccess={(ref: any) => handlePaymentSuccess(ref, booking.id, booking.estimate.totalCost)}
                           onClose={() => console.log('Closed')}
                         />
                         <button 
                           onClick={() => handleDecline(booking.id)}
                           disabled={isProcessing === booking.id}
                           className="flex-[0.5] py-3 bg-white text-emerald-700 border border-emerald-200 text-xs font-black rounded-xl hover:bg-emerald-50 transition-colors disabled:opacity-50"
                         >
                           Decline
                         </button>
                       </>
                    )}
                    {booking.status === 'IN_PROGRESS' && (
                       <button
                         onClick={() => handleCompleteJob(booking.id)}
                         disabled={isProcessing === booking.id}
                         className="flex-1 py-3 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 text-center"
                       >
                         {isProcessing === booking.id ? 'Processing...' : 'Mark Job Completed'}
                       </button>
                    )}
                  </div>
                </div>
              )}

              {/* Status helper text */}
              {(booking.status === 'PENDING' || booking.status === 'ADMIN_REVIEW' || booking.status === 'WORKER_REVIEW') && (
                <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-center gap-3 text-sm text-blue-700 font-bold">
                   <AlertCircle size={18} />
                   Awaiting worker confirmation. You'll be notified once accepted.
                </div>
              )}
              {booking.status === 'ACCEPTED' && !booking.estimate && (
                <div className="mt-6 p-4 bg-green-50/50 rounded-2xl border border-green-100/50 flex items-center gap-3 text-sm text-green-700 font-bold">
                   <CheckCircle2 size={18} />
                   Worker has accepted! They will arrive at the scheduled time.
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200 shadow-inner mt-6">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <Briefcase size={48} className="text-gray-200" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">No bookings found</h2>
            <p className="text-gray-500 font-medium mb-10 max-w-xs mx-auto">It looks like you don't have any bookings in this category.</p>
            <Link 
              href="/search" 
              className="inline-flex bg-primary hover:bg-primary-light text-white px-10 py-4 rounded-[1.5rem] font-black shadow-xl shadow-primary/20 transition-all active:scale-95 uppercase tracking-widest text-sm"
            >
              Browse Workers
            </Link>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <ShieldAlert className="text-red-500" size={28} />
                 <h2 className="text-xl font-black text-gray-900">Report Issue</h2>
              </div>
              <button 
                onClick={() => setReportingJob(null)}
                className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-gray-400 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleReportSubmit} className="p-8 space-y-6">
              {message && (
                <div className={cn(
                  "p-4 rounded-2xl text-sm font-black text-center animate-in slide-in-from-top-2",
                  message.type === 'success' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                )}>
                  {message.text}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Reason</label>
                <select 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500/20 outline-none appearance-none cursor-pointer"
                  value={reportForm.reason}
                  onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
                >
                  <option value="CONDUCT">Unprofessional Conduct</option>
                  <option value="LATE">Extreme Tardiness</option>
                  <option value="QUALITY">Poor Job Quality</option>
                  <option value="SCAM">Payment/Scam Attempt</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Description</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium focus:ring-2 focus:ring-red-500/20 outline-none resize-none"
                  placeholder="Tell us what happened..."
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-red-500 text-white rounded-[1.5rem] font-black shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> File Official Report</>}
              </button>
              
              <p className="text-[10px] text-center text-gray-400 font-bold px-6 leading-relaxed">
                Platform admins will review this report within 24 hours. False reports may lead to account suspension.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {activeChat && user && (
        <ChatWindow 
          jobId={activeChat.id}
          senderId={user.id} 
          recipientName={activeChat.worker?.name || 'Worker'}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
}
