'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { validateAdminToken, consumeAdminToken } from '@/app/actions/admin-setup';

export default function AdminTokenSetupPage() {
  const params = useParams();
  const token = params.token as string;
  const [tokenStatus, setTokenStatus] = useState<'LOADING' | 'VALID' | 'INVALID' | 'EXPIRED' | 'USED'>('LOADING');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkToken() {
      const result = await validateAdminToken(token);
      if (result.success) {
        setTokenStatus('VALID');
        if (result.token?.email) setEmail(result.token.email);
      } else {
        if (result.message?.includes('Invalid')) setTokenStatus('INVALID');
        else if (result.message?.includes('expired')) setTokenStatus('EXPIRED');
        else if (result.message?.includes('used')) setTokenStatus('USED');
      }
    }
    checkToken();
  }, [token]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenStatus !== 'VALID') return;
    
    setIsLoading(true);
    setError('');

    try {
      // 1. Create Supabase Auth User
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: 'SUPER_ADMIN',
          },
        },
      });
      if (signupError) throw signupError;
      
      // 2. Consume Token
      await consumeAdminToken(token);
      
      setIsSuccess(true);
      setTimeout(() => router.push('/dashboard/admin'), 2000);
    } catch (err: any) {
      setError(err.message || 'Setup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenStatus === 'LOADING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (tokenStatus !== 'VALID') {
    const messages = {
      INVALID: 'This link is invalid or malformed.',
      EXPIRED: 'This secure setup link has expired.',
      USED: 'This secure setup link has already been used.',
    };

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">Link Deactivated</h1>
        <p className="text-slate-500 max-w-sm mb-8 font-medium">{messages[tokenStatus as keyof typeof messages]}</p>
        <Link href="/login" className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all border border-white/5">
          Back to Login
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-center">
        <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-[2.5rem] flex items-center justify-center mb-8 border border-green-500/20 animate-bounce">
          <CheckCircle2 size={56} />
        </div>
        <h1 className="text-4xl font-black text-white mb-4 tracking-tighter">Root Initialized</h1>
        <p className="text-slate-500 max-w-sm mb-8 text-lg font-medium">Your Super Admin account is now active. Launching Command Center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Image src="/diwalya-logo.png" alt="Diwalya Logo" width={200} height={50} className="object-contain brightness-0 invert mx-auto mb-10 opacity-80" />
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-xl shadow-blue-500/5">
           <ShieldCheck size={14} /> One-Time Setup Protocol
        </div>
        <h2 className="text-4xl font-black text-white tracking-tighter mb-4 leading-none">
          Genesis Access
        </h2>
        <p className="text-slate-500 font-bold max-w-[320px] mx-auto leading-relaxed text-sm">
          Initialize the primary Super Admin account using this secure token.
        </p>
      </div>

      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/60 backdrop-blur-3xl py-12 px-10 shadow-[0_30px_70px_rgba(0,0,0,0.6)] rounded-[3.5rem] border border-white/5 relative overflow-hidden group border-t-blue-500/20">
          
          <form className="space-y-8 relative z-10" onSubmit={handleSetup}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-3xl text-sm text-red-400 font-bold animate-pulse text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 block">Identity Label</label>
              <div className="relative group/field focus-within:scale-[1.01] transition-transform duration-300">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-8 py-5 bg-slate-950/80 border border-slate-800 rounded-3xl text-white placeholder-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 outline-none transition-all font-bold text-lg"
                  placeholder="Super Admin"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 block">Root Email</label>
              <div className="relative group/field focus-within:scale-[1.01] transition-transform duration-300">
                <input
                  type="email"
                  required
                  value={email}
                  disabled={tokenStatus === 'VALID' && email !== ''}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-8 py-5 bg-slate-950/80 border border-slate-800 rounded-3xl text-white placeholder-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 outline-none transition-all font-bold text-lg disabled:opacity-50"
                  placeholder="admin@diwalya.com"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 block">Genesis Password</label>
              <div className="relative group/field focus-within:scale-[1.01] transition-transform duration-300">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-16 py-5 bg-slate-950/80 border border-slate-800 rounded-3xl text-white placeholder-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 outline-none transition-all font-black text-lg tracking-[0.4em]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-700 hover:text-blue-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-6 border border-transparent rounded-[2rem] shadow-[0_20px_40px_rgba(59,130,246,0.3)] text-xl font-black text-white bg-blue-600 hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] focus:outline-none transition-all disabled:opacity-70 gap-4"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-9 w-9" />
                ) : (
                  <>
                     Establish Root Access
                    <ArrowRight className="h-8 w-8" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-12 text-center text-slate-800 text-[10px] font-black uppercase tracking-[0.3em] px-8 leading-relaxed">
           Security Level: <span className="text-blue-500/60">Classified</span> • Protocol: <span className="text-blue-500/60">AES-256</span>
        </div>
      </div>
    </div>
  );
}
