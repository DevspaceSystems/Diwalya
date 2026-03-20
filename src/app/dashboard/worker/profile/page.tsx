'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  User, 
  Star, 
  MapPin, 
  Briefcase, 
  Clock, 
  Edit3, 
  ImageIcon, 
  CheckCircle2, 
  Loader2,
  Calendar,
  ShieldCheck,
  TrendingUp,
  Image as LucideImage
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import WorkerSidebar from '@/components/WorkerSidebar';

export default function WorkerProfilePage() {
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Public Profile</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Manage your professional presence</p>
          </div>
          <Link 
            href="/dashboard/worker/settings"
            className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10"
          >
             <Edit3 size={16} /> Edit Profile
          </Link>
      </div>
           {/* Profile Header Card */}
           <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />
              
              <div className="flex flex-col md:flex-row gap-10 relative z-10">
                 <div className="w-40 h-40 rounded-[2.5rem] bg-slate-100 border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50 shrink-0">
                    {profile?.profilePicture ? (
                       <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                       <User size={80} className="text-slate-300 m-auto mt-6" />
                    )}
                 </div>

                 <div className="flex-grow space-y-6">
                    <div>
                       <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-4xl font-black text-slate-900 tracking-tight">{user?.user_metadata?.full_name || 'Professional'}</h2>
                          {profile?.isVerified && (
                             <span className="p-1 px-2.5 bg-blue-50 text-blue-500 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                <ShieldCheck size={14} /> Verified Pro
                             </span>
                          )}
                       </div>
                       <p className="text-lg font-black text-primary uppercase tracking-[0.15em] flex items-center gap-2">
                          <Briefcase size={20} /> {profile?.jobCategory || 'Expert Service Provider'}
                       </p>
                    </div>

                    <div className="flex flex-wrap gap-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                       <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"><MapPin size={16} className="text-primary" /> {profile?.location || 'Ghana'}</span>
                       <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"><Star size={16} className="text-amber-400" /> 5.0 Rating</span>
                       <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"><CheckCircle2 size={16} className="text-emerald-500" /> 100% Guaranteed</span>
                    </div>

                    <p className="text-slate-500 font-medium leading-relaxed max-w-2xl text-lg italic">
                       "{profile?.bio || 'Professional artisan dedicated to providing high-quality service and exceptional craftsmanship. Ready to take on your next project with precision and care.'}"
                    </p>
                 </div>
              </div>
           </div>

           {/* Details Grid */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Left Col: Badges & Info */}
              <div className="lg:col-span-1 space-y-10">
                 <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-900/10">
                    <h3 className="font-black text-xl mb-8 flex items-center gap-3">
                       <TrendingUp className="text-primary" size={24} /> 
                       Performance
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Response Time</p>
                          <p className="font-black text-xl italic">Under 1hr</p>
                       </div>
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Completion Rate</p>
                          <p className="font-black text-xl">98%</p>
                       </div>
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Repeat Clients</p>
                          <p className="font-black text-xl">12+</p>
                       </div>
                       <div className="p-4 bg-primary text-white rounded-2xl">
                          <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Experience</p>
                          <p className="font-black text-xl">5+ Years</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                       <Calendar size={64} className="text-slate-900" />
                    </div>
                    <h3 className="font-black text-xl text-slate-900 mb-6 flex items-center gap-3">
                       <Clock className="text-primary" size={24} /> 
                       Availability
                    </h3>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <span className="font-black text-emerald-600 text-[10px] uppercase tracking-widest">Currently Open</span>
                          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                       </div>
                       <p className="text-slate-500 text-sm font-medium leading-relaxed px-2">
                          Available for new projects starting this week. Most active between 8:00 AM and 6:00 PM.
                       </p>
                    </div>
                 </div>
              </div>

              {/* Right Col: Portfolio & Skills */}
              <div className="lg:col-span-2 space-y-10">
                 <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="font-black text-2xl text-slate-900 flex items-center gap-3">
                          <ImageIcon className="text-primary" size={28} /> 
                          Portfolio
                       </h3>
                       <Link href="/dashboard/worker/portfolio" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">
                          Manage Work Samples
                       </Link>
                    </div>

                    {profile?.portfolioImages?.length > 0 ? (
                       <div className="grid grid-cols-2 gap-6">
                          {profile.portfolioImages.slice(0, 4).map((img: string, i: number) => (
                             <div key={i} className="aspect-video rounded-[2rem] overflow-hidden group border border-slate-100 shadow-sm relative">
                                <img src={img} alt={`Work ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                   <p className="text-white font-black text-xs uppercase tracking-widest italic">Verified Completed Work</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="py-20 flex flex-col items-center justify-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                          <LucideImage size={48} className="text-slate-200 mb-4" />
                          <p className="text-slate-400 font-bold text-sm">Upload your portfolio to build trust!</p>
                       </div>
                    )}
                 </div>

                 <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                    <h3 className="font-black text-2xl text-slate-900 mb-8 flex items-center gap-3">
                       <ShieldCheck className="text-primary" size={28} /> 
                       Skills & Specializations
                    </h3>
                    <div className="flex flex-wrap gap-4">
                       {['Plumbing', 'Electrical Repair', 'Project Management', 'Site Inspection', 'Cost Estimation'].map((skill) => (
                          <span key={skill} className="px-6 py-3.5 bg-slate-50 text-slate-900 font-black rounded-2xl border border-slate-100 text-xs uppercase tracking-widest shadow-sm hover:shadow-lg transition-all cursor-default">
                             {skill}
                          </span>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
    </div>
  );
}
