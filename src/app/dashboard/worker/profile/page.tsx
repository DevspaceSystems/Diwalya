'use client';

import React from 'react';
import Link from 'next/link';
import { 
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
  Image as LucideImage,
  ExternalLink,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import SupabaseImage from '@/components/ui/SupabaseImage';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Loading Profile...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Your Public Profile</h2>
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mt-1">This is how clients see you on the platform</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link 
              href={`/worker/${user?.id}`}
              target="_blank"
              className="flex-grow md:flex-none px-6 py-4 bg-white border border-gray-200 text-slate-700 font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
               <ExternalLink size={16} /> View Public View
            </Link>
            <Link 
              href="/dashboard/worker/settings"
              className="flex-grow md:flex-none px-6 py-4 bg-primary text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20"
            >
               <Edit3 size={16} /> Edit Profile
            </Link>
          </div>
      </div>

      {/* Profile Hero Card */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] pointer-events-none" />
        
        <div className="p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
          <div className="relative shrink-0">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2.5rem] bg-gray-100 border-4 border-white overflow-hidden shadow-2xl relative flex items-center justify-center">
              {profile?.profilePicture ? (
                <SupabaseImage 
                  src={profile.profilePicture} 
                  alt={profile?.displayName || user?.user_metadata?.full_name || 'Worker'} 
                  width={192}
                  height={192}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-4xl font-black text-primary select-none">
                  {(profile?.displayName || user?.user_metadata?.full_name || 'WK')
                    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            {profile?.isVerified && (
              <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2.5 rounded-2xl shadow-lg border-4 border-white">
                <ShieldCheck size={20} />
              </div>
            )}
          </div>

          <div className="flex-grow space-y-6 text-center md:text-left">
            <div>
              <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                  {user?.user_metadata?.full_name || 'Professional Worker'}
                </h1>
                {profile?.isVerified && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                    <ShieldCheck size={14} /> Verified Pro
                  </span>
                )}
              </div>
              <p className="text-xl md:text-2xl font-bold text-primary flex items-center justify-center md:justify-start gap-2">
                <Award size={24} className="text-secondary" /> {profile?.jobCategory || 'Expert Service Provider'}
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm">
                <MapPin size={16} className="text-primary" /> {profile?.location || 'Ghana'}
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm text-yellow-600">
                <Star size={16} className="fill-yellow-500 text-yellow-500" /> 5.0 Rating
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm text-emerald-600">
                <CheckCircle2 size={16} className="text-emerald-500" /> 100% Guaranteed
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-0 top-0 w-1 h-full bg-primary/10 rounded-full" />
              <p className="pl-6 text-slate-600 font-medium leading-relaxed max-w-3xl text-lg italic">
                "{profile?.bio || 'Professional artisan dedicated to providing high-quality service and exceptional craftsmanship. Ready to take on your next project with precision and care.'}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics & Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-8">
          {/* Performance Stats */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-900/10 border border-slate-800">
            <h3 className="font-black text-xl mb-8 flex items-center gap-3">
              <TrendingUp className="text-secondary" size={24} /> 
              Platform Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-default group">
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1 group-hover:text-slate-200">Response</p>
                <p className="font-black text-xl italic text-blue-400">Under 1hr</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-default group">
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1 group-hover:text-slate-200">Success</p>
                <p className="font-black text-xl text-emerald-400">98%</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-default group">
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1 group-hover:text-slate-200">Repeat</p>
                <p className="font-black text-xl text-amber-400">12+</p>
              </div>
              <div className="p-4 bg-primary text-white rounded-2xl shadow-lg shadow-blue-500/20">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Exp.</p>
                <p className="font-black text-xl">5+ Years</p>
              </div>
            </div>
          </div>

          {/* Availability Block */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm text-center md:text-left relative overflow-hidden">
            <div className="absolute -top-4 -right-4 bg-primary/5 p-8 rounded-full blur-2xl pointer-events-none" />
            <h3 className="font-black text-xl text-slate-900 mb-6 flex items-center justify-center md:justify-start gap-3 relative">
              <Clock className="text-primary" size={24} /> 
              Availability Status
            </h3>
            <div className="space-y-4 relative">
              <div className="flex items-center justify-between p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="font-black text-emerald-600 text-xs uppercase tracking-[0.2em]">Currently Accepting Jobs</span>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-slate-700 text-sm font-medium leading-relaxed">
                Most active between **8:00 AM** and **6:00 PM** daily. Ready for urgent inspections and estimates.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Portfolio Grid */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
              <h3 className="font-black text-2xl text-slate-900 flex items-center gap-3">
                <ImageIcon className="text-primary" size={28} /> 
                Showcase Portfolio
              </h3>
              <Link href="/dashboard/worker/portfolio" className="bg-gray-50 px-4 py-2 rounded-xl text-[10px] font-black text-slate-700 uppercase tracking-widest hover:text-primary hover:bg-primary/5 transition-all border border-gray-100">
                Manage Samples
              </Link>
            </div>

            {profile?.portfolioImages?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {profile.portfolioImages.slice(0, 4).map((img: string, i: number) => (
                  <div key={i} className="aspect-video rounded-3xl overflow-hidden group border border-gray-100 shadow-sm relative cursor-pointer">
                    <SupabaseImage 
                      src={img} 
                      alt={`Portfolio ${i}`} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                      <div className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest italic">
                        <CheckCircle2 size={14} className="text-emerald-400" /> Professional Finish
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-200 mb-4">
                  <LucideImage size={32} />
                </div>
                <p className="text-slate-700 font-bold text-sm tracking-tight mb-4">You haven't uploaded any work samples yet.</p>
                <Link href="/dashboard/worker/portfolio" className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Specializations */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-sm">
            <h3 className="font-black text-2xl text-slate-900 mb-8 flex items-center gap-3">
              <ShieldCheck className="text-primary" size={28} /> 
              Verified Specializations
            </h3>
            <div className="flex flex-wrap gap-3">
              {['Project Management', 'Site Inspection', 'Cost Estimation', 'Plumbing', 'Electrical Repair'].map((skill) => (
                <div key={skill} className="px-6 py-4 bg-gray-50 text-slate-900 font-black rounded-2xl border border-gray-100 text-xs uppercase tracking-widest shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-default flex items-center gap-2 group">
                  <div className="w-2 h-2 rounded-full bg-primary group-hover:scale-150 transition-transform" />
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
