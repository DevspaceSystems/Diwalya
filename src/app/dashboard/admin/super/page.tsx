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
import ActivityFeed from '@/components/Admin/ActivityFeed';
import AdminMessenger from '@/components/Admin/AdminMessenger';

export default function SuperAdminDashboard() {
  const [showMessenger, setShowMessenger] = useState(false);
  const [stats, setStats] = useState({
    users: 124,
    workers: 45,
    bookings: 89,
    revenue: 4520,
    activeAlerts: 3
  });

  const cards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
    { label: 'Verified Workers', value: stats.workers, icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+5%' },
    { label: 'Active Bookings', value: stats.bookings, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+18%' },
    { label: 'Platform Rev', value: formatGHS(stats.revenue), icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+24%' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar Overlay for Mobile */}
      <aside className="w-80 bg-[#0F172A] p-8 hidden lg:flex flex-col text-slate-400">
        <div className="mb-12">
            <Link href="/">
              <div className="bg-white p-2 rounded-xl inline-block">
                <Image src="/diwalya-logo.png" alt="Diwalya" width={140} height={35} />
              </div>
            </Link>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-4 px-1">Super Admin Console v2</p>
        </div>

        <nav className="flex-grow space-y-2">
            <Link href="/dashboard/admin/super" className="flex items-center gap-3 px-5 py-4 bg-primary text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-500/20">
                <Zap size={20} /> Live Monitoring
            </Link>
            <Link href="/dashboard/admin/users" className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 rounded-2xl font-bold transition-all">
                <Users size={20} /> User Management
            </Link>
            <Link href="/dashboard/admin/bookings" className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 rounded-2xl font-bold transition-all">
                <Briefcase size={20} /> Global Bookings
            </Link>
            <Link href="/dashboard/admin/verifications" className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 rounded-2xl font-bold transition-all">
                <ShieldCheck size={20} /> Verification Center
            </Link>
            <Link href="/dashboard/admin/payments" className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 rounded-2xl font-bold transition-all">
                <Wallet size={20} /> Financial Ledger
            </Link>
            <Link href="/dashboard/admin/reports" className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 rounded-2xl font-bold transition-all">
                <ShieldAlert size={20} /> Security &amp; Reports
            </Link>
            <Link href="/dashboard/admin/inspections" className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 rounded-2xl font-bold transition-all">
                <ClipboardCheck size={20} /> Inspections
            </Link>
            <Link href="/dashboard/admin/settings" className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 rounded-2xl font-bold transition-all">
                <Settings2 size={20} /> System Settings
            </Link>
        </nav>

        <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">System Online</span>
            </div>
            <p className="text-xs font-medium text-slate-400 leading-relaxed mb-4">You have full super-admin access to all platform systems.</p>
            <button 
              onClick={() => setShowMessenger(true)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
                Launch Broadcast
            </button>
        </div>
      </aside>

      <main className="flex-grow">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <div className="lg:hidden p-2 bg-slate-900 text-white rounded-lg">
                    <Activity size={20} />
                </div>
                <div>
                   <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Monitor</h1>
                   <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest mt-1">
                      <Zap size={12} fill="currentColor" /> Real-time activity active
                   </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative hidden md:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Global search..." className="pl-12 pr-6 py-3 bg-slate-100/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all w-80 font-bold text-sm" />
                </div>
                <button className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary transition-all relative">
                    <Bell size={24} />
                    <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
                    A
                </div>
            </div>
        </header>

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
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
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
                        <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed">Need to alert all users about maintenance or a system update?</p>
                        <button 
                          onClick={() => setShowMessenger(true)}
                          className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-2xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                           <Zap size={16} /> Send Announcement
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </main>

      {showMessenger && (
        <AdminMessenger onClose={() => setShowMessenger(false)} />
      )}
    </div>
  );
}
