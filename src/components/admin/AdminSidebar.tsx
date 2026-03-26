'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Briefcase, 
  CreditCard, 
  LayoutDashboard, 
  Settings, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp,
  ClipboardList,
  Search,
  Bell,
  MoreVertical,
  FileText,
  DollarSign,
  Mail,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const sidebarLinks = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/admin/users', label: 'Clients', icon: Users },
  { href: '/dashboard/admin/workers', label: 'Workers', icon: Briefcase },
  { href: '/dashboard/admin/bookings', label: 'Bookings', icon: ClipboardList },
  { href: '/dashboard/admin/inspections', label: 'Inspections', icon: FileText },
  { href: '/dashboard/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { href: '/dashboard/admin/disputes', label: 'Disputes', icon: ShieldAlert },
  { href: '/dashboard/admin/notifications', label: 'Push Notifications', icon: Bell },
  { href: '/dashboard/admin/emails', label: 'Emailing', icon: Mail },
  { href: '/dashboard/admin/withdrawals', label: 'Withdrawals', icon: TrendingUp },
  { href: '/dashboard/admin/special-requests', label: 'Special Requests', icon: FileText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/admin/logout', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.redirect) {
        router.push(data.redirect);
      }
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-700 flex flex-col h-full border-r border-white/5 shadow-2xl overflow-y-auto">
      <div className="p-8">
         <div className="bg-white p-2 rounded-lg inline-block">
            <Image src="/diwalya-logo.png" alt="Diwalya Admin" width={120} height={30} className="object-contain" />
         </div>
         <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mt-2 ml-1">Admin Panel</p>
      </div>
      
      <nav className="flex-grow px-4 space-y-1 overflow-y-auto scrollbar-hide custom-scrollbar">
        {sidebarLinks.map((link) => (
          <Link 
            key={link.href}
            href={link.href} 
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
              pathname === link.href 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "hover:bg-white/5 hover:text-white"
            )}
          >
            <link.icon size={20} /> {link.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
         <Link 
          href="/dashboard/admin/settings" 
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
            pathname === '/dashboard/admin/settings' 
              ? "bg-primary text-white" 
              : "hover:bg-white/5 hover:text-white"
          )}
        >
          <Settings size={20} /> System Settings
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={20} /> Secure Logout
        </button>
      </div>
    </div>
  );
}
