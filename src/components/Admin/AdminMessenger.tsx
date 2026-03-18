'use client';

import React, { useState } from 'react';
import { Send, X, Bell, Mail, Loader2, ShieldCheck, User } from 'lucide-react';
import { sendNotification } from '@/lib/notifications';
import { cn } from '@/lib/utils';

interface AdminMessengerProps {
  onClose: () => void;
  targetUserId?: string;
  targetUserName?: string;
}

export default function AdminMessenger({ onClose, targetUserId, targetUserName }: AdminMessengerProps) {
  const [formData, setFormData] = useState({
    userId: targetUserId || '',
    title: '',
    body: '',
    channels: ['push', 'email'] as ('push' | 'email')[]
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.title || !formData.body) return;

    setSending(true);
    setStatus(null);
    try {
      const res = await (sendNotification as any)({
        userId: formData.userId,
        title: formData.title,
        body: formData.body,
        channels: formData.channels
      });

      if (res.success) {
        setStatus({ type: 'success', text: 'Communication sent successfully!' });
        setTimeout(onClose, 2000);
      } else {
        setStatus({ type: 'error', text: res.error || 'Failed to send' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    }
    setSending(false);
  };

  const toggleChannel = (channel: 'push' | 'email') => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
               <Bell size={20} />
             </div>
             <div>
               <h3 className="font-black text-lg">Broadcast Messenger</h3>
               <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Super Admin Controls</p>
             </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {status && (
            <div className={cn(
              "p-4 rounded-2xl text-sm font-bold animate-in fade-in-0 slide-in-from-top-2",
              status.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
            )}>
              {status.text}
            </div>
          )}

          <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">Target User ID</label>
             <div className="relative">
               <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
               <input 
                 type="text" 
                 value={formData.userId}
                 onChange={(e) => setFormData({...formData, userId: e.target.value})}
                 placeholder="Enter User ID..."
                 className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all font-bold text-sm"
                 readOnly={!!targetUserId}
               />
               {targetUserName && (
                 <p className="mt-1 text-[10px] text-primary font-black ml-1 uppercase">Target: {targetUserName}</p>
               )}
             </div>
          </div>

          <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">Message Title</label>
             <input 
               type="text" 
               value={formData.title}
               onChange={(e) => setFormData({...formData, title: e.target.value})}
               placeholder="Emergency Update / Welcome / Alert..."
               className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all font-bold text-sm"
               required
             />
          </div>

          <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">Message Body</label>
             <textarea 
               value={formData.body}
               onChange={(e) => setFormData({...formData, body: e.target.value})}
               placeholder="Your message content here..."
               rows={4}
               className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all font-bold text-sm resize-none"
               required
             ></textarea>
          </div>

          <div className="flex gap-4">
             <button 
               type="button"
               onClick={() => toggleChannel('push')}
               className={cn(
                 "flex-grow p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest",
                 formData.channels.includes('push') ? "border-primary bg-primary/5 text-primary" : "border-gray-100 text-gray-400"
               )}
             >
               <Bell size={16} /> Push
             </button>
             <button 
               type="button"
               onClick={() => toggleChannel('email')}
               className={cn(
                 "flex-grow p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest",
                 formData.channels.includes('email') ? "border-primary bg-primary/5 text-primary" : "border-gray-100 text-gray-400"
               )}
             >
               <Mail size={16} /> Email
             </button>
          </div>

          <button 
            type="submit"
            disabled={sending}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> Send Broadcast</>}
          </button>
        </form>
      </div>
    </div>
  );
}
