'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, Star, ShieldCheck, MapPin, Wrench, Zap, Briefcase, Camera, Car, Calendar, Menu, ArrowRight } from 'lucide-react';
import { formatGHS } from '@/lib/utils';
import { getWorkers } from './actions/user';

export default function Home() {
  const router = useRouter();
  const [featuredWorkers, setFeaturedWorkers] = useState<any[]>([]);

  useEffect(() => {
    async function checkWorker() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.role === 'WORKER') {
        router.push('/dashboard/worker');
      }
    }
    checkWorker();
  }, [router]);

  useEffect(() => {
    async function fetchFeatured() {
      const res = await getWorkers();
      if (res.success && res.data) {
        setFeaturedWorkers(res.data.slice(0, 3));
      }
    }
    fetchFeatured();
  }, []);
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-900">

      {/* Navigation removed and centralized in layout.tsx */}

      <main className="flex-grow">

        {/* 1. Hero Section & 2. Search Bar */}
        <section className="relative bg-gradient-to-br from-primary via-[#152e69] to-primary-light text-white overflow-hidden pb-12 pt-24 md:pt-32 md:pb-24">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
                Where <span className="text-secondary text-transparent bg-clip-text bg-gradient-to-r from-secondary to-secondary-light">talent</span> meets opportunity.
              </h1>
              <p className="text-xl sm:text-2xl font-medium mb-10 text-blue-100 max-w-2xl mx-auto leading-relaxed">
                Connect with Ghana&apos;s most trusted and verified skilled and unskilled workers instantly. From plumbers to delivery riders, we&apos;ve got you covered.

              </p>

              {/* Search Bar Container */}
              <div className="bg-white p-2 sm:p-3 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-2 max-w-4xl mx-auto transform hover:scale-[1.01] transition-transform duration-300">
                <div className="flex-grow w-full flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 hover:border-gray-300 transition-colors">
                  <Search className="text-gray-400 mr-3 shrink-0" size={20} />
                  <input
                    type="text"
                    placeholder="What service do you need? (e.g. Plumber)"
                    className="bg-transparent w-full text-gray-800 placeholder-gray-400 focus:outline-none text-base sm:text-lg"
                  />
                </div>
                <div className="w-full sm:w-auto shrink-0 flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 hover:border-gray-300 transition-colors">
                  <MapPin className="text-gray-400 mr-3 shrink-0" size={20} />
                  <select className="bg-transparent w-full text-gray-600 focus:outline-none cursor-pointer appearance-none text-base sm:text-lg">
                    <option>Sunyani</option>
                    <option>Accra</option>
                    <option>Kumasi</option>
                  </select>
                </div>
                <Link href="/search" className="w-full sm:w-auto bg-secondary hover:bg-secondary-light text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2">
                  Find Workers
                  <ArrowRight size={20} />
                </Link>

              </div>

              <div className="mt-8 flex items-center justify-center gap-6 text-sm font-medium text-blue-200">
                <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-400" /> Verified Workers</div>
                <div className="flex items-center gap-2"><Star size={16} className="text-yellow-400" /> 4.8/5 Avg Rating</div>
              </div>
            </div>
          </div>

          {/* Decorative wave */}
          <div className="absolute bottom-0 w-full overflow-hidden leading-none">
            <svg className="relative block w-full h-12 md:h-24" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,123.15,198.8,111.41C241.36,104,281.38,84.7,321.39,56.44Z" className="fill-gray-50"></path>
            </svg>
          </div>
        </section>

        {/* 3. Service Categories */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Popular Services in <span className="text-primary">Sunyani</span></h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Connecting you with both highly skilled professionals and reliable manual labor for everyday tasks.</p>
            </div>

            {/* Skilled Workers Section */}
            <div className="mb-16">
              <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                <Briefcase className="text-primary" size={24} /> Skilled Professionals
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                {[
                  { name: 'Electrician', icon: Zap, count: '142 Workers' },
                  { name: 'Plumber', icon: Wrench, count: '98 Workers' },
                  { name: 'Event Planning', icon: Calendar, count: '210 Workers' },
                  { name: 'Mechanic', icon: Car, count: '85 Workers' },
                  { name: 'Photography', icon: Camera, count: '64 Workers' },
                  { name: 'Carpentry', icon: Briefcase, count: '112 Workers' },
                ].map((category, index) => (
                  <Link href={`/search?category=${category.name.toLowerCase()}`} key={index} className="group bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 hover:border-primary/20 transition-all duration-300 flex flex-col items-center text-center transform hover:-translate-y-1">
                    <div className="w-16 h-16 rounded-full bg-accent text-secondary flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-white transition-colors duration-300">
                      <category.icon size={28} />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg group-hover:text-primary transition-colors">{category.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 font-medium">{category.count}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Unskilled Workers Section */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                <Zap className="text-secondary" size={24} /> Daily Essentials & Manual Labor
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                {[
                  { name: 'Delivery', icon: Zap, count: '320 Workers' }, // Using Zap as placeholder for Bike/Delivery
                  { name: 'Cleaning', icon: ShieldCheck, count: '156 Workers' }, // Using ShieldCheck as placeholder
                  { name: 'Security', icon: ShieldCheck, count: '88 Workers' },
                  { name: 'Gardening', icon: MapPin, count: '45 Workers' },
                  { name: 'Laundry', icon: Zap, count: '72 Workers' },
                  { name: 'General Labor', icon: Briefcase, count: '215 Workers' },
                ].map((category, index) => (
                  <Link href={`/search?category=${category.name.toLowerCase()}`} key={index} className="group bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 hover:border-orange-500/20 transition-all duration-300 flex flex-col items-center text-center transform hover:-translate-y-1">
                    <div className="w-16 h-16 rounded-full bg-orange-50 text-secondary flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-white transition-colors duration-300">
                      <category.icon size={28} />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg group-hover:text-secondary transition-colors">{category.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 font-medium">{category.count}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Smart Recommendations / Featured Workers */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-100 pb-6">
              <div>
                <div className="text-secondary font-bold tracking-wider uppercase text-sm mb-2 flex items-center gap-2">
                  <Star size={16} className="fill-secondary" /> AI Recommended
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Top Rated Workers Near You</h2>
              </div>
              <Link href="/search" className="text-primary font-semibold hover:text-primary-light flex items-center gap-1 mt-4 md:mt-0 group">
                View all workers <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredWorkers.map((worker) => {
                const profile = worker.workerProfile;
                const name = worker.name || 'Worker';
                const category = profile?.category || 'Service Provider';
                const price = profile?.hourlyRate || 0;
                const rating = 5.0;
                const jobs = 0;
                const slug = name.toLowerCase().replace(/ /g, '-');

                return (
                  <div key={worker.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                        {worker.profilePicture && (
                          <img src={worker.profilePicture} alt={name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
                        <div className="w-16 h-16 rounded-full border-2 border-white bg-white overflow-hidden shadow-lg">
                          {worker.profilePicture ? (
                            <img src={worker.profilePicture} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-blue-100 flex items-center justify-center text-primary font-bold text-xl">{name.charAt(0)}</div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg flex items-center gap-1 pb-1">{name} {profile?.isVerified && <ShieldCheck size={16} className="text-blue-400 fill-white" />}</h3>
                          <div className="flex items-center text-yellow-400 text-sm font-semibold bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm w-fit">
                            <Star size={14} className="fill-yellow-400 mr-1" /> {rating} <span className="text-gray-200 font-normal ml-1">({jobs} jobs)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full w-fit">{category}</p>
                        </div>
                        <p className="font-bold text-gray-900">{formatGHS(price)} <span className="text-sm font-normal text-gray-500">/ job avg</span></p>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-6">{profile?.bio || 'No bio available yet.'}</p>
                      <Link href={`/worker/${slug}`} className="w-full py-3 bg-gray-50 hover:bg-primary hover:text-white text-primary font-bold rounded-xl transition-colors border border-gray-200 hover:border-primary block text-center">
                        View Profile & Book
                      </Link>
                    </div>
                  </div>
                );
              })}
              {featuredWorkers.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 font-medium">
                  Loading featured workers...
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 5. How it works */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How Diwalya Works</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Get your tasks done in three simple steps with our secure platform.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10 -z-0 -translate-y-8"></div>

              {[
                { step: '01', title: 'Search & Compare', desc: 'Browse verified workers based on skills, location, and reviews to find your perfect match.' },
                { step: '02', title: 'Book & Pay Securely', desc: 'Schedule your job and pay online via Paystack (Mobile Money or Card). Funds are held securely.' },
                { step: '03', title: 'Job Completed', desc: 'The worker completes the job. Approve the work and leave a review to release payment.' },
              ].map((item, index) => (
                <div key={index} className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center border-b-4 border-secondary text-primary font-black text-3xl mb-6 transform rotate-3 hover:rotate-0 transition-all">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Call to Action */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary"></div>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to grow your business?</h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join thousands of skilled and unskilled professionals across Ghana who are using Diwalya to find clients, manage bookings, and increase their earnings.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register/worker" className="bg-secondary hover:bg-white hover:text-secondary text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all">
                Register as a Worker
              </Link>
              <Link href="/search" className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 px-8 py-4 rounded-xl font-bold text-lg transition-all">
                I&apos;m looking to hire
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-gray-800">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center mb-4 bg-white p-2 rounded max-w-fit">
                <Image src="/diwalya-logo.png" alt="Diwalya Logo" width={140} height={35} className="object-contain" />
              </div>
              <p className="text-sm mb-4">Where talent meets opportunity. Africa&apos;s trusted marketplace for skilled labor.</p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-secondary transition-colors">Find Workers</Link></li>
                <li><Link href="/" className="hover:text-secondary transition-colors">How it works</Link></li>
                <li><Link href="/" className="hover:text-secondary transition-colors">Pricing</Link></li>
                <li><Link href="/" className="hover:text-secondary transition-colors">Diwalya Guarantee</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">For Workers</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-secondary transition-colors">Join Diwalya</Link></li>
                <li><Link href="/" className="hover:text-secondary transition-colors">Success Stories</Link></li>
                <li><Link href="/" className="hover:text-secondary transition-colors">Worker App</Link></li>
                <li><Link href="/" className="hover:text-secondary transition-colors">Verification Process</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-secondary transition-colors">Help Center</Link></li>
                <li><Link href="/" className="hover:text-secondary transition-colors">Contact Us</Link></li>
                <li><Link href="/" className="hover:text-secondary transition-colors">Terms of Service</Link></li>
                <li><Link href="/" className="hover:text-secondary transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            <p>&copy; {new Date().getFullYear()} Diwalya Platform. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <span className="flex items-center gap-1"><ShieldCheck size={14} /> Secure Online Payments</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
