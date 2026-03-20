'use client';

import React, { useState } from 'react';
import { Mail, Send, Users, CheckCircle2, Loader2, ChevronDown, FileText, X, AlertCircle } from 'lucide-react';
import { broadcastEmail } from '@/app/actions/broadcasts';
import { EMAIL_TEMPLATES } from '@/lib/broadcast-templates';

type Recipient = 'ALL' | 'WORKERS' | 'CLIENTS' | 'SPECIFIC';

export default function AdminEmailsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('WELCOME');
  const [recipient, setRecipient] = useState<Recipient>('ALL');
  const [specificEmail, setSpecificEmail] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; sent?: number | undefined; error?: string | undefined } | null>(null);

  const currentTemplate = EMAIL_TEMPLATES.find(t => t.id === selectedTemplate);
  const previewBody = selectedTemplate === 'CUSTOM' ? customBody : currentTemplate?.body('John Doe') || '';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const res = await broadcastEmail({
        templateId: selectedTemplate,
        targetGroup: recipient,
        customSubject: selectedTemplate === 'CUSTOM' ? customSubject : undefined,
        customBody: selectedTemplate === 'CUSTOM' ? customBody : undefined,
        specificEmail: recipient === 'SPECIFIC' ? specificEmail : undefined,
      });
      setResult({
        success: res.success,
        sent: res.sent,
        error: res.error as string | undefined
      });
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
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Mail size={32} />
          </div>
          Email Dispatch
        </h1>
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mt-3 ml-1 flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
          Hostinger SMTP via info@diwalya.com
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Compose Panel */}
        <form onSubmit={handleSend} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Compose & Send</h2>

          {/* Template Selector */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Email Template</label>
            <div className="grid grid-cols-1 gap-2">
              {EMAIL_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    selectedTemplate === t.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                  }`}
                >
                  <FileText size={16} />
                  <span className="text-sm font-bold">{t.label}</span>
                  {selectedTemplate === t.id && <CheckCircle2 size={16} className="ml-auto text-indigo-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Custom fields */}
          {selectedTemplate === 'CUSTOM' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Subject Line</label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  placeholder="e.g. Important update from Diwalya"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Email Body</label>
                <textarea
                  value={customBody}
                  onChange={e => setCustomBody(e.target.value)}
                  placeholder="Enter your custom email message here..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-medium text-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-300 min-h-[160px] resize-none"
                  required
                />
              </div>
            </div>
          )}

          {/* Recipient */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Recipients</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'ALL', label: 'Everyone', icon: '👥' },
                { value: 'WORKERS', label: 'Workers Only', icon: '🔧' },
                { value: 'CLIENTS', label: 'Clients Only', icon: '👤' },
                { value: 'SPECIFIC', label: 'Specific Email', icon: '✉️' },
              ].map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRecipient(r.value as Recipient)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-left text-sm font-bold ${
                    recipient === r.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                  }`}
                >
                  <span>{r.icon}</span> {r.label}
                </button>
              ))}
            </div>
            {recipient === 'SPECIFIC' && (
              <input
                type="email"
                value={specificEmail}
                onChange={e => setSpecificEmail(e.target.value)}
                placeholder="someone@example.com"
                className="w-full mt-3 p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                required
              />
            )}
          </div>

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${result.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {result.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {result.success ? `✅ Sent to ${result.sent} recipient(s) successfully!` : `❌ Error: ${result.error}`}
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
          >
            {sending ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Send Email</>}
          </button>
        </form>

        {/* Right: Preview Panel */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preview</p>
            <h3 className="text-lg font-black text-white mb-6 tracking-tight">
              {selectedTemplate === 'CUSTOM' ? (customSubject || 'Custom Email') : currentTemplate?.subject}
            </h3>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-slate-300 font-medium leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
              {previewBody || 'Select a template to preview...'}
            </div>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Mail size={12} /> Sent via info@diwalya.com (Hostinger SMTP)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
