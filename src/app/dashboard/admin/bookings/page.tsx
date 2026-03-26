'use client';

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  User, 
  Calendar,
  CreditCard,
  MessageSquare,
  AlertCircle,
  Coins,
  Loader2,
  X,
  PlayCircle,
  Volume2,
  CalendarCheck
} from 'lucide-react';
import { getAdminBookings, adminReleasePartialFunds, assignWorker, scheduleInspection, adminApproveEstimate, getJobEstimate, adminReleaseFinalPayout } from '@/app/actions/booking';
import { cn, formatGHS } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function GlobalBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Partial Payout State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutReason, setPayoutReason] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [adminId, setAdminId] = useState<string>('');

  // Assignment State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showInspectionFeeModal, setShowInspectionFeeModal] = useState(false);
  const [inspectionFeeAmount, setInspectionFeeAmount] = useState('');
  const [workers, setWorkers] = useState<any[]>([]);
  const [inspectionDate, setInspectionDate] = useState('');
  const [accompanyingMember, setAccompanyingMember] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showFinalPayoutModal, setShowFinalPayoutModal] = useState(false);
  const [currentEstimate, setCurrentEstimate] = useState<any>(null);
  const [finalPayoutAmount, setFinalPayoutAmount] = useState('');

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAdminId(session.user.id);
      }
    }
    init();
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchWorkers();
  }, [statusFilter]);

  const fetchWorkers = async () => {
    const { data, error } = await supabase
      .from('WorkerProfile')
      .select('*, user:User(*)')
      .eq('verificationStatus', 'APPROVED');
    if (!error) setWorkers(data);
  };

  const fetchBookings = async () => {
    setLoading(true);
    const res = await getAdminBookings(statusFilter as any);
    if (res.success) setBookings(res.data || []);
    setLoading(false);
  };

  const handlePartialPayout = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!selectedJob || !adminId) return;
     const amount = parseFloat(payoutAmount);
     if (isNaN(amount) || amount <= 0) return alert('Invalid amount');

     setProcessing(true);
     try {
       const res = await adminReleasePartialFunds({
         jobId: selectedJob.id,
         adminId,
         amount,
         reason: payoutReason
       });

       if (res.success) {
         alert('Funds released successfully!');
         setShowPayoutModal(false);
         setPayoutAmount('');
         setPayoutReason('');
         fetchBookings(); // Refresh data
       } else {
         alert(res.error || 'Failed to release funds');
       }
     } catch (err: any) {
       alert('An error occurred.');
     } finally {
       setProcessing(false);
     }
  };

  const handleAssignWorker = async (workerId: string) => {
    if (!selectedJob) return;
    setProcessing(true);
    const res = await assignWorker(selectedJob.id, workerId);
    if (res.success) {
      alert('Worker assigned and notified!');
      setShowAssignModal(false);
      fetchBookings();
    } else {
      alert(res.error || 'Failed to assign worker');
    }
    setProcessing(false);
  };


  const handleScheduleInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !inspectionDate) return;
    setProcessing(true);
    const res = await scheduleInspection(selectedJob.id, inspectionDate, accompanyingMember);
    if (res.success) {
      alert('Inspection scheduled successfully!');
      setShowScheduleModal(false);
      fetchBookings();
    } else {
      alert(res.error || 'Failed to schedule');
    }
    setProcessing(false);
  };

  const handleSetInspectionFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    const fee = parseFloat(inspectionFeeAmount);
    if (isNaN(fee) || fee <= 0) return alert('Invalid fee amount');

    setProcessing(true);
    try {
      const { adminSetInspectionFee } = await import('@/app/actions/booking');
      const res = await adminSetInspectionFee(selectedJob.id, fee);
      if (res.success) {
        alert('Inspection fee set! Client notified to pay.');
        setShowInspectionFeeModal(false);
        setInspectionFeeAmount('');
        fetchBookings();
      } else {
        alert(res.error || 'Failed to set inspection fee');
      }
    } catch (err) {
      alert('An error occurred.');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenFinalPayout = (job: any) => {
    setSelectedJob(job);
    const defaultAmount = (job.priceAmount || 0) * 0.95;
    setFinalPayoutAmount(defaultAmount.toString());
    setShowFinalPayoutModal(true);
  };

  const handleReleaseFinalPayout = async () => {
    if (!selectedJob) return;
    const amount = parseFloat(finalPayoutAmount);
    if (isNaN(amount) || amount <= 0) return alert('Invalid amount');

    setProcessing(true);
    const res = await adminReleaseFinalPayout(selectedJob.id, amount);
    if (res.success) {
      alert('Final payout released to specialist wallet!');
      setShowFinalPayoutModal(false);
      fetchBookings();
    } else {
      alert(res.error || 'Failed to release payout');
    }
    setProcessing(false);
  };

  const handleReviewEstimate = async (job: any) => {
    setSelectedJob(job);
    setProcessing(true);
    const res = await getJobEstimate(job.id);
    if (res.success) {
      setCurrentEstimate(res.data);
      setShowReviewModal(true);
    } else {
      alert('Failed to fetch estimate details');
    }
    setProcessing(false);
  };

  const handleApproveEstimate = async () => {
    if (!selectedJob) return;
    setProcessing(true);
    const res = await adminApproveEstimate(selectedJob.id);
    if (res.success) {
      alert('Estimate approved and sent to client!');
      setShowReviewModal(false);
      fetchBookings();
    } else {
      alert(res.error || 'Failed to approve');
    }
    setProcessing(false);
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-600',
    ESTIMATE_PENDING_ADMIN_REVIEW: 'bg-purple-50 text-purple-600 border-purple-100',
    ESTIMATE_SUBMITTED: 'bg-green-50 text-green-600 border-green-100',
    IN_PROGRESS: 'bg-primary/10 text-primary border-primary/20',
    WORKER_REVIEW: 'bg-slate-50 text-slate-600 border-slate-100',
    ACCEPTED: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    COMPLETED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    CANCELLED: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Global Bookings</h1>
            <p className="text-slate-700 font-medium mt-1 uppercase text-[10px] tracking-widest font-black">All platform jobs</p>
          </div>
          <div className="flex gap-4">
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="px-6 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
             >
               <option value="">All Statuses</option>
               <option value="PENDING">Pending</option>
               <option value="ADMIN_REVIEW">Admin Review</option>
               <option value="WORKER_REVIEW">Worker Review</option>
               <option value="ACCEPTED">Accepted</option>
               <option value="IN_PROGRESS">In Progress</option>
               <option value="COMPLETED">Completed</option>
               <option value="CANCELLED">Cancelled</option>
             </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-full py-20 text-center font-black text-slate-700 animate-pulse uppercase tracking-widest text-xs">
               Syncing platform jobs...
             </div>
          ) : bookings.length === 0 ? (
             <div className="col-span-full py-20 text-center font-black text-slate-700 uppercase tracking-widest text-xs">
               No bookings found.
             </div>
          ) : bookings.map((job) => (
            <div key={job.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all p-8 flex flex-col group">
              <div className="flex justify-between items-start mb-6">
                <span className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                  statusColors[job.status] || "bg-slate-50 text-slate-700"
                )}>
                  {job.status.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1 group-hover:text-primary transition-colors">
                  <Clock size={12} /> {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-6 flex-grow">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{job.serviceType}</h3>
                  <p className="text-xs text-slate-700 line-clamp-2 font-medium">{job.description}</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Client</p>
                      <p className="text-sm font-bold text-slate-800">{job.client.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Worker</p>
                      <p className="text-sm font-bold text-slate-800">{job.worker.workerProfile?.businessName || job.worker.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex-grow">
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Financials</p>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-slate-900 leading-none">{formatGHS(job.priceAmount)}</span>
                            {job.paymentId && <div className="p-1 bg-emerald-100 text-emerald-600 rounded-lg" title="Paid"><CreditCard size={12}/></div>}
                        </div>
                    </div>
                    {job.audioUrl && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            const audio = new Audio(job.audioUrl);
                            audio.play();
                          }}
                          className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center hover:bg-primary/20 transition-all font-black text-[10px] uppercase tracking-widest"
                          title="Play Audio Description"
                        >
                          <Volume2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex gap-2">
                 {(job.status === 'IN_PROGRESS' || job.status === 'ACCEPTED') && job.paymentId && (
                   <button 
                     onClick={() => {
                        setSelectedJob(job);
                        setShowPayoutModal(true);
                     }}
                     className="px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all flex items-center justify-center shadow-sm"
                     title="Release Partial Escrow Funds"
                   >
                      <Coins size={18} />
                   </button>
                 )}
                 {job.status === 'ADMIN_REVIEW' && (
                    <button 
                      onClick={() => {
                        setSelectedJob(job);
                        setShowAssignModal(true);
                      }}
                      className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      Assign
                    </button>
                  )}
                  {job.status === 'INSPECTION_PAYMENT_PENDING' && (
                    <button 
                      onClick={() => {
                        setSelectedJob(job);
                        setShowScheduleModal(true);
                      }}
                      className="px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      Schedule Visit
                    </button>
                  )}
                 <button 
                   onClick={() => {
                     if (job.status === 'ESTIMATE_PENDING_ADMIN_REVIEW') {
                       handleReviewEstimate(job);
                     } else if (job.status === 'IN_PROGRESS' && job.paymentId) {
                       handleOpenFinalPayout(job);
                     } else if (job.status === 'ACCEPTED' && job.paymentId) {
                       setSelectedJob(job);
                       setShowPayoutModal(true);
                     } else if (job.status === 'INSPECTION_REQUESTED') {
                       setSelectedJob(job);
                       setShowInspectionFeeModal(true);
                     } else {
                       alert(`Job Status: ${job.status}\nID: ${job.id}\nService: ${job.serviceType}\nLocation: ${job.location}\nClient: ${job.client?.name}`);
                     }
                   }}
                   className="flex-grow py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all">
                    View Details
                 </button>
                 <button className="p-3 bg-slate-100 text-slate-700 hover:text-primary rounded-xl transition-all">
                    <MessageSquare size={18} />
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Partial Payout Modal */}
      {showPayoutModal && selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden p-8 scale-in-center">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                     <Coins className="text-emerald-500" /> Early Payout
                  </h3>
                  <p className="text-slate-700 text-[10px] font-black uppercase tracking-widest mt-1">Ref: {selectedJob.id}</p>
                </div>
                <button onClick={() => setShowPayoutModal(false)} className="w-10 h-10 bg-slate-50 text-slate-700 hover:text-red-500 rounded-full flex items-center justify-center transition-colors">
                  <X size={20} />
                </button>
             </div>

             <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl mb-6">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Job Budget</p>
                <p className="text-2xl font-black text-emerald-800">{formatGHS(selectedJob.payment?.amount || 0)}</p>
                <p className="text-[10px] font-bold text-emerald-700 mt-1 mt-1 leading-relaxed">
                   Maximum worker allowance is 95% of the total budget. Releasing funds early reduces the final payout amount at completion.
                </p>
             </div>

             <form onSubmit={handlePartialPayout} className="space-y-4">
                <div>
                   <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Payout Amount (GHS)</label>
                   <input 
                     type="number"
                     step="0.01"
                     max={(selectedJob.payment?.amount || 0) * 0.95}
                     value={payoutAmount}
                     onChange={(e) => setPayoutAmount(e.target.value)}
                     className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-xl"
                     placeholder="0.00"
                     required
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Reason for early release</label>
                   <input 
                     type="text"
                     value={payoutReason}
                     onChange={(e) => setPayoutReason(e.target.value)}
                     className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                     placeholder="e.g. Transportation, Material upfront cost..."
                     required
                   />
                </div>
                
                <button 
                  type="submit"
                  disabled={processing}
                  className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center"
                >
                   {processing ? <Loader2 className="animate-spin" /> : 'Confirm & Releae Funds'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Schedule Inspection Modal */}
      {showScheduleModal && selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-amber-50/50">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Schedule Inspection</h3>
                    <p className="text-slate-700 text-[10px] font-black uppercase tracking-widest mt-1">Inspection Paid: {formatGHS(100)}</p>
                 </div>
                 <button onClick={() => setShowScheduleModal(false)} className="w-10 h-10 bg-white text-slate-700 hover:text-red-500 rounded-full flex items-center justify-center transition-colors shadow-sm">
                   <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleScheduleInspection} className="p-8 space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1 mb-2 block">Inspection Date & Time</label>
                    <input 
                      type="datetime-local"
                      required
                      value={inspectionDate}
                      onChange={(e) => setInspectionDate(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1 mb-2 block">Accompanying Member (Optional)</label>
                    <input 
                      type="text"
                      placeholder="e.g. Ama from Diwalya HQ"
                      value={accompanyingMember}
                      onChange={(e) => setAccompanyingMember(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                 </div>

                 <button 
                   type="submit"
                   disabled={processing}
                   className="w-full py-5 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-600 transition-all uppercase tracking-widest text-xs shadow-xl shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                    {processing ? <Loader2 className="animate-spin" /> : <><CalendarCheck size={18} /> Confirm Schedule</>}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Set Inspection Fee Modal */}
      {showInspectionFeeModal && selectedJob && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden p-8 scale-in-center">
               <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                       Set Inspection Fee
                    </h3>
                    <p className="text-slate-700 text-[10px] font-black uppercase tracking-widest mt-1">Job Ref: {selectedJob.id}</p>
                  </div>
                  <button onClick={() => setShowInspectionFeeModal(false)} className="w-10 h-10 bg-slate-50 text-slate-700 hover:text-red-500 rounded-full flex items-center justify-center transition-colors">
                    <X size={20} />
                  </button>
               </div>

               <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-6">
                  <p className="text-[10px] font-bold text-amber-700 mt-1 leading-relaxed">
                     The specialist requested a site visit. Set the inspection fee here. The client will be notified to pay this amount into escrow before the visit happens.
                  </p>
               </div>

               <form onSubmit={handleSetInspectionFee} className="space-y-4">
                  <div>
                     <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Inspection Fee (GHS)</label>
                     <input 
                       type="number"
                       step="0.01"
                       value={inspectionFeeAmount}
                       onChange={(e) => setInspectionFeeAmount(e.target.value)}
                       className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-xl"
                       placeholder="e.g. 100"
                       required
                     />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={processing}
                    className="w-full py-4 bg-amber-500 text-white font-black rounded-2xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                     {processing ? <Loader2 className="animate-spin" /> : 'Confirm Fee & Notify Client'}
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* Assign Worker Modal */}
      {showAssignModal && selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Assign Specialist</h3>
                   <p className="text-slate-700 text-[10px] font-black uppercase tracking-widest mt-1">Select the best fit for this request</p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="w-10 h-10 bg-white text-slate-700 hover:text-red-500 rounded-full flex items-center justify-center transition-colors shadow-sm">
                  <X size={20} />
                </button>
             </div>

             <div className="p-6 overflow-y-auto flex-grow space-y-3">
                {workers.length === 0 ? (
                  <div className="text-center py-10 text-slate-700 font-bold italic">No approved specialists found.</div>
                ) : workers.map((worker) => (
                  <button
                    key={worker.id}
                    disabled={processing}
                    onClick={() => handleAssignWorker(worker.userId)}
                    className="w-full p-6 bg-white border border-slate-100 rounded-3xl flex items-center justify-between hover:border-primary hover:bg-primary/5 transition-all text-left shadow-sm hover:shadow-md group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                         {worker.user?.profilePicture ? (
                           <img src={worker.user.profilePicture} alt={worker.user.name} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center font-black text-slate-700">{worker.user?.name?.charAt(0)}</div>
                         )}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 group-hover:text-primary transition-colors">{worker.businessName || worker.user?.name}</h4>
                        <p className="text-xs text-slate-700 font-bold uppercase tracking-widest">{worker.category}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black text-slate-700 uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all">
                       Select
                    </div>
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}
      {/* Review Estimate Modal */}
      {showReviewModal && selectedJob && currentEstimate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-purple-50/50">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Review Specialist Quote</h3>
                    <p className="text-purple-600 text-[10px] font-black uppercase tracking-widest mt-1">Job ID: {selectedJob.id}</p>
                 </div>
                 <button onClick={() => setShowReviewModal(false)} className="w-10 h-10 bg-white text-slate-700 hover:text-red-500 rounded-full flex items-center justify-center transition-colors shadow-sm">
                   <X size={20} />
                 </button>
              </div>

              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                       <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Labor Cost</p>
                       <p className="text-xl font-black text-slate-900">{formatGHS(currentEstimate.laborCost)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                       <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Materials</p>
                       <p className="text-xl font-black text-slate-900">{formatGHS(currentEstimate.materialCost)}</p>
                    </div>
                 </div>

                 <div className="p-6 bg-slate-900 text-white rounded-2xl">
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Total Quote</p>
                          <p className="text-3xl font-black text-white">{formatGHS(currentEstimate.totalCost)}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Duration</p>
                          <p className="font-black">{currentEstimate.estimatedDuration}</p>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Specialist Notes</p>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600 italic">
                       "{currentEstimate.workerNotes || 'No notes provided'}"
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button 
                      onClick={handleApproveEstimate}
                      disabled={processing}
                      className="flex-1 py-5 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 transition-all uppercase tracking-widest text-xs shadow-xl shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                       {processing ? <Loader2 className="animate-spin" /> : <><CheckCircle size={18} /> Approve & Send</>}
                    </button>
                    <button 
                      onClick={() => setShowReviewModal(false)}
                      className="px-6 py-5 border-2 border-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]"
                    >
                       Reject
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
      {/* Final Payout Modal */}
      {showFinalPayoutModal && selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-emerald-50/50">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Release Final Funds</h3>
                    <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mt-1 tracking-tighter">Job ID: {selectedJob.id}</p>
                 </div>
                 <button onClick={() => setShowFinalPayoutModal(false)} className="w-10 h-10 bg-white text-slate-700 hover:text-red-500 rounded-full flex items-center justify-center transition-colors shadow-sm">
                   <X size={20} />
                 </button>
              </div>

              <div className="p-8 space-y-6">
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-1">
                       <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Total Escrow Amount</p>
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Secured</p>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{formatGHS(selectedJob.priceAmount)}</p>
                 </div>

                 <div className="space-y-4">
                    <div>
                       <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1 mb-2 block">Amount to Release (GHS)</label>
                       <div className="relative">
                          <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                          <input 
                            type="number" 
                            step="0.01"
                            value={finalPayoutAmount}
                            onChange={(e) => setFinalPayoutAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xl text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                          />
                       </div>
                       <p className="mt-2 text-[10px] font-bold text-slate-700 italic">
                          Suggested (95%): {formatGHS(selectedJob.priceAmount * 0.95)}
                       </p>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                       <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <AlertCircle size={12} /> Financial Guard
                       </p>
                       <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                          This will permanently transfer funds from escrow to the worker's wallet. Ensure the client has confirmed satisfaction.
                       </p>
                    </div>
                 </div>

                 <button 
                   onClick={handleReleaseFinalPayout}
                   disabled={processing}
                   className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                    {processing ? <Loader2 className="animate-spin" /> : <><CheckCircle size={18} /> Confirm Disbursement</>}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
