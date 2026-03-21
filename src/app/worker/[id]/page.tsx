'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Star, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  Calendar, 
  MessageSquare, 
  ArrowRight, 
  Share2, 
  Heart, 
  Briefcase, 
  X, 
  Send, 
  AlertTriangle, 
  ShieldAlert, 
  ClipboardCheck,
  Loader2,
  Lock,
  Play,
  Video as VideoIcon
} from 'lucide-react';
import SupabaseImage from '@/components/ui/SupabaseImage';
import { formatGHS, cn } from '@/lib/utils';
import { getWorkerById } from '@/app/actions/worker';
import { sendMessage as sendChatMsg } from '@/app/actions/chat';
import { supabase } from '@/lib/supabase';

export default function WorkerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoved, setIsLoved] = useState(false);
  const [lovedCount, setLovedCount] = useState(48);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ text: string, isUser: boolean }[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  
  const isVideo = (url: string) => 
    url?.includes('.mp4') || url?.includes('.mov') || url?.includes('.webm') || url?.toLowerCase().includes('video');

  useEffect(() => {
    async function loadWorker() {
      const res = await getWorkerById(id);
      if (res.success) {
        setWorker(res.data);
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUser(session.user);
      setLoading(false);
    }
    loadWorker();
  }, [id]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Hire ${worker?.name} on Diwalya`,
          text: `Check out ${worker?.name}'s profile on Diwalya`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Profile link copied to clipboard!');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error('Share failed:', err);
    }
  };

  const toggleLove = () => {
    setIsLoved(!isLoved);
    setLovedCount(prev => isLoved ? prev - 1 : prev + 1);
  };

  const sendMessage = async (text: string) => {
    if (!user) return alert('Please log in to chat.');
    
    setChatLog(prev => [...prev, { text, isUser: true }]);
    setMessage('');

    const res = await sendChatMsg({
        jobId: 'direct_inquiry_' + id, // Simplified for profile chat
        senderId: user.id,
        content: text
    });

    if (!res.success) {
        setShowWarning(true);
        // Remove the suspicious message from UI log for better enforcement
        setChatLog(prev => prev.filter(m => m.text !== text));
    } else {
        setShowWarning(false);
    }
  };

  const maskContact = (val: string) => {
    if (!val) return 'Not Provided';
    return val.substring(0, 4) + ' **** ' + val.substring(val.length - 2);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!worker) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <h2 className="text-2xl font-black text-gray-900 mb-2">Worker Not Found</h2>
      <Link href="/search" className="px-6 py-3 bg-primary text-white font-black rounded-xl">Back to Search</Link>
    </div>
  );

  const profile = worker.workerProfile?.[0] || {};

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50 h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between">
          <Link href="/search" className="text-gray-600 hover:text-primary flex items-center gap-2 font-bold">
            <ArrowRight size={18} className="rotate-180" /> Back to Search
          </Link>
          <div className="flex items-center gap-4">
            <button onClick={handleShare} className="p-2 text-gray-400 hover:text-primary rounded-full transition-all">
              <Share2 size={20} />
            </button>
            <button onClick={toggleLove} className={cn("p-2 rounded-full transition-all", isLoved ? "text-red-500 bg-red-50" : "text-gray-400 hover:bg-red-50")}>
              <Heart size={20} className={isLoved ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-start relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-8 translate-x-8 blur-2xl"></div>
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-[1.5rem] bg-gray-100 flex items-center justify-center text-primary shrink-0 overflow-hidden border-4 border-white shadow-lg relative">
                  <SupabaseImage 
                    src={worker.profilePicture} 
                    alt={worker.name} 
                    className="w-full h-full" 
                  />
                </div>
               <div className="flex-grow">
                 <div className="flex flex-wrap items-center gap-3 mb-4">
                   <h1 className="text-4xl font-black text-gray-900 tracking-tight">{worker.name}</h1>
                   {profile.isVerified && (
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                       <ShieldCheck size={14} className="fill-blue-50" /> Verified Pro
                     </div>
                   )}
                 </div>
                 <p className="text-xl font-bold text-primary mb-6">{profile.category || 'General Contractor'}</p>
                 
                 <div className="flex flex-wrap items-center gap-8">
                    <div className="text-center md:text-left">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rating</p>
                       <div className="flex items-center gap-1.5 font-black text-gray-900">
                          <Star size={18} className="fill-yellow-500 text-yellow-500" />
                          <span>4.9</span>
                          <span className="text-gray-400 font-bold ml-1 text-xs">(124)</span>
                       </div>
                    </div>
                    <div className="text-center md:text-left">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Loves</p>
                       <div className="flex items-center gap-1.5 font-black text-red-500">
                          <Heart size={18} className="fill-red-500" />
                          <span>{lovedCount}</span>
                       </div>
                    </div>
                    <div className="text-center md:text-left">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Location</p>
                       <div className="flex items-center gap-1.5 font-black text-gray-900">
                          <MapPin size={18} className="text-primary" />
                          <span>{profile.location || 'Ghana'}</span>
                       </div>
                    </div>
                 </div>
               </div>
            </div>

            {/* Content Sections */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-12">
               <section>
                  <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Biography</h2>
                  <p className="text-gray-600 font-medium leading-relaxed">{profile.bio || 'This worker has not provided a biography yet.'}</p>
               </section>
               
               <section>
                  <h3 className="text-xl font-black text-gray-900 mb-6 tracking-tight">Technical Proficiency</h3>
                  <div className="flex flex-wrap gap-3">
                    {['Professionalism', 'Timing', 'Fair Pricing', 'Cleanliness'].map((skill) => (
                      <span key={skill} className="px-5 py-2.5 bg-gray-50 text-gray-700 font-bold rounded-2xl border border-gray-100 text-sm">
                        <CheckCircle size={16} className="inline mr-2 text-emerald-500" /> {skill}
                      </span>
                    ))}
                  </div>
               </section>
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
               <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Verified Work Proof</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {profile.portfolioImages && profile.portfolioImages.length > 0 ? (
                    profile.portfolioImages.map((url: string, i: number) => (
                      <div 
                        key={i} 
                        onClick={() => setSelectedMedia(url)}
                        className="aspect-square bg-gray-100 rounded-3xl overflow-hidden hover:opacity-90 transition-all cursor-pointer border-2 border-white shadow-md group relative"
                      >
                        {isVideo(url) ? (
                          <div className="w-full h-full relative">
                            <video src={url} className="w-full h-full object-cover" muted />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <VideoIcon size={32} className="text-white drop-shadow-lg" />
                            </div>
                          </div>
                        ) : (
                          <SupabaseImage 
                            src={url} 
                            alt={`Portfolio ${i}`} 
                            className="w-full h-full" 
                          />
                        )}
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-primary scale-0 group-hover:scale-100 transition-transform">
                              {isVideo(url) ? <Play size={20} className="fill-primary" /> : <Send size={20} className="rotate-45" />}
                           </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded-3xl overflow-hidden hover:opacity-90 transition-all cursor-pointer border-2 border-white shadow-md flex items-center justify-center relative group">
                        <Briefcase size={32} className="text-gray-300 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    ))
                  )}
                </div>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl sticky top-24 space-y-8">
              <div className="flex justify-between items-start pb-6 border-b border-gray-100">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Base Inspection</p>
                  <p className="text-4xl font-black text-gray-900">{formatGHS(100)}</p>
                </div>
                <div className="text-right">
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">Now Active</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary">
                      <Clock size={20} />
                   </div>
                   <div>
                      <h4 className="font-black text-gray-900 text-sm">Response Time</h4>
                      <p className="text-xs text-gray-500 font-bold">Fast • within 30 mins</p>
                   </div>
                </div>
                
                <div className="p-5 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl"></div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Lock size={12} className="text-emerald-400" /> Anti-Bypass Security
                   </p>
                   <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold">
                         <span className="text-slate-400">Phone:</span>
                         <span>{maskContact(worker.phone)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold">
                         <span className="text-slate-400">Email:</span>
                         <span>{maskContact(worker.email)}</span>
                      </div>
                   </div>
                   <p className="text-[9px] text-slate-500 italic mt-4 leading-tight">Full details revealed after first payment release.</p>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Link 
                  href={`/booking/${worker.id}`}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-black text-lg block text-center shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Confirm Booking
                </Link>
                <button 
                  onClick={() => setShowChat(true)}
                  className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black text-base flex items-center justify-center gap-2 border-2 border-slate-100 hover:bg-slate-50 transition-all"
                >
                  <MessageSquare size={20} /> Inquiry Chat
                </button>
              </div>

              <p className="text-center text-[10px] text-gray-400 font-black uppercase tracking-widest">
                Shielded by Diwalya Escrow 🛡️
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Chat UI Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg md:rounded-[3rem] shadow-2xl flex flex-col h-full md:h-[650px] overflow-hidden scale-in-center">
            <div className="p-8 border-b flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-lg">{worker.name.charAt(0)}</div>
                <div>
                  <h3 className="font-black text-lg tracking-tight">Direct Inquiry</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Professional Channel</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="hover:bg-white/10 p-2 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="flex-grow p-8 overflow-y-auto space-y-6 bg-gray-50/50">
              <div className="bg-white p-6 rounded-2xl text-gray-700 text-sm font-bold border border-gray-100 shadow-sm inline-block max-w-[90%]">
                👋 Hello! This is **{worker.name}**. I'm currently active. How can I assist you with your project?
              </div>
              
              {chatLog.map((chat, idx) => (
                <div key={idx} className={cn("flex", chat.isUser ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] p-5 rounded-2xl text-sm font-bold shadow-sm",
                    chat.isUser ? "bg-primary text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                  )}>
                    {chat.text}
                  </div>
                </div>
              ))}

              {showWarning && (
                <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-red-900 space-y-3 animate-in shake-1">
                   <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-red-600">
                      <ShieldAlert size={16} /> Security Interception
                   </div>
                   <p className="text-xs font-bold leading-relaxed">
                     **Contact sharing detected.** For your security, all payments and deals must happen through Diwalya. This message was blocked and a warning has been logged.
                   </p>
                </div>
              )}
            </div>

            <div className="p-8 border-t bg-white">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && message.trim() && sendMessage(message)}
                  placeholder="Ask a professional question..." 
                  className="flex-grow p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all text-sm text-gray-900" 
                />
                <button 
                  onClick={() => message.trim() && sendMessage(message)}
                  className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/20"
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Media Lightbox Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <button 
            onClick={() => setSelectedMedia(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[210]"
          >
            <X size={28} />
          </button>
          
          <div className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center scale-in-center overflow-hidden rounded-[2rem]">
            {selectedMedia && isVideo(selectedMedia) ? (
              <video 
                src={selectedMedia} 
                className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" 
                controls 
                autoPlay 
              />
            ) : (
              selectedMedia && (
                <SupabaseImage 
                  src={selectedMedia} 
                  alt="Enlarged Portfolio" 
                  className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain w-auto h-auto" 
                />
              )
            )}
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes scale-in-center {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .scale-in-center { animation: scale-in-center 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .shake-1 { animation: shake 0.2s ease-in-out infinite; animation-iteration-count: 2; }
      `}</style>
    </div>
  );
}
