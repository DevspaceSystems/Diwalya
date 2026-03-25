'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Loader2, ShieldCheck, Briefcase, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { sendWelcomeNotification } from '@/app/actions/broadcasts';


export default function SignupPage() {
  const [role, setRole] = useState<'CLIENT' | 'WORKER'>('CLIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Removed multi-step states as per user request to use the previous UI
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Check if user already exists with a different role
      const { data: existingUser } = await supabase
        .from('User')
        .select('role')
        .eq('email', email)
        .single();
      
      if (existingUser && existingUser.role !== role) {
        throw new Error(`This email is already registered as a ${existingUser.role === 'WORKER' ? 'Worker' : 'Client'}. Please log in as a ${existingUser.role === 'WORKER' ? 'Worker' : 'Hire Talent'} instead.`);
      }

      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
          },
        },
      });

      if (signupError) throw signupError;

      if (data?.user) {
        // Await the sync to ensure User record exists for Storage permissions/Profile creation
        await sendWelcomeNotification(data.user.id, name, email, role);
      }

      // If session is null, email confirmation is likely required in Supabase settings
      if (!data.session) {
        setIsSuccess(true);
        setError('');
        return;
      }

      // Redirect based on role
      // Redirect based on role - Using window.location for a clean state
      window.location.href = role === 'WORKER' ? '/dashboard/worker' : '/dashboard/client';
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
        <div className="text-center">
          <Link href="/">
            <Image src="/diwalya-logo.png" alt="Diwalya Logo" width={180} height={45} className="mx-auto mb-6 cursor-pointer" />
          </Link>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Create your account</h2>
          <p className="mt-2 text-sm text-gray-500 font-bold">Choose your role to get started</p>
        </div>

        {/* Role Selection */}
        <div className="flex p-1.5 bg-gray-50 rounded-xl mb-8">
          <button
            type="button"
            onClick={() => setRole('CLIENT')}
            className={`flex-1 flex items-center justify-center p-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${
              role === 'CLIENT' 
              ? 'bg-white text-primary shadow-sm border border-gray-100' 
              : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <User className="mr-2" size={16} /> Hire Talent
          </button>
          <button
            type="button"
            onClick={() => setRole('WORKER')}
            className={`flex-1 flex items-center justify-center p-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${
              role === 'WORKER' 
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
              : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Briefcase className="mr-2" size={16} /> Work & Earn
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3">
              <ShieldCheck className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700 font-bold">{error}</p>
            </div>
          )}

          {isSuccess && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" size={20} />
                <h3 className="text-green-800 font-black uppercase text-xs tracking-widest">Account Created!</h3>
              </div>
              <p className="text-sm text-green-700 font-bold">
                Please check your email (<span className="underline">{email}</span>) to confirm your account before logging in.
              </p>
              <Link href="/login" className="inline-block text-xs font-black text-primary uppercase tracking-widest py-2">
                Continue to Login →
              </Link>
            </div>
          )}
          
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none relative block w-full pl-12 pr-3 py-3.5 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm font-bold bg-white"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Email Address</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full pl-12 pr-3 py-3.5 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm font-bold bg-white"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Password</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-12 pr-12 py-3.5 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm font-bold bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input required type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer" />
            <label className="ml-3 block text-sm text-gray-500 font-bold">
              I agree to the <span className="text-primary hover:underline cursor-pointer">Terms</span> and <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-black rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all active:scale-[0.98] ${
                role === 'WORKER' 
                ? 'bg-slate-900 hover:bg-slate-800 focus:ring-slate-500 shadow-lg shadow-slate-200' 
                : 'bg-primary hover:bg-primary-light focus:ring-primary shadow-lg shadow-primary/20'
              } disabled:opacity-50`}
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-6 w-6" />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 font-bold">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary-light transition-colors">
            Log in instead
          </Link>
        </p>
      </div>
      
      <div className="mt-8 flex items-center justify-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">
        <ShieldCheck size={16} className="text-primary" />
        Data is encrypted and secure with 256-bit SSL
      </div>
    </div>
  );
}
