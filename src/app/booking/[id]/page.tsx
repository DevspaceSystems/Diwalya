'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, CreditCard, ChevronRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import { supabase } from '@/lib/supabase';
import { createJob } from '@/app/actions/booking';
import { formatGHS } from '@/lib/utils';

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

  // Fixed price for now (should ideally fetch from worker profile)
  const serviceFee = 150;
  const platformCommission = serviceFee * 0.05;
  const totalToPay = serviceFee + platformCommission;

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

  const config = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || '',
    amount: Math.round(totalToPay * 100), // Paystack amount in pesewas
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    currency: 'GHS',
  };

  const initializePayment = usePaystackPayment(config);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        setError('Please log in to continue');
        return;
    }
    setLoading(true);
    setError('');

    const res = await createJob({
        clientId: user.id,
        workerId: workerId,
        serviceType: 'General Service', 
        description,
        location,
        scheduledAt: new Date(date),
        priceAmount: totalToPay
    });

    if (res.success) {
        setJobId(res.jobId || null);
        setStep(2);
    } else {
        setError(res.error || 'Failed to initialize booking');
    }
    setLoading(false);
  };

  const onSuccess = (reference: any) => {
    setLoading(true);
    verifyPayment(reference.reference);
  };

  const onClose = () => {
    console.log('Paystack popup closed');
  };

  const verifyPayment = async (paystackReference: string) => {
    try {
        const res = await fetch('/api/paystack/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reference: paystackReference,
                jobId,
                workerId,
                totalAmount: totalToPay
            })
        });
        const data = await res.json();
        if (data.success) {
            setStep(3);
        } else {
            setError(data.error || 'Payment verification failed');
        }
    } catch (err: any) {
        setError('Something went wrong during verification');
    } finally {
        setLoading(false);
    }
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
            <p className="text-gray-500 mb-8">Tell us about the job you need help with.</p>

            <form onSubmit={handleCreateJob} className="space-y-6">
              <div>
                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2">Job Description</label>
                <textarea 
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  placeholder="Describe what needs to be fixed or done..."
                ></textarea>
              </div>

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
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
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
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all appearance-none"
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
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Continue to Payment <ChevronRight size={24} /></>}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 animate-in fade-in slide-in-from-right-4">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Secure Payment</h1>
            <p className="text-gray-500 mb-8">Payment is held securely until the job is completed.</p>

            <div className="bg-primary/5 p-6 rounded-2xl mb-8 border border-primary/10">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-600">Service Fee</span>
                <span className="font-black text-gray-900 text-xl">{formatGHS(serviceFee)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Platform Commission (5%)</span>
                <span>{formatGHS(platformCommission)}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-primary/10 flex justify-between items-center">
                <span className="font-black text-primary">Total to Pay</span>
                <span className="font-black text-primary text-2xl">{formatGHS(totalToPay)}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border-2 border-primary bg-primary/5 rounded-2xl flex flex-col items-center gap-2">
                  <span className="font-black text-primary">Paystack Checkout</span>
                  <div className="flex gap-1 h-4">
                    <div className="w-4 h-4 rounded-full bg-blue-500" />
                    <div className="w-4 h-4 rounded-full bg-yellow-400" />
                  </div>
                </div>
                <div className="p-4 border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 opacity-50">
                    <CreditCard size={24} />
                    <span className="text-xs font-bold uppercase">Secured by Paystack</span>
                </div>
              </div>

              <button 
                onClick={() => {
                    setError('');
                    // @ts-ignore
                    initializePayment(onSuccess, onClose);
                }}
                disabled={loading}
                className="w-full bg-secondary text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Pay & Confirm Booking</>}
              </button>

              <button 
                onClick={() => setStep(1)}
                className="w-full py-4 text-gray-500 font-bold hover:text-gray-700 transition-all"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100 text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 size={64} />
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-4">Request Sent!</h1>
            <p className="text-gray-500 text-lg mb-10 leading-relaxed">
              Your booking has been confirmed and payment received. Kwame will be notified of your request immediately.
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
