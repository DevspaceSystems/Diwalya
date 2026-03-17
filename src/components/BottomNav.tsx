'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, User, LogIn, Search, Wallet, LayoutDashboard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '../lib/utils';

export default function BottomNav() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                setRole(session.user.user_metadata?.role || 'CLIENT');
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
    }, []);

    const navItems = !user ? [
        { label: 'Home', href: '/', icon: Home },
        { label: 'Search', href: '/search', icon: Search },
        { label: 'Bookings', href: '/bookings', icon: Briefcase },
        { label: 'Login', href: '/login', icon: LogIn },
    ] : role === 'WORKER' ? [
        { label: 'Home', href: '/', icon: Home },
        { label: 'Search', href: '/search', icon: Search },
        { label: 'Dashboard', href: '/dashboard/worker', icon: LayoutDashboard },
        { label: 'Wallet', href: '/dashboard/worker/wallet', icon: Wallet },
        { label: 'Profile', href: '/profile', icon: User },
    ] : [
        { label: 'Home', href: '/', icon: Home },
        { label: 'Search', href: '/search', icon: Search },
        { label: 'Bookings', href: '/bookings', icon: Briefcase },
        { label: 'Profile', href: '/profile', icon: User },
    ];

    // Hide BottomNav on auth pages for a cleaner app feel
    const isAuthPage = pathname === '/login' || pathname === '/signup';
    if (isAuthPage) return null;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex justify-between items-center py-3 h-16 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link 
                            key={item.href} 
                            href={item.href} 
                            className={cn(
                                "flex flex-col items-center min-w-[60px] transition-all duration-300 relative",
                                isActive ? "text-primary -translate-y-1" : "text-gray-400"
                            )}
                        >
                            <item.icon size={22} className={cn("transition-all", isActive ? 'stroke-[2.5px]' : 'stroke-[2px]')} />
                            <span className={cn(
                                "text-[10px] sm:text-xs mt-1 font-bold tracking-tight transition-all duration-300",
                                isActive ? "opacity-100" : "opacity-80 font-medium"
                            )}>
                                {item.label}
                            </span>
                            {isActive && (
                                <span className="absolute -top-1 w-1 h-1 bg-primary rounded-full"></span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
