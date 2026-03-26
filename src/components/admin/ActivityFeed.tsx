'use client';

import React, { useEffect, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, limitToLast, query } from 'firebase/database';
// import { ActivityType } from '@prisma/client';
import { 
  UserPlus, 
  Briefcase, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  Wallet, 
  AlertTriangle, 
  ShieldCheck, 
  Info,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Client-side config (from .env/props)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

const activityIcons: Record<string, any> = {
  REGISTRATION: { icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Registration' },
  BOOKING_REQUEST: { icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-50', label: 'New Booking' },
  BOOKING_ACCEPTED: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Booking Accepted' },
  BOOKING_REJECTED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Booking Rejected' },
  PAYMENT_COMPLETED: { icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Payment' },
  WALLET_WITHDRAWAL: { icon: Wallet, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Withdrawal' },
  REPORT_SUBMITTED: { icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50', label: 'Report' },
  VERIFICATION_REQUEST: { icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Verification Request' },
  VERIFICATION_APPROVED: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Verified worker' },
  SYSTEM_ALERT: { icon: Info, color: 'text-gray-700', bg: 'bg-gray-50', label: 'System Alert' },
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activitiesRef = query(ref(db, 'activities'), limitToLast(20));
    
    const unsubscribe = onValue(activitiesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert map of objects to sorted array
        const list = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        setActivities(list);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-700 font-bold uppercase tracking-widest text-xs">
        Connecting to live feed...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="text-center py-10 text-gray-700 font-medium">No recent activity detected.</div>
      ) : (
        activities.map((activity) => {
          const config = activityIcons[activity.type] || activityIcons.SYSTEM_ALERT;
          const Icon = config.icon;

          return (
            <div 
              key={activity.id} 
              className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all animate-in slide-in-from-right-4"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", config.bg, config.color)}>
                <Icon size={20} />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", config.color)}>
                    {config.label}
                  </span>
                  <span className="text-[10px] text-gray-700 font-bold flex items-center gap-1">
                    <Clock size={10} /> 
                    {new Date(activity.timestamp || activity.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-800 font-medium leading-tight">
                  {activity.content}
                </p>
                {activity.metadata?.jobId && (
                  <div className="mt-2 text-[10px] font-black text-primary opacity-60 uppercase tracking-tighter">
                    Ref: {activity.metadata.jobId.slice(-8)}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
