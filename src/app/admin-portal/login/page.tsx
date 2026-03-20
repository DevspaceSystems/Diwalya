'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, User, KeyRound, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function SecureAdminLogin() {
  const [step, setStep] = useState<'credentials' | 'totp'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload: any = { username, password };
      if (step === 'totp') {
        payload.totpCode = totpCode;
      }

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      if (data.requires2FA) {
        setStep('totp');
      } else if (data.success && data.redirect) {
        router.push(data.redirect);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-grid-white/[0.02] relative">
      <div className="absolute inset-0 bg-slate-900 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-8">
           <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-2xl">
              <ShieldCheck size={32} className="text-primary" />
           </div>
        </div>
        <h2 className="text-center text-2xl font-black text-white tracking-widest uppercase">
          Secure Portal Access
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-500">
          Authorized personnel only.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/50 backdrop-blur-xl py-8 px-4 shadow-2xl border border-slate-700 sm:rounded-[2rem] sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            {step === 'credentials' && (
              <div className="space-y-5 animate-in slide-in-from-bottom-2 fade-in">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                    Admin Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-sm font-bold text-white placeholder-slate-600 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                     Passphrase
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-12 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl text-sm font-bold text-white placeholder-slate-600 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'totp' && (
              <div className="space-y-5 flex flex-col items-center animate-in zoom-in-95 fade-in">
                 <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700 mb-2">
                    <KeyRound size={28} className="text-primary" />
                 </div>
                 <div className="text-center w-full">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       Two-Factor Authentication
                    </label>
                    <p className="text-sm font-medium text-slate-500 mt-1 mb-6">Enter the 6-digit code from your authenticator app.</p>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      className="block w-full text-center tracking-[0.5em] text-2xl py-4 bg-slate-900/50 border border-slate-700 rounded-2xl font-black text-white focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      placeholder="000000"
                    />
                 </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-lg text-sm font-black text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-primary transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-8"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (step === 'totp' ? 'Verify Code' : 'Authenticate')}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <Lock size={12} /> Access Logged and Monitored
            </p>
        </div>
      </div>
    </div>
  );
}
