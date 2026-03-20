'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, Filter, Star, ShieldCheck, ArrowRight, XCircle } from 'lucide-react';
import { formatGHS } from '@/lib/utils';
import { getWorkers } from '@/app/actions/user';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('All Locations');
  const [workers, setWorkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function fetchWorkers() {
      setIsLoading(true);
      const res = await getWorkers();
      if (res.success && res.data) {
        setWorkers(res.data);
      }
      setIsLoading(false);
    }
    fetchWorkers();
  }, []);

  // Live filter real workers
  const filteredWorkers = workers.filter(worker => {
    const name = worker.name || '';
    const category = worker.workerProfile?.category || '';
    const loc = worker.workerProfile?.location || '';
    
    const matchesQuery = name.toLowerCase().includes(query.toLowerCase()) ||
                         category.toLowerCase().includes(query.toLowerCase()) ||
                         loc.toLowerCase().includes(query.toLowerCase());
    
    const matchesLocation = location === 'All Locations' || loc.toLowerCase() === location.toLowerCase();

    return matchesQuery && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-4">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search workers, skills, or locations..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary outline-none text-gray-900 font-medium"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters - Sidebar on desktop */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
              <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
                <Filter size={18} /> Filters
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Location</label>
                  <select 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full mt-2 p-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 font-medium">
                    <option>All Locations</option>
                    <option>Sunyani</option>
                    <option>Accra</option>
                    <option>Kumasi</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Categories</label>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase mb-2">Skilled</p>
                      <div className="space-y-2">
                        {['Plumbing', 'Electrical', 'Carpentry', 'Mechanic', 'Photography'].map(cat => (
                          <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300" />
                            <span className="text-gray-600 group-hover:text-primary transition-colors text-sm font-medium">{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-secondary uppercase mb-2">Manual / Unskilled</p>
                      <div className="space-y-2">
                        {['Delivery', 'Cleaning', 'Security', 'Gardening', 'Laundry', 'General Labor'].map(cat => (
                          <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 rounded text-secondary focus:ring-secondary border-gray-300" />
                            <span className="text-gray-600 group-hover:text-secondary transition-colors text-sm font-medium">{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Price Range</label>
                  <input type="range" className="w-full mt-2 accent-primary" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1 font-medium">
                    <span>{formatGHS(0)}</span>
                    <span>{formatGHS(500)}+</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Search Results */}
          <main className="flex-grow">
            <div className="mb-6">
              <h1 className="text-2xl font-black text-gray-900">Available workers in {location}</h1>
              <p className="text-gray-500 font-medium">{filteredWorkers.length} professionals found</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {isLoading ? (
                <div className="py-20 text-center text-gray-500 font-bold">Loading workers...</div>
              ) : (
                filteredWorkers.map((worker) => {
                  const profile = worker.workerProfile;
                  const name = worker.name || 'Worker';
                  const category = profile?.category || 'Service Provider';
                  const loc = profile?.location || 'Ghana';
                  const price = profile?.hourlyRate || 0;
                  const isVerified = profile?.isVerified || false;
                  const rating = 5.0; 
                  const jobs = 0;
                  const slug = name.toLowerCase().replace(/ /g, '-');
                  
                  return (
                    <Link 
                      href={`/worker/${slug}`} 
                      key={worker.id}
                      className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 group"
                    >
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
                      {worker.profilePicture ? (
                        <Image src={worker.profilePicture} alt={name} width={128} height={128} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-blue-50 flex items-center justify-center text-primary font-black text-3xl">
                          {name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {name}
                            {isVerified ? (
                              <div className="flex items-center gap-1 text-blue-500 font-black text-[10px] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                                 <ShieldCheck size={14} className="fill-blue-50" /> Verified
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-gray-400 font-black text-[10px] uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded">
                                 <XCircle size={14} /> Unverified
                              </div>
                            )}
                          </h3>
                          <p className="text-primary font-bold">{category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-gray-900">{formatGHS(price)}</p>
                          <p className="text-xs text-gray-400">avg job</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1 text-yellow-500 font-bold">
                          <Star size={16} className="fill-yellow-500" /> {rating}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={16} /> {loc}
                        </div>
                        <div>{jobs} jobs completed</div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">Available Today</span>
                        <span className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-full">Top Rated</span>
                      </div>
                    </div>

                    <div className="flex items-end md:items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <ArrowRight size={24} />
                      </div>
                    </div>
                  </Link>
                  );
                })
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
