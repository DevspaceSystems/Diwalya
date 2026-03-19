'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminAuthPage() {
  const [isAdminSetup, setIsAdminSetup] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function checkAdminExists() {
      // In a real app, we'd use a server action or a specialized API
      // Here we'll check via Supabase if possible, or assume 0 if error (for setup phase)
      try {
        const { data, error } = await supabase
          .from('User')
          .select('id')
          .eq('role', 'ADMIN')
          .limit(1);
        
        setIsAdminSetup(!data || data.length === 0);
      } catch (err) {
        setIsAdminSetup(true); // Default to setup on error/first run
      }
    }
    checkAdminExists();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isAdminSetup) {
        // Sign up as first admin
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              role: 'ADMIN',
            },
          },
        });
        if (signupError) throw signupError;
        router.push('/dashboard/admin');
      } else {
        // Regular login
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;
        
        // Verify role
        if (data.user?.user_metadata?.role !== 'ADMIN') {
          await supabase.auth.signOut();
          throw new Error('Access denied. This portal is for administrators only.');
        }
        
        router.push('/dashboard/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAdminSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="flex justify-center mb-8">
          <Image src="/diwalya-logo.png" alt="Diwalya Logo" width={220} height={55} className="object-contain brightness-0 invert" />
        </Link>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest mb-6">
           <ShieldAlert size={14} /> Admin Secure Access
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight mb-2">
          {isAdminSetup ? 'Primary Admin Setup' : 'Administrator Login'}
        </h2>
        <p className="text-slate-400 font-medium">
          {isAdminSetup 
            ? 'No administrator found. Create the primary root account.' 
            : 'Enter your credentials to access the command center.'}
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-xl py-10 px-6 shadow-2xl rounded-[2.5rem] sm:px-10 border border-slate-700/50">
          <form className="space-y-6" onSubmit={handleAuth}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-sm text-red-400 font-bold animate-in shake-in">
                {error}
              </div>
            )}
            
            {isAdminSetup && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ShieldCheck className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                    placeholder="Admin Name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                  placeholder="admin@diwalya.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Secure Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-5 border border-transparent rounded-2xl shadow-xl text-lg font-black text-white bg-red-600 hover:bg-red-500 focus:outline-none transition-all transform active:scale-[0.98] disabled:opacity-70 gap-3"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                <>
                  {isAdminSetup ? 'Initialize Admin' : 'Access Commands'}
                  <ArrowRight className="h-6 w-6" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-10 text-center text-slate-500 text-xs font-medium">
          Protected by Diwalya Sentinel System. Unauthorised access attempts are logged.
        </p>
      </div>
    </div>
  );
}
