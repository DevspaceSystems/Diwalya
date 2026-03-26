'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Briefcase, Clock, Wallet, Settings, Search, Star, MessageSquare, Loader2, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatGHS, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { getClientJobs } from '@/app/actions/booking';
import NotificationBell from '@/components/ui/NotificationBell';

export default function ClientDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace('/login');
      setUser(session.user);
      
      const res = await getClientJobs(session.user.id);
      if (res.success) setJobs(res.data || []);
      setLoading(false);
    }
    load();
  }, [router]);

  const stats = [
    { label: 'Quotes & Inspections', value: jobs.filter(j => j.status === 'ESTIMATE_SUBMITTED' || j.status === 'INSPECTION_REQUESTED').length.toString(), color: 'text-primary', bg: 'bg-blue-50' },
    { label: 'Ongoing Jobs', value: jobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'ACCEPTED').length.toString(), color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Done', value: jobs.filter(j => j.status === 'COMPLETED').length.toString(), color: 'text-green-500', bg: 'bg-green-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="w-full lg:w-64 bg-slate-900 border-r flex flex-col">
        <div className="p-8">
          <Link href="/">
             <div className="bg-white p-2 rounded-lg inline-block">
                <Image src="/diwalya-logo.png" alt="Diwalya" width={120} height={30} className="object-contain" />
             </div>
          </Link>
        </div>
        <nav className="flex-grow px-4 space-y-2">
          <Link href="/dashboard/client" className="flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/search" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-white/5 rounded-xl font-bold transition-all">
            <Search size={20} /> Find Workers
          </Link>
          <Link href="/dashboard/client/jobs" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-white/5 rounded-xl font-bold transition-all">
            <Briefcase size={20} /> My Bookings
          </Link>
          <Link href="/dashboard/client/wallet" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-white/5 rounded-xl font-bold transition-all">
            <Wallet size={20} /> Escrow Wallet
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <Link href="/dashboard/client/settings" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-white/5 rounded-xl font-bold transition-all">
            <Settings size={20} /> Account Settings
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow">
        <header className="bg-white border-b h-20 flex items-center justify-between px-8 sticky top-0 z-40">
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-none">Client Dashboard</h1>
            <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mt-1">Hello, {user?.user_metadata?.full_name || 'Mark'}!</p>
          </div>
          <div className="flex items-center gap-6">
            <NotificationBell />
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary border-2 border-primary/20 text-xl">
              {user?.user_metadata?.full_name?.charAt(0) || 'M'}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
                <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2">{stat.label}</p>
                <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Recent Bookings */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-gray-900 text-2xl tracking-tight">Active Bookings</h3>
                <Link href="/dashboard/client/jobs" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">See history</Link>
              </div>

              <div className="space-y-4">
                {loading ? (
                   <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-dashed border-gray-200">
                     <Loader2 className="animate-spin text-primary mb-4" />
                     <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Fetching your bookings...</p>
                   </div>
                ) : jobs.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-dashed border-gray-200 text-center px-8">
                     <Briefcase size={40} className="text-gray-100 mb-4" />
                     <p className="text-lg font-black text-gray-900 mb-2">No active bookings</p>
                     <p className="text-xs text-gray-700 font-bold uppercase tracking-widest mb-6">Start your first project in minutes.</p>
                     <Link href="/search" className="px-8 py-4 bg-primary text-white font-black rounded-2xl">Find Experts Now</Link>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-primary/20 transition-all group relative overflow-hidden">
                       {job.status === 'ESTIMATE_SUBMITTED' && (
                         <div className="absolute top-0 right-0 p-4">
                            <span className="bg-primary text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Quote Received</span>
                         </div>
                       )}

                       {job.status === 'INSPECTION_REQUESTED' && (
                         <div className="absolute top-0 right-0 p-4">
                            <span className="bg-amber-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Inspection Proposed</span>
                         </div>
                       )}
                       
                       {job.status === 'COMPLETED' && (
                         <div className="absolute top-0 right-0 p-4">
                            <span className="bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Action Required</span>
                         </div>
                       )}
                       
                       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div className="flex items-center gap-6">
                             <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0 font-black text-2xl overflow-hidden border-2 border-gray-50">
                                {job.worker?.profilePicture ? (
                                  <img src={job.worker.profilePicture} alt={job.worker.name} className="w-full h-full object-cover" />
                                ) : (
                                  job.worker?.name?.charAt(0) || 'W'
                                )}
                             </div>
                             <div>
                                <h4 className="font-black text-gray-900 text-xl tracking-tight leading-none mb-2">{job.serviceType}</h4>
                                <p className="text-xs font-bold text-gray-700 flex items-center gap-4 mb-4 uppercase tracking-widest">
                                   <span>Pro: {job.worker?.name}</span>
                                   <span className="flex items-center gap-1 font-black"><Clock size={12} /> {new Date(job.createdAt).toLocaleDateString()}</span>
                                </p>
                                 <div className="flex flex-wrap gap-2">
                                   <span className={cn(
                                     "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                                     job.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                     job.status === 'ESTIMATE_SUBMITTED' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                     job.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                     "bg-gray-50 text-gray-700 border-gray-100"
                                   )}>
                                      {job.status.replace(/_/g, ' ')}
                                   </span>
                                   {job.type === 'INSPECTION' && (
                                     <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900 text-white border border-slate-900">
                                        Inspection Only
                                     </span>
                                   )}
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                             <p className="text-2xl font-black text-gray-900 leading-none">{formatGHS(job.priceAmount || 0)}</p>
                             <div className="flex gap-2 w-full md:w-auto">
                                <Link 
                                  href={job.status === 'ESTIMATE_SUBMITTED' ? `/dashboard/client/jobs/${job.id}/estimate` : `/dashboard/client/jobs/${job.id}/track`}
                                  className={cn(
                                    "px-6 py-3 font-black rounded-xl text-xs flex-grow md:flex-none text-center shadow-lg transition-all active:scale-95",
                                    job.status === 'ESTIMATE_SUBMITTED' ? "bg-primary text-white shadow-primary/20" :
                                    job.status === 'COMPLETED' ? "bg-emerald-600 text-white shadow-emerald-600/20" : "bg-slate-900 text-white shadow-slate-900/20"
                                  )}
                                >
                                  {job.status === 'ESTIMATE_SUBMITTED' ? 'Review Quote' : 
                                   job.status === 'COMPLETED' ? 'Confirm & Release' : 'Track Progress'}
                                </Link>
                                <button className="p-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                                   <MessageSquare size={18} />
                                </button>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Support / Quick Actions */}
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-2 tracking-tight">Support Policy</h3>
                    <p className="text-slate-700 text-sm font-bold leading-relaxed mb-6">Your payments are held in escrow for your safety. Only release funds if you are 100% satisfied.</p>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 font-black text-[10px]">24h</div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Mediation Window</p>
                       </div>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -translate-y-12 translate-x-12 blur-3xl group-hover:bg-primary/30 transition-all"></div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 text-lg mb-6 tracking-tight">Upcoming Inspection</h3>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center gap-4">
                   <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Search size={24} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Scheduled</p>
                      <p className="font-black text-gray-900 text-sm italic tracking-tight leading-none mt-1">Tomorrow, 10:00 AM</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
