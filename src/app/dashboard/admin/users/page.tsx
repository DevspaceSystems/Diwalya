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
  Wallet as WalletIcon
} from 'lucide-react';
import { getUsers, updateUser } from '@/app/actions/user';
import { moderateUser, liftSanctions } from '@/app/actions/report';
import AdminMessenger from '@/components/Admin/AdminMessenger';
import { cn } from '@/lib/utils';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showMessenger, setShowMessenger] = useState(false);

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
    if (action === 'LIFT') {
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
    <div className="min-h-screen bg-slate-50 p-8">
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
             <select 
               value={roleFilter}
               onChange={(e) => setRoleFilter(e.target.value)}
               className="px-6 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
             >
               <option value="">All Roles</option>
               <option value="CLIENT">Clients</option>
               <option value="WORKER">Workers</option>
               <option value="ADMIN">Admins</option>
             </select>
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
    </div>
  );
}
