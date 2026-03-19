'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Verify role via server action (to prevent client-side spoofing)
      try {
        const { prisma } = await import('@/lib/prisma'); // This won't work in client, use action
        const { ensureAdmin } = await import('@/app/actions/auth');
        
        // We look up by email or id from the session
        const userEmail = session.user.email;
        if (!userEmail) {
            router.push('/');
            return;
        }

        // We'll use a specific action for client check
        const { checkAdminAccess } = await import('@/app/actions/auth-check');
        const hasAccess = await checkAdminAccess(userEmail);
        
        if (!hasAccess) {
          setIsAuthorized(false);
          setTimeout(() => router.push('/'), 3000);
        } else {
          setIsAuthorized(true);
        }
      } catch (err) {
        console.error('Auth Check Error:', err);
        setIsAuthorized(false);
        router.push('/');
      }
    }

    checkAuth();
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-8">
        <Loader2 className="animate-spin text-primary mb-6" size={48} />
        <h2 className="text-2xl font-black tracking-tight">Verifying Security Clearance...</h2>
        <p className="text-slate-400 mt-2 font-medium">Please wait while we validate your administrative privileges.</p>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-8 text-center">
        <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-red-500">Access Denied</h2>
        <p className="text-slate-400 mt-4 max-w-md font-medium text-lg">
          You do not have the required permissions to access the Super Admin Dashboard.
        </p>
        <p className="text-slate-500 mt-8 text-sm italic">Redirecting you to safety...</p>
      </div>
    );
  }

  return <>{children}</>;
}
