'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  Mail, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  LogOut, 
  Camera, 
  Video, 
  Upload,
  Clock,
  CheckCircle,
  X,
  Plus
} from 'lucide-react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      setRole(session.user.user_metadata?.role || 'CLIENT');
      setLoading(false);
      
      // In a real app, fetch portfolio from Prisma or Supabase
      setPortfolio([
        'https://images.unsplash.com/photo-1581244276891-8bb092bba40a?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400'
      ]);
    };
    fetchUser();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleUploadWork = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      // Simulation of upload to Supabase Storage
      const mockUrl = URL.createObjectURL(file);
      setPortfolio(prev => [...prev, mockUrl]);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
       <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
       <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Profile...</p>
    </div>
  </div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-primary to-primary-light relative">
             <button onClick={handleSignOut} className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                <LogOut size={14} /> Sign Out
             </button>
          </div>
          <div className="px-8 pb-8 flex flex-col items-center sm:items-start sm:flex-row gap-6 -mt-12 relative z-10">
            <div className="w-32 h-32 rounded-[2rem] bg-white p-1.5 shadow-xl shrink-0">
               <div className="w-full h-full rounded-[1.7rem] bg-gray-50 overflow-hidden relative group">
                  {user.user_metadata?.profilePicture ? (
                    <Image src={user.user_metadata.profilePicture} alt="Profile" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary text-4xl font-black">
                      {user.user_metadata?.full_name?.charAt(0)}
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                    <Camera className="text-white" size={24} />
                    <input type="file" className="hidden" accept="image/*" />
                  </label>
               </div>
            </div>
            
            <div className="flex-grow text-center sm:text-left pt-14 sm:pt-12">
               <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                 <h1 className="text-3xl font-black text-gray-900">{user.user_metadata?.full_name}</h1>
                 {role === 'WORKER' && (
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100">
                     <ShieldCheck size={14} className="fill-green-50" /> Verified Worker
                   </span>
                 )}
               </div>
               <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-gray-500 font-bold text-sm">
                 <span className="flex items-center gap-1.5"><Mail size={16} className="text-gray-400" /> {user.email}</span>
                 <span className="flex items-center gap-1.5"><Briefcase size={16} className="text-gray-400" /> {role}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Role Specific Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Sidebar / Info */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Account Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-bold flex items-center gap-2"><Clock size={16} /> Joined</span>
                  <span className="text-gray-900 font-black">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-bold flex items-center gap-2"><CheckCircle size={16} /> Status</span>
                  <span className="text-green-600 font-black">Active</span>
                </div>
              </div>
            </div>

            {role === 'WORKER' && (
               <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
                  <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4">Worker Progress</h3>
                  <div className="w-full bg-gray-200 h-2 rounded-full mb-2">
                    <div className="bg-primary h-full rounded-full w-[85%]"></div>
                  </div>
                  <p className="text-xs font-bold text-primary opacity-80">85% Profile completed</p>
               </div>
            )}
          </div>

          {/* Main Content Areas */}
          <div className="md:col-span-2 space-y-8">
            {role === 'WORKER' ? (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-gray-900">My Portfolio</h2>
                  <label className="cursor-pointer bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all transform active:scale-95">
                    <Plus size={16} /> Add Work
                    <input type="file" className="hidden" multiple accept="image/*,video/*" onChange={handleUploadWork} />
                  </label>
                </div>

                {isUploading && (
                  <div className="mb-6 p-4 bg-primary/5 rounded-2xl flex items-center justify-center gap-3">
                     <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                     <span className="text-xs font-bold text-primary uppercase tracking-widest">Optimizing & Uploading...</span>
                  </div>
                )}

                {portfolio.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                       <Upload className="text-gray-300" size={24} />
                    </div>
                    <p className="text-gray-400 font-bold">No portfolio items yet.</p>
                    <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.2em] mt-1">Upload photos/videos of your works</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {portfolio.map((item, idx) => (
                      <div key={idx} className="group relative aspect-square bg-gray-100 rounded-2xl overflow-hidden hover:scale-[1.02] transition-all cursor-pointer shadow-sm">
                        <Image src={item} alt={`Work ${idx}`} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                           <button className="bg-red-500 text-white p-2 rounded-xl shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                              <X size={16} />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Portfolio Videos Mock */}
                <div className="mt-12 pt-8 border-t border-gray-50">
                   <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                     <Video size={20} className="text-primary" /> Videos of Recent Works
                   </h3>
                   <div className="grid grid-cols-1 gap-4">
                      {/* Video placeholders */}
                      <div className="aspect-video bg-gray-100 rounded-[2rem] flex flex-col items-center justify-center border border-gray-100 group hover:bg-gray-200/50 transition-colors">
                         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-xl group-hover:scale-110 transition-transform">
                            <Plus size={24} className="text-primary" />
                         </div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload your first video</p>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-black text-gray-900 mb-6">Recent Bookings</h2>
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="text-gray-300" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings yet</h3>
                  <p className="text-gray-500 max-w-xs mx-auto mb-8">Ready to get something done? Find Ghana's best workers today.</p>
                  <button onClick={() => router.push('/search')} className="bg-primary hover:bg-primary-light text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                    Explore Workers
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
