'use client';

import React, { useEffect, useState } from 'react';
import { 
  ClipboardList, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  Loader2,
  Phone,
  ArrowRight
} from 'lucide-react';
import { getSpecialRequests, updateSpecialRequestStatus } from '@/app/actions/special-request';
import { cn } from '@/lib/utils';

export default function AdminSpecialRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    const result = await getSpecialRequests();
    if (result.success) {
      setRequests(result.data);
    }
    setLoading(false);
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    const result = await updateSpecialRequestStatus(id, status);
    if (result.success) {
      loadRequests();
    }
  };

  const filteredRequests = requests.filter(req => 
    filter === 'ALL' ? true : req.status === filter
  );

  return (
    <div className="p-8 max-w-7xl mx-auto pb-32">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Special Labor Requests</h1>
          <p className="text-gray-500 font-medium tracking-tight">Manage manual matching requests from platform users.</p>
        </div>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          {['ALL', 'PENDING', 'CONTACTED', 'ASSIGNED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black transition-all",
                filter === f ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
           <Loader2 className="animate-spin text-primary mb-4" size={40} />
           <p className="text-gray-400 font-bold">Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
           <ClipboardList className="text-gray-200 mb-4" size={60} />
           <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No requests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all overflow-hidden group">
              <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-50 font-bold">
                
                {/* User Info */}
                <div className="p-8 lg:w-1/4 bg-gray-50/30">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-xl font-black">
                      {req.user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-gray-900">{req.user.name}</h3>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-none mt-1">Requester</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <a href={`tel:${req.user.phone}`} className="flex items-center gap-2 text-xs text-gray-600 hover:text-primary transition-colors">
                      <Phone size={14} /> {req.user.phone || 'No phone'}
                    </a>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock size={14} /> {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Request Content */}
                <div className="p-8 flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-lg uppercase tracking-widest">
                      {req.serviceType}
                    </span>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg",
                      req.status === 'PENDING' ? "bg-orange-100 text-orange-600" :
                      req.status === 'ASSIGNED' ? "bg-green-100 text-green-600" :
                      "bg-blue-100 text-blue-600"
                    )}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {req.description}
                  </p>
                  <div className="flex flex-wrap gap-6 text-xs">
                    <div className="flex items-center gap-2 text-gray-900 bg-gray-50 px-4 py-2 rounded-xl">
                      <MapPin size={16} className="text-primary" /> {req.location}
                    </div>
                    <div className="flex items-center gap-2 text-gray-900 bg-gray-50 px-4 py-2 rounded-xl">
                      <Calendar size={16} className="text-primary" /> {new Date(req.preferredTime).toLocaleString()}
                    </div>
                    {req.budget && (
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl">
                        ₵{req.budget.toLocaleString()} Budget
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-8 lg:w-1/4 flex flex-col justify-center gap-3">
                  {req.status === 'PENDING' && (
                    <button 
                      onClick={() => handleStatusUpdate(req.id, 'CONTACTED')}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      Mark Contacted <MessageSquare size={14} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleStatusUpdate(req.id, 'ASSIGNED')}
                    className="w-full py-3 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Assign Worker <ArrowRight size={14} />
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(req.id, 'CANCELLED')}
                    className="w-full py-3 border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 rounded-xl text-xs font-black hover:bg-red-50 transition-all"
                  >
                    Dismiss Request
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
