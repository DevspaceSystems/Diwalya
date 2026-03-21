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
  Zap
} from 'lucide-react';
import { formatGHS } from '@/lib/utils';

export default function AdminDashboard() {
  const [platformStats, setPlatformStats] = React.useState({
    commission: 0,
    totalRevenue: 0,
    activeBookings: 0,
    totalWorkers: 0
  });

  const [pendingWorkers, setPendingWorkers] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function loadStats() {
      const { getPlatformStats } = await import('@/app/actions/admin');
      const result = await getPlatformStats();
      if (result.success && result.stats) {
        setPlatformStats(result.stats);
      }
    }
    async function loadPending() {
      const { getPendingVerifications } = await import('@/app/actions/worker');
      const result = await getPendingVerifications();
      if (result.success && result.data) {
        setPendingWorkers(result.data.slice(0, 5));
      }
    }
    loadStats();
    loadPending();
  }, []);

  const stats = [
    { label: 'Total Workers', value: platformStats.totalWorkers.toString(), change: '+12%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Bookings', value: platformStats.activeBookings.toString(), change: '+5%', icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Revenue', value: formatGHS(platformStats.totalRevenue), change: '+18%', icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Platform Earnings', value: formatGHS(platformStats.commission), change: 'Real-time', icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary/5' },
  ];
  return (
    <div className="p-6 md:p-10 w-full overflow-x-hidden min-h-screen bg-gray-50/50">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">Admin Dashboard Overview</h1>
          <p className="text-gray-500 font-bold flex items-center gap-2 uppercase tracking-widest text-[10px]">
            <Activity size={14} className="text-green-500" /> System Status: <span className="text-green-500">Online</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              const { generateSystemReport } = await import('@/app/actions/admin');
              const res = await generateSystemReport();
              if (res.success && res.data) {
                alert(`Report generated successfully!\n\nSummary:\n- Total Workers: ${res.data.totalWorkers}\n- Total Revenue: ${formatGHS(res.data.totalRevenue)}\n- Active Bookings: ${res.data.activeBookings}`);
              } else {
                alert(`Error generating report: ${res.error || 'Failed to fetch data'}`);
              }
            }}
            className="bg-white px-6 py-3 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
          >
            Generate Report <TrendingUp size={18} />
          </button>
        </div>
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
                Pending Verifications
                <span className="bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest">Priority</span>
              </h3>
              <button className="text-primary text-sm font-bold hover:underline">See All</button>
           </div>
           <div className="divide-y divide-gray-50">
              {pendingWorkers.map((worker) => {
                const name = worker.user?.name || 'Worker';
                const category = worker.category || 'Service Provider';
                const loc = worker.location || 'Ghana';
                const date = new Date(worker.createdAt).toLocaleDateString();
                
                return (
                  <div key={worker.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-primary font-black flex items-center justify-center rounded-2xl overflow-hidden">
                           {worker.user?.profilePicture ? (
                             <img src={worker.user.profilePicture} alt={name} className="w-full h-full object-cover" />
                           ) : (
                             name.charAt(0)
                           )}
                        </div>
                        <div>
                           <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{name}</h4>
                           <p className="text-xs text-gray-500 font-medium">{category} • {loc}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400 font-bold">{date}</span>
                        <Link href={`/dashboard/admin/verifications?id=${worker.userId}`} className="px-5 py-2 bg-secondary text-white font-black text-xs rounded-xl shadow-lg shadow-orange-500/10 hover:scale-105 transition-all">
                           Review ID
                        </Link>
                        <button className="p-2 text-gray-300 hover:text-gray-600">
                           <MoreVertical size={16} />
                        </button>
                     </div>
                  </div>
                );
              })}
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
  );
}
