'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

export default function AdminWorkerManagement() {
  const [filter, setFilter] = useState('all');

  const workers = [
    { id: '1', name: 'Kwame Mensah', skill: 'Plumber', location: 'Sunyani', status: 'Verified', rating: 4.9, email: 'kwame@example.com' },
    { id: '2', name: 'Sarah Mensah', skill: 'Electrician', location: 'Accra', status: 'Pending', rating: 0, email: 'sarah@example.com' },
    { id: '3', name: 'Kofi Arhin', skill: 'Mechanic', location: 'Kumasi', status: 'Unverified', rating: 4.2, email: 'kofi@example.com' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Reusable Admin Sidebar placeholder logic (would normally be a component) */}
      <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col fixed inset-y-0 z-50">
        <div className="p-8">
           <div className="bg-white p-2 rounded-lg inline-block">
              <Image src="/diwalya-logo.png" alt="Diwalya Admin" width={120} height={30} className="object-contain" />
           </div>
        </div>
        <nav className="flex-grow px-4 space-y-1">
          <Link href="/dashboard/admin" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <ShieldCheck size={20} /> Overview
          </Link>
          <Link href="/dashboard/admin/workers" className="flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-xl font-bold transition-all">
            <Users size={20} /> Manage Workers
          </Link>
          <Link href="/dashboard/admin/bookings" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <CheckCircle2 size={20} /> Oversight
          </Link>
        </nav>
      </aside>

      <main className="flex-grow ml-64 p-8">
        <div className="max-w-7xl mx-auto">
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

          {/* Workers Table/List */}
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
                  {workers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary font-black flex items-center justify-center">
                            {worker.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{worker.name}</p>
                            <p className="text-xs text-gray-400">{worker.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-gray-700">{worker.skill}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={12} /> {worker.location}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          worker.status === 'Verified' ? 'bg-green-100 text-green-600' : 
                          worker.status === 'Pending' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {worker.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 font-black text-gray-900">
                        {worker.rating > 0 ? `⭐ ${worker.rating}` : 'N/A'}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                           <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="View Details">
                              <Eye size={16} />
                           </button>
                           {worker.status === 'Pending' && (
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
               <p className="text-xs font-bold text-gray-400">Showing 3 of 482 workers</p>
               <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-400 cursor-not-allowed">Previous</button>
                  <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-primary transition-colors">Next</button>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
