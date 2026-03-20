'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, Loader2, CheckCircle2, User, Briefcase, MapPin, DollarSign, Upload, LayoutDashboard, Wallet, Image as ImageIcon, Settings, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import MediaUpload from '@/components/ui/MediaUpload';
import { compressImage } from '@/lib/image-utils';

async function saveWorkerProfile(userId: string, data: any) {
  const { error } = await supabase
    .from('WorkerProfile')
    .upsert({ ...data, userId }, { onConflict: 'userId' });
  if (error) throw error;
}

async function saveUserProfilePicture(userId: string, profilePicture: string) {
  const { error } = await supabase
    .from('User')
    .update({ profilePicture, updatedAt: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

export default function WorkerSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const picInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    businessName: '',
    bio: '',
    category: '',
    location: '',
    experienceYears: 0,
    hourlyRate: 0,
    availability: '',
  });
  const [profilePicture, setProfilePicture] = useState<string>('');

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUser(session.user);

      const { data: userData } = await supabase.from('User').select('*').eq('id', session.user.id).single();
      if (userData) setProfilePicture(userData.profilePicture || '');

      const { data: wp } = await supabase.from('WorkerProfile').select('*').eq('userId', session.user.id).single();
      if (wp) {
        setProfile(wp);
        setForm({
          businessName: wp.businessName || '',
          bio: wp.bio || '',
          category: wp.category || '',
          location: wp.location || '',
          experienceYears: wp.experienceYears || 0,
          hourlyRate: wp.hourlyRate || 0,
          availability: wp.availability || '',
        });
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
      await supabase.storage.from('diwalya-media').upload(path, uploadFile, { upsert: true });
      const { data } = supabase.storage.from('diwalya-media').getPublicUrl(path);
      setProfilePicture(data.publicUrl);
      await saveUserProfilePicture(user.id, data.publicUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPic(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccess(false);
    try {
      await saveWorkerProfile(user.id, {
        id: profile?.id || `WP-${user.id}`,
        ...form,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-primary" size={36} />
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-end mb-8 px-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Profile Settings</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Management</p>
          </div>
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 font-black text-sm bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 size={16} /> Saved!
            </div>
          )}
      </div>

      <div className="py-12 px-6 max-w-2xl mx-auto space-y-8">
        {/* Profile Picture */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Profile Photo</p>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-[1.5rem] bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-slate-300" />
                )}
              </div>
              <button
                type="button"
                onClick={() => picInputRef.current?.click()}
                disabled={uploadingPic}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                {uploadingPic ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
              <input ref={picInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
            </div>
            <div>
              <p className="font-black text-slate-900">{user?.user_metadata?.full_name || 'Worker'}</p>
              <p className="text-xs text-slate-400 font-bold mt-1">{user?.email}</p>
              <button
                type="button"
                onClick={() => picInputRef.current?.click()}
                className="mt-2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
              >
                Change Photo
              </button>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Information</p>

            {[
              { key: 'businessName', label: 'Business / Trade Name', placeholder: 'e.g. Kwame Electrical Services' },
              { key: 'category', label: 'Service Category', placeholder: 'e.g. Electrician, Plumber, Painter' },
              { key: 'location', label: 'City / Region', placeholder: 'e.g. Accra, Kumasi' },
              { key: 'availability', label: 'Availability', placeholder: 'e.g. Mon-Sat, 8am-6pm' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">{field.label}</label>
                <input
                  type="text"
                  value={(form as any)[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  value={form.experienceYears}
                  onChange={e => setForm(f => ({ ...f, experienceYears: Number(e.target.value) }))}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Hourly Rate (GHS)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.hourlyRate}
                  onChange={e => setForm(f => ({ ...f, hourlyRate: Number(e.target.value) }))}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Professional Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Describe your skills, experience, and what makes you stand out..."
                rows={4}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-medium text-slate-900 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2rem] text-white flex items-center justify-between group overflow-hidden relative">
             <div className="relative z-10">
                <h4 className="font-black text-lg mb-1">Portfolio Management</h4>
                <p className="text-slate-400 text-xs font-bold">Showcase your work on a dedicated page</p>
                <Link href="/dashboard/worker/portfolio" className="mt-4 inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
                   View & Edit Portfolio <ArrowRight size={14} />
                </Link>
             </div>
             <ImageIcon size={100} className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-700" />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-5 bg-primary text-white font-black rounded-[2rem] shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Save Profile</>}
          </button>
        </form>
      </div>
    </div>
  );
}
