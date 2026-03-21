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
  Calendar,
  Wallet as WalletIcon,
  Eye,
  X,
  Copy,
  Check
} from 'lucide-react';
import { getUsers, updateUser, deleteUser } from '@/app/actions/user';
import { moderateUser, liftSanctions } from '@/app/actions/report';
import AdminMessenger from '@/components/admin/AdminMessenger';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showMessenger, setShowMessenger] = useState(false);
  const [viewingUser, setViewingUser] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await getUsers(search, roleFilter);
    if (res.success) setUsers(res.data || []);
    setLoading(false);
  };

  const handleAction = async (userId: string, action: string) => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    let res;
    if (action === 'DELETE') {
      res = await deleteUser(userId);
    } else if (action === 'LIFT') {
      res = await liftSanctions(userId);
    } else {
      res = await (moderateUser as any)(userId, action as any, `Admin manual action: ${action}`);
    }

    if (res.success) {
      alert(`${action} successful`);
      fetchUsers();
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
            <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest font-black">Database Access v2.0</p>
          </div>
          <div className="flex gap-4">
             <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search name, email, or ID..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all w-80 font-bold text-sm"
               />
             </div>
             
             <div className="flex bg-slate-100 p-1 rounded-2xl">
               {['', 'CLIENT', 'WORKER', 'ADMIN'].map((role) => (
                 <button
                   key={role}
                   onClick={() => setRoleFilter(role)}
                   className={cn(
                     "px-6 py-2 rounded-xl text-xs font-black transition-all",
                     roleFilter === role ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                   )}
                 >
                   {role === '' ? 'All Roles' : role === 'CLIENT' ? 'Clients' : role === 'WORKER' ? 'Workers' : 'Admins'}
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
            <tbody className="divide-y divide-slate-50 font-medium">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold animate-pulse">Loading records...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold">No users found.</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-slate-400">
                        {user.profilePicture ? <img src={user.profilePicture} className="w-full h-full rounded-xl object-cover" /> : user.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter",
                      user.role === 'ADMIN' ? "bg-red-50 text-red-600" : 
                      user.role === 'WORKER' ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"
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
                      <button 
                        onClick={() => setViewingUser(user)}
                        className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-all"
                        title="View Full Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedUser(user); setShowMessenger(true); }}
                        className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all"
                        title="Message"
                      >
                        <Mail size={18} />
                      </button>
                      <button 
                        onClick={() => handleAction(user.id, user.isBanned || user.isSuspended ? 'LIFT' : 'SUSPEND')}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          user.isBanned || user.isSuspended ? "hover:bg-emerald-100 text-emerald-600" : "hover:bg-orange-100 text-orange-600"
                        )}
                        title={user.isBanned || user.isSuspended ? "Lift Sanctions" : "Suspend User"}
                      >
                        {user.isBanned || user.isSuspended ? <Unlock size={18} /> : <ShieldAlert size={18} />}
                      </button>
                      <button 
                        onClick={() => handleAction(user.id, 'BAN')}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                        title="Perm Ban"
                        disabled={user.isBanned}
                      >
                        <Ban size={18} />
                      </button>
                      <button 
                        onClick={() => handleAction(user.id, 'DELETE')}
                        className="p-2 hover:bg-red-600 hover:text-white text-red-600 rounded-lg transition-all"
                        title="Delete User COMPLETELY"
                      >
                        <Trash2 size={18} />
                      </button>
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

      {/* View Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
             <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
               <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                 User Details
               </h2>
               <button 
                 onClick={() => setViewingUser(null)}
                 className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
               >
                 <X size={20} />
               </button>
             </div>
             
              <div className="p-8 overflow-y-auto w-full space-y-8">
                <div className="flex-grow text-center sm:text-left pt-14 sm:pt-12">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                    <h3 className="text-3xl font-black text-gray-900">{viewingUser.name}</h3>
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border",
                      viewingUser.role === 'WORKER' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-blue-50 text-blue-600 border-blue-100"
                    )}>
                      {viewingUser.role}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-gray-500 font-bold text-sm">
                    <span className="flex items-center gap-1.5"><Mail size={16} className="text-gray-400" /> {viewingUser.email}</span>
                    <span className="flex items-center gap-1.5"><Phone size={16} className="text-gray-400" /> {viewingUser.phone || 'No Phone'}</span>
                  </div>
                  <div className="mt-4 p-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between w-full sm:w-fit gap-4">
                     <code className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {viewingUser.id}</code>
                     <button 
                       onClick={() => {
                         navigator.clipboard.writeText(viewingUser.id);
                         alert('User ID copied to clipboard');
                       }}
                       className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-primary transition-all shadow-sm"
                       title="Copy ID"
                     >
                       <Copy size={12} />
                     </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Status</p>
                    <p className={cn(
                      "text-sm font-bold",
                      viewingUser.isBanned ? "text-red-600" : viewingUser.isSuspended ? "text-orange-600" : "text-emerald-600"
                    )}>
                      {viewingUser.isBanned ? 'BANNED' : viewingUser.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Joined Date</p>
                    <p className="text-sm font-bold text-gray-900">{new Date(viewingUser.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Warnings</p>
                    <p className="text-sm font-bold text-gray-900">{viewingUser.warningCount || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Wallet Bal</p>
                    <p className="text-sm font-bold text-gray-900">GHS {viewingUser.wallet?.balance?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                {viewingUser.workerProfile && (
                  <div className="animate-in slide-in-from-bottom-4">
                    <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Professional Worker Profile</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                         <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Business Name</p>
                         <p className="text-sm font-bold text-gray-900">{viewingUser.workerProfile.businessName || 'N/A'}</p>
                      </div>
                      <div>
                         <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Category</p>
                         <p className="text-sm font-bold text-gray-900">{viewingUser.workerProfile.category}</p>
                      </div>
                      <div>
                         <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Location</p>
                         <p className="text-sm font-bold text-gray-900">{viewingUser.workerProfile.location}</p>
                      </div>
                      <div>
                         <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Verification Status</p>
                         <div className="flex items-center gap-2">
                           <span className={cn(
                             "text-xs font-black uppercase",
                             viewingUser.workerProfile.verificationStatus === 'APPROVED' ? "text-emerald-600" :
                             viewingUser.workerProfile.verificationStatus === 'REJECTED' ? "text-red-600" : "text-orange-600"
                           )}>
                             {viewingUser.workerProfile.verificationStatus}
                           </span>
                           {viewingUser.workerProfile.isVerified && <ShieldCheck size={14} className="text-emerald-500" />}
                         </div>
                      </div>
                      <div>
                         <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Experience (Years)</p>
                         <p className="text-sm font-bold text-gray-900">{viewingUser.workerProfile.experienceYears} Years</p>
                      </div>
                      <div>
                         <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Hourly Rate</p>
                         <p className="text-sm font-bold text-gray-900">{viewingUser.workerProfile.hourlyRate ? `GHS ${viewingUser.workerProfile.hourlyRate}` : 'N/A'}</p>
                      </div>
                      <div className="col-span-full">
                         <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Ghana Card (ID)</p>
                         {viewingUser.workerProfile.ghanaCardUrl ? (
                           <a href={viewingUser.workerProfile.ghanaCardUrl} target="_blank" className="mt-2 block w-full sm:w-1/2 aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 group relative">
                              <img src={viewingUser.workerProfile.ghanaCardUrl} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                <span className="text-white text-[10px] font-black uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">Click to View Full</span>
                              </div>
                           </a>
                         ) : (
                           <p className="text-sm font-bold text-red-500 italic">No Ghana Card uploaded</p>
                         )}
                      </div>
                      <div className="col-span-full">
                         <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Bio / About</p>
                         <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl leading-relaxed whitespace-pre-wrap">{viewingUser.workerProfile.bio || 'No bio provided'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

