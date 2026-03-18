'use client';

import React, { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, ShieldCheck, Clock, CheckCircle, Calendar, MessageSquare, ArrowRight, Share2, Heart, Briefcase, X, Send, AlertTriangle, ShieldAlert } from 'lucide-react';


export default function WorkerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  // Mock data for the specific worker
  const worker = {
    id: id,
    name: 'Kwame Mensah',
    category: 'Expert Plumber',
    location: 'Sunyani - Airport Residential Area',
    rating: 4.9,
    reviewsCount: 124,
    price: 150,
    verified: true,
    bio: 'Professional plumber with over 8 years of experience in residential and commercial plumbing. I specialize in leak detection, bathroom installations, and water heater maintenance. Committed to providing high-quality service and customer satisfaction.',
    skills: ['Leak Repair', 'Pipe Installation', 'Water Heaters', 'Drain Cleaning'],
    experience: '8 Years',
    availability: 'Mon - Sat, 8:00 AM - 6:00 PM',
  };

  const [isLoved, setIsLoved] = React.useState(false);
  const [lovedCount, setLovedCount] = React.useState(48);
  const [showChat, setShowChat] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [chatLog, setChatLog] = React.useState<{ text: string, isUser: boolean }[]>([]);
  const [showWarning, setShowWarning] = React.useState(false);

  const predefinedQuestions = [
    "Are you available for work today?",
    "What is your base fee for a site visit?",
    "Do you offer emergency services?",
    "Do you have all the necessary tools for the job?"
  ];

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Hire ${worker.name} on Diwalya`,
          text: `Check out ${worker.name}'s profile on Diwalya - ${worker.category}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Profile link copied to clipboard!');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  const toggleLove = () => {
    setIsLoved(!isLoved);
    setLovedCount(prev => isLoved ? prev - 1 : prev + 1);
  };

  const sendMessage = (text: string) => {
    const phoneRegex = /(?:\+?233|0)[235][0-9]{8}/;
    if (phoneRegex.test(text)) {
      setShowWarning(true);
      return;
    }

    setChatLog(prev => [...prev, { text, isUser: true }]);
    setMessage('');
    setShowWarning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/search" className="text-gray-600 hover:text-primary flex items-center gap-2">
            <ArrowRight size={18} className="rotate-180" /> Back to Search
          </Link>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-full transition-all"
            >
              <Share2 size={20} />
            </button>
            <button 
              onClick={toggleLove}
              className={`p-2 rounded-full transition-all ${
                isLoved ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
            >
              <Heart size={20} className={isLoved ? 'fill-red-500' : ''} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Info */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 items-start">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-blue-50 flex items-center justify-center text-primary font-black text-5xl shrink-0">
                {worker.name.charAt(0)}
              </div>
              <div className="flex-grow">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black text-gray-900">{worker.name}</h1>
                  {worker.verified ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded-xl border border-blue-100">
                      <ShieldCheck size={14} className="fill-blue-50" /> Verified Worker
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-wider rounded-xl border border-gray-100">
                      <X size={14} /> Unverified Worker
                    </div>
                  )}
                </div>
                <p className="text-xl font-bold text-primary mb-4">{worker.category}</p>
                
                <div className="flex flex-wrap items-center gap-6 text-gray-600">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Star size={18} className="fill-yellow-500 text-yellow-500" />
                    <span>{worker.rating}</span>
                    <span className="text-gray-400 font-normal ml-1">({worker.reviewsCount} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-red-500">
                    <Heart size={18} className="fill-red-500" />
                    <span>{lovedCount}</span>
                    <span className="text-gray-400 font-normal ml-1">Loves</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Image src="/diwalya-logo.png" alt="Diwalya Logo" width={140} height={35} className="object-contain" />
                    <span>{worker.location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* About & Skills */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-black text-gray-900 mb-4">About Me</h2>
              <p className="text-gray-600 leading-relaxed mb-8">{worker.bio}</p>
              
              <h3 className="text-lg font-black text-gray-900 mb-4">Skills & Services</h3>
              <div className="flex flex-wrap gap-2">
                {worker.skills.map((skill) => (
                  <span key={skill} className="px-4 py-2 bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-100">
                    <CheckCircle size={14} className="inline mr-2 text-green-500" /> {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Portfolio Mockup */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Recent Work</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square bg-gray-100 rounded-2xl overflow-hidden hover:opacity-90 transition-opacity cursor-pointer border border-gray-100 flex items-center justify-center">
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Briefcase size={48} className="opacity-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Booking Card */}
          <aside className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl sticky top-24">
              <div className="flex justify-between items-end mb-8 pb-6 border-b border-gray-100">
                <div>
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Average Rate</p>
                  <p className="text-4xl font-black text-gray-900">₵{worker.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-600 font-black text-sm uppercase">Available</p>
                  <p className="text-gray-400 text-xs">Today</p>
                </div>
              </div>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <Clock className="text-primary mt-1" size={20} />
                  <div>
                    <h4 className="font-bold text-gray-900">Working Hours</h4>
                    <p className="text-sm text-gray-600">{worker.availability}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Calendar className="text-primary mt-1" size={20} />
                  <div>
                    <h4 className="font-bold text-gray-900">Fast Response</h4>
                    <p className="text-sm text-gray-600">Usually replies within 30 mins</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Link 
                  href={`/booking/${worker.id}`}
                  className="w-full bg-secondary hover:bg-secondary-light text-white py-4 rounded-2xl font-black text-lg block text-center shadow-lg hover:shadow-orange-500/20 transition-all transform active:scale-[0.98]"
                >
                  Book Now
                </Link>
                <button 
                  onClick={() => setShowChat(true)}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-gray-800 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare size={20} /> Chat with {worker.name.split(' ')[0]}
                </button>
              </div>

              <div className="mt-6 p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                <div className="flex items-center gap-2 text-orange-700 font-black text-[10px] uppercase tracking-widest mb-1">
                  <ShieldAlert size={14} /> Platform Protected
                </div>
                <p className="text-[10px] text-gray-400 font-medium leading-tight">
                  Contact details are strictly hidden until booking is confirmed and payment is completed through Diwalya.
                </p>
              </div>

              <p className="text-center text-xs text-gray-400 mt-6 font-medium">
                Shielded by Diwalya Guarantee 🛡️
              </p>
            </div>
          </aside>
        </div>
      </div>
      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full max-w-lg md:rounded-3xl shadow-2xl flex flex-col h-[80vh] md:h-[600px] animate-in slide-in-from-bottom-4">
            <div className="p-6 border-b flex justify-between items-center bg-primary text-white md:rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">K</div>
                <div>
                  <h3 className="font-bold">Chat with {worker.name}</h3>
                  <p className="text-xs opacity-80">Professional Plumber</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="hover:bg-white/10 p-2 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="flex-grow p-6 overflow-y-auto space-y-4">
              <div className="bg-blue-50 p-4 rounded-2xl text-blue-800 text-sm border border-blue-100">
                👋 Hello! How can I help you regarding your plumbing needs today?
              </div>
              
              {chatLog.map((chat, idx) => (
                <div key={idx} className={`flex ${chat.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                    chat.isUser ? 'bg-primary text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                    {chat.text}
                  </div>
                </div>
              ))}

              {showWarning && (
                <div className="flex items-start gap-2 p-4 bg-orange-50 border border-orange-200 rounded-2xl text-orange-800 text-sm animate-in shake-1 overflow-hidden">
                  <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                  <p>Sharing contact numbers is against Diwalya policy to ensure your payments and work are protected. Please keep communication here.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Common Questions</p>
                <div className="flex flex-wrap gap-2">
                  {predefinedQuestions.map(q => (
                    <button 
                      key={q} 
                      onClick={() => sendMessage(q)}
                      className="text-xs bg-white border border-gray-200 hover:border-primary hover:text-primary px-3 py-2 rounded-full font-bold transition-all shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && message.trim() && sendMessage(message)}
                  placeholder="Type a professional message..." 
                  className="flex-grow p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm text-gray-900" 
                />
                <button 
                  onClick={() => message.trim() && sendMessage(message)}
                  className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center hover:bg-primary-light transition-all shadow-lg shadow-blue-500/20"
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
