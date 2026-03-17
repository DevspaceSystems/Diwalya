'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Briefcase, Wallet, Settings, Bell, Star, TrendingUp, DollarSign, Clock, CheckCircle2, MapPin, ArrowRight } from 'lucide-react';


export default function WorkerDashboard() {
  const stats = [
    { label: 'Total Earnings', value: '₵4,850', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Jobs', value: '3', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg Rating', value: '4.9', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Response Rate', value: '98%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const recentRequests = [
    { id: '1', client: 'Alice Freeman', service: 'Emergency Leak', date: 'Just now', price: '₵200', status: 'Near Sunyani Central' },
    { id: '2', client: 'John Mensah', service: 'Pipe Installation', date: '2 hours ago', price: '₵450', status: 'Airport Residential' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-slate-900 text-slate-400 flex flex-col">
        <div className="p-8">
          <Link href="/">
             <div className="bg-white p-2 rounded-lg inline-block">
                <Image src="/diwalya-logo.png" alt="Diwalya" width={120} height={30} className="object-contain" />
             </div>
          </Link>
        </div>
        
        <nav className="flex-grow px-4 space-y-2">
          <Link href="/dashboard/worker" className="flex items-center gap-3 px-4 py-3 bg-secondary text-white rounded-xl font-bold transition-all">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/dashboard/worker/jobs" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <Briefcase size={20} /> My Jobs
          </Link>
          <Link href="/dashboard/worker/wallet" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <Wallet size={20} /> Earnings
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <Link href="/dashboard/worker/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <Settings size={20} /> Profile Settings
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow">
        <header className="bg-white border-b h-20 flex items-center justify-between px-8 sticky top-0 z-40">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Worker Dashboard</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Status: <span className="text-green-500">Online & Accepting Jobs</span></p>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-secondary transition-colors">
              <Bell size={24} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-gray-900">Kwame Mensah</p>
                <p className="text-xs font-bold text-blue-500 flex items-center justify-end gap-1">
                  <CheckCircle2 size={12} /> Verified Pro
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-black text-xl border-2 border-secondary/20">
                K
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                    <stat.icon size={20} />
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-3xl font-black text-gray-900`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* New Job Requests */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-gray-900">Incoming Requests</h3>
                <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-black rounded-full animate-pulse">2 NEW</span>
              </div>
              
              <div className="space-y-4">
                 {recentRequests.map((req) => (
                   <div key={req.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-secondary/30 transition-all group">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex gap-4">
                           <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-gray-300">
                              <Briefcase size={32} />
                           </div>

                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-black text-lg text-gray-900">{req.client}</h4>
                                <span className="text-xs font-bold text-gray-400">{req.date}</span>
                              </div>
                              <p className="text-primary font-bold mb-2">{req.service}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><MapPin size={12} /> {req.status}</span>
                                <span className="flex items-center gap-1"><Clock size={12} /> 2:30 PM Today</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex md:flex-col justify-between items-end gap-4 min-w-[120px]">
                           <p className="text-2xl font-black text-gray-900">{req.price}</p>
                           <div className="flex gap-2">
                              <button className="px-6 py-2 bg-secondary text-white font-black rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 transition-all text-sm">
                                Accept
                              </button>
                              <button className="px-4 py-2 bg-gray-50 text-gray-400 font-bold rounded-xl hover:bg-red-50 hover:text-red-500 transition-all text-sm">
                                Decline
                              </button>
                           </div>
                        </div>
                      </div>
                   </div>
                 ))}
              </div>
            </div>

            {/* Quick Insights */}
            <div className="space-y-6">
               <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
                  <h3 className="font-black text-gray-900 text-lg mb-6 text-left">Wallet Balance</h3>
                  <div className="mb-8">
                     <p className="text-5xl font-black text-gray-900 mb-2">₵1,820</p>
                     <p className="text-green-500 font-bold text-sm flex items-center justify-center gap-1">
                       <TrendingUp size={14} /> +12% this week
                     </p>
                  </div>
                  <Link href="/dashboard/worker/wallet" className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all block">
                    Withdraw Earnings
                  </Link>
               </div>

               <div className="bg-slate-900 p-8 rounded-3xl text-white">
                  <h3 className="font-black text-lg mb-4">Improve Ranking</h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Complete your profile verification by uploading your National ID to unlock the <span className="text-blue-400 font-bold">Verified Badge</span> and get 3x more bookings.
                  </p>
                  <Link href="/dashboard/worker/setup" className="flex items-center justify-between bg-white/10 p-4 rounded-2xl hover:bg-white/20 transition-all group">
                     <span className="font-bold">Verify Identity</span>
                     <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
