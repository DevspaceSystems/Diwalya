'use client';

import React from 'react';
import WorkerSidebar from '@/components/WorkerSidebar';
import NotificationBell from '@/components/ui/NotificationBell';
import { ShieldCheck, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<any>(null);
  const [workerProfile, setWorkerProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { getWorkerProfile } = await import('@/app/actions/worker');
        const profileRes = await getWorkerProfile(session.user.id);
        if (profileRes.success) {
          setWorkerProfile(profileRes.data);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:w-72 shrink-0">
        <WorkerSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-300">
            <WorkerSidebar />
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-[-50px] w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl"
            >
               <span className="font-black text-slate-900 text-xl">×</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-h-screen w-full">
        <header className="bg-white border-b h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 w-full shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-50 rounded-xl text-slate-500"
            >
               <div className="w-6 h-0.5 bg-current mb-1.5" />
               <div className="w-6 h-0.5 bg-current mb-1.5" />
               <div className="w-4 h-0.5 bg-current" />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">Professional Portal</h1>
              <div className="flex items-center gap-2 mt-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Active Session</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <NotificationBell />
            <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-gray-900 leading-none">{user?.user_metadata?.full_name || 'Worker'}</p>
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-widest flex items-center justify-end gap-1 mt-1.5",
                  workerProfile?.isVerified ? "text-emerald-500" : "text-amber-500"
                )}>
                  {workerProfile?.isVerified ? (
                    <><ShieldCheck size={12} /> Verified Pro</>
                  ) : (
                    <><Clock size={12} /> Verification Pending</>
                  )}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-lg border border-gray-200 overflow-hidden shadow-sm">
                {workerProfile?.profilePicture ? (
                  <img src={workerProfile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.user_metadata?.full_name?.charAt(0) || 'W'
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          {children}
        </main>
      </div>
    </div>
  );
}
