'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, X, Info, Zap, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.isRead).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch user + notifications
  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  const fetchNotifications = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Notification')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data);
      }
    } catch (e) {
      // Silently fail if table doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    if (!userId) return;
    await supabase
      .from('Notification')
      .update({ isRead: true })
      .eq('userId', userId)
      .eq('isRead', false);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markOneRead = async (id: string) => {
    await supabase.from('Notification').update({ isRead: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT_COMPLETED': return <Zap size={14} className="text-emerald-500" />;
      case 'ADMIN_ACTION': return <ShieldCheck size={14} className="text-indigo-500" />;
      default: return <Info size={14} className="text-primary" />;
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative p-2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell size={24} />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-[360px] bg-white rounded-[2rem] shadow-2xl shadow-slate-200/80 border border-slate-100 z-[200] overflow-hidden animate-in slide-in-from-top-4 duration-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-base tracking-tight">Notifications</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{unread} unread</p>
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-slate-500 transition-colors ml-2">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="py-16 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-16 text-center">
                <Bell size={32} className="text-slate-100 mx-auto mb-3" />
                <p className="text-sm font-black text-slate-400">No notifications yet</p>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markOneRead(n.id)}
                  className={`px-6 py-4 cursor-pointer transition-colors flex items-start gap-4 ${n.isRead ? 'opacity-60' : 'bg-primary/[0.02] hover:bg-primary/5'}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${n.isRead ? 'bg-slate-50' : 'bg-white shadow-sm border border-slate-100'}`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black text-slate-900 leading-tight ${n.isRead ? '' : 'text-slate-900'}`}>{n.title}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
