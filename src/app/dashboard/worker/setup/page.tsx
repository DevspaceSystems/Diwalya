'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Camera, MapPin, Briefcase, FileText, ArrowRight, CheckCircle2, Loader2, Upload } from 'lucide-react';

export default function WorkerSetupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(4);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="flex justify-between items-center mb-12">
          <Link href="/">
            <Image src="/diwalya-logo.png" alt="Diwalya Logo" width={140} height={35} className="object-contain" />
          </Link>
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-2 w-12 rounded-full transition-all duration-500 ${step >= s ? 'bg-secondary' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Setup Your Profile</h1>
            <p className="text-gray-500 mb-8">Let's start with your professional details.</p>

            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
              <div className="flex justify-center mb-8">
                <div className="relative group">
                  <div className="w-32 h-32 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 overflow-hidden">
                    <Camera size={40} />
                  </div>
                  <button type="button" className="absolute -bottom-2 -right-2 bg-secondary text-white p-2 rounded-xl shadow-lg hover:scale-110 transition-transform">
                    <Upload size={16} />
                  </button>
                  <p className="text-center text-xs font-bold text-gray-400 mt-2">Add Profile Photo</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">Your Skill Category</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <select 
                    required 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-secondary focus:outline-none transition-all appearance-none"
                  >
                    <option value="">Select your main skill...</option>
                    <optgroup label="Skilled Professionals">
                      <option>Electrician</option>
                      <option>Plumber</option>
                      <option>Carpenter</option>
                      <option>Mechanic</option>
                      <option>Photographer</option>
                      <option>Mobile App Dev</option>
                      <option>Graphic Designer</option>
                    </optgroup>
                    <optgroup label="Daily Essentials / Unskilled">
                      <option>Delivery Rider</option>
                      <option>Professional Cleaner</option>
                      <option>Security Guard</option>
                      <option>Gardener</option>
                      <option>Laundry Service</option>
                      <option>General Labor / Loader</option>
                    </optgroup>
                    <option value="other">Other...</option>
                  </select>
                </div>
              </div>

              {selectedCategory === 'other' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">Please specify your skill</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="What is your profession?" 
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-secondary focus:outline-none transition-all" 
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">Location (e.g. Sunyani Airport)</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="text" required placeholder="Where do you work?" className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-secondary focus:outline-none transition-all" />
                </div>
              </div>

              <button type="submit" className="w-full bg-secondary text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:scale-[1.01] transition-all">
                Next: Verification <ArrowRight size={24} />
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-right-4">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Identity Verification</h1>
            <p className="text-gray-500 mb-8">To earn the <span className="text-blue-500 font-bold">Verified Badge</span>, we need to verify your ID.</p>

            <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-6">
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 mb-6">
                <div className="flex gap-4">
                  <FileText className="text-blue-500 shrink-0" size={24} />
                  <div>
                    <h4 className="font-bold text-blue-900">National ID Card</h4>
                    <p className="text-sm text-blue-700">Please upload a clear photo of your Ghana Card or Voter's ID.</p>
                  </div>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center hover:border-secondary transition-colors cursor-pointer group">
                  <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary group-hover:text-white transition-all">
                    <Upload size={32} />
                  </div>
                  <p className="font-bold text-gray-400">Click or drag photo here</p>
                  <p className="text-xs text-gray-300 mt-2">JPG, PNG or PDF (Max 5MB)</p>
              </div>

              <div className="flex gap-4 pt-4">
                 <button onClick={() => setStep(1)} type="button" className="flex-grow py-5 bg-gray-50 text-gray-500 rounded-2xl font-bold">Back</button>
                 <button type="submit" className="flex-[2] bg-secondary text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
                   Next: Availability <ArrowRight size={24} />
                 </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-right-4">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Your Availability</h1>
            <p className="text-gray-500 mb-8">When are you available for bookings?</p>

            <form onSubmit={handleFinish} className="space-y-6">
               <div className="grid grid-cols-4 gap-3">
                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                   <button key={day} type="button" className="py-3 border-2 border-primary bg-primary/5 text-primary rounded-xl font-bold">
                     {day}
                   </button>
                 ))}
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">Work Starts</label>
                    <input type="time" defaultValue="08:00" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-secondary focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">Work Ends</label>
                    <input type="time" defaultValue="18:00" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-secondary focus:outline-none transition-all" />
                  </div>
               </div>

               <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
                  <h4 className="font-bold text-orange-900 mb-1">Expert Tip 💡</h4>
                  <p className="text-sm text-orange-700">Workers available on weekends often get 40% more job requests.</p>
               </div>

               <button type="submit" disabled={loading} className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                  {loading ? <Loader2 className="animate-spin" /> : <>Finish & Go to Dashboard</>}
               </button>
            </form>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white p-12 rounded-3xl shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 size={64} />
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-4">You're All Set!</h1>
            <p className="text-gray-500 text-lg mb-10 leading-relaxed max-w-sm mx-auto">
              Your profile is being reviewed. You can now start receiving job requests and managing your profile.
            </p>
            <Link href="/dashboard/worker" className="inline-block bg-primary text-white px-10 py-5 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.05] transition-all">
              Launch Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
