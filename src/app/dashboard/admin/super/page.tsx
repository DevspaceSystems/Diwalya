'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Briefcase, 
  Wallet, 
  TrendingUp, 
  Bell, 
  Search, 
  Activity,
  ArrowUpRight,
  Database,
  Eye,
  MessageSquare,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Clock,
  ClipboardCheck,
  Settings2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatGHS } from '@/lib/utils';
import ActivityFeed from '@/components/admin/ActivityFeed';
import AdminMessenger from '@/components/admin/AdminMessenger';

import { getUsers, getWorkers } from '@/app/actions/user';
import { getAdminBookings } from '@/app/actions/booking';
import { getFinancialData } from '@/app/actions/finance';
import { getReports } from '@/app/actions/report';

export default function SuperAdminDashboard() {
  const [showMessenger, setShowMessenger] = useState(false);
  const [stats, setStats] = useState({
    users: 0,
    workers: 0,
    bookings: 0,
    revenue: 0,
    activeAlerts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const [uRes, wRes, bRes, fRes, rRes] = await Promise.all([
        getUsers(),
        getWorkers(),
        getAdminBookings(),
        getFinancialData(),
        getReports()
      ]);

      setStats({
        users: uRes.success ? (uRes.data?.length || 0) : 0,
        workers: wRes.success ? (wRes.data?.length || 0) : 0,
        bookings: bRes.success ? (bRes.data?.length || 0) : 0,
        revenue: fRes.success ? (fRes.data?.stats.totalVolume || 0) : 0,
        activeAlerts: rRes.success ? (rRes.data?.filter((r: any) => r.status === 'PENDING').length || 0) : 0
      });
      setLoading(false);
    }
    loadStats();
  }, []);

  const cards = [
    { label: 'Total Platform Users', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Live' },
    { label: 'Verified Professionals', value: stats.workers, icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: 'Live' },
    { label: 'Active Service Bookings', value: stats.bookings, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50', trend: 'Live' },
    { label: 'Cumulative Volume', value: formatGHS(stats.revenue), icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Live' },
  ];

  return (
    <div className="p-10 max-w-[1600px] mx-auto space-y-10">
            {/* Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className={cn("p-4 rounded-2xl shadow-inner", card.bg, card.color)}>
                                <card.icon size={28} />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
                                <TrendingUp size={12} /> {card.trend}
                            </span>
                        </div>
                        <p className="text-sm font-black text-slate-700 uppercase tracking-widest mb-1">{card.label}</p>
                        <p className="text-4xl font-black text-slate-900">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Live Activity Feed */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="p-3 bg-slate-900 text-white rounded-2xl">
                             <Activity size={24} />
                           </div>
                           <h2 className="text-2xl font-black text-slate-900 tracking-tight">Real-time Feed</h2>
                        </div>
                        <button className="text-primary font-black text-xs uppercase tracking-widest hover:underline px-2 py-1">Export Logs</button>
                    </div>
                    
                    <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-200 min-h-[600px] p-2 overflow-hidden relative">
                         <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-slate-50/50 to-transparent z-10"></div>
                         <div className="max-h-[700px] overflow-y-auto p-4 no-scrollbar">
                            <ActivityFeed />
                         </div>
                         <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-50/50 to-transparent z-10"></div>
                    </div>
                </div>

                {/* System Insights */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Critical Insights</h3>
                    
                    <div className="bg-[#0F172A] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/40 transition-all duration-700"></div>
                        <h4 className="font-black text-lg mb-4 flex items-center gap-2">
                           <ShieldAlert className="text-orange-400" size={24} /> Security Status
                        </h4>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500">
                                     <AlertTriangle size={16} />
                                  </div>
                                  <span className="text-xs font-bold">Unresolved Reports</span>
                               </div>
                               <span className="text-xl font-black">08</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500">
                                     <Clock size={16} />
                                  </div>
                                  <span className="text-xs font-bold">Pending Payouts</span>
                               </div>
                               <span className="text-xl font-black">12</span>
                            </div>
                        </div>
                        <button className="w-full mt-8 py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all text-xs uppercase tracking-widest">
                           Audit Security Log
                        </button>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
                        <h4 className="font-black text-lg mb-6 flex items-center gap-2">
                           <MessageSquare className="text-primary" size={24} fill="currentColor" opacity={0.1} /> Quick Broadcast
                        </h4>
                        <p className="text-slate-700 text-sm font-medium mb-6 leading-relaxed">Need to alert all users about maintenance or a system update?</p>
                        <button 
                          onClick={() => setShowMessenger(true)}
                          className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-2xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                           <Zap size={16} /> Send Announcement
                        </button>
                    </div>
                </div>
            </div>

            {showMessenger && (
              <AdminMessenger onClose={() => setShowMessenger(false)} />
            )}
    </div>
  );
}
