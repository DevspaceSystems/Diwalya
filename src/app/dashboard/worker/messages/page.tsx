'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  MessageSquare, 
  Search, 
  User, 
  ShieldCheck, 
  Clock, 
  Loader2,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import WorkerSidebar from '@/components/WorkerSidebar';
import ChatWindow from '@/components/Chat/ChatWindow';

export default function WorkerMessagesPage() {
  const [chats, setChats] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);
  const [activeChat, setActiveChat] = React.useState<any>(null);

  React.useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchChats(session.user.id);
      }
    }
    loadData();
  }, []);

  const fetchChats = async (userId: string) => {
    setLoading(true);
    // Fetch all messages involving this user
    const { data, error } = await supabase
      .from('ChatMessage')
      .select('*, job:Job(id, serviceType, client:User!clientId(id, name, profilePicture))')
      .or(`senderId.eq.${userId},recipientId.eq.${userId}`)
      .order('createdAt', { ascending: false });

    if (!error && data) {
      // Find what missing Users we need to look up (for direct inquiries without a job)
      const missingUserIds = new Set<string>();
      data.forEach(msg => {
        if (!msg.job) {
          const otherId = msg.senderId === userId ? msg.recipientId : msg.senderId;
          if (otherId && otherId !== 'admin') missingUserIds.add(otherId);
        }
      });

      // Fetch the missing users
      let fallbackUsers: Record<string, any> = {};
      if (missingUserIds.size > 0) {
        const { data: users } = await supabase
          .from('User')
          .select('id, name, profilePicture')
          .in('id', Array.from(missingUserIds));
        
        if (users) {
          users.forEach(u => fallbackUsers[u.id] = u);
        }
      }

      // Grouping logic to find unique conversations
      const uniqueChats: any[] = [];
      const seen = new Set();
      
      data.forEach((msg: any) => {
        const otherUserId = msg.senderId === userId ? msg.recipientId : msg.senderId;
        const chatKey = msg.jobId ? `job-${msg.jobId}` : `user-${otherUserId}`;
        
        if (!seen.has(chatKey)) {
          seen.add(chatKey);
          
          let recipientName = 'Worker/Client';
          let profilePicture = undefined;
          
          if (msg.job?.client) {
             recipientName = msg.job.client.name;
             profilePicture = msg.job.client.profilePicture;
          } else if (otherUserId === 'admin') {
             recipientName = 'Diwalya Admin';
          } else if (fallbackUsers[otherUserId]) {
             recipientName = fallbackUsers[otherUserId].name;
             profilePicture = fallbackUsers[otherUserId].profilePicture;
          }

          uniqueChats.push({
            id: msg.jobId || otherUserId,
            jobId: msg.jobId,
            recipientId: otherUserId,
            recipientName,
            lastMessage: msg.content,
            time: msg.createdAt,
            serviceType: msg.job?.serviceType || 'Direct Inquiry',
            profilePicture
          });
        }
      });
      setChats(uniqueChats);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      <div className="p-8 max-w-5xl mx-auto w-full flex justify-between items-end mb-4 shrink-0 px-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Messages</h2>
            <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mt-1">Manage your communication</p>
          </div>
          <button 
            onClick={() => setActiveChat({ recipientId: 'admin', recipientName: 'Diwalya Admin' })}
            className="px-6 py-3 bg-primary text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
             <ShieldCheck size={16} /> Contact Admin
          </button>
      </div>

      <div className="flex-grow overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-6">
         {loading ? (
           <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
              <Loader2 className="animate-spin text-primary" size={40} />
           </div>
         ) : chats.length === 0 ? (
           <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-[1.5rem] flex items-center justify-center mb-6">
                <MessageSquare size={32} className="text-gray-200" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No Conversations</h3>
              <p className="text-gray-700 font-bold text-sm max-w-xs mx-auto">
                 Once you start chatting with clients or admins, your messages will appear here.
              </p>
           </div>
         ) : (
           <div className="grid gap-4">
              {chats.map((chat) => (
                 <div 
                   key={chat.id} 
                   onClick={() => setActiveChat(chat)}
                   className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer flex items-center gap-6 group relative overflow-hidden"
                 >
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden shadow-sm shadow-slate-200/50">
                       {chat.profilePicture ? (
                          <img src={chat.profilePicture} alt={chat.recipientName} className="w-full h-full object-cover" />
                       ) : (
                          <User size={32} className="text-slate-600" />
                       )}
                    </div>

                    <div className="flex-grow min-w-0">
                       <div className="flex justify-between items-start gap-4 mb-1">
                          <div>
                             <h4 className="font-black text-slate-900 leading-tight flex items-center gap-2">
                                {chat.recipientName}
                                {chat.recipientId === 'admin' && <ShieldCheck size={12} className="text-blue-500" />}
                             </h4>
                             {chat.serviceType && (
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">{chat.serviceType} Project</p>
                             )}
                          </div>
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">
                             {new Date(chat.time).toLocaleDateString()}
                          </span>
                       </div>
                       <p className="text-sm text-slate-700 font-medium leading-relaxed truncate group-hover:text-slate-700 transition-colors">
                          {chat.lastMessage}
                       </p>
                    </div>
                    
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-primary group-hover:text-white transition-all">
                       <ChevronLeft size={16} className="rotate-180" />
                    </div>
                 </div>
              ))}
           </div>
         )}
      </div>

      {activeChat && (
         <ChatWindow 
           jobId={activeChat.jobId}
           senderId={user?.id}
           recipientId={activeChat.recipientId}
           recipientName={activeChat.recipientName}
           onClose={() => setActiveChat(null)}
         />
      )}
    </div>
  );
}
