'use client';

import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/app/actions/settings';
import { supabase } from '@/lib/supabase';
import { Save, Settings2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatGHS } from '@/lib/utils';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    inspectionFee: 100,
    inspectionWorkerShare: 60
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [adminId, setAdminId] = useState('');

  useEffect(() => {
    loadSettings();
    getCurrentAdmin();
  }, []);

  async function getCurrentAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setAdminId(user.id);
  }

  async function loadSettings() {
    setLoading(true);
    const result = await getSettings();
    if (result.success && result.data) {
      setSettings({
        inspectionFee: result.data.inspectionFee,
        inspectionWorkerShare: result.data.inspectionWorkerShare
      });
    }
    setLoading(false);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });

    const result = await updateSettings(adminId, settings);

    if (result.success) {
      setMessage({ type: 'success', text: 'Settings updated successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update settings' });
    }
    
    setSaving(false);
  };

  const platformShare = settings.inspectionFee - settings.inspectionWorkerShare;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto pb-32">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
          <Settings2 className="text-primary" />
          System Settings
        </h1>
        <p className="text-slate-700 font-medium">Configure global platform parameters and fees.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 font-bold text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-8">
        {/* Inspection Request Settings */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Inspection Requests</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">
                Fixed Inspection Fee (₵)
              </label>
              <p className="text-xs text-slate-700 mb-3 font-medium">The total amount the client pays for an inspection visit.</p>
              <input 
                type="number" 
                min="0"
                step="0.01"
                required
                value={settings.inspectionFee}
                onChange={(e) => setSettings({...settings, inspectionFee: parseFloat(e.target.value) || 0})}
                className="w-full xl:w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary font-bold text-slate-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-2">
                Worker Share (₵)
              </label>
              <p className="text-xs text-slate-700 mb-3 font-medium">The portion of the inspection fee that goes to the worker's wallet.</p>
              <input 
                type="number" 
                min="0"
                max={settings.inspectionFee}
                step="0.01"
                required
                value={settings.inspectionWorkerShare}
                onChange={(e) => setSettings({...settings, inspectionWorkerShare: parseFloat(e.target.value) || 0})}
                className="w-full xl:w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary font-bold text-slate-900 transition-all"
              />
            </div>

            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">Distribution Summary</h3>
              <div className="flex justify-between items-center text-sm font-bold text-slate-700 mb-2">
                <span>Client Pays:</span>
                <span className="text-slate-900 font-black">{formatGHS(settings.inspectionFee)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-slate-700 mb-2">
                <span>Worker Receives:</span>
                <span className="text-emerald-600 font-black">{formatGHS(settings.inspectionWorkerShare)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-slate-700 pt-2 border-t border-blue-100">
                <span>Platform Keeps:</span>
                <span className="text-primary font-black">{formatGHS(Math.max(0, platformShare))}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-4 bg-slate-900 hover:bg-primary text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 flex items-center gap-2 group disabled:opacity-70 disabled:hover:scale-100"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="group-hover:-translate-y-0.5 transition-transform" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
