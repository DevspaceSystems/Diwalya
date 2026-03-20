'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ShieldCheck, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  UserSquare2, 
  FileCheck,
  Loader2,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import WorkerSidebar from '@/components/WorkerSidebar';
import MediaUpload from '@/components/ui/MediaUpload';

export default function WorkerVerificationPage() {
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { getWorkerProfile } = await import('@/app/actions/worker');
        const res = await getWorkerProfile(session.user.id);
        if (res.success) {
          setProfile(res.data);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const steps = [
    { id: 'IDENTITY', label: 'Identity Check', icon: CreditCard, description: 'Upload a valid government-issued ID (Ghana Card)', status: profile?.idCardUrl ? 'COMPLETED' : 'PENDING' },
    { id: 'FACIAL', label: 'Facial Recognition', icon: UserSquare2, description: 'AI face matching against your ID document', status: profile?.faceVerified ? 'COMPLETED' : 'PENDING' },
    { id: 'PROFESSIONAL', label: 'Professional Vetting', icon: FileCheck, description: 'Admin review of your skills and experience', status: profile?.isVerified ? 'COMPLETED' : 'PENDING' },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 pb-24">
      <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Trust & Verification</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Unlock your official trust badge</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-500 rounded-xl border border-blue-100">
             <ShieldCheck size={18} />
             <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/80">Secured with Diwalya Trust</span>
          </div>
      </div>
           {/* Verification Overview */}
           <div className={cn(
             "rounded-[3rem] p-10 shadow-xl relative overflow-hidden group transition-all duration-700",
             profile?.isVerified ? "bg-emerald-900 text-white shadow-emerald-900/20" : "bg-slate-900 text-white shadow-slate-900/20"
           )}>
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-colors" />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                 <div className={cn(
                   "w-28 h-28 rounded-[2rem] flex items-center justify-center shadow-2xl shrink-0 transition-transform group-hover:scale-110",
                   profile?.isVerified ? "bg-emerald-500 text-white" : "bg-primary text-white"
                 )}>
                    {profile?.isVerified ? <ShieldCheck size={56} /> : <ShieldAlert size={56} />}
                 </div>

                 <div className="text-center md:text-left">
                    <h2 className="text-4xl font-black tracking-tight mb-2">
                       {profile?.isVerified ? 'You are a Verified Pro' : 'Verification Required'}
                    </h2>
                    <p className="text-white/60 font-medium text-lg max-w-xl">
                       {profile?.isVerified
                        ? 'Congratulations! Your profile is prioritized in searches and carries the official trust badge.'
                        : 'Complete the steps below to unlock your verified badge and increase your booking rate by up to 300%.'}
                    </p>
                 </div>
              </div>
           </div>

           {/* Step Tracking */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((step, i) => (
                 <div key={step.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative group hover:shadow-xl hover:border-primary/20 transition-all duration-500">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm",
                      step.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-400"
                    )}>
                       <step.icon size={28} />
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                       <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">{step.label}</h3>
                       {step.status === 'COMPLETED' && <CheckCircle2 size={14} className="text-emerald-500" />}
                    </div>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">{step.description}</p>

                    <div className="flex items-center justify-between mt-auto">
                       <span className={cn(
                         "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                         step.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                       )}>
                          {step.status}
                       </span>
                       {step.status === 'PENDING' && (
                          <div className="w-6 h-6 rounded-full border-2 border-slate-100 flex items-center justify-center">
                             <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                          </div>
                       )}
                    </div>
                 </div>
              ))}
           </div>

           {/* Verification Tools */}
           {!profile?.isVerified && (
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                <div className="lg:col-span-3 space-y-8">
                   <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                      <h3 className="font-black text-2xl text-slate-900 mb-8 flex items-center gap-3">
                         <CreditCard className="text-primary" size={28} />
                         Identity Document
                      </h3>

                      <div className="space-y-6">
                         <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                            Please upload a clear photo of your <span className="text-slate-900 font-black">Ghana Card (Front & Back)</span>.
                            Ensure all details are legible and the photo is not blurry.
                         </p>

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-4">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ghana Card Front</p>
                               <MediaUpload 
                                  bucket="worker-documents"
                                  folder={`${user?.id}/gh-card-front`}
                                  onUploadComplete={async (urls: string[]) => {
                                     const url = urls[0];
                                     await supabase.from('WorkerProfile').update({ idCardUrl: url }).eq('userId', user?.id);
                                     window.location.reload();
                                  }}
                               />
                            </div>
                            <div className="space-y-4">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ghana Card Back</p>
                               <MediaUpload 
                                  bucket="worker-documents"
                                  folder={`${user?.id}/gh-card-back`}
                                  onUploadComplete={async (urls: string[]) => {
                                      // Potentially update another field or metadata
                                  }}
                               />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                   <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-900/10">
                      <h3 className="font-black text-xl mb-8 flex items-center gap-3">
                         <UserSquare2 className="text-primary" size={24} /> 
                         Selfie Verification
                      </h3>
                      <p className="text-white/40 text-sm font-medium leading-relaxed mb-10">
                         Take a live selfie to match your face against the ID document provided.
                      </p>
                      
                      <Link 
                        href="/onboarding?step=face-match"
                        className="w-full py-5 bg-white text-slate-900 font-black rounded-2xl shadow-xl hover:scale-[1.03] transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3 group"
                      >
                         Launch AI Face Match
                         <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </Link>

                      <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                         <div className="flex items-center gap-3 text-white/40 text-[10px] font-black uppercase tracking-widest">
                            <ShieldCheck size={14} className="text-primary" />
                            Secure biometric processing
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}
    </div>
  );
}
