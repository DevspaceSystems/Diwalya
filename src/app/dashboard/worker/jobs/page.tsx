'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Briefcase, Wallet, Settings, Bell, Star, TrendingUp, DollarSign, Clock, CheckCircle2, MapPin, ArrowRight, Loader2, ShieldCheck, ChevronLeft, Image as ImageIcon, Search, Filter, History } from 'lucide-react';
import { cn, formatGHS } from '@/lib/utils';
import WorkerSidebar from '@/components/WorkerSidebar';

export default function WorkerJobsPage() {
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState('ACTIVE');

  React.useEffect(() => {
    async function loadData() {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { getWorkerJobs } = await import('@/app/actions/booking');
        const jobsResult = await getWorkerJobs(session.user.id);
        if (jobsResult.success && jobsResult.data) {
          setJobs(jobsResult.data);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredJobs = jobs.filter(job => {
    switch (activeTab) {
      case 'PENDING': return job.status === 'WORKER_REVIEW' || (job.status === 'PENDING' && job.type === 'REGULAR');
      case 'INSPECTION': return job.type === 'INSPECTION' && job.status !== 'COMPLETED' && job.status !== 'CANCELLED';
      case 'ACTIVE': return job.status === 'ACCEPTED' || job.status === 'IN_PROGRESS' || job.status === 'ESTIMATE_SUBMITTED';
      case 'COMPLETED': return job.status === 'COMPLETED';
      case 'CANCELLED': return job.status === 'CANCELLED';
      default: return true;
    }
  });

  const tabs = [
    { id: 'PENDING', label: 'Pending', icon: Bell, count: jobs.filter(j => j.status === 'WORKER_REVIEW').length },
    { id: 'INSPECTION', label: 'Inspections', icon: Search, count: jobs.filter(j => j.type === 'INSPECTION' && j.status !== 'COMPLETED').length },
    { id: 'ACTIVE', label: 'Active', icon: TrendingUp, count: jobs.filter(j => j.status === 'ACCEPTED' || j.status === 'IN_PROGRESS').length },
    { id: 'COMPLETED', label: 'Completed', icon: CheckCircle2, count: jobs.filter(j => j.status === 'COMPLETED').length },
    { id: 'CANCELLED', label: 'Cancelled', icon: History, count: jobs.filter(j => j.status === 'CANCELLED').length },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Job Management</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Track & Manage your workload</p>
          </div>
      </div>
          {/* Tabs Navigation */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-x-auto no-scrollbar sticky top-24 z-30">
             {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap",
                    activeTab === tab.id 
                      ? "bg-primary text-white shadow-lg shadow-blue-500/20" 
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  )}
                >
                  <tab.icon size={14} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={cn(
                      "ml-1 px-2 py-0.5 rounded-full text-[10px] font-black",
                      activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
             ))}
          </div>

          <div className="space-y-6">
             {loading ? (
                <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100/50 shadow-sm">
                  <div className="relative">
                    <Loader2 className="animate-spin text-primary" size={48} />
                    <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
                  </div>
                  <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] mt-8">Fetching jobs...</p>
                </div>
             ) : filteredJobs.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
                  <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6">
                    <Briefcase size={40} className="text-gray-200" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">No {activeTab.toLowerCase()} jobs found</h3>
                  <p className="text-gray-400 font-bold text-sm max-w-xs mx-auto leading-relaxed">
                    Once you have jobs in this status, they will appear here for you to manage.
                  </p>
                </div>
             ) : (
                <div className="grid gap-6">
                   {filteredJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((job) => (
                      <div key={job.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group relative overflow-hidden">
                         {/* Status Bar */}
                         <div className={cn(
                           "absolute left-0 top-0 bottom-0 w-1.5",
                           job.status === 'COMPLETED' ? "bg-emerald-500" :
                           job.status === 'ACCEPTED' ? "bg-blue-500" :
                           job.status === 'WORKER_REVIEW' ? "bg-red-500" : "bg-gray-200"
                         )} />

                         <div className="flex flex-col md:flex-row justify-between gap-8">
                            <div className="flex gap-6">
                               <div className={cn(
                                 "w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 shadow-sm",
                                 job.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-500" : "bg-blue-50 text-blue-500"
                               )}>
                                  {job.type === 'INSPECTION' ? <Search size={36} /> : <Briefcase size={36} />}
                               </div>
                               <div>
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h4 className="font-black text-xl text-gray-900 tracking-tight">{job.serviceType}</h4>
                                    <span className={cn(
                                       "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                                       job.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                       job.status === 'ACCEPTED' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                       job.status === 'WORKER_REVIEW' ? "bg-red-50 text-red-600 border-red-100 animate-pulse" :
                                       "bg-gray-50 text-gray-500 border-gray-100"
                                    )}>
                                      {job.status.replace(/_/g, ' ')}
                                    </span>
                                    {job.type === 'INSPECTION' && (
                                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900 text-white border border-slate-900">
                                        INSPECTION JOB
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-900 font-black text-sm mb-4">Client: {job.client?.name || 'Protected Identity'}</p>
                                  <div className="flex flex-wrap items-center gap-6 text-[11px] text-gray-400 font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-2"><MapPin size={14} className="text-primary" /> {job.location}</span>
                                    <span className="flex items-center gap-2"><Clock size={14} className="text-primary" /> {new Date(job.scheduledAt).toLocaleDateString()}</span>
                                  </div>
                               </div>
                            </div>

                            <div className="flex md:flex-col justify-between items-end gap-6 min-w-[160px] border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                               <div className="text-right">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Fee</p>
                                  <p className="text-3xl font-black text-gray-900 tracking-tight">{formatGHS(job.priceAmount)}</p>
                               </div>
                               <Link 
                                 href={job.status === 'WORKER_REVIEW' ? `/dashboard/worker` : `/dashboard/worker/jobs/${job.id}/progress`}
                                 className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest text-center"
                               >
                                 {job.status === 'WORKER_REVIEW' ? 'Review Offer' : 'Manage Job'}
                               </Link>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
    </div>
  );
}
