'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Mail, 
  Bell, 
  Users, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon
} from 'lucide-react';
import { sendNotification } from '@/lib/notifications';
import { sendMassBroadcast } from '@/app/actions/notification';
import { EMAIL_TEMPLATES, parseTemplate } from '@/lib/email';
import { cn } from '@/lib/utils';

interface AdminMessengerProps {
  onClose: () => void;
  targetUserId?: string;
  targetUserName?: string;
}

export default function AdminMessenger({ onClose, targetUserId, targetUserName }: AdminMessengerProps) {
  const [mode, setMode] = useState<'INDIVIDUAL' | 'BROADCAST'>(targetUserId ? 'INDIVIDUAL' : 'BROADCAST');
  const [target, setTarget] = useState<'ALL' | 'WORKERS' | 'CLIENTS'>( 'ALL');
  const [templateKey, setTemplateKey] = useState<keyof typeof EMAIL_TEMPLATES>('CUSTOM');
  const [channels, setChannels] = useState({ email: true, push: true });
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [clickAction, setClickAction] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    async function getAdminId() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
          // We need the primary key ID from our DB, but for now we'll assume 
          // either auth ID matches or we look it up. 
          // Let's look up the user by email to be sure we have the Prisma ID.
          const { checkAdminAccess } = await import('@/app/actions/auth-check');
          const user = await prisma.user.findUnique({
              where: { email: session.user.email },
              select: { id: true }
          }) as any;
          if (user) setAdminId(user.id);
      }
    }
    getAdminId();
  }, []);

  // Update subject/message when template changes
  useEffect(() => {
    const template = EMAIL_TEMPLATES[templateKey];
    setSubject(template.subject);
    if (templateKey !== 'CUSTOM') {
       setMessage(template.body);
    } else {
       setMessage('');
    }
  }, [templateKey]);

  const handleSend = async () => {
    setLoading(true);
    try {
      if (mode === 'INDIVIDUAL' && targetUserId) {
        const res = await sendNotification({
            userId: targetUserId,
            title: subject,
            body: message,
            channels: [
                ...(channels.email ? ['email'] : []),
                ...(channels.push ? ['push'] : [])
            ] as any,
            data: clickAction ? { url: clickAction } : {}
        });
        if (res.success) setSuccess(true);
      } else {
        const res = await sendMassBroadcast({
          target: target as any,
          templateKey,
          channels,
          customSubject: subject,
          customMessage: templateKey === 'CUSTOM' ? message : undefined,
          imageUrl: imageUrl || undefined,
          clickAction: clickAction || undefined,
          adminId: adminId || ''
        });
        if (res.success) setSuccess(true);
      }
    } catch (err) {
      alert('Error sending message');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-12 text-center max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
           <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
             <CheckCircle2 size={40} />
           </div>
           <h2 className="text-2xl font-black text-slate-900 tracking-tight">Broadcast Dispatched!</h2>
           <p className="text-slate-500 font-medium mt-2">Your messages have been queued for multi-channel delivery.</p>
           <button 
             onClick={onClose}
             className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all"
           >
             Close Messenger
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden relative animate-in slide-in-from-bottom-8 duration-500 my-8">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400"
        >
          <X size={24} />
        </button>

        <div className="p-12 space-y-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Messenger Pro</h2>
            <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest font-black mt-1">Unified Email & Push Broadcast</p>
          </div>

          <div className="space-y-8">
            {/* Audience Selection */}
            {!targetUserId && (
              <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100">
                {(['ALL', 'WORKERS', 'CLIENTS'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTarget(t)}
                    className={cn(
                      "flex-grow py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                      target === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {targetUserId && (
              <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm font-black text-xl">
                  {targetUserName?.[0] || 'U'}
                </div>
                <div>
                   <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest italic">Target Recipient</p>
                   <p className="text-lg font-black text-slate-900 leading-none">{targetUserName}</p>
                </div>
              </div>
            )}

            {/* Template & Channels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Select Template</label>
                 <div className="relative">
                   <select 
                     value={templateKey}
                     onChange={(e) => setTemplateKey(e.target.value as any)}
                     className="w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-3xl font-extrabold text-sm appearance-none focus:ring-2 focus:ring-primary focus:outline-none transition-all cursor-pointer"
                   >
                     {Object.keys(EMAIL_TEMPLATES).map(key => (
                       <option key={key} value={key}>{key.replace('_', ' ').toLowerCase()}</option>
                     ))}
                   </select>
                   <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Channels</label>
                 <div className="flex gap-3">
                    <button 
                      onClick={() => setChannels(prev => ({ ...prev, email: !prev.email }))}
                      className={cn(
                        "flex-grow flex items-center justify-center gap-2 py-4 rounded-3xl border transition-all",
                        channels.email ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-black" : "bg-slate-50 border-slate-100 text-slate-400 font-bold"
                      )}
                    >
                      <Mail size={16} /> Email
                    </button>
                    <button 
                      onClick={() => setChannels(prev => ({ ...prev, push: !prev.push }))}
                      className={cn(
                        "flex-grow flex items-center justify-center gap-2 py-4 rounded-3xl border transition-all",
                        channels.push ? "bg-emerald-50 border-emerald-200 text-emerald-600 font-black" : "bg-slate-50 border-slate-100 text-slate-400 font-bold"
                      )}
                    >
                      <Bell size={16} /> Push
                    </button>
                 </div>
              </div>
            </div>

            {/* Advanced Options (Push ONLY) */}
            {channels.push && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"><ImageIcon size={16} /></span>
                  <input 
                    type="text" 
                    placeholder="Image URL (Optional)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-all"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"><LinkIcon size={16} /></span>
                  <input 
                    type="text" 
                    placeholder="Click Action (URL/Page)"
                    value={clickAction}
                    onChange={(e) => setClickAction(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Custom Input */}
            <div className="space-y-6">
               <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="Subject Line"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-8 py-5 bg-white border border-slate-100 rounded-3xl font-black text-lg focus:ring-2 focus:ring-primary focus:outline-none shadow-sm transition-all placeholder:text-slate-200"
                  />
               </div>
               <div className="space-y-2 relative">
                  <textarea 
                    placeholder="Compose your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="w-full px-8 py-6 bg-white border border-slate-100 rounded-[2rem] font-medium text-slate-600 focus:ring-2 focus:ring-primary focus:outline-none shadow-sm transition-all placeholder:text-slate-200 resize-none"
                  />
                  <div className="absolute right-6 bottom-6 flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    <FileText size={12} /> Personalized with Variable Support
                  </div>
               </div>
            </div>

            {/* Send Button */}
            <button 
              onClick={handleSend}
              disabled={loading || !subject || !message}
              className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50"
            >
              {loading ? (
                 <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send size={18} /> Dispatch Broadcast
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
