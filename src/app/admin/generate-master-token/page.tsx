'use client';

import React, { useState } from 'react';
import { generateAdminToken } from '@/app/actions/admin-setup';
import { Loader2, Key, Copy, CheckCircle2 } from 'lucide-react';

export default function GenerateTokenPage() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newToken = await generateAdminToken(email || undefined);
      setToken(newToken);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/admin/setup/${token.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-2 tracking-tighter flex items-center gap-3">
          <Key className="text-blue-500" /> Genesis Token
        </h1>
        <p className="text-slate-500 text-sm mb-8 font-medium">Generate a one-time secure link for Super Admin initialization.</p>

        {!token ? (
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4 block mb-2">Restrict to Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-700 outline-none focus:border-blue-500/30 transition-all font-bold"
                placeholder="admin@diwalya.com"
              />
            </div>
            <button
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Generate Secure Link'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="p-6 bg-slate-950 rounded-2xl border border-blue-500/20 break-all">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 font-mono">Secure Token Created</p>
              <p className="text-slate-300 font-mono text-xs">{token.token}</p>
            </div>
            
            <button
              onClick={copyToClipboard}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              {copied ? <><CheckCircle2 size={18} className="text-green-500" /> Copied!</> : <><Copy size={18} /> Copy Setup URL</>}
            </button>

            <p className="text-[10px] text-slate-600 font-bold text-center uppercase tracking-widest">Expires in 24 hours • One-time use only</p>
          </div>
        )}
      </div>
    </div>
  );
}
