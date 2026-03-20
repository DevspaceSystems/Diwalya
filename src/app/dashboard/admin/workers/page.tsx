'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWorkers } from '@/app/actions/user';

export default function AdminWorkerManagement() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadWorkers() {
      setLoading(true);
      const res = await getWorkers();
      if (res.success) setWorkers(res.data || []);
      setLoading(false);
    }
    loadWorkers();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Worker Management</h1>
          <p className="text-gray-500">Verify, Suspend, or Manage professional profiles.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-gray-200 rounded-2xl flex items-center px-4 py-2 hover:border-primary transition-colors">
            <Search size={18} className="text-gray-400 mr-3" />
            <input type="text" placeholder="Search by name or skill..." className="bg-transparent focus:outline-none text-sm font-medium" />
          </div>
          <button className="bg-primary text-white px-6 py-2 rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2">
            <Filter size={18} /> Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Worker</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Skill & Location</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Rating</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center text-gray-400 font-bold animate-pulse">Loading workers...</td></tr>
              ) : workers.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-gray-400 font-bold">No workers found.</td></tr>
              ) : workers.map((worker) => (
                <tr key={worker.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary font-black flex items-center justify-center overflow-hidden">
                        {worker.profilePicture ? <img src={worker.profilePicture} className="w-full h-full object-cover" /> : worker.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{worker.name}</p>
                        <p className="text-xs text-gray-400">{worker.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-bold text-gray-700">{worker.workerProfile?.category || 'General'}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={12} /> {worker.workerProfile?.city || 'Ghana'}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        worker.workerProfile?.isVerified ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                    )}>
                      {worker.workerProfile?.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-black text-gray-900">
                    ⭐ {worker.workerProfile?.rating || 'N/A'}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                       <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="View Details">
                          <Eye size={16} />
                       </button>
                       {!worker.workerProfile?.isVerified && (
                         <button className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm" title="Approve">
                            <CheckCircle2 size={16} />
                         </button>
                       )}
                       <button className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Suspend">
                          <ShieldAlert size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
           <p className="text-xs font-bold text-gray-400">Showing {workers.length} workers</p>
           <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-400 cursor-not-allowed">Previous</button>
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-primary transition-colors">Next</button>
           </div>
        </div>
      </div>
    </div>
  );
}
