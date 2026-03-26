'use client';

import React, { useState, useEffect } from 'react';
import { getInspections, assignInspectionWorker, verifyInspection, adminReviewEstimate } from '@/app/actions/booking';
import { getWorkers } from '@/app/actions/user';
import { supabase } from '@/lib/supabase';
import { formatGHS } from '@/lib/utils';
import {
  ClipboardCheck, UserCheck, ShieldCheck, Clock, MapPin, User,
  Loader2, CheckCircle2, AlertCircle, Users, ArrowRight, CheckCheck,
  FileText, XCircle, CheckCircle, Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-orange-50 text-orange-600 border-orange-100',
  ACCEPTED: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  IN_PROGRESS: 'bg-blue-50 text-blue-600 border-blue-100',
  COMPLETED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  CANCELLED: 'bg-red-50 text-red-600 border-red-100',
};

export default function AdminInspectionsPage() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [assignModal, setAssignModal] = useState<{ open: boolean; jobId: string } | null>(null);
  const [reviewModal, setReviewModal] = useState<{ open: boolean; job: any } | null>(null);
  const [assignForm, setAssignForm] = useState({ workerId: '', teamMember: '' });
  const [reviewForm, setReviewForm] = useState({ approved: true, adminNotes: '' });
  const [saving, setSaving] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    loadData();
  }, [filter]);

  async function loadData() {
    setLoading(true);
    const [inspRes, workersRes] = await Promise.all([
      getInspections(filter || undefined),
      getWorkers()
    ]);
    if (inspRes.success) setInspections(inspRes.data || []);
    if ((workersRes as any)?.success) setWorkers((workersRes as any).data || []);
    setLoading(false);
  }

  const handleAssign = async () => {
    if (!assignModal || !assignForm.workerId) return;
    setSaving(assignModal.jobId);
    const result = await assignInspectionWorker(
      assignModal.jobId,
      assignForm.workerId,
      assignForm.teamMember || undefined
    );
    if (result.success) {
      setAssignModal(null);
      setAssignForm({ workerId: '', teamMember: '' });
      loadData();
    }
    setSaving(null);
  };

  const handleVerify = async (jobId: string) => {
    setSaving(jobId);
    const result = await verifyInspection(jobId);
    if (result.success) loadData();
    setSaving(null);
  };

  const handleReview = async () => {
    if (!reviewModal || !user) return;
    setSaving(reviewModal.job.id);
    const result = await adminReviewEstimate(
      user.id,
      reviewModal.job.id,
      reviewForm.approved,
      reviewForm.adminNotes
    );
    if (result.success) {
      setReviewModal(null);
      setReviewForm({ approved: true, adminNotes: '' });
      loadData();
    }
    setSaving(null);
  };

  const statCounts = {
    pending: inspections.filter(i => i.status === 'PENDING').length,
    inProgress: inspections.filter(i => i.status === 'IN_PROGRESS').length,
    completed: inspections.filter(i => i.status === 'COMPLETED').length,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1 flex items-center gap-3">
            <ClipboardCheck className="text-primary" />
            Inspections
          </h1>
          <p className="text-slate-700 font-medium text-sm">Manage all platform inspection requests.</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          {[['', 'All'], ['PENDING', 'Pending'], ['IN_PROGRESS', 'Confirmed'], ['COMPLETED', 'Verified']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-black transition-all',
                filter === val ? 'bg-primary text-white shadow-md' : 'text-slate-700 hover:text-slate-700'
              )}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pending Assignment', value: statCounts.pending, color: 'text-orange-500', bg: 'bg-orange-50', icon: Clock },
          { label: 'Awaiting Verification', value: statCounts.inProgress, color: 'text-blue-500', bg: 'bg-blue-50', icon: ShieldCheck },
          { label: 'Completed & Verified', value: statCounts.completed, color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle2 },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center gap-4 shadow-sm">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', bg)}>
              <Icon className={color} size={22} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{value}</p>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center items-center py-24"><Loader2 className="animate-spin text-primary" size={36} /></div>
      ) : inspections.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
          <ClipboardCheck className="text-slate-200 mx-auto mb-4" size={56} />
          <p className="text-slate-700 font-bold uppercase tracking-widest text-sm">No inspections found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inspections.map((insp) => (
            <div key={insp.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden border-l-4 border-l-slate-200 hover:border-l-primary transition-all">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Status & Service */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={cn('text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border', STATUS_COLORS[insp.status] || 'bg-slate-50 text-slate-700 border-slate-100')}>
                        {insp.status.replace('_', ' ')}
                      </span>
                      {insp.isInspectionVerified && (
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                          <CheckCheck size={12} /> Admin Verified
                        </span>
                      )}
                      {insp.estimate && (
                        <span className={cn(
                          'text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border flex items-center gap-1',
                          insp.estimate.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          insp.estimate.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-indigo-50 text-indigo-600 border-indigo-100'
                        )}>
                          <FileText size={12} /> Estimate: {insp.estimate.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-slate-900">{insp.serviceType}</h3>

                    <div className="flex flex-wrap gap-4 mt-3 text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1"><User size={13} /> Client: {insp.client?.name}</span>
                      <span className="flex items-center gap-1"><UserCheck size={13} /> Worker: {insp.worker?.name || <span className="text-orange-500">Unassigned</span>}</span>
                      <span className="flex items-center gap-1"><MapPin size={13} /> {insp.location}</span>
                      {insp.assignedTeamMember && (
                        <span className="flex items-center gap-1"><Users size={13} /> Team: {insp.assignedTeamMember}</span>
                      )}
                    </div>
                    {insp.inspectionNotes && (
                      <p className="mt-2 text-xs text-slate-700 bg-slate-50 rounded-lg px-3 py-2 font-medium">{insp.inspectionNotes}</p>
                    )}
                  </div>

                  {/* Fee */}
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-black text-slate-900">{formatGHS(insp.priceAmount || 0)}</p>
                    <div className="text-xs text-slate-700 font-bold mt-1 space-y-0.5">
                      <p>Worker: {formatGHS(insp.inspectionWorkerAmount || 0)}</p>
                      <p>Platform: {formatGHS(insp.inspectionAdminAmount || 0)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    {insp.status === 'PENDING' && (
                      <button
                        onClick={() => setAssignModal({ open: true, jobId: insp.id })}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-1.5"
                      >
                        <UserCheck size={14} /> Assign
                      </button>
                    )}
                    {insp.status === 'IN_PROGRESS' && !insp.isInspectionVerified && (
                      <button
                        onClick={() => handleVerify(insp.id)}
                        disabled={saving === insp.id}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-1.5 disabled:opacity-70"
                      >
                        {saving === insp.id ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                        Verify & Pay
                      </button>
                    )}
                    {insp.estimate && insp.estimate.status === 'PENDING_REVIEW' && (
                      <button
                        onClick={() => setReviewModal({ open: true, job: insp })}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-1.5"
                      >
                        <Calculator size={14} /> Review Estimate
                      </button>
                    )}
                  </div>
                </div>

                {/* Estimate Summary if exists */}
                {insp.estimate && (
                  <div className={cn(
                    "mt-6 p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6",
                    insp.estimate.status === 'APPROVED' ? "bg-emerald-50/50 border-emerald-100" :
                    insp.estimate.status === 'REJECTED' ? "bg-red-50/50 border-red-100" : "bg-indigo-50/50 border-indigo-100"
                  )}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full md:w-auto">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-700">Labor</p>
                        <p className="text-sm font-black text-slate-900">{formatGHS(insp.estimate.laborCost)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-700">Materials</p>
                        <p className="text-sm font-black text-slate-900">{formatGHS(insp.estimate.materialCost)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-700">Duration</p>
                        <p className="text-sm font-black text-slate-900">{insp.estimate.estimatedDuration}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-primary/60">Total Project Quote</p>
                        <p className="text-lg font-black text-primary">{formatGHS(insp.estimate.totalCost)}</p>
                      </div>
                    </div>
                    {insp.estimate.workerNotes && (
                      <div className="w-full md:w-auto md:max-w-xs md:border-l md:border-slate-200 md:pl-6">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-700">Worker Notes</p>
                        <p className="text-[11px] font-medium text-slate-600 italic">"{insp.estimate.workerNotes}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="border-t border-slate-50 px-6 py-3 flex flex-wrap gap-6 text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-slate-50/30">
                <span className="flex items-center gap-1.5"><Clock size={12} /> Filed: {new Date(insp.createdAt).toLocaleDateString()}</span>
                {insp.workerConfirmedAt && <span className="text-indigo-400 flex items-center gap-1.5"><CheckCircle2 size={12} /> Confirmed: {new Date(insp.workerConfirmedAt).toLocaleDateString()}</span>}
                {insp.adminVerifiedAt && <span className="text-emerald-500 flex items-center gap-1.5"><ShieldCheck size={12} /> Verified: {new Date(insp.adminVerifiedAt).toLocaleDateString()}</span>}
                {insp.estimate?.reviewedAt && <span className="text-primary flex items-center gap-1.5"><Calculator size={12} /> Reviewed: {new Date(insp.estimate.reviewedAt).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Modal */}
      {assignModal?.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl p-10 w-full max-w-md animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <UserCheck size={24} />
              </div>
              Assign Worker
            </h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 mb-2 block">Available Workers</label>
                <select
                  value={assignForm.workerId}
                  onChange={(e) => setAssignForm({ ...assignForm, workerId: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none"
                >
                  <option value="">Choose a professional...</option>
                  {workers.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name} – {w.workerProfile?.category || 'Worker'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 mb-2 block">Team Member Escort (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Ama from Diwalya"
                  value={assignForm.teamMember}
                  onChange={(e) => setAssignForm({ ...assignForm, teamMember: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setAssignModal(null)} className="flex-1 py-4 text-slate-700 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!assignForm.workerId || !!saving}
                  className="flex-[2] py-4 bg-primary text-white rounded-2xl text-sm font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal?.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setReviewModal(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-lg animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Calculator size={24} />
              </div>
              Review Estimate
            </h2>
            
            <div className="bg-slate-900 p-8 rounded-3xl mb-8 text-white">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-slate-700 font-bold text-xs uppercase tracking-widest">
                  <span>Labor Breakdown</span>
                  <span className="text-white text-base">{formatGHS(reviewModal.job.estimate.laborCost)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 font-bold text-xs uppercase tracking-widest">
                  <span>Material Costs</span>
                  <span className="text-white text-base">{formatGHS(reviewModal.job.estimate.materialCost)}</span>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between items-end">
                  <span className="text-primary font-black text-sm uppercase tracking-[0.2em]">Total Quote</span>
                  <span className="text-3xl font-black text-white">{formatGHS(reviewModal.job.estimate.totalCost)}</span>
                </div>
              </div>
              
              <div className="mt-6 flex items-center gap-3 text-xs font-bold text-slate-600 bg-white/5 p-3 rounded-xl border border-white/5">
                <Clock size={14} className="text-primary" /> 
                Timeline: {reviewModal.job.estimate.estimatedDuration}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setReviewForm({ ...reviewForm, approved: true })}
                  className={cn(
                    "flex-1 py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest flex flex-col items-center gap-2 transition-all",
                    reviewForm.approved ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-500/10" : "bg-white border-slate-100 text-slate-700 hover:border-slate-200"
                  )}
                >
                  <CheckCircle size={20} /> Approve
                </button>
                <button
                  onClick={() => setReviewForm({ ...reviewForm, approved: false })}
                  className={cn(
                    "flex-1 py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest flex flex-col items-center gap-2 transition-all",
                    !reviewForm.approved ? "bg-red-50 border-red-500 text-red-700 shadow-lg shadow-red-500/10" : "bg-white border-slate-100 text-slate-700 hover:border-slate-200"
                  )}
                >
                  <XCircle size={20} /> Reject
                </button>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 mb-2 block">Internal Admin Notes</label>
                <textarea
                  placeholder="Explain your decision to the worker..."
                  value={reviewForm.adminNotes}
                  onChange={(e) => setReviewForm({ ...reviewForm, adminNotes: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setReviewModal(null)} className="flex-1 py-4 text-slate-700 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleReview}
                  disabled={!!saving}
                  className={cn(
                    "flex-[2] py-4 text-white rounded-2xl text-sm font-black shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70",
                    reviewForm.approved ? "bg-emerald-600 shadow-emerald-500/20" : "bg-red-600 shadow-red-500/20"
                  )}
                >
                  {saving ? <Loader2 size={20} className="animate-spin" /> : reviewForm.approved ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  {reviewForm.approved ? "Confirm Approval" : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
