'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  Image as ImageIcon, 
  Film, 
  Plus, 
  Trash2,
  ExternalLink,
  LayoutDashboard,
  Briefcase,
  Wallet,
  Settings,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import MediaUpload from '@/components/ui/MediaUpload';
import { cn } from '@/lib/utils';
import WorkerSidebar from '@/components/WorkerSidebar';

export default function WorkerPortfolioPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [portfolioVideos, setPortfolioVideos] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUser(session.user);

      const { data: wp } = await supabase.from('WorkerProfile').select('*').eq('userId', session.user.id).single();
      if (wp) {
        setProfile(wp);
        setPortfolioImages(wp.portfolioImages || []);
        setPortfolioVideos(wp.portfolioVideos || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSuccess(false);
    try {
      const { error } = await supabase
        .from('WorkerProfile')
        .upsert({ 
          userId: user.id,
          id: profile?.id || `WP-${user.id}`,
          portfolioImages,
          portfolioVideos,
          updatedAt: new Date().toISOString()
        }, { onConflict: 'userId' });

      if (error) throw error;
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
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10 pb-24">
      <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Work Portfolio</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Showcase your best work</p>
          </div>
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 font-black text-sm bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 animate-in fade-in zoom-in">
              <CheckCircle2 size={16} /> Portfolio Updated
            </div>
          )}
      </div>

        <div className="p-8 max-w-5xl mx-auto space-y-10">
           <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white overflow-hidden relative group">
              <div className="relative z-10">
                 <h2 className="text-3xl font-black mb-4 tracking-tight">Showcase Your Best Work 💎</h2>
                 <p className="text-slate-400 font-bold max-w-md leading-relaxed text-sm">
                   Upload high-quality photos and videos of your completed projects. Verified portfolios get <span className="text-white">3x more job requests</span> on Diwalya.
                 </p>
              </div>
              <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-700">
                 <ImageIcon size={200} />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Image Portfolio */}
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                          <ImageIcon size={20} />
                       </div>
                       <h3 className="font-black text-gray-900">Work Photos</h3>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{portfolioImages.length} / 6</span>
                 </div>

                 <MediaUpload
                   label="Upload Project Photos"
                   accept="image/*"
                   maxFiles={6}
                   bucket="diwalya-media"
                   folder={`portfolios/${user?.id}/images`}
                   existingUrls={portfolioImages}
                   onUploadComplete={setPortfolioImages}
                 />
                 
                 <p className="text-[10px] text-gray-400 font-bold italic">Max 5MB per image. PNG, JPG supported.</p>
              </div>

              {/* Video Portfolio */}
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
                          <Film size={20} />
                       </div>
                       <h3 className="font-black text-gray-900">Work Videos</h3>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{portfolioVideos.length} / 3</span>
                 </div>

                 <MediaUpload
                   label="Upload Project Videos"
                   accept="video/*"
                   maxFiles={3}
                   bucket="diwalya-media"
                   folder={`portfolios/${user?.id}/videos`}
                   existingUrls={portfolioVideos}
                   onUploadComplete={setPortfolioVideos}
                 />

                 <p className="text-[10px] text-gray-400 font-bold italic">Max 10MB per video. MP4, MOV supported.</p>
              </div>
           </div>

           <div className="flex justify-center pt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full md:w-auto px-12 py-5 bg-primary text-white font-black rounded-[2rem] shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"
              >
                {saving ? <Loader2 className="animate-spin" size={24} /> : <><CheckCircle2 size={24} /> Save Portfolio Updates</>}
              </button>
           </div>
        </div>
    </div>
  );
}
