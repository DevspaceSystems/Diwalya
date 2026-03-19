'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminSetupPage() {
  const [isAdminExists, setIsAdminExists] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function checkAdminExists() {
      try {
        const { data } = await supabase
          .from('User')
          .select('id')
          .eq('role', 'ADMIN')
          .limit(1);
        
        setIsAdminExists(data && data.length > 0);
      } catch (err) {
        setIsAdminExists(false);
      }
    }
    checkAdminExists();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdminExists) return;
    
    setIsLoading(true);
    setError('');

    try {
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
    } catch (err: any) {
      setError(err.message || 'Setup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAdminExists === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-red-500" size={32} />
      </div>
    );
  }

  if (isAdminExists) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Setup Restricted</h1>
        <p className="text-slate-500 max-w-sm mb-8">An administrator account already exists. For security, the one-time setup is no longer available.</p>
        <Link href="/admin/diwalya/login" className="px-8 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all">
          Proceed to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link href="/" className="flex justify-center mb-10 translate-y-[-10px]">
          <Image src="/diwalya-logo.png" alt="Diwalya Logo" width={240} height={60} className="object-contain brightness-0 invert" />
        </Link>
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[11px] font-black uppercase tracking-[0.2em] mb-8 shadow-lg shadow-blue-500/5">
           <ShieldCheck size={16} /> Initial Core Setup
        </div>
        <h2 className="text-4xl font-black text-white tracking-tighter mb-4 leading-none">
          Root Initialization
        </h2>
        <p className="text-slate-500 font-bold max-w-[280px] mx-auto leading-relaxed text-sm">
          You are the first admin. Establish the primary root account for the Diwalya platform.
        </p>
      </div>

      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/40 backdrop-blur-2xl py-12 px-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[3rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <form className="space-y-7 relative z-10" onSubmit={handleSetup}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-3xl text-sm text-red-400 font-bold animate-in shake-in shadow-inner text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4 block">Official Full Name</label>
              <div className="relative group/field focus-within:scale-[1.01] transition-transform">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <ShieldCheck className="h-5 w-5 text-slate-600 group-focus-within/field:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-950/50 border border-slate-800 rounded-3xl text-white placeholder-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 outline-none transition-all font-bold text-lg"
                  placeholder="Master Admin"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4 block">Core Email</label>
              <div className="relative group/field focus-within:scale-[1.01] transition-transform">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-600 group-focus-within/field:text-blue-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-950/50 border border-slate-800 rounded-3xl text-white placeholder-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 outline-none transition-all font-bold text-lg"
                  placeholder="admin@diwalya.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4 block">Genesis Password</label>
              <div className="relative group/field focus-within:scale-[1.01] transition-transform">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-600 group-focus-within/field:text-blue-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-14 py-5 bg-slate-950/50 border border-slate-800 rounded-3xl text-white placeholder-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 outline-none transition-all font-black text-lg tracking-[0.3em]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-6 border border-transparent rounded-3xl shadow-[0_10px_30px_rgba(59,130,246,0.3)] text-xl font-black text-white bg-blue-600 hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] focus:outline-none transition-all disabled:opacity-70 gap-4"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-8 w-8" />
                ) : (
                  <>
                     Complete Initialization
                    <ArrowRight className="h-7 w-7" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-12 text-center text-slate-700 text-[10px] font-black uppercase tracking-[0.2em] px-8 leading-relaxed">
           This is a one-time operation. Make sure to keep your credentials secure.
        </div>
      </div>
    </div>
  );
}
