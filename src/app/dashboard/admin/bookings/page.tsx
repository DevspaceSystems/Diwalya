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
  AlertCircle
} from 'lucide-react';
import { getGlobalBookings } from '@/app/actions/booking';
import { cn } from '@/lib/utils';

export default function GlobalBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    const res = await getGlobalBookings(statusFilter as any);
    if (res.success) setBookings(res.data || []);
    setLoading(false);
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-600',
    ADMIN_REVIEW: 'bg-blue-50 text-blue-600 border-blue-100',
    WORKER_REVIEW: 'bg-slate-50 text-slate-600 border-slate-100',
    ACCEPTED: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    IN_PROGRESS: 'bg-primary/10 text-primary border-primary/20',
    COMPLETED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    CANCELLED: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Global Bookings</h1>
            <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest font-black">All platform jobs</p>
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
             <div className="col-span-full py-20 text-center font-black text-slate-400 animate-pulse uppercase tracking-widest text-xs">
               Syncing platform jobs...
             </div>
          ) : bookings.length === 0 ? (
             <div className="col-span-full py-20 text-center font-black text-slate-400 uppercase tracking-widest text-xs">
               No bookings found.
             </div>
          ) : bookings.map((job) => (
            <div key={job.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all p-8 flex flex-col group">
              <div className="flex justify-between items-start mb-6">
                <span className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                  statusColors[job.status] || "bg-slate-50 text-slate-400"
                )}>
                  {job.status.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 group-hover:text-primary transition-colors">
                  <Clock size={12} /> {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-6 flex-grow">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{job.serviceType}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 font-medium">{job.description}</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</p>
                      <p className="text-sm font-bold text-slate-800">{job.client.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Worker</p>
                      <p className="text-sm font-bold text-slate-800">{job.worker.workerProfile?.businessName || job.worker.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex-grow">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Financials</p>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-slate-900 leading-none">₵{job.priceAmount || 'N/A'}</span>
                            {job.paymentId && <div className="p-1 bg-emerald-100 text-emerald-600 rounded-lg" title="Paid"><CreditCard size={12}/></div>}
                        </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex gap-2">
                 <button className="flex-grow py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all">
                    View Details
                 </button>
                 <button className="p-3 bg-slate-100 text-slate-400 hover:text-primary rounded-xl transition-all">
                    <MessageSquare size={18} />
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
