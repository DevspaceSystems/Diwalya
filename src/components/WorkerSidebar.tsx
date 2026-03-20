'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Briefcase, 
  Search, 
  Calculator, 
  TrendingUp, 
  Wallet, 
  Bell, 
  MessageSquare, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  Settings, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard/worker', icon: LayoutDashboard },
  { name: 'My Jobs', href: '/dashboard/worker/jobs', icon: Briefcase },
  { name: 'Inspections', href: '/dashboard/worker/inspections', icon: Search },
  { name: 'Estimates', href: '/dashboard/worker/estimates', icon: Calculator },
  { name: 'Progress Tracking', href: '/dashboard/worker/progress', icon: TrendingUp },
  { name: 'Earnings & Wallet', href: '/dashboard/worker/wallet', icon: Wallet },
  { name: 'Notifications', href: '/dashboard/worker/notifications', icon: Bell },
  { name: 'Messages', href: '/dashboard/worker/messages', icon: MessageSquare },
  { name: 'My Profile', href: '/dashboard/worker/profile', icon: User },
  { name: 'Verification', href: '/dashboard/worker/verification', icon: ShieldCheck },
  { name: 'Reports & Issues', href: '/dashboard/worker/reports', icon: AlertCircle },
  { name: 'Settings', href: '/dashboard/worker/settings', icon: Settings },
];

export default function WorkerSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <aside className="w-full lg:w-72 bg-slate-900 text-slate-400 flex flex-col h-screen sticky top-0 overflow-y-auto no-scrollbar border-r border-slate-800/50">
      <div className="p-8 pb-10">
        <Link href="/">
           <div className="bg-white p-2.5 rounded-2xl inline-block shadow-lg shadow-white/5">
              <Image src="/diwalya-logo.png" alt="Diwalya" width={140} height={35} className="object-contain" />
           </div>
        </Link>
      </div>
      
      <nav className="flex-grow px-4 space-y-1.5 pb-10">
        <div className="px-4 mb-4">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Professional Panel</p>
        </div>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold transition-all group",
                isActive 
                  ? "bg-primary text-white shadow-xl shadow-blue-500/20" 
                  : "hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3.5">
                <Icon size={20} className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-primary transition-colors")} />
                <span className="text-[13px] tracking-tight">{item.name}</span>
              </div>
              {isActive && <ChevronRight size={14} className="text-white/50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800/50">
         <button 
           onClick={handleLogout}
           className="w-full flex items-center gap-3.5 px-4 py-4 hover:bg-red-500/10 hover:text-red-500 rounded-2xl font-bold transition-all text-slate-500"
         >
           <LogOut size={20} />
           <span className="text-[13px]">Logout Account</span>
         </button>
      </div>
    </aside>
  );
}
