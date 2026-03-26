'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, ShieldCheck, Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import NotificationBell from '../ui/NotificationBell';
import { AdminSidebar } from './AdminSidebar';

export function AdminHeader() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { getUserProfile } = await import('@/app/actions/user');
        const res = await getUserProfile(session.user.id);
        if (res.success) setUserProfile(res.data);
      }
    });
  }, []);

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-300 pointer-events-auto flex flex-col">
             <AdminSidebar />
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-[-50px] w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl"
            >
               <span className="font-black text-slate-900 text-xl">×</span>
            </button>
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md border-b h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 w-full shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-50 rounded-xl text-slate-700"
          >
             <div className="w-6 h-0.5 bg-slate-600 mb-1" />
             <div className="w-6 h-0.5 bg-slate-600 mb-1" />
             <div className="w-6 h-0.5 bg-slate-600" />
          </button>
          <div className="flex items-center gap-4 bg-gray-100/50 px-4 py-2 rounded-2xl border border-gray-100 min-w-[200px] md:min-w-[300px] focus-within:border-primary/30 transition-all">
            <Search className="text-gray-700" size={18} />
            <input type="text" placeholder="Search..." className="bg-transparent w-full focus:outline-none text-sm font-medium" />
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <NotificationBell />
          <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-gray-900 leading-none">{userProfile?.name || 'Chief Systems Controller'}</p>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center justify-end gap-1 mt-1">
                <ShieldCheck size={12} /> Root Access
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-slate-900/20 hover:scale-105 transition-all overflow-hidden">
               {userProfile?.profilePicture ? (
                 <img src={userProfile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <Globe size={24} className="text-primary" />
               )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
