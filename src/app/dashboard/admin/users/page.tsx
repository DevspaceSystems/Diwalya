'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ShieldAlert, 
  ShieldCheck, 
  Ban, 
  Unlock,
  Mail,
  Edit2,
  Phone,
  Eye,
  X,
  Copy,
  Check,
  MapPin,
  Trash2,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { getUsers, updateUser, deleteUser } from '@/app/actions/user';
import { moderateUser, liftSanctions } from '@/app/actions/report';
import AdminMessenger from '@/components/admin/AdminMessenger';
import { cn } from '@/lib/utils';

export default function ClientManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('CLIENT');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showMessenger, setShowMessenger] = useState(false);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{show: boolean, action: string, userId: string, userName: string} | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await getUsers(search, roleFilter);
    if (res.success) setUsers(res.data || []);
    setLoading(false);
  };

  const executeAction = async () => {
    if (!confirmModal) return;
    const { userId, action } = confirmModal;
    
    setConfirmModal(null);
    setProcessingId(userId);
    
    let res;
    try {
      if (action === 'DELETE') {
        res = await deleteUser(userId);
      } else if (action === 'LIFT') {
        res = await liftSanctions(userId);
      } else {
        res = await (moderateUser as any)(userId, action as any, `Admin manual action: ${action}`);
      }

      if (res?.success) {
        await fetchUsers();
        if (viewingUser?.id === userId) setViewingUser(null);
      } else {
        alert(`Error: ${res?.error || 'Action failed'}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const triggerConfirm = (userId: string, userName: string, action: string) => {
    setConfirmModal({ show: true, userId, userName, action });
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Client Management</h1>
            <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest font-black text-primary">Service Requester Network</p>
          </div>
          <div className="flex gap-4">
             <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search name, email, or ID..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all w-80 font-bold text-sm shadow-sm"
               />
             </div>
             
             <div className="flex bg-slate-100 p-1 rounded-2xl">
               {['CLIENT', 'ADMIN'].map((role) => (
                 <button
                   key={role}
                   onClick={() => setRoleFilter(role)}
                   className={cn(
                     "px-6 py-2 rounded-xl text-xs font-black transition-all",
                     roleFilter === role ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                   )}
                 >
                   {role === 'CLIENT' ? 'Clients' : 'Admins'}
                 </button>
               ))}
             </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Joined</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-sm">
              {loading && users.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold animate-pulse text-lg">Loading records...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold text-lg">No clients found.</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className={cn("hover:bg-slate-50/50 transition-all group", processingId === user.id && "opacity-50 pointer-events-none")}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-slate-400 overflow-hidden shadow-inner border border-slate-200">
                        {user.profilePicture ? <img src={user.profilePicture} className="w-full h-full rounded-xl object-cover" /> : user.name[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 group-hover:text-primary transition-colors">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter",
                      user.role === 'ADMIN' ? "bg-red-50 text-red-600 border border-red-100" : 
                      user.role === 'WORKER' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex gap-2">
                      {user.isBanned ? (
                        <span className="flex items-center gap-1 text-[10px] font-black text-red-600 uppercase"><Ban size={12}/> Banned</span>
                      ) : user.isSuspended ? (
                        <span className="flex items-center gap-1 text-[10px] font-black text-orange-600 uppercase"><ShieldAlert size={12}/> Suspended</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase"><ShieldCheck size={12}/> Active</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-slate-400 text-xs font-bold">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      {processingId === user.id ? (
                        <div className="p-2 text-primary animate-spin">
                          <Loader2 size={18} />
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => setViewingUser(user)}
                            className="p-2.5 hover:bg-slate-100 text-slate-600 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200"
                            title="View Full Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => { setSelectedUser(user); setShowMessenger(true); }}
                            className="p-2.5 hover:bg-primary/10 text-primary rounded-xl transition-all shadow-sm border border-transparent hover:border-primary/20"
                            title="Secure Message"
                          >
                            <Mail size={18} />
                          </button>
                          <button 
                            onClick={() => triggerConfirm(user.id, user.name, user.isBanned || user.isSuspended ? 'LIFT' : 'SUSPEND')}
                            className={cn(
                              "p-2.5 rounded-xl transition-all shadow-sm border",
                              user.isBanned || user.isSuspended 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white" 
                                : "bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-600 hover:text-white"
                            )}
                            title={user.isBanned || user.isSuspended ? "Lift Sanctions" : "Suspend User"}
                          >
                            {user.isBanned || user.isSuspended ? <Unlock size={18} /> : <ShieldAlert size={18} />}
                          </button>
                          <button 
                            onClick={() => triggerConfirm(user.id, user.name, 'BAN')}
                            className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                            title="Permanent Ban"
                            disabled={user.isBanned}
                          >
                            <Ban size={18} />
                          </button>
                          <button 
                            onClick={() => triggerConfirm(user.id, user.name, 'DELETE')}
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

      {showMessenger && selectedUser && (
        <AdminMessenger 
          onClose={() => setShowMessenger(false)} 
          targetUserId={selectedUser.id} 
          targetUserName={selectedUser.name} 
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-6">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto",
                confirmModal.action === 'DELETE' || confirmModal.action === 'BAN' ? "bg-red-50 text-red-600" : 
                confirmModal.action === 'LIFT' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
              )}>
                {confirmModal.action === 'DELETE' || confirmModal.action === 'BAN' ? <Trash2 size={32} /> : 
                 confirmModal.action === 'LIFT' ? <ShieldCheck size={32} /> : <AlertTriangle size={32} />}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-900 leading-tight">Confirm {confirmModal.action}?</h3>
                <p className="text-slate-500 text-sm mt-2 font-medium">Are you sure you want to {confirmModal.action.toLowerCase()} user <span className="font-black text-slate-800">{confirmModal.userName}</span>?</p>
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
                    confirmModal.action === 'DELETE' || confirmModal.action === 'BAN' ? "bg-red-600 shadow-red-500/20" : 
                    confirmModal.action === 'LIFT' ? "bg-emerald-600 shadow-emerald-500/20" : "bg-orange-600 shadow-orange-500/20"
                  )}
                >
                  Confirm {confirmModal.action}
                </button>
              </div>
           </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingUser && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingUser(null);
          }}
        >
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/10 relative">
             <div className="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
               <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Client Dossier</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Record Intelligence</p>
               </div>
               <button 
                 onClick={() => setViewingUser(null)}
                 className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100 z-[70]"
               >
                 <X size={24} />
               </button>
             </div>
             
              <div className="p-10 overflow-y-auto w-full space-y-10 custom-scrollbar">
                <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left">
                  <div className="w-32 h-32 bg-slate-100 rounded-[2rem] flex-shrink-0 flex items-center justify-center font-black text-4xl text-slate-300 overflow-hidden shadow-xl border-4 border-white">
                    {viewingUser.profilePicture ? <img src={viewingUser.profilePicture} className="w-full h-full object-cover" /> : viewingUser.name[0]}
                  </div>
                  <div className="flex-grow space-y-4 pt-2">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                      <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{viewingUser.name}</h3>
                      <span className={cn(
                        "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm",
                        viewingUser.role === 'ADMIN' ? "bg-red-50 text-red-600 border-red-100" : "bg-blue-50 text-blue-600 border-blue-100"
                      )}>
                        {viewingUser.role}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-slate-500 font-bold text-sm">
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-xl border border-slate-100"><Mail size={16} className="text-primary" /> {viewingUser.email}</span>
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-xl border border-slate-100"><Phone size={16} className="text-primary" /> {viewingUser.phone || 'No Phone'}</span>
                    </div>
                    <div className="mt-4 p-2.5 bg-slate-900 rounded-xl flex items-center justify-between w-full sm:w-fit gap-6 shadow-xl mx-auto sm:mx-0">
                       <code className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID: {viewingUser.id}</code>
                       <button 
                         onClick={() => {
                           navigator.clipboard.writeText(viewingUser.id);
                           alert('Client ID copied to clipboard');
                         }}
                         className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all shadow-sm"
                         title="Copy ID"
                       >
                         <Copy size={12} />
                       </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {[
                    { label: 'Status', value: viewingUser.isBanned ? 'TERMINATED' : viewingUser.isSuspended ? 'SUSPENDED' : 'OPERATIONAL', color: viewingUser.isBanned ? 'text-red-500' : viewingUser.isSuspended ? 'text-orange-500' : 'text-emerald-500' },
                    { label: 'Network Joined', value: new Date(viewingUser.createdAt).toLocaleDateString(), color: 'text-slate-900' },
                    { label: 'Infractions', value: viewingUser.warningCount || 0, color: (viewingUser.warningCount || 0) > 0 ? 'text-red-500' : 'text-slate-400' },
                    { label: 'Wallet Credits', value: `GHS ${viewingUser.wallet?.balance?.toFixed(2) || '0.00'}`, color: 'text-primary' }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">{stat.label}</p>
                      <p className={cn("text-lg font-black tracking-tight", stat.color)}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {viewingUser.workerProfile && (
                  <div className="animate-in slide-in-from-bottom-6 duration-500 mt-10">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-6">
                      <h4 className="text-sm font-black text-primary uppercase tracking-[0.3em]">Associated Worker Profile</h4>
                      <div className="flex-grow h-px bg-slate-50" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div>
                         <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Business Identity</p>
                         <p className="text-base font-black text-gray-900">{viewingUser.workerProfile.businessName || 'Independent'}</p>
                      </div>
                      <div>
                         <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Specialization</p>
                         <p className="text-base font-black text-gray-900">{viewingUser.workerProfile.category}</p>
                      </div>
                      <div>
                         <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Service Radius</p>
                         <p className="text-base font-black text-gray-900 font-mono flex items-center gap-2"><MapPin size={16} className="text-primary"/> {viewingUser.workerProfile.location}</p>
                      </div>
                      <div>
                         <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Verification Index</p>
                         <div className="flex items-center gap-2">
                           <span className={cn(
                             "text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg border",
                             viewingUser.workerProfile.verificationStatus === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                             viewingUser.workerProfile.verificationStatus === 'REJECTED' ? "bg-red-50 text-red-600 border-red-100" : "bg-orange-50 text-orange-600 border-orange-100"
                           )}>
                             {viewingUser.workerProfile.verificationStatus}
                           </span>
                           {viewingUser.workerProfile.isVerified && <ShieldCheck size={18} className="text-emerald-500" />}
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between mt-auto">
                <div className="flex gap-3">
                   <button 
                     onClick={() => triggerConfirm(viewingUser.id, viewingUser.name, viewingUser.isBanned || viewingUser.isSuspended ? 'LIFT' : 'SUSPEND')}
                     className={cn(
                       "px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg flex items-center gap-2",
                       viewingUser.isBanned || viewingUser.isSuspended 
                        ? "bg-white text-emerald-600 border border-emerald-200 shadow-emerald-500/10" 
                        : "bg-white text-orange-600 border border-orange-200 shadow-orange-500/10"
                     )}
                   >
                      {viewingUser.isBanned || viewingUser.isSuspended ? <Unlock size={18} /> : <ShieldAlert size={18} />}
                      {viewingUser.isBanned || viewingUser.isSuspended ? 'Operational Restore' : 'Security Sandbox'}
                   </button>
                </div>
                <button 
                  onClick={() => triggerConfirm(viewingUser.id, viewingUser.name, 'DELETE')}
                  className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-600/20 hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Trash2 size={18} /> Purge Record
                </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
