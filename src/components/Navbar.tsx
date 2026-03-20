'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Wallet, 
  Settings, 
  Search, 
  Briefcase, 
  HelpCircle,
  Bell,
  ChevronDown,
  ClipboardList,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

import NotificationBox from './NotificationBox';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role || 'CLIENT');
      } else {
        setUser(null);
        setRole(null);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role || 'CLIENT');
      } else {
        setUser(null);
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Close menus on path change
  useEffect(() => {
    setIsProfileOpen(false);
  }, [pathname]);

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isSearchPage = pathname === '/search';
  const isDashboardPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin-portal');
  
  if (isAuthPage || isDashboardPage) return null;

  return (
    <nav className="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link 
              href={role === 'ADMIN' ? "/dashboard/admin" : "/"} 
              className="flex items-center transform hover:scale-105 transition-transform"
            >
              <Image src="/diwalya-logo.png" alt="Diwalya Logo" width={180} height={45} className="object-contain" priority />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {!isSearchPage && role !== 'ADMIN' && role !== 'WORKER' && (
              <>
                <Link href="/" className={cn("text-gray-600 hover:text-primary font-medium transition-colors", pathname === '/' && "text-primary font-bold")}>Home</Link>
                <Link href="/search" className={cn("text-gray-600 hover:text-primary font-medium transition-colors flex items-center gap-2", pathname === '/search' && "text-primary font-bold")}>
                  <Search size={18} /> Search
                </Link>
              </>
            )}
                {!user ? (
                  <>
                    {!isSearchPage && (
                      <>
                        <Link href="/bookings" className={cn("text-gray-600 hover:text-primary font-medium transition-colors", pathname === '/bookings' && "text-primary font-bold")}>Bookings</Link>
                        <Link href="/signup" className="text-gray-600 hover:text-primary font-medium transition-colors">Join as Worker</Link>
                        <div className="flex items-center space-x-4 ml-4">
                          <Link href="/login" className="text-primary font-semibold hover:text-primary-light transition-colors">Log in</Link>
                          <Link href="/signup" className="bg-primary hover:bg-primary-light text-white px-6 py-2.5 rounded-full font-semibold shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0">Sign up</Link>
                        </div>
                      </>
                    )}
                  </>
            ) : (
              <div className="flex items-center space-x-8">
                {/* Admin Links */}
                {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                  <Link href="/dashboard/admin" className={cn("text-primary hover:text-primary-light font-bold transition-colors flex items-center gap-2", pathname.startsWith('/dashboard/admin') && "text-primary underline underline-offset-8 decoration-2")}>
                    <ShieldCheck size={18} /> Admin Dashboard
                  </Link>
                )}

                {/* Worker Links - Hiding Dashboard and Wallet as per request */}
                {role === 'WORKER' && (
                  <>
                    {/* Intentionally left empty to remove links per user request */}
                  </>
                )}

                {/* Client Links */}
                {role === 'CLIENT' && (
                  <div className="flex items-center space-x-8">
                    <Link href="/special-request" className={cn("text-primary hover:text-primary-light font-bold transition-colors flex items-center gap-2", pathname === '/special-request' && "text-primary underline underline-offset-8 decoration-2")}>
                      <ClipboardList size={18} /> Request a Worker
                    </Link>
                    <Link href="/bookings" className={cn("text-secondary hover:text-secondary-light font-bold transition-colors flex items-center gap-2", pathname === '/bookings' && "text-secondary underline underline-offset-8 decoration-2")}>
                      <Briefcase size={18} /> My Bookings
                    </Link>
                  </div>
                )}

                <div className="flex items-center space-x-6 ml-4 border-l border-gray-100 pl-8">
                  <div className="relative">
                    <button 
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 text-gray-400 hover:text-primary transition-colors group"
                    >
                      <Bell size={22} />
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white group-hover:animate-ping"></span>
                    </button>
                    {showNotifications && user && (
                      <NotificationBox userId={user.id} onClose={() => setShowNotifications(false)} />
                    )}
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-3 p-1 pl-3 pr-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-all hover:border-primary/30 active:scale-95"
                    >
                      <div className="text-right hidden lg:block">
                        <p className="text-xs font-bold text-gray-900 leading-tight">{user.user_metadata?.full_name || 'My Account'}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{role}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all">
                        {user.user_metadata?.profilePicture ? (
                          <Image src={user.user_metadata.profilePicture} alt="Profile" width={40} height={40} className="object-cover" />
                        ) : (
                          <span className="text-lg">{user.user_metadata?.full_name?.charAt(0) || <User size={20} />}</span>
                        )}
                      </div>
                      <ChevronDown size={16} className={cn("text-gray-400 transition-transform duration-200", isProfileOpen && "rotate-180")} />
                    </button>

                    {isProfileOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                          <div className="px-4 py-3 border-b border-gray-50 mb-1">
                            <p className="text-sm font-bold text-gray-900 truncate">{user.user_metadata?.full_name}</p>
                            <p className="text-[10px] text-gray-500 truncate font-medium">{user.email}</p>
                          </div>
                          <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors">
                            <User size={18} className="text-gray-400" /> My Profile
                          </Link>
                          {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                            <Link href="/dashboard/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary font-bold hover:bg-primary/5 transition-colors">
                              <ShieldCheck size={18} className="text-primary" /> Command Center
                            </Link>
                          )}
                          {role === 'CLIENT' && (
                            <Link href="/bookings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors">
                              <Briefcase size={18} className="text-gray-400" /> My Bookings
                            </Link>
                          )}
                          {role === 'WORKER' && (
                            <Link href="/dashboard/worker/wallet" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors">
                              <Wallet size={18} className="text-gray-400" /> My Wallet
                            </Link>
                          )}
                          <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors border-t border-gray-50 mt-1 pt-2">
                            <Settings size={18} className="text-gray-400" /> Settings
                          </Link>
                          <button 
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1"
                          >
                            <LogOut size={18} /> Sign Out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Notification Button (if any) */}
          <div className="md:hidden flex items-center gap-3">
            {user && (
              <button className="relative p-2 text-gray-400 hover:text-primary transition-colors">
                <Bell size={22} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
