'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, CreditCard, ChevronRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
// Dynamically import PaystackButton to avoid "window is not defined" during SSR
const PaystackButton = dynamic(() => import('@/components/booking/PaystackButton'), { 
    ssr: false,
    loading: () => <div className="h-16 w-full animate-pulse bg-gray-100 rounded-2xl" />
});
import { supabase } from '@/lib/supabase';
import { createJob } from '@/app/actions/booking';
import { formatGHS } from '@/lib/utils';
import VoiceRecorder from '@/components/booking/VoiceRecorder';

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workerId } = use(params);
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  
  // Form States
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('Morning (8AM - 12PM)');
  const [location, setLocation] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);

  // Dynamic pricing system - no fixed fees.

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push(`/login?redirectTo=/booking/${workerId}`);
      }
      setUser(currentUser);
    };
    fetchUser();
  }, [router, workerId]);

  // config moved to PaystackButton component

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        setError('Please log in to continue');
        return;
    }
    setLoading(true);
    setError('');

    let audioUrl = '';
    if (audioBlob) {
      setUploading(true);
      const fileExt = audioBlob.type.split('/')[1] || 'webm';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `descriptions/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('diwalya-audio')
        .upload(filePath, audioBlob);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError('Failed to upload audio message. Please try again.');
        setLoading(false);
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('diwalya-audio')
        .getPublicUrl(filePath);
      
      audioUrl = publicUrl;
      setUploading(false);
    }

    const res = await createJob({
        clientId: user.id,
        workerId: workerId,
        serviceType: 'General Service', 
        description,
        location,
        scheduledAt: new Date(date),
        priceAmount: 0, // Price is determined after worker review/inspection
        audioUrl
    });

    if (res.success) {
        setJobId(res.jobId || null);
        setStep(3); // Skip payment, go straight to success
    } else {
        setError(res.error || 'Failed to initialize booking');
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/">
            <Image src="/diwalya-logo.png" alt="Diwalya Logo" width={140} height={35} className="object-contain" />
          </Link>
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-2 w-8 rounded-full ${step >= s ? 'bg-primary' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="font-bold">{error}</p>
            </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Book a Service</h1>
            <p className="text-gray-600 mb-8 font-medium">Tell us about the job you need help with.</p>

            <form onSubmit={handleCreateJob} className="space-y-6">
              <div>
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">Job Description</label>
                <textarea 
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all text-gray-900 font-medium"
                  placeholder="Describe what needs to be fixed or done..."
                ></textarea>
              </div>

              <VoiceRecorder onRecordingComplete={(blob) => setAudioBlob(blob)} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">Service Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="date" 
                        required 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all text-gray-900 font-medium" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">Preferred Time</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <select 
                        required 
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all appearance-none text-gray-900 font-medium"
                    >
                      <option>Morning (8AM - 12PM)</option>
                      <option>Afternoon (12PM - 4PM)</option>
                      <option>Evening (4PM - 7PM)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">Job Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    required 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Detailed address or landmark" 
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all text-gray-900 font-medium" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || uploading}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {loading || uploading ? <Loader2 className="animate-spin" /> : <>Submit Request <ChevronRight size={24} /></>}
              </button>
            </form>
          </div>
        )}


        {step === 3 && (
          <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100 text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 size={64} />
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-4">Request Sent!</h1>
            <p className="text-gray-600 text-lg mb-10 leading-relaxed font-medium">
              Your booking has been confirmed and payment received. The worker will be notified of your request immediately.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard/client" className="inline-block bg-primary text-white px-8 py-4 rounded-2xl font-black text-lg shadow-lg hover:scale-[1.05] transition-all">
                Go to Dashboard
              </Link>
              <Link href="/" className="inline-block bg-gray-50 text-gray-600 px-8 py-4 rounded-2xl font-bold">
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
