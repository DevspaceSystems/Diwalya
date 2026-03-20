'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // When the user clicks the link in their email, Supabase creates a session 
    // and triggers a PASSWORD_RECOVERY event if configured, or just logs them in.
    // They are now authenticated and can update their password.
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Technically, the hash in URL logs them in. But if not...
        setError('No active session found. Please request a new password reset link.');
      }
    };
    checkUser();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      // Update password hash in our DB as well
      if (!error) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await fetch('/api/user/update-password', {
             method: 'POST',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify({ userId: user.id }),
          }).catch(console.error); // Best effort, not strictly blocking
        }
      }

      if (error) {
        throw error;
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
         <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-3">
             <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform shadow-lg shadow-primary/20">
               <span className="text-white font-black text-2xl tracking-tighter">D</span>
             </div>
             <span className="text-3xl font-black tracking-tight text-gray-900">Diwalya</span>
          </Link>
        </div>
        <h2 className="text-center text-3xl font-black text-gray-900 tracking-tight">Set New Password</h2>
        <p className="mt-2 text-center text-sm font-bold text-gray-500">
          Almost there! Enter your new password below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-[2rem] sm:px-10 border border-gray-100">
          {success ? (
            <div className="text-center py-6">
               <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-500" />
               </div>
               <h3 className="text-xl font-black text-gray-900 mb-2">Password Updated!</h3>
               <p className="text-sm font-medium text-gray-500 mb-8">
                 Your password has been changed successfully. Redirecting to login...
               </p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleUpdatePassword}>
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[13px] font-bold flex gap-3 animate-in slide-in-from-top-2">
                  <AlertCircle size={18} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="password" className="text-[10px] uppercase tracking-widest font-black text-gray-400 px-2">
                  New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    className="block w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-sm font-bold placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Enter at least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-[1.5rem] shadow-xl shadow-primary/20 text-sm font-black text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>Update Password <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
