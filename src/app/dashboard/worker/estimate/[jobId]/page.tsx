'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { submitJobEstimate, getJobEstimate } from '@/app/actions/booking';
import { prisma } from '@/lib/prisma'; // Note: client side prisma usage is discouraged, I'll use a server action if needed, but for now I'll use the job data I fetch
import { 
  Calculator, 
  Clock, 
  Construction, 
  DollarSign, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { formatGHS } from '@/lib/utils';
import Link from 'next/link';

export default function WorkerEstimatePage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    laborCost: 0,
    materialCost: 0,
    estimatedDuration: '',
    workerNotes: ''
  });

  const [existingEstimate, setExistingEstimate] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const result = await getJobEstimate(jobId);
      if (result.success && result.data) {
        setExistingEstimate(result.data);
        setForm({
          laborCost: result.data.laborCost,
          materialCost: result.data.materialCost,
          estimatedDuration: result.data.estimatedDuration,
          workerNotes: result.data.workerNotes || ''
        });
      }
      setLoading(false);
    }
    loadData();
  }, [jobId]);

  const totalCost = (Number(form.laborCost) || 0) + (Number(form.materialCost) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const result = await submitJobEstimate({
      jobId,
      laborCost: Number(form.laborCost),
      materialCost: Number(form.materialCost),
      estimatedDuration: form.estimatedDuration,
      workerNotes: form.workerNotes
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push('/dashboard/worker'), 3000);
    } else {
      setError(result.error || 'Failed to submit estimate');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Estimate Submitted!</h1>
        <p className="text-slate-500 max-w-md">Your estimate has been sent to the admin for review. You'll be notified once it's approved.</p>
        <Link href="/dashboard/worker" className="mt-8 text-primary font-bold flex items-center gap-2">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-2xl mx-auto px-6 pt-12">
        <Link href="/dashboard/worker" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-8 transition-colors">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>

        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calculator size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Submit Job Estimate</h1>
          <p className="text-slate-500 font-medium mt-1">Provide a detailed breakdown of the costs for this job.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100 mb-6">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="text-primary" size={20} />
              Cost Breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest block mb-2">Labor Cost (₵)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₵</div>
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    value={form.laborCost}
                    onChange={(e) => setForm({ ...form, laborCost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-widest block mb-2">Material Cost (₵)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₵</div>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    value={form.materialCost}
                    onChange={(e) => setForm({ ...form, materialCost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-2xl flex justify-between items-center text-white">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estimated Total Cost</p>
                <p className="text-3xl font-black">{formatGHS(totalCost)}</p>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Calculator size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Clock className="text-primary" size={20} />
              Timeline & Details
            </h2>

            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-widest block mb-2">Estimated Duration</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  required
                  type="text"
                  placeholder="e.g. 3-5 days, 2 hours"
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  value={form.estimatedDuration}
                  onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-700 uppercase tracking-widest block mb-2">Additional Notes (Optional)</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
                <textarea
                  rows={4}
                  placeholder="Break down materials or explain the work scope..."
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  value={form.workerNotes}
                  onChange={(e) => setForm({ ...form, workerNotes: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || totalCost <= 0 || !form.estimatedDuration}
            className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
          >
            {saving ? <Loader2 className="animate-spin" size={24} /> : <Construction size={24} />}
            {saving ? 'Submitting...' : existingEstimate ? 'Update Estimate' : 'Submit for Admin Review'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400 font-medium leading-relaxed px-10">
          Your estimate will be reviewed by the Diwalya admin team to ensure fairness and accuracy before being sent to the client.
        </p>
      </div>
    </div>
  );
}
