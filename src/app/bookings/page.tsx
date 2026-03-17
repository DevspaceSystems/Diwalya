'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Briefcase, Calendar, MapPin, Clock, ChevronRight, Filter, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

// Enhanced Mock bookings data with all requested statuses
const MOCK_BOOKINGS = [
  {
    id: 'BK-9942',
    workerName: 'Kwame Mensah',
    service: 'Plumbing Repair',
    date: 'Oct 28, 2023',
    time: '10:00 AM',
    status: 'ACCEPTED',
    price: 150,
    address: 'Adum, Kumasi'
  },
  {
    id: 'BK-9950',
    workerName: 'Amma Serwaa',
    service: 'Electrical Wiring',
    date: 'Nov 02, 2023',
    time: '02:30 PM',
    status: 'PENDING',
    price: 450,
    address: 'East Legon, Accra'
  },
  {
    id: 'BK-7721',
    workerName: 'Kofi Owusu',
    service: 'Furniture Assembly',
    date: 'Oct 12, 2023',
    time: '09:00 AM',
    status: 'COMPLETED',
    price: 300,
    address: 'Bantama, Kumasi'
  },
  {
    id: 'BK-8801',
    workerName: 'Sarah Boateng',
    service: 'Home Cleaning',
    date: 'Oct 05, 2023',
    time: '08:00 AM',
    status: 'CANCELLED',
    price: 120,
    address: 'Osu, Accra'
  }
];

export default function BookingsPage() {
  const [activeFilter, setActiveFilter] = useState('ALL');

  const filteredBookings = MOCK_BOOKINGS.filter(booking => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'ACTIVE') return ['PENDING', 'ACCEPTED'].includes(booking.status);
    return booking.status === activeFilter;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING':
        return 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircle2 size={14} />;
      case 'PENDING':
        return <AlertCircle size={14} />;
      case 'CANCELLED':
        return <XCircle size={14} />;
      case 'COMPLETED':
        return <CheckCircle2 size={14} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-4">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">My Bookings</h1>
            <p className="text-gray-500 font-medium">Keep track of your service requests and their status</p>
          </div>
          
          <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
            {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeFilter === f 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filteredBookings.map((booking) => (
            <div 
              key={booking.id}
              className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/10 transition-colors">
                    <Briefcase size={36} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{booking.workerName}</h3>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </div>
                    </div>
                    <p className="text-primary font-black text-lg mb-4">{booking.service}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
                      <div className="flex items-center gap-2.5 text-sm text-gray-500 font-bold">
                        <Calendar size={18} className="text-gray-400" />
                        {booking.date}
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-gray-500 font-bold">
                        <Clock size={18} className="text-gray-400" />
                        {booking.time}
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-gray-500 font-bold col-span-full">
                        <MapPin size={18} className="text-gray-400" />
                        {booking.address}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end border-t md:border-t-0 pt-6 md:pt-0 border-gray-50">
                  <div className="text-right mb-6 md:mb-0">
                    <p className="text-3xl font-black text-gray-900 leading-none">₵{booking.price}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Service Fee</p>
                  </div>
                  
                  <button className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-2xl font-bold transition-all group/btn">
                    Details <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Status helper text */}
              {booking.status === 'PENDING' && (
                <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-center gap-3 text-sm text-blue-700 font-bold">
                   <AlertCircle size={18} />
                   Awaiting worker confirmation. You'll be notified once accepted.
                </div>
              )}
              {booking.status === 'ACCEPTED' && (
                <div className="mt-6 p-4 bg-green-50/50 rounded-2xl border border-green-100/50 flex items-center gap-3 text-sm text-green-700 font-bold">
                   <CheckCircle2 size={18} />
                   Worker has accepted! They will arrive at the scheduled time.
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200 shadow-inner">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <Briefcase size={48} className="text-gray-200" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">No bookings found</h2>
            <p className="text-gray-500 font-medium mb-10 max-w-xs mx-auto">It looks like you don't have any bookings in this category.</p>
            <Link 
              href="/search" 
              className="inline-flex bg-primary hover:bg-primary-light text-white px-10 py-4 rounded-[1.5rem] font-black shadow-xl shadow-primary/20 transition-all active:scale-95 uppercase tracking-widest text-sm"
            >
              Browse Workers
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
