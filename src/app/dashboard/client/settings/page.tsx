'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, Loader2, CheckCircle2, User, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/image-utils';

export default function ClientSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [profilePicture, setProfilePicture] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [success, setSuccess] = useState(false);
  const picInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUser(session.user);

      const { data: userData } = await supabase
        .from('User')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userData) {
        setProfilePicture(userData.profilePicture || '');
        setName(userData.name || session.user.user_metadata?.full_name || '');
        setPhone(userData.phone || '');
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPic(true);
    try {
      let uploadFile = file;
      if (file.type.startsWith('image/')) {
        uploadFile = await compressImage(file, 0.9);
      }
      const ext = file.name.split('.').pop();
      const path = `profiles/${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('diwalya-media')
        .upload(path, uploadFile, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from('diwalya-media').getPublicUrl(path);
      setProfilePicture(data.publicUrl);

      await supabase.from('User').update({ profilePicture: data.publicUrl }).eq('id', user.id);
    } catch (err: any) {
      alert(err.message || 'Upload failed. Make sure the Supabase storage bucket is set up.');
    } finally {
      setUploadingPic(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('User').update({
        name,
        phone: phone || null,
        updatedAt: new Date().toISOString()
      }).eq('id', user.id);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={36} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b z-50 h-20 flex items-center px-6 gap-4">
        <Link href="/dashboard/client" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft size={22} />
        </Link>
        <div>
          <h1 className="font-black text-xl text-slate-900 tracking-tight leading-none">My Profile</h1>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">Account Settings</p>
        </div>
        {success && (
          <div className="ml-auto flex items-center gap-2 text-emerald-600 font-black text-sm bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
            <CheckCircle2 size={16} /> Saved!
          </div>
        )}
      </header>

      <main className="pt-28 pb-32 px-6 max-w-lg mx-auto space-y-6">
        {/* Profile Picture */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-[2rem] bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-slate-300" />
              )}
            </div>
            <button
              type="button"
              onClick={() => picInputRef.current?.click()}
              disabled={uploadingPic}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              {uploadingPic ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            </button>
            <input ref={picInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
          </div>
          <div className="text-center">
            <p className="font-black text-slate-900 text-lg">{name}</p>
            <p className="text-xs text-slate-400 font-bold">{user?.email}</p>
            <button
              type="button"
              onClick={() => picInputRef.current?.click()}
              className="mt-2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
            >
              Upload Photo
            </button>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Info</p>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full p-4 pl-10 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full p-4 pl-10 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-400 text-sm outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Phone Number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+233 XX XXX XXXX"
                className="w-full p-4 pl-10 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} /> Save Changes</>}
          </button>
        </form>
      </main>
    </div>
  );
}
