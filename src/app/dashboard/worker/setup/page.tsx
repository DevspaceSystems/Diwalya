'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Camera, MapPin, Briefcase, FileText, ArrowRight, CheckCircle2, Loader2, Upload, ChevronRight, Star, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { updateUserProfile } from '@/app/actions/user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WorkerSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      } else {
        router.push('/login');
      }
    };
    fetchUser();
  }, [router]);
  
  // Form State
  const [profilePicture, setProfilePicture] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('Skilled professional ready to provide high-quality services.');
  const [experience, setExperience] = useState(2);

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const res = await updateUserProfile(user.id, {
        name: user.user_metadata?.full_name || 'User',
        role: 'WORKER',
        profilePicture: profilePicture || user.user_metadata?.profilePicture,
        workerData: {
          businessName: user.user_metadata?.full_name || 'My Business',
          location: location,
          category: selectedCategory === 'other' ? customCategory : selectedCategory,
          bio: bio,
          experienceYears: experience,
        }
      });

      if (res.success) {
        setStep(4);
      } else {
        alert('Failed to save profile: ' + res.error);
      }
    } catch (error) {
      console.error('Setup Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center py-12 px-6 lg:px-8 selection:bg-orange-100">
      <div className="max-w-2xl w-full">
        {/* Branding & Progress */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image src="/diwalya-logo.png" alt="Diwalya Logo" width={160} height={40} className="object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-700 ease-in-out",
                  step === s ? "w-12 bg-secondary shadow-[0_0_15px_rgba(249,155,56,0.3)]" : 
                  step > s ? "w-6 bg-slate-900" : "w-6 bg-slate-100"
                )} 
              />
            ))}
            <span className="ml-4 text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Step 0{step}/03</span>
          </div>
        </div>

        {/* Step 1: Professional Details */}
        {step === 1 && (
          <div className="bg-white p-10 md:p-14 rounded-[3.5rem] border border-slate-100/60 shadow-[0_32px_64px_-16px_rgba(15,23,42,0.04)] animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="mb-10">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-secondary mb-6 shadow-sm">
                <Star size={24} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Professional Setup</h1>
              <p className="text-slate-700 font-bold leading-relaxed">Let's craft your identity on the platform to attract high-value clients.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-8">
              <div className="flex flex-col items-center mb-10">
                <div className="relative group">
                  <div className="w-40 h-40 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200 border-2 border-dashed border-slate-100 overflow-hidden group-hover:border-secondary transition-all duration-500 bg-gradient-to-br from-white to-slate-50 shadow-inner">
                    <Camera size={48} className="group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <button type="button" className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-4 rounded-3xl shadow-2xl hover:bg-secondary hover:-translate-y-1 transition-all duration-300">
                    <Upload size={20} />
                  </button>
                </div>
                <p className="text-center text-[10px] font-black text-slate-700 uppercase tracking-widest mt-6">Upload High-Res Portrait</p>
              </div>

              <div className="grid gap-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-[0.2em] mb-3 ml-2">Core Expertise</label>
                  <div className="relative group/field">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within/field:text-secondary transition-colors">
                      <Briefcase size={22} />
                    </div>
                    <select 
                      required 
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 bg-slate-50/50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-secondary/5 focus:border-secondary focus:bg-white focus:outline-none transition-all appearance-none font-bold text-slate-900 cursor-pointer"
                    >
                      <option value="">Choose your primary skill...</option>
                      <optgroup label="Skilled Tech & Creative">
                        <option>Mobile App Dev</option>
                        <option>Web Development</option>
                        <option>Graphic Designer</option>
                        <option>UI/UX Architect</option>
                      </optgroup>
                      <optgroup label="Skilled Trades">
                        <option>Automotive Engineer</option>
                        <option>Structural Electrician</option>
                        <option>Master Plumber</option>
                        <option>Furniture Architect</option>
                      </optgroup>
                      <optgroup label="Essential Services">
                        <option>Private Security</option>
                        <option>Landscape Artist</option>
                        <option>Property Maintenance</option>
                      </optgroup>
                      <option value="other">Other Unique Skill...</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                      <ChevronRight size={18} className="rotate-90" />
                    </div>
                  </div>
                </div>

                {selectedCategory === 'other' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-[0.2em] mb-3 ml-2">Specify Profession</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Interior Mural Artist" 
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-6 py-5 bg-slate-50/50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-secondary/5 focus:border-secondary focus:bg-white focus:outline-none transition-all font-bold text-slate-900" 
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-[0.2em] mb-3 ml-2">Service Radius / City</label>
                  <div className="relative group/field">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within/field:text-secondary transition-colors">
                      <MapPin size={22} />
                    </div>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Osu, Accra" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 bg-slate-50/50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-secondary/5 focus:border-secondary focus:bg-white focus:outline-none transition-all font-bold text-slate-900" 
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 mt-6 group">
                Continue to Verification <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Verification */}
        {step === 2 && (
          <div className="bg-white p-10 md:p-14 rounded-[3.5rem] border border-slate-100/60 shadow-[0_32px_64px_-16px_rgba(15,23,42,0.04)] animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="mb-10">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-6 shadow-sm">
                <ShieldCheck size={24} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Trust & Safety</h1>
              <p className="text-slate-700 font-bold leading-relaxed">Earn the <span className="text-blue-600 font-black italic">Verified Specialist</span> badge to unlock premium bookings.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-8">
              <div className="p-8 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-[2.5rem] border border-blue-100/50 flex gap-5 items-start">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                  <FileText size={24} />
                </div>
                <div>
                  <h4 className="font-black text-blue-900 text-lg mb-1 tracking-tight">Identity Document</h4>
                  <p className="text-blue-700/70 font-bold text-sm leading-relaxed">Please provide a high-resolution scan of your Ghana Card or Passport.</p>
                </div>
              </div>

              <div className="border-4 border-dashed border-slate-50 rounded-[3rem] p-16 text-center hover:border-secondary/30 transition-all duration-500 cursor-pointer group bg-slate-50/30 hover:bg-white">
                  <div className="w-20 h-20 bg-white text-slate-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:bg-secondary group-hover:text-white group-hover:scale-110 shadow-sm transition-all duration-500">
                    <Upload size={36} />
                  </div>
                  <p className="font-black text-slate-700 uppercase tracking-widest text-xs">Drop files or click to scan</p>
                  <p className="text-[10px] text-slate-600 font-bold mt-3 uppercase tracking-widest tracking-tighter">Maximum size 50MB (RAW, JPG, PDF)</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                 <button onClick={() => setStep(1)} type="button" className="flex-grow py-6 px-8 bg-slate-50 text-slate-700 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-colors">Previous</button>
                 <button type="submit" className="flex-[2] bg-slate-900 text-white py-6 px-8 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-1 transition-all duration-300 group">
                   Schedule Availability <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Availability */}
        {step === 3 && (
          <div className="bg-white p-10 md:p-14 rounded-[3.5rem] border border-slate-100/60 shadow-[0_32px_64px_-16px_rgba(15,23,42,0.04)] animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="mb-10">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 shadow-sm">
                <CheckCircle2 size={24} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Time Logic</h1>
              <p className="text-slate-700 font-bold leading-relaxed">Establish your operational hours to manage client expectations automatically.</p>
            </div>

            <form onSubmit={handleFinish} className="space-y-10">
               <div className="p-3 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 flex flex-wrap gap-2 justify-center">
                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                   <button 
                    key={day} 
                    type="button" 
                    className={cn(
                      "flex-1 min-w-[60px] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300",
                      ['Sat', 'Sun'].includes(day) ? "bg-white text-slate-400 border border-slate-100/50 hover:border-secondary hover:text-secondary" : "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                    )}
                   >
                     {day}
                   </button>
                 ))}
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-[0.2em] mb-4 ml-2">Operation Starts</label>
                    <div className="relative">
                      <input type="time" defaultValue="08:00" className="w-full px-6 py-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-secondary/5 focus:border-secondary focus:bg-white focus:outline-none transition-all font-black text-xl text-slate-900" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-[0.2em] mb-4 ml-2">Operation Ends</label>
                    <div className="relative">
                      <input type="time" defaultValue="18:00" className="w-full px-6 py-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-secondary/5 focus:border-secondary focus:bg-white focus:outline-none transition-all font-black text-xl text-slate-900" />
                    </div>
                  </div>
               </div>

               <div className="p-8 bg-gradient-to-r from-secondary/5 to-orange-50/50 rounded-[2.5rem] border border-secondary/10 relative overflow-hidden group">
                  <div className="relative z-10">
                    <h4 className="font-black text-secondary text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                       Insight ✨
                    </h4>
                    <p className="text-sm text-slate-600 font-bold leading-relaxed">
                      Specialists available over weekends maintain 42% higher retention and booking volume in your region.
                    </p>
                  </div>
                  <div className="absolute right-[-20px] top-[-20px] text-secondary/5 -rotate-12 transform group-hover:rotate-0 transition-transform duration-700">
                    <Star size={120} />
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => setStep(2)} type="button" className="flex-grow py-6 px-8 bg-slate-50 text-slate-700 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-colors">Previous</button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-[2] bg-secondary text-white py-6 px-8 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 shadow-[0_20px_40px_-12px_rgba(249,155,56,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <>Generate Professional Profile</>}
                  </button>
               </div>
            </form>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="bg-white p-14 md:p-20 rounded-[4rem] border border-slate-100/60 shadow-[0_48px_96px_-24px_rgba(15,23,42,0.06)] text-center animate-in zoom-in-95 duration-1000">
            <div className="w-32 h-32 bg-emerald-50 text-emerald-500 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
              <CheckCircle2 size={72} />
            </div>
            <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">Configuration Complete</h1>
            <p className="text-slate-700 text-lg font-bold mb-14 leading-relaxed max-w-sm mx-auto">
              Your specialist credentials have been submitted for priority verification. Experience the platform now.
            </p>
            <Link href="/dashboard/worker" className="inline-block bg-slate-900 text-white px-14 py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-slate-900/20 hover:scale-[1.05] hover:bg-slate-800 transition-all duration-500">
              Enter Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
