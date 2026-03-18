'use client';

import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  User, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink,
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  Loader2,
  Lock,
  Unlock,
  Flag
} from 'lucide-react';
import { getReports, updateReportStatus, moderateUser, liftSanctions } from '@/app/actions/report';
import { cn } from '@/lib/utils';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    const result = await getReports();
    if (result.success && result.data) {
      setReports(result.data);
    }
    setLoading(false);
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    const result = await updateReportStatus(id, status);
    if (result.success) {
      loadReports();
    }
  };

  const handleModeration = async (userId: string, action: 'WARN' | 'SUSPEND' | 'BAN') => {
    const reason = action === 'SUSPEND' ? window.prompt('Enter suspension reason:') : undefined;
    if (action === 'SUSPEND' && !reason) return;
    
    const result = await moderateUser(userId, action, reason || '');
    if (result.success) {
      loadReports();
    }
  };

  const filteredReports = reports.filter(r => 
    filter === 'ALL' ? true : r.status === filter
  );

  return (
    <div className="p-8 max-w-7xl mx-auto pb-32">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight flex items-center gap-3">
             <ShieldAlert className="text-red-500" size={32} />
             Reports & Moderation
          </h1>
          <p className="text-gray-500 font-medium tracking-tight">Review complaints and manage platform safety.</p>
        </div>
        <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          {['ALL', 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap",
                filter === f ? "bg-red-500 text-white shadow-md shadow-red-500/20" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
           <Loader2 className="animate-spin text-red-500 mb-4" size={40} />
           <p className="text-gray-400 font-bold">Fetching reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
           <Flag className="text-gray-200 mb-4" size={60} />
           <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No reports to display</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-gray-200/50 transition-all">
              <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-50">
                
                {/* Users Involved */}
                <div className="p-8 lg:w-1/3 bg-gray-50/20 flex flex-col font-black">
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Involved Parties</span>
                    <AlertTriangle className="text-orange-500" size={18} />
                  </div>
                  
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-lg border-2 border-red-100">R</div>
                      <div className="flex-grow">
                        <p className="text-sm text-gray-900">{report.reporter.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Reporter (Filed)</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center py-2 h-0 relative">
                        <div className="absolute w-[2px] h-8 bg-dashed bg-gray-200"></div>
                        <Flag size={14} className="text-red-300 relative z-10 bg-gray-50/20 p-0.5 rounded-full" />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-lg border-2 border-gray-800 shadow-lg shadow-black/10">T</div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                           <p className="text-sm text-gray-900">{report.target.name}</p>
                           {report.target.isBanned && <span className="bg-black text-[8px] text-white px-1.5 py-0.5 rounded font-black">BANNED</span>}
                           {report.target.isSuspended && <span className="bg-orange-500 text-[8px] text-white px-1.5 py-0.5 rounded font-black">SUSPENDED</span>}
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Target (Accused)</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-orange-600">
                        <AlertTriangle size={12} /> {report.target.warningCount || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complaint Details */}
                <div className="p-8 flex-grow font-black">
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3 text-red-600 bg-red-50 px-4 py-2 rounded-2xl border border-red-100/50">
                         <ShieldAlert size={18} />
                         <span className="text-xs uppercase tracking-widest">{report.reason}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg border-2",
                        report.status === 'PENDING' ? "border-orange-500 text-orange-500 bg-orange-50/30" :
                        report.status === 'REVIEWED' ? "border-blue-500 text-blue-500" :
                        report.status === 'RESOLVED' ? "border-green-500 text-green-500 bg-green-50/30" :
                        "border-gray-200 text-gray-400"
                      )}>
                        {report.status}
                      </span>
                   </div>

                   <p className="text-gray-700 text-base leading-relaxed mb-8 font-medium italic p-6 bg-slate-50 rounded-3xl border border-gray-100">
                      "{report.description}"
                   </p>

                   <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-100 px-4 py-2 rounded-xl">
                        <Clock size={14} /> {new Date(report.createdAt).toLocaleString()}
                      </div>
                      {report.jobId && (
                        <button className="flex items-center gap-2 text-primary hover:text-blue-700 text-xs transition-colors">
                           <ExternalLink size={14} /> View Related Job
                        </button>
                      )}
                      {report.evidenceUrls && report.evidenceUrls.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl">
                           <MessageSquare size={14} /> {report.evidenceUrls.length} Attachments
                        </div>
                      )}
                   </div>
                </div>

                {/* Moderation Actions */}
                <div className="p-8 lg:w-1/4 bg-gray-50/10 flex flex-col justify-center gap-4">
                   <div className="space-y-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-2 px-2">Decision Tools</p>
                      
                      {report.status === 'PENDING' && (
                        <button 
                          onClick={() => handleStatusUpdate(report.id, 'REVIEWED')}
                          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase"
                        >
                           Mark for Review <ArrowRight size={14} />
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleModeration(report.target.id, 'WARN')}
                          className="py-3 px-2 bg-orange-100 text-orange-600 rounded-xl text-[10px] font-black hover:bg-orange-200 transition-all uppercase"
                        >
                           Warn Target
                        </button>
                        <button 
                          onClick={() => handleModeration(report.target.id, 'SUSPEND')}
                          className={cn(
                            "py-3 px-2 rounded-xl text-[10px] font-black transition-all uppercase",
                            report.target.isSuspended ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600 hover:bg-red-200"
                          )}
                        >
                           {report.target.isSuspended ? 'Lift Susp.' : 'Suspend'}
                        </button>
                      </div>

                      <button 
                         onClick={() => handleModeration(report.target.id, 'BAN')}
                         className="w-full py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black hover:bg-black transition-all uppercase flex items-center justify-center gap-2"
                      >
                         <Lock size={12} /> Permanently Ban
                      </button>

                      <div className="pt-4 border-t border-gray-100">
                        <button 
                          onClick={() => handleStatusUpdate(report.id, 'RESOLVED')}
                          className="w-full py-3 text-green-600 text-[10px] font-black uppercase hover:bg-green-50 rounded-xl transition-all"
                        >
                           Close Report
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper arrow for button
function ArrowRight({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
