'use client';

import React, { useState } from 'react';
import { Bell, Send, Users, CheckCircle2, Loader2, Smartphone, AlertCircle, FileText } from 'lucide-react';
import { broadcastPushNotification } from '@/app/actions/broadcasts';
import { PUSH_TEMPLATES } from '@/lib/broadcast-templates';

type TargetGroup = 'ALL' | 'WORKERS' | 'CLIENTS';

export default function AdminNotificationsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('ANNOUNCEMENT');
  const [targetGroup, setTargetGroup] = useState<TargetGroup>('ALL');
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const currentTemplate = PUSH_TEMPLATES.find(t => t.id === selectedTemplate);
  const previewTitle = selectedTemplate === 'CUSTOM' ? customTitle : currentTemplate?.title || '';
  const previewBody = selectedTemplate === 'CUSTOM' ? customBody : currentTemplate?.body || '';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const res = await broadcastPushNotification({
        templateId: selectedTemplate,
        targetGroup,
        customTitle: selectedTemplate === 'CUSTOM' ? customTitle : undefined,
        customBody: selectedTemplate === 'CUSTOM' ? customBody : undefined,
      });
      setResult(res);
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-10 pb-32">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Bell size={32} />
          </div>
          Push Notifications
        </h1>
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mt-3 ml-1 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          In-App + Firebase Cloud Messaging
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Compose Panel */}
        <form onSubmit={handleSend} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Compose Notification</h2>

          {/* Template Selector */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Notification Template</label>
            <div className="grid grid-cols-1 gap-2">
              {PUSH_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    selectedTemplate === t.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                  }`}
                >
                  <Bell size={16} />
                  <div className="flex-1">
                    <p className="text-sm font-bold">{t.label}</p>
                    {t.id !== 'CUSTOM' && <p className="text-[10px] text-slate-400 truncate">{t.body.slice(0, 50)}...</p>}
                  </div>
                  {selectedTemplate === t.id && <CheckCircle2 size={16} className="ml-auto text-emerald-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Custom fields */}
          {selectedTemplate === 'CUSTOM' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Notification Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  placeholder="e.g. 🎉 Special Announcement"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Notification Body</label>
                <textarea
                  value={customBody}
                  onChange={e => setCustomBody(e.target.value)}
                  placeholder="Enter your notification message..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-medium text-slate-900 text-sm outline-none focus:ring-2 focus:ring-emerald-300 min-h-[120px] resize-none"
                  required
                />
              </div>
            </div>
          )}

          {/* Recipient Group */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Target Audience</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'ALL', label: 'Everyone', icon: '👥' },
                { value: 'WORKERS', label: 'Workers', icon: '🔧' },
                { value: 'CLIENTS', label: 'Clients', icon: '👤' },
              ].map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setTargetGroup(r.value as TargetGroup)}
                  className={`flex flex-col items-center gap-1 px-3 py-4 rounded-xl border-2 transition-all text-center text-sm font-bold ${
                    targetGroup === r.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                  }`}
                >
                  <span className="text-xl">{r.icon}</span>
                  <span className="text-xs">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 text-sm font-bold ${result.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {result.success ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
              <div>
                {result.success
                  ? `✅ Delivered! In-app: ${result.inAppSent} users. Push: ${result.pushSent} devices.`
                  : `❌ Error: ${result.error}`}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
          >
            {sending ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Send Notification</>}
          </button>
        </form>

        {/* Right: Phone Mock Preview */}
        <div className="flex flex-col items-center justify-center">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 w-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Preview</p>

              {/* Notification Preview Card */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                    <Bell size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Diwalya</p>
                    <p className="text-[10px] text-white/40">now</p>
                  </div>
                </div>
                <p className="text-white font-black text-sm leading-tight mb-1">{previewTitle || '(Notification Title)'}</p>
                <p className="text-white/70 text-xs font-medium leading-relaxed">{previewBody || '(Notification body will appear here)'}</p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-emerald-400 font-black text-xl">In-App</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Bell Dropdown</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-primary font-black text-xl">FCM</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Mobile Push</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
