'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  Wallet, 
  Settings, 
  Bell, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  MessageSquare,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import NotificationBell from '@/components/ui/NotificationBell';
import SupabaseImage from '@/components/ui/SupabaseImage';

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { getWorkerProfile, getWorkerById } = await import('@/app/actions/worker');
        const profileRes = await getWorkerProfile(session.user.id);
        if (profileRes.success) {
          setWorkerProfile(profileRes.data);
        }
        // Fetch full user record for profile picture source
        const userRes = await getWorkerById(session.user.id);
        if (userRes.success) {
          setUser(userRes.data);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    }
    loadUser();
  }, [router]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard/worker', icon: LayoutDashboard },
    { name: 'My Jobs', href: '/dashboard/worker/jobs', icon: Briefcase },
    { name: 'Inspections', href: '/dashboard/worker/inspections', icon: CheckCircle2 },
    { name: 'Estimates', href: '/dashboard/worker/estimates', icon: TrendingUp },
    { name: 'Progress Tracking', href: '/dashboard/worker/progress', icon: ActivityIcon },
    { name: 'Earnings & Wallet', href: '/dashboard/worker/wallet', icon: Wallet },
    { name: 'Notifications', href: '/dashboard/worker/notifications', icon: Bell },
    { name: 'Messages', href: '/dashboard/worker/messages', icon: MessageSquare },
    { name: 'My Profile', href: '/dashboard/worker/profile', icon: User },
    { name: 'Reports & Issues', href: '/dashboard/worker/reports', icon: Bell },
    { name: 'Settings', href: '/dashboard/worker/settings', icon: Settings },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Portal...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex overflow-x-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-gray-100 z-50 overflow-y-auto">
        <div className="p-8">
           <Link href="/dashboard/worker" className="inline-block">
              <img src="/diwalya-logo.png" alt="Diwalya" className="h-8 object-contain" />
           </Link>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3 ml-1">Professional Panel</p>
        </div>

        <nav className="flex-grow px-4 space-y-1 pb-10">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300",
                pathname === item.href
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-600 hover:bg-gray-50 hover:text-primary"
              )}
            >
              <item.icon className="mr-3 h-5 w-5 shrink-0" />
              {item.name}
              {pathname === item.href && (
                 <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
           <button 
             onClick={async () => {
                await supabase.auth.signOut();
                router.push('/');
             }}
             className="w-full flex items-center px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
           >
              <LogOut className="mr-3 h-5 w-5" /> Logout Account
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow lg:pl-64 flex flex-col min-h-screen w-full bg-gray-50">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 w-full shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors">
               <Menu size={24} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Professional Portal</h1>
              <div className="flex items-center gap-2 mt-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Session</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-4 pl-6 border-l border-gray-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 leading-none mb-2">{user?.name || user?.user_metadata?.full_name || 'Worker'}</p>
                <div className={cn(
                  "text-[9px] font-black uppercase tracking-widest flex items-center justify-end gap-1.5 px-2.5 py-1 rounded-full border shadow-sm",
                  workerProfile?.isVerified 
                    ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
                    : "text-amber-700 bg-amber-50 border-amber-200"
                )}>
                  {workerProfile?.isVerified ? (
                    <><ShieldCheck size={12} className="fill-emerald-50" /> Verified</>
                  ) : (
                    <><Clock size={12} /> Verification Pending</>
                  )}
                </div>
              </div>
              <Link 
                href="/dashboard/worker/profile" 
                className="relative w-11 h-11 rounded-2xl bg-white flex items-center justify-center font-black text-lg border border-gray-100 overflow-hidden shadow-md ring-2 ring-white shrink-0 hover:ring-primary/20 transition-all active:scale-95"
              >
                <SupabaseImage 
                  src={user?.profilePicture || workerProfile?.profilePicture} 
                  alt={user?.name || 'Worker'} 
                  width={44}
                  height={44}
                  className="w-full h-full object-cover" 
                />
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-grow relative z-0">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white z-[70] flex flex-col lg:hidden animate-in slide-in-from-left duration-300 shadow-xl">
             <div className="p-8 flex items-center justify-between">
                <div className="rounded-xl">
                   <img src="/diwalya-logo.png" alt="Diwalya" className="h-6" />
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:bg-gray-100 p-2 rounded-xl transition-colors">
                   <X size={24} />
                </button>
             </div>
             <nav className="flex-grow px-4 space-y-1 overflow-y-auto pb-10">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-4 text-sm font-bold rounded-xl transition-all",
                      pathname === item.href
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-slate-600 hover:bg-gray-50 hover:text-primary"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
                <div className="pt-6 mt-6 border-t border-gray-100">
                  <button 
                    onClick={async () => {
                        await supabase.auth.signOut();
                        router.push('/');
                    }}
                    className="w-full flex items-center px-4 py-4 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                      <LogOut className="mr-3 h-5 w-5" /> Logout Account
                  </button>
                </div>
             </nav>
          </aside>
        </>
      )}
    </div>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
}
