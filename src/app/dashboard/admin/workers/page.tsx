'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  ShieldCheck, 
  ShieldAlert, 
  MapPin, 
  Mail, 
  Phone,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Ban,
  Unlock,
  Copy,
  X,
  Star,
  ExternalLink,
  ClipboardList,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUsers, deleteUser } from '@/app/actions/user';
import { moderateUser, liftSanctions } from '@/app/actions/report';
import { approveWorker, rejectWorker } from '@/app/actions/worker';
import AdminMessenger from '@/components/admin/AdminMessenger';
import MediaLightbox from '@/components/ui/MediaLightbox';

export default function EnhancedWorkerManagement() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewingWorker, setViewingWorker] = useState<any>(null);
  const [showMessenger, setShowMessenger] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{show: boolean, action: string, workerId: string, workerName: string} | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkers();
  }, [search]);

  const fetchWorkers = async () => {
    setLoading(true);
    const res = await getUsers(search, 'WORKER');
    if (res.success) setWorkers(res.data || []);
    setLoading(false);
  };

  const executeAction = async () => {
    if (!confirmModal) return;
    const { workerId, action } = confirmModal;
    
    setConfirmModal(null);
    setProcessingId(workerId);
    
    let res;
    try {
      if (action === 'DELETE') {
        res = await deleteUser(workerId);
      } else if (action === 'LIFT') {
        res = await liftSanctions(workerId);
      } else if (action === 'APPROVE') {
        res = await approveWorker(workerId);
      } else if (action === 'REJECT') {
        const reason = prompt('Enter rejection reason:');
        if (!reason) { setProcessingId(null); return; }
        res = await rejectWorker(workerId, reason);
      } else {
        res = await (moderateUser as any)(workerId, action as any, `Admin manual action: ${action}`);
      }

      if (res?.success) {
        // Optimistic/Immediate UI update
        if (action === 'APPROVE') {
          setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, workerProfile: { ...w.workerProfile, isVerified: true } } : w));
        } else if (action === 'DELETE') {
          setWorkers(prev => prev.filter(w => w.id !== workerId));
        } else if (action === 'SUSPEND') {
          setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, isSuspended: true } : w));
        } else if (action === 'LIFT') {
          setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, isSuspended: false, isBanned: false } : w));
        }
        
        await fetchWorkers();
        if (viewingWorker?.id === workerId) setViewingWorker(null);
      } else {
        alert(`Error: ${res?.error || 'Action failed'}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const triggerConfirm = (workerId: string, workerName: string, action: string) => {
    setConfirmModal({ show: true, workerId, workerName, action });
  };

  return (
    <div className="p-8">
      <MediaLightbox 
        url={selectedMedia} 
        onClose={() => setSelectedMedia(null)} 
      />
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Worker Management</h1>
            <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest font-black text-primary">Professional Network Control</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search name, skill, or ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all w-full md:w-80 font-bold text-sm shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Worker</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category & Location</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Rating</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-sm">
                {loading && workers.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold animate-pulse text-lg">Syncing professional database...</td></tr>
                ) : workers.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-bold text-lg">No workers found in registry.</td></tr>
                ) : workers.map((worker) => (
                  <tr key={worker.id} className={cn("hover:bg-slate-50/50 transition-all group", processingId === worker.id && "opacity-50 pointer-events-none")}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-slate-400 overflow-hidden shadow-inner border border-slate-200">
                          {worker.profilePicture ? <img src={worker.profilePicture} className="w-full h-full object-cover" /> : worker.name[0]}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 group-hover:text-primary transition-colors">{worker.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{worker.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-700">{worker.workerProfile?.category || 'General'}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-1 mt-0.5"><MapPin size={10} /> {worker.workerProfile?.location || 'Ghana'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-2">
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter inline-flex items-center gap-1 w-fit",
                          worker.workerProfile?.isVerified ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-500 border border-slate-200"
                        )}>
                          {worker.workerProfile?.isVerified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                          {worker.workerProfile?.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                        {worker.isBanned ? (
                          <span className="text-[9px] font-black text-red-600 uppercase flex items-center gap-1"><Ban size={10}/> Banned</span>
                        ) : worker.isSuspended && (
                          <span className="text-[9px] font-black text-orange-600 uppercase flex items-center gap-1"><ShieldAlert size={10}/> Suspended</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 font-black text-slate-900">
                      <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2 py-1 rounded-lg border border-yellow-100 w-fit">
                        <Star size={12} className="fill-current" />
                        <span className="text-xs">{worker.workerProfile?.rating || '0.0'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        {processingId === worker.id ? (
                           <div className="p-2.5 text-primary animate-spin">
                              <Loader2 size={18} />
                           </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => setViewingWorker(worker)}
                              className="p-2.5 hover:bg-slate-100 text-slate-600 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200"
                              title="View Full Identity"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => { setSelectedWorker(worker); setShowMessenger(true); }}
                              className="p-2.5 hover:bg-primary/10 text-primary rounded-xl transition-all shadow-sm border border-transparent hover:border-primary/20"
                              title="Secure Comm"
                            >
                              <Mail size={18} />
                            </button>
                            
                            {!worker.workerProfile?.isVerified && (
                              <button 
                                onClick={() => triggerConfirm(worker.id, worker.name, 'APPROVE')}
                                className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                                title="Verify Account"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                            )}

                            <button 
                              onClick={() => triggerConfirm(worker.id, worker.name, worker.isBanned || worker.isSuspended ? 'LIFT' : 'SUSPEND')}
                              className={cn(
                                "p-2.5 rounded-xl transition-all shadow-sm border",
                                worker.isBanned || worker.isSuspended 
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white" 
                                  : "bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-600 hover:text-white"
                              )}
                              title={worker.isBanned || worker.isSuspended ? "Lift Sanctions" : "Suspend Worker"}
                            >
                              {worker.isBanned || worker.isSuspended ? <Unlock size={18} /> : <ShieldAlert size={18} />}
                            </button>
                            
                            <button 
                              onClick={() => triggerConfirm(worker.id, worker.name, 'DELETE')}
                              className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                              title="Terminal Deletion"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showMessenger && selectedWorker && (
        <AdminMessenger 
          onClose={() => setShowMessenger(false)} 
          targetUserId={selectedWorker.id} 
          targetUserName={selectedWorker.name} 
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-6">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto",
                confirmModal.action === 'DELETE' ? "bg-red-50 text-red-600" : 
                confirmModal.action === 'APPROVE' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
              )}>
                {confirmModal.action === 'DELETE' ? <Trash2 size={32} /> : 
                 confirmModal.action === 'APPROVE' ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-900 leading-tight">Confirm {confirmModal.action}?</h3>
                <p className="text-slate-500 text-sm mt-2 font-medium">Are you sure you want to {confirmModal.action.toLowerCase()} worker <span className="font-black text-slate-800">{confirmModal.workerName}</span>?</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeAction}
                  className={cn(
                    "flex-1 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95",
                    confirmModal.action === 'DELETE' ? "bg-red-600 shadow-red-500/20" : 
                    confirmModal.action === 'APPROVE' ? "bg-emerald-600 shadow-emerald-500/20" : "bg-orange-600 shadow-orange-500/20"
                  )}
                >
                  Confirm {confirmModal.action}
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Enhanced Viewing Modal */}
      {viewingWorker && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingWorker(null);
          }}
        >
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-white/10 relative">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
               <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Worker Dossier</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verification Intelligence Unit</p>
                  </div>
               </div>
               <button 
                 onClick={() => setViewingWorker(null)}
                 className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100 z-[70]"
               >
                 <X size={24} />
               </button>
             </div>
             
             <div className="p-10 overflow-y-auto w-full space-y-10 custom-scrollbar">
                <div className="flex flex-col md:flex-row gap-10 items-start">
                  <div className="w-40 h-40 bg-slate-100 rounded-[2.5rem] flex-shrink-0 flex items-center justify-center font-black text-5xl text-slate-300 overflow-hidden shadow-2xl border-4 border-white">
                    {viewingWorker.profilePicture ? <img src={viewingWorker.profilePicture} className="w-full h-full object-cover" /> : viewingWorker.name[0]}
                  </div>
                  <div className="flex-grow space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{viewingWorker.name}</h3>
                      <span className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                        Professional Worker
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-slate-500 font-bold">
                      <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-sm"><Mail size={16} className="text-primary" /> {viewingWorker.email}</span>
                      <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-sm"><Phone size={16} className="text-primary" /> {viewingWorker.phone || 'No Contact Data'}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-2xl flex items-center justify-between w-fit gap-6 shadow-xl">
                       <code className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">ID: {viewingWorker.id}</code>
                       <button 
                         onClick={() => {
                           navigator.clipboard.writeText(viewingWorker.id);
                           alert('Unique identifier copied to clipboard');
                         }}
                         className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                         title="Copy Identity Token"
                       >
                         <Copy size={14} />
                       </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Status', value: viewingWorker.isBanned ? 'TERMINATED' : viewingWorker.isSuspended ? 'SUSPENDED' : 'OPERATIONAL', color: viewingWorker.isBanned ? 'text-red-500' : viewingWorker.isSuspended ? 'text-orange-500' : 'text-emerald-500' },
                    { label: 'Network Joined', value: new Date(viewingWorker.createdAt).toLocaleDateString(), color: 'text-slate-900' },
                    { label: 'Verification', value: viewingWorker.workerProfile?.isVerified ? 'VERIFIED' : 'PENDING', color: viewingWorker.workerProfile?.isVerified ? 'text-emerald-500' : 'text-slate-400' },
                    { label: 'Wallet Balance', value: `GHS ${viewingWorker.wallet?.balance?.toFixed(2) || '0.00'}`, color: 'text-primary' }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">{stat.label}</p>
                      <p className={cn("text-lg font-black tracking-tight", stat.color)}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {viewingWorker.workerProfile ? (
                  <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                      <h4 className="text-sm font-black text-primary uppercase tracking-[0.3em]">Professional Credentials</h4>
                      <div className="flex-grow h-px bg-slate-50" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Business Name</p>
                        <p className="text-base font-black text-slate-900">{viewingWorker.workerProfile.businessName || 'Independent Provider'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Specialization</p>
                        <p className="text-base font-black text-slate-900">{viewingWorker.workerProfile.category}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Operating Base</p>
                        <p className="text-base font-black text-slate-900">{viewingWorker.workerProfile.location}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Industry Experience</p>
                        <p className="text-base font-black text-slate-900">{viewingWorker.workerProfile.experienceYears} Standard Years</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Standard Rate</p>
                        <p className="text-base font-black text-slate-900 font-mono">GHS {viewingWorker.workerProfile.hourlyRate || '0.00'}/hr</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Reputation Score</p>
                        <div className="flex items-center gap-2 text-yellow-500">
                           <Star size={18} className="fill-current" />
                           <span className="text-base font-black">{viewingWorker.workerProfile.rating || '0.0'} Trust Level</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Professional Bio / Mission Statement</p>
                      <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                        <p className="text-slate-600 leading-relaxed font-medium text-sm italic whitespace-pre-wrap">"{viewingWorker.workerProfile.bio || 'The professional has not provided a mission statement yet.'}"</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Government Identity Verification (Ghana Card)</p>
                      {viewingWorker.workerProfile.ghanaCardUrl ? (
                        <div className="relative group overflow-hidden rounded-[2.5rem] border-4 border-slate-100 shadow-2xl">
                          <img 
                            src={viewingWorker.workerProfile.ghanaCardUrl} 
                            className="w-full max-h-[400px] object-contain bg-slate-100 group-hover:scale-[1.02] transition-transform duration-500 cursor-zoom-in" 
                            alt="ID Document" 
                            onClick={() => setSelectedMedia(viewingWorker.workerProfile.ghanaCardUrl)}
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm pointer-events-none">
                            <div className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl">
                              Click to Inspect <Eye size={16} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 text-red-500 p-8 rounded-[2.5rem] border border-red-100 flex items-center gap-4">
                          <ShieldAlert size={32} />
                          <div>
                            <p className="font-black uppercase tracking-widest text-xs">Security Alert</p>
                            <p className="font-bold text-sm">No valid government ID document found on record for this professional.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-50 text-orange-600 p-10 rounded-[3rem] border border-orange-100 text-center space-y-4">
                     <ShieldAlert size={48} className="mx-auto" />
                     <h4 className="text-xl font-black">Profile Incomplete</h4>
                     <p className="max-w-md mx-auto font-bold opacity-80 uppercase tracking-widest text-[10px]">The user has the worker role but has not initialized their professional profile structure.</p>
                  </div>
                )}
             </div>

             <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-3">
                   {!viewingWorker.workerProfile?.isVerified && (
                     <button 
                       onClick={() => triggerConfirm(viewingWorker.id, viewingWorker.name, 'APPROVE')}
                       className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-600/20 hover:scale-105 transition-all flex items-center gap-2"
                     >
                        <CheckCircle2 size={18} /> Approve Professional
                     </button>
                   )}
                   <button 
                     onClick={() => triggerConfirm(viewingWorker.id, viewingWorker.name, viewingWorker.isBanned || viewingWorker.isSuspended ? 'LIFT' : 'SUSPEND')}
                     className={cn(
                       "px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg flex items-center gap-2",
                       viewingWorker.isBanned || viewingWorker.isSuspended 
                        ? "bg-white text-emerald-600 border border-emerald-200 shadow-emerald-500/10" 
                        : "bg-white text-orange-600 border border-orange-200 shadow-orange-500/10"
                     )}
                   >
                      {viewingWorker.isBanned || viewingWorker.isSuspended ? <Unlock size={18} /> : <ShieldAlert size={18} />}
                      {viewingWorker.isBanned || viewingWorker.isSuspended ? 'Lift Restrictions' : 'Impose Sandbox'}
                   </button>
                </div>
                <button 
                  onClick={() => triggerConfirm(viewingWorker.id, viewingWorker.name, 'DELETE')}
                  className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-red-600/20 hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Trash2 size={18} /> Purge Identity
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
