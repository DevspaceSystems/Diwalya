'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Briefcase, Wallet, Settings, Bell, Star, TrendingUp, DollarSign, Clock, CheckCircle2, MapPin, ArrowRight, Loader2, ShieldCheck, Image as ImageIcon, Calculator, Activity } from 'lucide-react';
import { cn, formatGHS } from '@/lib/utils';
import ChatWindow from '@/components/Chat/ChatWindow';
import NotificationBell from '@/components/ui/NotificationBell';
import WorkerSidebar from '@/components/WorkerSidebar';


export default function WorkerDashboard() {
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);
  const [workerProfile, setWorkerProfile] = React.useState<any>(null);
  const [wallet, setWallet] = React.useState<any>(null);
  const [activities, setActivities] = React.useState<any[]>([]);
  const [activeChat, setActiveChat] = React.useState<any>(null);

  React.useEffect(() => {
    async function loadData() {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { getWorkerJobs } = await import('@/app/actions/booking');
        const jobsResult = await getWorkerJobs(session.user.id);
        if (jobsResult.success && jobsResult.data) {
          setJobs(jobsResult.data);
        }

        // Fetch worker profile for verification status
        const { getWorkerProfile } = await import('@/app/actions/worker');
        const profileRes = await getWorkerProfile(session.user.id);
        if (profileRes.success) {
          setWorkerProfile(profileRes.data);
        }

        // Fetch wallet data
        const { getWalletData } = await import('@/app/actions/wallet');
        const walletRes = await getWalletData(session.user.id);
        if (walletRes.success) {
          setWallet(walletRes);
        }

        // Fetch recent activity
        const { supabase } = await import('@/lib/supabase');
        const { data: activityData } = await supabase
          .from('ActivityLog')
          .select('*')
          .eq('userId', session.user.id)
          .order('createdAt', { ascending: false })
          .limit(5);
        if (activityData) setActivities(activityData);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const stats = [
    { label: 'Completed Jobs', value: jobs.filter(j => j.status === 'COMPLETED').length.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Jobs', value: jobs.filter(j => j.status === 'ACCEPTED' || j.status === 'IN_PROGRESS').length.toString(), icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Req', value: jobs.filter(j => j.status === 'WORKER_REVIEW').length.toString(), icon: Bell, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Wallet Balance', value: formatGHS(wallet?.balance || 0), icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Command Center</h2>
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mt-1">Overview & Real-time Insights</p>
          </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
                <stat.icon size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
               <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* New Job Requests */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900">Job Requests</h3>
            {jobs.filter(j => j.status === 'WORKER_REVIEW').length > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded-full animate-pulse uppercase tracking-widest">
                {jobs.filter(j => j.status === 'WORKER_REVIEW').length} Urgent
              </span>
            )}
          </div>
          
          <div className="space-y-4">
             {loading ? (
               <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-gray-200">
                 <Loader2 className="animate-spin text-secondary mb-4" />
                 <p className="text-slate-700 font-bold uppercase tracking-widest text-xs">Loading jobs...</p>
               </div>
             ) : jobs.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-gray-200">
                  <Briefcase size={40} className="text-gray-200 mb-4" />
                  <p className="text-slate-700 font-bold uppercase tracking-widest text-xs">No jobs yet</p>
                </div>
             ) : (
              jobs.map((job) => {
                const isMasked = job.status === 'WORKER_REVIEW';
                return (
                  <div key={job.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-secondary/30 transition-all group overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-gray-800">
                            {isMasked ? <ShieldCheck size={32} className="text-primary/30" /> : <Briefcase size={32} />}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-black text-lg text-slate-900">
                                {isMasked ? 'Client Identity Protected' : job.client.name}
                              </h4>
                              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none">
                                {new Date(job.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-primary font-black mb-2 uppercase tracking-wide flex items-center gap-2">
                              {job.serviceType}
                              {isMasked && <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded text-primary">ADMIN VERIFIED</span>}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-700 font-bold">
                              <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                              <span className="flex items-center gap-1"><Clock size={12} /> {new Date(job.scheduledAt).toLocaleString()}</span>
                            </div>
                            {isMasked && (
                              <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                <p className="text-xs text-gray-700 italic leading-relaxed">
                                  "Admin: Worker summary provided. Please accept to reveal full details."
                                </p>
                              </div>
                            )}
                        </div>
                      </div>
                      
                      <div className="flex md:flex-col justify-between items-end gap-4 min-w-[120px]">
                        <p className="text-2xl font-black text-slate-900">{formatGHS(job.priceAmount)}</p>
                        {isMasked ? (
                          <div className="flex gap-2 w-full md:w-auto">
                            <button 
                              onClick={async () => {
                                const { workerRespondToJob } = await import('@/app/actions/booking');
                                await workerRespondToJob(job.id, 'ACCEPT');
                                window.location.reload();
                              }}
                              className="flex-grow md:flex-none px-6 py-3 bg-secondary text-white font-black rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all text-xs"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={async () => {
                                const { workerRespondToJob } = await import('@/app/actions/booking');
                                await workerRespondToJob(job.id, 'REJECT');
                                window.location.reload();
                              }}
                              className="px-4 py-3 bg-gray-50 text-slate-700 font-black rounded-xl hover:bg-red-50 hover:text-red-500 transition-all text-xs"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                           <span className={cn(
                             "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border",
                             job.status === 'ACCEPTED' ? "border-green-200 text-green-600 bg-green-50" : "border-gray-100 text-slate-700 bg-gray-50"
                           )}>
                             {job.status}
                           </span>
                         )}
                        {(job.status === 'ACCEPTED' || job.status === 'IN_PROGRESS' || job.status === 'ESTIMATE_SUBMITTED') && (
                          <div className="flex flex-col gap-2 w-full md:w-auto">
                            <Link 
                              href={`/dashboard/worker/jobs/${job.id}/progress`}
                              className="px-4 py-2 bg-slate-900 text-white font-black rounded-lg hover:bg-slate-800 transition-all text-xs text-center"
                            >
                              Update Progress
                            </Link>
                            <button 
                              onClick={() => setActiveChat(job)}
                              className="px-4 py-2 bg-primary/10 text-primary font-black rounded-lg hover:bg-primary hover:text-white transition-all text-xs"
                            >
                              Chat with Client
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
             )}
          </div>
        </div>

        {/* Quick Insights */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
              <h3 className="font-black text-slate-900 text-lg mb-6 text-left">Wallet Balance</h3>
              <div className="mb-8">
                 <p className="text-5xl font-black text-slate-900 mb-2">{formatGHS(wallet?.balance || 0)}</p>
                 <p className="text-green-500 font-bold text-sm flex items-center justify-center gap-1">
                   <TrendingUp size={14} /> +12% this week
                 </p>
              </div>
              <Link href="/dashboard/worker/wallet" className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all block text-sm">
                Withdraw Earnings
              </Link>
           </div>

        </div>
      </div>

      {/* Chat Window */}
      {activeChat && (
        <ChatWindow 
          jobId={activeChat.id}
          senderId={user?.id}
          recipientName={activeChat.client?.name || 'Client'}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
}
