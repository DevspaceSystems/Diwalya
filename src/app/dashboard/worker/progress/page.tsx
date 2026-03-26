'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Activity, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  MapPin,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import { cn, formatGHS } from '@/lib/utils';
export default function WorkerProgressOverviewPage() {
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    async function loadData() {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { getWorkerJobs } = await import('@/app/actions/booking');
        const jobsResult = await getWorkerJobs(session.user.id);
        if (jobsResult.success && jobsResult.data) {
          // Filter active jobs (ACCEPTED or IN_PROGRESS or ESTIMATE_SUBMITTED)
          const active = jobsResult.data.filter((j: any) => 
            j.status === 'ACCEPTED' || j.status === 'IN_PROGRESS' || j.status === 'ESTIMATE_SUBMITTED'
          );
          setJobs(active);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const calculateProgress = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 10;
      case 'ESTIMATE_SUBMITTED': return 30;
      case 'IN_PROGRESS': return 65;
      case 'COMPLETED': return 100;
      default: return 0;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Progress Tracking</h1>
        <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mt-0.5">Monitor your active project milestones</p>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <Loader2 className="animate-spin text-primary mb-4" size={40} />
          <p className="text-gray-700 font-black uppercase tracking-widest text-[10px]">Loading active projects...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6">
            <TrendingUp size={40} className="text-gray-200" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">No Active Projects</h3>
          <p className="text-gray-700 font-bold text-sm max-w-xs mx-auto leading-relaxed">
            Start a new job to track its progress and milestones here.
          </p>
        </div>
      ) : (
        <div className="grid gap-10">
          {jobs.map((job) => {
            const progress = calculateProgress(job.status);
            return (
              <div key={job.id} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden">
                <div className="flex flex-col xl:flex-row justify-between gap-10">
                   <div className="flex-grow space-y-8">
                      <div>
                         <div className="flex items-center gap-3 mb-3">
                            <span className={cn(
                               "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border",
                               job.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-600 border-blue-100" :
                               "bg-amber-50 text-amber-600 border-amber-100"
                            )}>
                               {job.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none">
                               ID: {job.id.slice(0, 8)}
                            </span>
                         </div>
                         <h3 className="text-3xl font-black text-slate-900">{job.serviceType}</h3>
                         <p className="text-slate-700 font-bold mt-2 flex items-center gap-2">
                            <MapPin size={16} className="text-primary" /> {job.location}
                         </p>
                      </div>

                      {/* Progress Bar Section */}
                      <div className="space-y-4">
                         <div className="flex justify-between items-end">
                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Project Maturity</p>
                            <p className="text-3xl font-black text-primary">{progress}%</p>
                         </div>
                         <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200 p-0.5">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-500/20"
                              style={{ width: `${progress}%` }}
                            />
                         </div>
                         <div className="flex justify-between pt-2">
                            {['Initialized', 'Estimated', 'Execution', 'Completion'].map((step, i) => (
                              <div key={step} className="flex flex-col items-center">
                                 <div className={cn(
                                   "w-3 h-3 rounded-full mb-2 border-2",
                                   progress >= (i * 33) ? "bg-primary border-primary shadow-[0_0_10px_rgba(37,99,235,0.4)]" : "bg-white border-slate-200"
                                 )} />
                                 <span className={cn(
                                   "text-[9px] font-black uppercase tracking-tight",
                                   progress >= (i * 33) ? "text-slate-900" : "text-slate-300"
                                 )}>{step}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="xl:w-80 flex flex-col justify-between items-stretch gap-6 border-t xl:border-t-0 xl:border-l border-slate-100 pt-10 xl:pt-0 xl:pl-10">
                      <div className="space-y-6">
                         <div className="flex items-center gap-3">
                            <Activity size={20} className="text-slate-600" />
                            <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest">Summary</h4>
                         </div>
                         <p className="text-slate-700 text-xs leading-relaxed font-medium">
                            This project is currently in the <span className="text-slate-900 font-black">{job.status}</span> phase. 
                            Keep updating your progress to ensure client transparency.
                         </p>
                         <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Next Milestone</span>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Completion</span>
                         </div>
                      </div>

                      <Link 
                        href={`/dashboard/worker/jobs/${job.id}/progress`}
                        className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/10 hover:scale-[1.03] active:scale-[0.98] transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3 group"
                      >
                         Submit Progress Update
                         <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
