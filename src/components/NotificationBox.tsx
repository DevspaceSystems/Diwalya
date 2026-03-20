'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Clock, Briefcase, UserCheck, ShieldAlert, CreditCard, ExternalLink, X } from 'lucide-react';
import { getUserNotifications } from '@/app/actions/notification';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NotificationBoxProps {
  userId: string;
  onClose: () => void;
}

export default function NotificationBox({ userId, onClose }: NotificationBoxProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getUserNotifications(userId);
      if (res.success) {
        setNotifications(res.data || []);
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_REQUEST':
      case 'BOOKING_ACCEPTED':
      case 'BOOKING_REJECTED':
        return <Briefcase className="text-blue-500" size={16} />;
      case 'VERIFICATION_REQUEST':
      case 'VERIFICATION_APPROVED':
        return <UserCheck className="text-indigo-500" size={16} />;
      case 'PAYMENT_COMPLETED':
        return <CreditCard className="text-emerald-500" size={16} />;
      case 'SYSTEM_ALERT':
      case 'REPORT_SUBMITTED':
        return <ShieldAlert className="text-red-500" size={16} />;
      default:
        return <Bell className="text-gray-400" size={16} />;
    }
  };

  return (
    <div className="absolute right-0 mt-4 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in zoom-in duration-200 origin-top-right">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-lg font-black text-gray-900 tracking-tight">Recent Alerts</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400">
           <X size={18} />
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">
            Syncing updates...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-200">
                <Bell size={24} />
             </div>
             <p className="text-gray-400 font-bold text-sm">All clear! No new alerts.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif) => (
              <div key={notif.id} className="p-6 hover:bg-gray-50 transition-colors group">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-bold text-gray-900 leading-tight mb-1">{notif.content}</p>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                         <Clock size={10} /> {new Date(notif.createdAt).toLocaleDateString()}
                       </span>
                       <button className="text-[10px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                         Details
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50/50 text-center border-t border-gray-50">
         <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors">
            Clear All Notifications
         </button>
      </div>
    </div>
  );
}
