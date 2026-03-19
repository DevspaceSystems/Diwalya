'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, 
  Briefcase, 
  CreditCard, 
  LayoutDashboard, 
  Settings, 
  Search, 
  MoreVertical,
  TrendingUp,
  AlertCircle,
  ClipboardList,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Globe,
  Zap,
  Bell
} from 'lucide-react';
import { formatGHS } from '@/lib/utils';

export default function AdminDashboard() {
  const [platformStats, setPlatformStats] = React.useState({
    commission: 0,
    totalRevenue: 0,
    activeBookings: 0,
    totalWorkers: 0
  });

  React.useEffect(() => {
    async function loadStats() {
      const { getPlatformStats } = await import('@/app/actions/admin');
      const result = await getPlatformStats();
      if (result.success && result.stats) {
        setPlatformStats(result.stats);
      }
    }
    loadStats();
  }, []);

  const stats = [
    { label: 'Total Workers', value: platformStats.totalWorkers.toString(), change: '+12%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Operations', value: platformStats.activeBookings.toString(), change: '+5%', icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Cumulative Revenue', value: formatGHS(platformStats.totalRevenue), change: '+18%', icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Platform Dividends', value: formatGHS(platformStats.commission), change: 'Real-time', icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary/5' },
  ];

  const pendingWorkers = [
    { id: '1', name: 'John Doe', skill: 'Electrician', date: '2 hours ago', location: 'Sunyani' },
    { id: '2', name: 'Sarah Mensah', skill: 'Plumber', date: '5 hours ago', location: 'Accra' },
    { id: '3', name: 'Kofi Arhin', skill: 'Mechanic', date: 'Yesterday', location: 'Kumasi' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col fixed inset-y-0 z-50">
        <div className="p-8">
           <div className="bg-white p-2 rounded-lg inline-block">
              <Image src="/diwalya-logo.png" alt="Diwalya Admin" width={120} height={30} className="object-contain" />
           </div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 ml-1">Admin Panel</p>
        </div>
        
        <nav className="flex-grow px-4 space-y-1">
          <Link href="/dashboard/admin" className="flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-xl font-bold transition-all">
            <LayoutDashboard size={20} /> Command Center
          </Link>
          <Link href="/dashboard/admin/workers" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <Users size={20} /> Talent Registry
          </Link>
          <Link href="/dashboard/admin/bookings" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <Briefcase size={20} /> Operations
          </Link>
          <Link href="/dashboard/admin/payments" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <CreditCard size={20} /> Financials
          </Link>
          <Link href="/dashboard/admin/verifications" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <ShieldCheck size={20} /> Security Clearances
          </Link>
          <Link href="/dashboard/admin/reports" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <ShieldAlert size={20} /> Threat Assessment
          </Link>
          <Link href="/dashboard/admin/withdrawals" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <TrendingUp size={20} /> Fund Disbursal
          </Link>
          <Link href="/dashboard/admin/special-requests" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <ClipboardList size={20} /> Custom Protocols
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <Link href="/dashboard/admin/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <Settings size={20} /> System Settings
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow ml-64">
        <header className="bg-white border-b h-20 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 min-w-[300px]">
            <Search className="text-gray-400" size={18} />
            <input type="text" placeholder="Search workers, bookings, IDs..." className="bg-transparent w-full focus:outline-none text-sm font-medium" />
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-primary transition-colors">
              <Bell size={24} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
              <div className="text-right">
                <p className="text-sm font-black text-gray-900">Chief Systems Controller</p>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center justify-end gap-1">
                  <ShieldCheck size={12} /> Root Access
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-slate-900/20">
                <Globe size={24} className="text-primary" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">Global Command Center</h1>
              <p className="text-gray-500 font-bold flex items-center gap-2 uppercase tracking-widest text-[10px]">
                <Activity size={14} className="text-green-500" /> System Vitality: <span className="text-green-500">Optimal</span>
              </p>
            </div>
            <button className="bg-white px-6 py-3 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
              Generate Report <TrendingUp size={18} />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                    <stat.icon size={24} />
                  </div>
                  <span className={`text-xs font-black px-2 py-1 rounded-full ${
                    stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pending Verifications */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                    Personnel Clearance Queue
                    <span className="bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest">Priority</span>
                  </h3>
                  <button className="text-primary text-sm font-bold hover:underline">See All</button>
               </div>
               <div className="divide-y divide-gray-50">
                  {pendingWorkers.map((worker) => (
                    <div key={worker.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 text-primary font-black flex items-center justify-center rounded-2xl">
                             {worker.name.charAt(0)}
                          </div>
                          <div>
                             <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{worker.name}</h4>
                             <p className="text-xs text-gray-500 font-medium">{worker.skill} • {worker.location}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-400 font-bold">{worker.date}</span>
                          <button className="px-5 py-2 bg-secondary text-white font-black text-xs rounded-xl shadow-lg shadow-orange-500/10 hover:scale-105 transition-all">
                             Review ID
                          </button>
                          <button className="p-2 text-gray-300 hover:text-gray-600">
                             <MoreVertical size={16} />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Platform Alerts */}
            <div className="space-y-6">
               <div className="bg-slate-900 p-8 rounded-3xl text-white">
                  <div className="flex items-start gap-4 mb-6">
                     <AlertCircle className="text-orange-500 shrink-0" size={24} />
                     <div>
                        <h4 className="font-black text-lg">System Update</h4>
                        <p className="text-slate-400 text-sm mt-1">Paystack API credentials need renewal in 3 days.</p>
                     </div>
                  </div>
                  <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all text-sm border border-white/5">
                    Update Credentials
                  </button>
               </div>

               <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="font-black text-gray-900 text-lg mb-6">Ledger Activity</h3>
                  <div className="space-y-4">
                     {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                 <Briefcase size={14} />
                              </div>
                              <span className="text-xs font-bold text-gray-700">Ref: #TXN-00{i}</span>
                           </div>
                           <span className="font-black text-gray-900 text-xs">₵240.00</span>
                        </div>
                     ))}
                  </div>
                  <button className="w-full mt-6 py-3 text-primary font-black text-sm border-2 border-primary/10 rounded-2xl hover:bg-primary/5 transition-all">
                    View Transaction Log
                  </button>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
