'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Bell, 
  CheckCheck, 
  Trash2, 
  Clock, 
  Info, 
  Zap, 
  ShieldCheck,
  Loader2,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import WorkerSidebar from '@/components/WorkerSidebar';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function WorkerNotificationsPage() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);
  const [filter, setFilter] = React.useState('ALL');

  React.useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchNotifications(session.user.id);
      }
    }
    loadData();
  }, []);

  const fetchNotifications = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Notification')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from('Notification')
      .update({ isRead: true })
      .eq('userId', user.id)
      .eq('isRead', false);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markOneRead = async (id: string) => {
    await supabase.from('Notification').update({ isRead: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from('Notification').delete().eq('id', id);
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !n.isRead;
    return n.type === filter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT_COMPLETED': return <Zap size={20} className="text-emerald-500" />;
      case 'ADMIN_ACTION': return <ShieldCheck size={20} className="text-indigo-500" />;
      case 'NEW_JOB': return <Bell size={20} className="text-orange-500" />;
      default: return <Info size={20} className="text-primary" />;
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-24">
      <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Notifications</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Stay updated with your activities</p>
          </div>
          <button 
            onClick={markAllRead}
            className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
             <CheckCheck size={16} /> Mark all read
          </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
         {['ALL', 'UNREAD', 'NEW_JOB', 'PAYMENT_COMPLETED', 'ADMIN_ACTION'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                filter === f 
                  ? "bg-white border-primary text-primary shadow-sm" 
                  : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
              )}
            >
              {f.replace(/_/g, ' ')}
            </button>
         ))}
      </div>

      <div className="space-y-4">
         {loading ? (
            <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
              <Loader2 className="animate-spin text-primary" size={40} />
            </div>
         ) : filteredNotifications.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-[1.5rem] flex items-center justify-center mb-6">
                <Bell size={32} className="text-gray-200" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Clean Slate!</h3>
              <p className="text-gray-400 font-bold text-sm">No notifications found in this category.</p>
            </div>
         ) : (
            filteredNotifications.map((n) => (
              <div 
                key={n.id}
                onClick={() => markOneRead(n.id)}
                className={cn(
                  "p-6 bg-white rounded-[2rem] border transition-all flex gap-6 group relative overflow-hidden",
                  n.isRead ? "border-gray-50 opacity-60" : "border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20"
                )}
              >
                 {!n.isRead && (
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                 )}
                 
                 <div className={cn(
                   "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                   n.isRead ? "bg-slate-50" : "bg-primary/5"
                 )}>
                    {getIcon(n.type)}
                 </div>

                 <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-4">
                       <h4 className="font-black text-slate-900 leading-tight mb-1">{n.title}</h4>
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{n.message}</p>
                 </div>

                 <button 
                   onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                   className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all self-center opacity-0 group-hover:opacity-100"
                 >
                    <Trash2 size={18} />
                 </button>
              </div>
            ))
         )}
      </div>
    </div>
  );
}
