'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, 
  MapPin, 
  Calendar, 
  MessageSquare, 
  Coins, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { createSpecialRequest } from '@/app/actions/special-request';
import { supabase } from '@/lib/supabase';

export default function SpecialRequestPage() {
  const [formData, setFormData] = useState({
    serviceType: '',
    description: '',
    location: '',
    preferredTime: '',
    budget: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/special-request');
        return;
      }

      const result = await createSpecialRequest({
        userId: user.id,
        serviceType: formData.serviceType,
        description: formData.description,
        location: formData.location,
        preferredTime: new Date(formData.preferredTime),
        budget: formData.budget ? parseFloat(formData.budget) : undefined
      });

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => router.push('/bookings'), 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Request Submitted!</h1>
        <p className="text-gray-500 max-w-md mb-8">
          Our team has received your request. We'll find the best professional for you and contact you shortly.
        </p>
        <button 
          onClick={() => router.push('/bookings')}
          className="bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          View My Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-12">
      <div className="max-w-xl mx-auto px-6">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Need a Hand?</h1>
          <p className="text-gray-500 font-medium">Tell us what you need, and we'll find the perfect pro for you.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="bg-primary p-8 text-white">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Wrench size={24} /> Special Labor Request
            </h2>
            <p className="text-primary-light text-sm mt-1 opacity-90 font-medium">Quick matching with verified professionals</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Type of Work</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Wrench size={18} />
                </div>
                <input 
                  required
                  type="text"
                  placeholder="e.g. Electrician, Moving Service, Deep Cleaning"
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-primary focus:border-primary text-sm font-bold placeholder-gray-400"
                  value={formData.serviceType}
                  onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Describe Your Needs</label>
              <div className="relative">
                <div className="absolute top-4 left-4 text-gray-400">
                  <MessageSquare size={18} />
                </div>
                <textarea 
                  required
                  rows={4}
                  placeholder="Tell us exactly what you need done..."
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-primary focus:border-primary text-sm font-bold placeholder-gray-400"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Location</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <MapPin size={18} />
                  </div>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. East Legon, Accra"
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-primary focus:border-primary text-sm font-bold placeholder-gray-400"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Preferred Time</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Calendar size={18} />
                  </div>
                  <input 
                    required
                    type="datetime-local"
                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-primary focus:border-primary text-sm font-bold text-gray-900"
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Budget (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Coins size={18} />
                </div>
                <input 
                  type="number"
                  placeholder="₵ How much are you offering?"
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-primary focus:border-primary text-sm font-bold placeholder-gray-400 text-gray-900"
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 mt-4"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Submit Request <ArrowRight size={22} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
