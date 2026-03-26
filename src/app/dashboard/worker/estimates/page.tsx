'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Calculator, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  DollarSign, 
  Loader2,
  AlertCircle,
  MapPin
} from 'lucide-react';
import { cn, formatGHS } from '@/lib/utils';
export default function WorkerEstimatesPage() {
  const [estimates, setEstimates] = React.useState<any[]>([]);
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
          const est = jobsResult.data.filter((j: any) => 
            j.status === 'ESTIMATE_SUBMITTED' || 
            (j.status === 'ACCEPTED' && j.type === 'REGULAR' && j.priceAmount > 0)
          );
          setEstimates(est);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Estimate Management</h1>
        <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mt-0.5">Track your submitted cost proposals</p>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <Loader2 className="animate-spin text-primary mb-4" size={40} />
          <p className="text-gray-700 font-black uppercase tracking-widest text-[10px]">Fetching your estimates...</p>
        </div>
      ) : estimates.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6">
            <Calculator size={40} className="text-gray-200" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">No Estimates Yet</h3>
          <p className="text-gray-700 font-bold text-sm max-w-xs mx-auto leading-relaxed">
            Choose an inspection job and submit your first estimate to see it here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {estimates.map((est) => (
            <div key={est.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
               <div className="absolute right-[-20px] top-[-20px] opacity-5 group-hover:scale-110 transition-transform duration-700">
                  <Calculator size={150} className="text-slate-900" />
               </div>

               <div className="flex flex-col xl:flex-row justify-between gap-8 relative z-10">
                  <div className="flex-grow">
                     <div className="flex items-center gap-3 mb-4">
                        <span className={cn(
                           "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                           est.status === 'ESTIMATE_SUBMITTED' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                           est.status === 'ACCEPTED' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                           "bg-gray-50 text-slate-700 border border-gray-100"
                        )}>
                           {est.status === 'ESTIMATE_SUBMITTED' ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                           {est.status === 'ESTIMATE_SUBMITTED' ? 'Awaiting Review' : 'Estimate Approved'}
                        </span>
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                           Submitted: {new Date(est.createdAt).toLocaleDateString()}
                        </span>
                     </div>

                     <h3 className="text-2xl font-black text-slate-900 mb-2">{est.serviceType} Project</h3>
                     <p className="text-slate-700 font-bold mb-6 flex items-center gap-2">
                       <MapPin size={16} className="text-primary" /> {est.location}
                     </p>

                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-1">Labor Cost</p>
                           <p className="font-black text-slate-900">{formatGHS(est.priceAmount * 0.4)}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-1">Materials</p>
                           <p className="font-black text-slate-900">{formatGHS(est.priceAmount * 0.6)}</p>
                        </div>
                        <div className="p-4 bg-primary text-white rounded-2xl shadow-lg shadow-blue-500/10">
                           <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Total Quote</p>
                           <p className="font-black text-xl">{formatGHS(est.priceAmount)}</p>
                        </div>
                        <div className="p-4 bg-slate-900 text-white rounded-2xl">
                           <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Status</p>
                           <p className="font-black text-xs uppercase tracking-tighter truncate">{est.status}</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col justify-center items-end gap-3 min-w-[180px]">
                     {est.status === 'ESTIMATE_SUBMITTED' ? (
                       <>
                          <Link 
                            href={`/dashboard/worker/estimate/${est.id}`}
                            className="w-full py-4 bg-slate-100 text-slate-900 font-black rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <Edit3 size={16} /> Edit Estimate
                          </Link>
                          <div className="w-full p-4 bg-blue-50 rounded-2xl border border-blue-100">
                             <p className="text-[10px] text-blue-600 font-black leading-tight text-center">
                               Admins are currently reviewing this proposal.
                             </p>
                          </div>
                       </>
                     ) : (
                       <Link 
                         href={`/dashboard/worker/jobs/${est.id}/progress`}
                         className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg shadow-slate-900/10 hover:scale-[1.03] transition-all text-xs uppercase tracking-widest block text-center"
                       >
                         Manage active project
                       </Link>
                     )}
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
