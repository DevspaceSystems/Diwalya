'use client';

import React, { useState, useEffect } from 'react';
import { getInspections, assignInspectionWorker, verifyInspection } from '@/app/actions/booking';
import { getWorkers } from '@/app/actions/user';
import { supabase } from '@/lib/supabase';
import { formatGHS } from '@/lib/utils';
import {
  ClipboardCheck, UserCheck, ShieldCheck, Clock, MapPin, User,
  Loader2, CheckCircle2, AlertCircle, Users, ArrowRight, CheckCheck
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
  const [assignForm, setAssignForm] = useState({ workerId: '', teamMember: '' });
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
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
          <p className="text-slate-500 font-medium text-sm">Manage all platform inspection requests.</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          {[['', 'All'], ['PENDING', 'Pending'], ['IN_PROGRESS', 'Confirmed'], ['COMPLETED', 'Verified']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-black transition-all',
                filter === val ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
              )}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pending Assignment', value: statCounts.pending, color: 'text-orange-500', bg: 'bg-orange-50', icon: Clock },
          { label: 'Awaiting Verification', value: statCounts.inProgress, color: 'text-blue-500', bg: 'bg-blue-50', icon: ShieldCheck },
          { label: 'Completed & Verified', value: statCounts.completed, color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle2 },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', bg)}>
              <Icon className={color} size={22} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{value}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
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
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No inspections found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inspections.map((insp) => (
            <div key={insp.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-6">
                {/* Status & Service */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={cn('text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border', STATUS_COLORS[insp.status] || 'bg-slate-50 text-slate-500 border-slate-100')}>
                      {insp.status.replace('_', ' ')}
                    </span>
                    {insp.isInspectionVerified && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                        <CheckCheck size={12} /> Admin Verified
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{insp.serviceType}</h3>

                  <div className="flex flex-wrap gap-4 mt-3 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1"><User size={13} /> Client: {insp.client?.name}</span>
                    <span className="flex items-center gap-1"><UserCheck size={13} /> Worker: {insp.worker?.name || <span className="text-orange-500">Unassigned</span>}</span>
                    <span className="flex items-center gap-1"><MapPin size={13} /> {insp.location}</span>
                    {insp.assignedTeamMember && (
                      <span className="flex items-center gap-1"><Users size={13} /> Team: {insp.assignedTeamMember}</span>
                    )}
                  </div>
                  {insp.inspectionNotes && (
                    <p className="mt-2 text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 font-medium">{insp.inspectionNotes}</p>
                  )}
                </div>

                {/* Fee */}
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-slate-900">{formatGHS(insp.priceAmount || 0)}</p>
                  <div className="text-xs text-slate-400 font-bold mt-1 space-y-0.5">
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
                </div>
              </div>

              {/* Timeline */}
              <div className="border-t border-slate-50 px-6 py-3 flex flex-wrap gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Submitted: {new Date(insp.createdAt).toLocaleDateString()}</span>
                {insp.workerConfirmedAt && <span className="text-blue-400">Worker Confirmed: {new Date(insp.workerConfirmedAt).toLocaleDateString()}</span>}
                {insp.adminVerifiedAt && <span className="text-emerald-400">Admin Verified: {new Date(insp.adminVerifiedAt).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Modal */}
      {assignModal?.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <UserCheck className="text-primary" /> Assign Inspection Worker
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-600 mb-1 block">Select Worker *</label>
                <select
                  value={assignForm.workerId}
                  onChange={(e) => setAssignForm({ ...assignForm, workerId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-primary focus:border-primary"
                >
                  <option value="">Choose a worker...</option>
                  {workers.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name} – {w.workerProfile?.category || 'Worker'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-600 mb-1 block">Team Member (Optional)</label>
                <input
                  type="text"
                  placeholder="Diwalya staff name..."
                  value={assignForm.teamMember}
                  onChange={(e) => setAssignForm({ ...assignForm, teamMember: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold placeholder-slate-400 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setAssignModal(null)} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!assignForm.workerId || !!saving}
                  className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  Assign & Notify
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
