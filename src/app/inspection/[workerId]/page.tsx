'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PaystackButton } from 'react-paystack';
import { createInspectionRequest } from '@/app/actions/booking';
import { getSettings } from '@/app/actions/settings';
import { supabase } from '@/lib/supabase';
import { formatGHS } from '@/lib/utils';
import { ClipboardCheck, MapPin, Calendar, MessageSquare, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';

interface Props {
  params: Promise<{ workerId: string }>;
}

export default function RequestInspectionPage({ params }: Props) {
  const { workerId } = React.use(params);
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    serviceType: '',
    description: '',
    location: '',
    scheduledAt: '',
  });

  useEffect(() => {
    async function init() {
      const [{ data: { user } }, settingsRes] = await Promise.all([
        supabase.auth.getUser(),
        getSettings()
      ]);
      setUser(user);
      if (settingsRes.success) setSettings(settingsRes.data);
      setLoading(false);
    }
    init();
  }, []);

  const handlePaystackSuccess = async (ref: any) => {
    if (!user || !settings) return;
    setError('');
    try {
      const result = await createInspectionRequest({
        clientId: user.id,
        workerId,
        serviceType: form.serviceType,
        description: form.description,
        location: form.location,
        scheduledAt: new Date(form.scheduledAt),
      });

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => router.push('/bookings'), 3000);
      } else {
        throw new Error(result.error || 'Failed to create inspection');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isFormValid = form.serviceType && form.description && form.location && form.scheduledAt;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={36} />
    </div>
  );

  if (!user) {
    router.push('/login?redirect=/inspection/' + workerId);
    return null;
  }

  if (isSuccess) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
        <CheckCircle2 size={40} />
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-2">Inspection Requested!</h1>
      <p className="text-gray-700 max-w-md">Your inspection has been booked and payment confirmed. Our team will assign a worker shortly.</p>
    </div>
  );

  const fee = settings?.inspectionFee ?? 100;
  const workerShare = settings?.inspectionWorkerShare ?? 60;
  const platformShare = fee - workerShare;

  const paystackConfig = {
    reference: `inspection-${Date.now()}`,
    email: user.email,
    amount: fee * 100, // Paystack uses pesewas
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    text: `Pay ${formatGHS(fee)} for Inspection`,
    onSuccess: handlePaystackSuccess,
    onClose: () => {},
    className: `w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all ${!isFormValid ? 'opacity-50 pointer-events-none' : ''}`,
    disabled: !isFormValid,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-12">
      <div className="max-w-xl mx-auto px-6">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Request an Inspection</h1>
          <p className="text-gray-700 font-medium mt-1">A professional will visit your site before providing a full quote.</p>
        </div>

        {/* Fee Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-blue-900 mb-1">Fixed Inspection Fee: {formatGHS(fee)}</p>
              <p className="text-sm text-blue-700">The assigned worker will receive {formatGHS(workerShare)} for the site visit. The platform retains {formatGHS(platformShare)} as a service fee.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100 mb-4">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 space-y-5">
          <div>
            <label className="text-xs font-black text-gray-700 uppercase tracking-widest block mb-1.5">Type of Work Needed</label>
            <input
              required
              type="text"
              placeholder="e.g. Electrical fault, Plumbing inspection"
              className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary"
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-black text-gray-700 uppercase tracking-widest block mb-1.5">Describe the Problem</label>
            <textarea
              required
              rows={3}
              placeholder="Tell the worker what needs to be inspected..."
              className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-gray-700 uppercase tracking-widest block mb-1.5">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" size={16} />
                <input
                  required
                  type="text"
                  placeholder="Your address..."
                  className="w-full pl-9 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-black text-gray-700 uppercase tracking-widest block mb-1.5">Preferred Date & Time</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" size={16} />
                <input
                  required
                  type="datetime-local"
                  className="w-full pl-9 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <PaystackButton {...paystackConfig} />
          </div>
        </div>
      </div>
    </div>
  );
}
