'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { sendMessage, getChatMessages } from '@/app/actions/chat';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  jobId?: string;
  senderId: string;
  recipientId?: string;
  recipientName: string;
  onClose: () => void;
}

export default function ChatWindow({ jobId, senderId, recipientId, recipientName, onClose }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [warning, setWarning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      let data: any[] = [];
      if (jobId) {
        const res = await getChatMessages(jobId);
        if (res.success && res.data) {
          data = res.data;
        }
      } else if (recipientId) {
        // Fetch direct messages
        const { supabase } = await import('@/lib/supabase');
        const { data: directMsgs } = await supabase
          .from('ChatMessage')
          .select('*, sender:User(name, role, profilePicture)')
          .or(`and(senderId.eq.${senderId},recipientId.eq.${recipientId}),and(senderId.eq.${recipientId},recipientId.eq.${senderId})`)
          .is('jobId', null)
          .order('createdAt', { ascending: true });
        if (directMsgs) data = directMsgs;
      }
      setMessages(data || []);
      setLoading(false);
    };
    fetchMessages();
  }, [jobId, recipientId, senderId]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    
    setSending(true);
    const res = await sendMessage({
      jobId,
      senderId,
      recipientId,
      content: message
    });

    if (res.success) {
      setMessages([...messages, res.message]);
      setMessage('');
      setWarning(false);
    } else {
      setWarning(true);
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full max-w-lg md:rounded-3xl shadow-2xl flex flex-col h-[80vh] md:h-[600px] animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-primary text-white md:rounded-t-3xl">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
               {recipientName.charAt(0)}
             </div>
             <div>
               <h3 className="font-bold">Chat with {recipientName}</h3>
               <div className="flex items-center gap-1 text-[10px] opacity-80 uppercase font-black">
                 <ShieldCheck size={10} /> Secure Platform Communication
               </div>
             </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Messages body */}
        <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-4 no-scrollbar">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="animate-spin text-primary opacity-20" size={48} />
            </div>
          ) : (
            <>
              <div className="bg-blue-50 p-4 rounded-2xl text-blue-800 text-[10px] font-black uppercase tracking-widest border border-blue-100 text-center">
                🛡️ All messages are monitored for your protection
              </div>
              
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className={cn(
                  "flex",
                  msg.senderId === senderId ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "max-w-[80%] p-4 rounded-3xl text-sm shadow-sm",
                    msg.senderId === senderId 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-gray-100 text-gray-800 rounded-tl-none",
                    msg.isFlagged && "border-2 border-red-200"
                  )}>
                    {msg.content}
                    {msg.isFlagged && msg.senderId === senderId && (
                      <div className="text-[8px] mt-1 opacity-70 font-black uppercase tracking-tighter">
                        🚩 Flagged for policy review
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {warning && (
            <div className="flex items-start gap-2 p-4 bg-orange-50 border border-orange-200 rounded-2xl text-orange-800 text-sm animate-in shake-1">
              <AlertTriangle className="shrink-0 mt-0.5" size={16} />
              <p className="font-bold lowercase">Policy Violation: Sharing contact details or external links is blocked to protect your payments and security.</p>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-6 border-t bg-gray-50 md:rounded-b-3xl">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Keep it here to stay protected..." 
              className="flex-grow p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm text-gray-900" 
            />
            <button 
              onClick={handleSend}
              disabled={sending}
              className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center hover:bg-primary-light transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {sending ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
