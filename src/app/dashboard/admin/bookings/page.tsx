'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Briefcase, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  User, 
  MoreVertical,
  ExternalLink,
  Users,
  ShieldCheck
} from 'lucide-react';

export default function AdminBookingOversight() {
  const bookings = [
    { id: 'BK-7214', worker: 'Kwame Mensah', client: 'Alice Freeman', service: 'Emergency Leak', status: 'Ongoing', price: '₵200', date: 'Oct 24, 14:20' },
    { id: 'BK-7215', worker: 'Sarah Mensah', client: 'John Mensah', service: 'Full Rewiring', status: 'Pending', price: '₵850', date: 'Oct 24, 10:15' },
    { id: 'BK-7212', worker: 'Amma Serwaa', client: 'Mike Arhin', service: 'AC Repair', status: 'Completed', price: '₵320', date: 'Oct 23, 16:45' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Placeholder */}
      <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col fixed inset-y-0 z-50">
        <div className="p-8">
           <div className="bg-white p-2 rounded-lg inline-block">
              <Image src="/diwalya-logo.png" alt="Diwalya Admin" width={120} height={30} className="object-contain" />
           </div>
        </div>
        <nav className="flex-grow px-4 space-y-1">
          <Link href="/dashboard/admin" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <ShieldCheck size={20} /> Overview
          </Link>
          <Link href="/dashboard/admin/workers" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl font-bold transition-all">
            <Users size={20} /> Manage Workers
          </Link>
          <Link href="/dashboard/admin/bookings" className="flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-xl font-bold transition-all">
            <CheckCircle2 size={20} /> Oversight
          </Link>
        </nav>
      </aside>

      <main className="flex-grow ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">Booking Oversight</h1>
              <p className="text-gray-500">Monitor and resolve all platform service transactions.</p>
            </div>
            <div className="flex gap-4">
               <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                  <span className="text-sm font-bold text-gray-600">12 Live Jobs</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-8 group">
                <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
                  <div className="col-span-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Booking ID</p>
                    <p className="font-black text-primary text-lg">{booking.id}</p>
                    <p className="text-xs text-gray-500 font-bold">{booking.date}</p>
                  </div>

                  <div className="col-span-1 border-l pl-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Participants</p>
                    <div className="space-y-2">
                       <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-blue-50 text-primary text-[10px] font-black flex items-center justify-center">W</div>
                          <p className="text-xs font-bold text-gray-700">{booking.worker}</p>
                       </div>
                       <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-gray-50 text-gray-500 text-[10px] font-black flex items-center justify-center">C</div>
                          <p className="text-xs font-bold text-gray-700">{booking.client}</p>
                       </div>
                    </div>
                  </div>

                  <div className="col-span-1 border-l pl-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Service & Value</p>
                    <p className="font-bold text-gray-800">{booking.service}</p>
                    <p className="font-black text-gray-900">{booking.price}</p>
                  </div>

                  <div className="col-span-1 border-l pl-6 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</p>
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider w-fit ${
                      booking.status === 'Ongoing' ? 'bg-blue-100 text-blue-600' :
                      booking.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                   <button className="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold rounded-2xl transition-all text-xs flex items-center gap-2">
                      Details <ExternalLink size={14} />
                   </button>
                   <button className="p-3 text-gray-400 hover:text-red-500 transition-colors">
                      <AlertCircle size={20} />
                   </button>
                   <button className="p-3 text-gray-400 hover:text-gray-900 transition-colors">
                      <MoreVertical size={20} />
                   </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-blue-900 rounded-3xl text-white relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-2xl font-black mb-2">Dispute Management</h3>
                <p className="text-blue-200 max-w-lg mb-6">Review flagged jobs, late arrivals, or payment disputes from either clients or workers.</p>
                <button className="bg-white text-blue-900 px-8 py-3 rounded-2xl font-black hover:scale-105 transition-all shadow-xl">
                  Open Resolution Center
                </button>
             </div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
