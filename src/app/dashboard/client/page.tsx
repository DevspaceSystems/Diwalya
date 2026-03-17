'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Briefcase, Clock, Wallet, Settings, Bell, Search, Star, MessageSquare } from 'lucide-react';

export default function ClientDashboard() {
  const stats = [
    { label: 'Pending Jobs', value: '2', color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Ongoing Jobs', value: '1', color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Spent', value: '₵1,240', color: 'text-green-500', bg: 'bg-green-50' },
  ];

  const recentJobs = [
    { id: '1', worker: 'Kwame Mensah', service: 'Plumbing', status: 'Pending', date: 'Oct 24, 2023', price: '₵150' },
    { id: '2', worker: 'Amma Serwaa', service: 'Electrical', status: 'Completed', date: 'Oct 18, 2023', price: '₵320' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-white border-r hidden lg:flex flex-col">
        <div className="p-6">
          <Link href="/">
            <Image src="/diwalya-logo.png" alt="Diwalya" width={120} height={30} className="object-contain" />
          </Link>
        </div>
        <nav className="flex-grow px-4 space-y-2">
          <Link href="/dashboard/client" className="flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-xl font-bold transition-all">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/search" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-bold transition-all">
            <Search size={20} /> Find Workers
          </Link>
          <Link href="/dashboard/client/jobs" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-bold transition-all">
            <Briefcase size={20} /> My Jobs
          </Link>
          <Link href="/dashboard/client/wallet" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-bold transition-all">
            <Wallet size={20} /> Wallet
          </Link>
        </nav>
        <div className="p-4 border-t">
          <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-bold transition-all">
            <Settings size={20} /> Settings
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow">
        <header className="bg-white border-b h-16 flex items-center justify-between px-8 sticky top-0 z-40">
          <h1 className="text-xl font-black text-gray-900">Client Dashboard</h1>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-primary transition-colors">
              <Bell size={24} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-primary border-2 border-primary/20">
              M
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome back, Mark! 👋</h2>
            <p className="text-gray-500">Here's what's happening with your bookings today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Recent Jobs */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-black text-gray-900 text-lg">Recent Bookings</h3>
                <Link href="/dashboard/client/jobs" className="text-primary text-sm font-bold hover:underline">View All</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {recentJobs.map((job) => (
                  <div key={job.id} className="px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{job.worker}</h4>
                        <p className="text-sm text-gray-500">{job.service} • {job.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900">{job.price}</p>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        job.status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions / Recommendations */}
            <div className="space-y-6">
              <div className="bg-primary text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-2">Need a Plumber fast?</h3>
                  <p className="text-blue-100 mb-6">We have 12 verified plumbers in Sunyani ready to help today.</p>
                  <Link href="/search?category=plumbing" className="inline-block bg-white text-primary px-6 py-3 rounded-xl font-black hover:scale-105 transition-all">
                    Find Plumber
                  </Link>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-900 text-lg mb-6">Leave a Review</h3>
                <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-primary">A</div>
                  <div className="flex-grow">
                    <p className="font-bold text-sm">Amma Serwaa</p>
                    <div className="flex text-yellow-500 gap-0.5">
                      <Star size={14} />
                      <Star size={14} />
                      <Star size={14} />
                      <Star size={14} />
                      <Star size={14} className="text-gray-200" />
                    </div>
                  </div>
                  <button className="text-primary font-black text-sm">Review</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
