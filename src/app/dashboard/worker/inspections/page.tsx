'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Search, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  DollarSign,
  Loader2,
  Briefcase
} from 'lucide-react';
import { cn, formatGHS } from '@/lib/utils';
export default function WorkerInspectionsPage() {
  const [inspections, setInspections] = React.useState<any[]>([]);
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
          // Filter only inspection type jobs that aren't cancelled
          const insp = jobsResult.data.filter((j: any) => j.type === 'INSPECTION' && j.status !== 'CANCELLED');
          setInspections(insp);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleRespond = async (jobId: string, response: 'ACCEPT' | 'REJECT') => {
     const { workerRespondToJob } = await import('@/app/actions/booking');
     const res = await workerRespondToJob(jobId, response);
     if (res.success) {
        window.location.reload();
     } else {
        alert(res.error || 'Failed to respond');
     }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Inspection Requests</h1>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Manage your service assessments</p>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100/50 shadow-sm">
          <Loader2 className="animate-spin text-primary mb-4" size={40} />
          <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Loading inspections...</p>
        </div>
      ) : inspections.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6">
            <Search size={40} className="text-gray-200" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">No Inspections Yet</h3>
          <p className="text-gray-400 font-bold text-sm max-w-xs mx-auto leading-relaxed">
            When you're assigned to inspect a client's site for an estimate, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-8">
          {inspections.map((insp) => (
            <div key={insp.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group duration-500">
               <div className="flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-gray-50">
                  {/* Left: Info */}
                  <div className="p-8 flex-grow">
                     <div className="flex items-center gap-3 mb-4">
                        <span className={cn(
                           "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                           insp.status === 'WORKER_REVIEW' ? "bg-red-50 text-red-600 animate-pulse" :
                           insp.status === 'ACCEPTED' ? "bg-blue-50 text-blue-600" :
                           "bg-gray-50 text-gray-500"
                        )}>
                           {insp.status.replace(/_/g, ' ')}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                           <Calendar size={12} /> Assigned: {new Date(insp.createdAt).toLocaleDateString()}
                        </span>
                     </div>
                     
                     <h3 className="text-2xl font-black text-slate-900 mb-2">{insp.serviceType} Inspection</h3>
                     <p className="text-slate-500 font-medium mb-6 line-clamp-2">{insp.description}</p>
                     
                     <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                           <MapPin size={16} className="text-primary" />
                           <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{insp.location}</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                           <Clock size={16} className="text-primary" />
                           <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{new Date(insp.scheduledAt).toLocaleString()}</span>
                        </div>
                     </div>
                  </div>

                  {/* Right: Actions & Fee */}
                  <div className="p-8 xl:w-72 bg-slate-50/50 flex flex-col justify-between items-center text-center">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Inspection Fee</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">
                           {formatGHS(insp.inspectionWorkerAmount || 100)}
                        </p>
                     </div>

                     <div className="w-full space-y-3 mt-8">
                        {insp.status === 'WORKER_REVIEW' ? (
                           <>
                              <button 
                                onClick={() => handleRespond(insp.id, 'ACCEPT')}
                                className="w-full py-4 bg-secondary text-white font-black rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                              >
                                Accept Inspection
                              </button>
                              <button 
                                onClick={() => handleRespond(insp.id, 'REJECT')}
                                className="w-full py-4 bg-white text-slate-400 font-black rounded-2xl border border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all text-xs uppercase tracking-widest"
                              >
                                Decline
                              </button>
                            </>
                        ) : insp.status === 'ACCEPTED' ? (
                            <Link 
                              href={`/dashboard/worker/estimate/${insp.id}`}
                              className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest block text-center"
                            >
                              Submit Estimate
                            </Link>
                        ) : (
                            <Link 
                              href={`/dashboard/worker/jobs/${insp.id}/progress`}
                              className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl border border-slate-200 hover:border-slate-300 transition-all text-xs uppercase tracking-widest block text-center"
                            >
                              View Details
                            </Link>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
