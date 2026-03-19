'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Briefcase, Wallet, Settings, Bell, Star, TrendingUp, DollarSign, Clock, CheckCircle2, MapPin, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { cn, formatGHS } from '@/lib/utils';
import ChatWindow from '@/components/Chat/ChatWindow';


export default function WorkerDashboard() {
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);
  const [workerProfile, setWorkerProfile] = React.useState<any>(null);
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
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const stats = [
    { label: 'Total Earnings', value: formatGHS(0), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Jobs', value: jobs.filter(j => j.status === 'ACCEPTED').length.toString(), icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg Rating', value: '5.0', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Incoming', value: jobs.filter(j => j.status === 'WORKER_REVIEW').length.toString(), icon: Bell, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-slate-900 text-slate-400 flex flex-col">
        <div className="p-8">
          <Link href="/">
             <div className="bg-white p-2 rounded-lg inline-block">
                <Image src="/diwalya-logo.png" alt="Diwalya" width={120} height={30} className="object-contain" />
             </div>
          </Link>
        </div>
        
        <nav className="flex-grow px-4 space-y-2">
          <Link href="/dashboard/worker" className="flex items-center gap-3 px-4 py-3 bg-secondary text-white rounded-xl font-bold transition-all">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/dashboard/worker/jobs" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <Briefcase size={20} /> My Jobs
          </Link>
          <Link href="/dashboard/worker/wallet" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <Wallet size={20} /> Earnings
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <Link href="/dashboard/worker/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <Settings size={20} /> Profile Settings
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow">
        <header className="bg-white border-b h-20 flex items-center justify-between px-8 sticky top-0 z-40">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Worker Dashboard</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Status: <span className="text-green-500">Online & Accepting Jobs</span></p>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-secondary transition-colors">
              <Bell size={24} />
              {jobs.some(j => j.status === 'WORKER_REVIEW') && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-ping"></span>
              )}
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-gray-900">{user?.user_metadata?.full_name || 'Worker'}</p>
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-widest flex items-center justify-end gap-1",
                  workerProfile?.isVerified ? "text-blue-500" : "text-gray-400"
                )}>
                  {workerProfile?.isVerified ? (
                    <><CheckCircle2 size={12} /> Verified Pro</>
                  ) : (
                    <><Clock size={12} /> Unverified Pro</>
                  )}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-black text-xl border-2 border-secondary/20 overflow-hidden">
                {user?.user_metadata?.profilePicture ? (
                  <Image src={user.user_metadata.profilePicture} alt="Profile" width={48} height={48} className="object-cover" />
                ) : (
                  user?.user_metadata?.full_name?.charAt(0) || 'W'
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                    <stat.icon size={20} />
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-3xl font-black text-gray-900`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* New Job Requests */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-gray-900">Job Requests</h3>
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
                     <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading jobs...</p>
                   </div>
                 ) : jobs.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-gray-200">
                      <Briefcase size={40} className="text-gray-200 mb-4" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No jobs yet</p>
                    </div>
                 ) : (
                  jobs.map((job) => {
                    const isMasked = job.status === 'WORKER_REVIEW';
                    return (
                      <div key={job.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-secondary/30 transition-all group overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          <div className="flex gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-gray-300">
                                {isMasked ? <ShieldCheck size={32} className="text-primary/30" /> : <Briefcase size={32} />}
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-black text-lg text-gray-900">
                                    {isMasked ? 'Client Identity Protected' : job.client.name}
                                  </h4>
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                                    {new Date(job.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-primary font-black mb-2 uppercase tracking-wide flex items-center gap-2">
                                  {job.serviceType}
                                  {isMasked && <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded text-primary">ADMIN VERIFIED</span>}
                                </p>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-bold">
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
                            <p className="text-2xl font-black text-gray-900">{formatGHS(job.priceAmount)}</p>
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
                                  className="px-4 py-3 bg-gray-50 text-gray-400 font-black rounded-xl hover:bg-red-50 hover:text-red-500 transition-all text-xs"
                                >
                                  Decline
                                </button>
                              </div>
                            ) : (
                               <span className={cn(
                                 "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border",
                                 job.status === 'ACCEPTED' ? "border-green-200 text-green-600 bg-green-50" : "border-gray-100 text-gray-400 bg-gray-50"
                               )}>
                                 {job.status}
                               </span>
                             )}
                            {job.status === 'ACCEPTED' && (
                              <button 
                                onClick={() => setActiveChat(job)}
                                className="px-4 py-2 bg-primary/10 text-primary font-black rounded-lg hover:bg-primary hover:text-white transition-all text-xs"
                              >
                                Chat with Client
                              </button>
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
                  <h3 className="font-black text-gray-900 text-lg mb-6 text-left">Wallet Balance</h3>
                  <div className="mb-8">
                     <p className="text-5xl font-black text-gray-900 mb-2">{formatGHS(1820)}</p>
                     <p className="text-green-500 font-bold text-sm flex items-center justify-center gap-1">
                       <TrendingUp size={14} /> +12% this week
                     </p>
                  </div>
                  <Link href="/dashboard/worker/wallet" className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all block">
                    Withdraw Earnings
                  </Link>
               </div>

               <div className="bg-slate-900 p-8 rounded-3xl text-white">
                  <h3 className="font-black text-lg mb-4">Improve Ranking</h3>
                  {workerProfile?.verificationStatus === 'APPROVED' ? (
                    <div className="space-y-4">
                      <p className="text-slate-400 text-sm leading-relaxed">
                        Your account is <span className="text-blue-400 font-bold">Verified</span>. Your profile is prioritized in search results.
                      </p>
                      <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-blue-500/30">
                         <ShieldCheck className="text-blue-400" size={24} />
                         <span className="font-black text-sm uppercase tracking-widest text-blue-400">Verified Pro Badge Active</span>
                      </div>
                    </div>
                  ) : workerProfile?.verificationStatus === 'PENDING' ? (
                    <div className="space-y-4">
                      <p className="text-slate-400 text-sm leading-relaxed">
                        Verification request <span className="text-orange-400 font-bold">Under Review</span>. Admins will verify your identity shortly.
                      </p>
                      <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-orange-500/30">
                         <Clock className="text-orange-400" size={24} />
                         <span className="font-black text-sm uppercase tracking-widest text-orange-400">Awaiting Admin Check</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Complete your profile verification by requesting an ID check to unlock the <span className="text-blue-400 font-bold">Verified Badge</span> and get 3x more bookings.
                      </p>
                      <button 
                        onClick={async () => {
                          const { requestVerification } = await import('@/app/actions/worker');
                          await requestVerification(user.id);
                          window.location.reload();
                        }}
                        className="w-full flex items-center justify-between bg-white/10 p-4 rounded-2xl hover:bg-white/20 transition-all group"
                      >
                         <span className="font-bold">Request Identity Check</span>
                         <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </>
                  )}
               </div>
            </div>
          </div>
        </div>
      </main>

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
