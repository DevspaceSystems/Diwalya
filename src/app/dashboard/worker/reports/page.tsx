'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  AlertCircle, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Send,
  Loader2,
  HelpCircle,
  ShieldQuestion
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import WorkerSidebar from '@/components/WorkerSidebar';

export default function WorkerReportsPage() {
  const [tickets, setTickets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);
  const [showNewTicket, setShowNewTicket] = React.useState(false);
  const [subject, setSubject] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState('TECHNICAL');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchTickets(session.user.id);
      }
    }
    loadData();
  }, []);

  const fetchTickets = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('SupportTicket')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (!error && data) {
      setTickets(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from('SupportTicket').insert({
      userId: user.id,
      subject,
      description,
      category,
      status: 'OPEN'
    });

    if (!error) {
      setShowNewTicket(false);
      setSubject('');
      setDescription('');
      fetchTickets(user.id);
    } else {
      alert('Failed to submit ticket');
    }
    setSubmitting(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 pb-24">
      <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Support & Reports</h2>
            <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mt-1">Get help and track your tickets</p>
          </div>
          <button 
            onClick={() => setShowNewTicket(true)}
            className="px-6 py-3 bg-primary text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
             <Plus size={16} /> New Ticket
          </button>
      </div>

      {/* FAQ/Help Card */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/20 transition-colors duration-700" />
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center shrink-0 border border-white/10">
               <ShieldQuestion size={48} className="text-primary" />
            </div>
            <div>
               <h2 className="text-3xl font-black mb-2 tracking-tight">Need immediate help?</h2>
               <p className="text-white/40 font-medium text-lg max-w-lg mb-6 leading-relaxed">
                  Check our professional guide or start a 1-on-1 chat with our support team.
               </p>
               <div className="flex flex-wrap gap-4">
                  <button className="px-6 py-3 bg-white text-slate-900 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                     Help Center
                  </button>
                  <Link href="/dashboard/worker/messages" className="px-6 py-3 bg-white/10 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">
                     Chat with Support
                  </Link>
               </div>
            </div>
         </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-6">
         <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <HelpCircle className="text-primary" size={24} /> 
            Your Tickets
         </h3>
         
         {loading ? (
           <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
              <Loader2 className="animate-spin text-primary" size={40} />
           </div>
         ) : tickets.length === 0 ? (
           <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
              <AlertCircle size={48} className="text-slate-100 mb-4" />
              <h4 className="text-lg font-black text-slate-900">No active tickets</h4>
              <p className="text-slate-700 font-bold text-sm">Facing an issue? Submit a ticket above.</p>
           </div>
         ) : (
           <div className="grid gap-4">
              {tickets.map((ticket) => (
                 <div key={ticket.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1.5",
                      ticket.status === 'RESOLVED' ? "bg-emerald-500" : "bg-amber-500"
                    )} />
                    
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                       <div className="flex-grow">
                          <div className="flex items-center gap-3 mb-2">
                             <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                ticket.status === 'RESOLVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                             )}>
                                {ticket.status}
                             </span>
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                Ref: #{ticket.id.slice(0, 8)}
                             </span>
                          </div>
                          <h4 className="text-xl font-black text-slate-900 mb-2">{ticket.subject}</h4>
                          <p className="text-slate-700 font-medium text-sm leading-relaxed line-clamp-2">{ticket.description}</p>
                       </div>
                       
                       <div className="flex md:flex-col justify-between items-end gap-4 min-w-[140px]">
                          <div className="text-right">
                             <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Created On</p>
                             <p className="text-xs font-black text-slate-900">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                          </div>
                          <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                             View Details <ChevronLeft size={12} className="rotate-180" />
                          </button>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
         )}
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Report an Issue</h3>
                    <p className="text-slate-700 font-medium">Explain the problem and we'll get back to you soon.</p>
                 </div>

                 <div className="space-y-6">
                    <div>
                       <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-3">Issue Category</label>
                       <div className="grid grid-cols-2 gap-3">
                          {['TECHNICAL', 'JOB_DISPUTE', 'PAYMENT', 'PROFILE'].map((cat) => (
                             <button
                               key={cat}
                               type="button"
                               onClick={() => setCategory(cat)}
                               className={cn(
                                 "py-3 px-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                 category === cat ? "border-primary bg-primary/5 text-primary" : "border-slate-50 text-slate-700 hover:border-slate-100"
                               )}
                             >
                                {cat.replace('_', ' ')}
                             </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <input 
                         type="text" 
                         required 
                         value={subject}
                         onChange={(e) => setSubject(e.target.value)}
                         placeholder="Subject of the issue" 
                         className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-2 focus:ring-primary focus:outline-none text-sm font-black text-slate-900"
                       />
                       <textarea 
                         rows={4}
                         required 
                         value={description}
                         onChange={(e) => setDescription(e.target.value)}
                         placeholder="Provide detailed information..." 
                         className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-2 focus:ring-primary focus:outline-none text-sm font-medium text-slate-900 resize-none"
                       />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowNewTicket(false)}
                      className="flex-grow py-5 bg-slate-50 text-slate-700 font-black rounded-2xl hover:bg-slate-100 transition-all text-xs uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="flex-[2] py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                       {submitting ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Submit Ticket</>}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
