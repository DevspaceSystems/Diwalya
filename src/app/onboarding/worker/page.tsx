'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createWorkerProfile, notifyAdminOfRejection } from '@/app/actions/worker';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Camera, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  User,
  X
} from 'lucide-react';
import * as faceapi from 'face-api.js';
import Image from 'next/image';

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = globalThis.Image ? new globalThis.Image() : null;
    if (!img) return reject('Image constructor not found');
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject('Failed to load image');
    img.src = url;
  });
};

export default function WorkerOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    businessName: '',
    location: '',
    experienceYears: 0,
    bio: '',
    category: 'Electrician',
  });

  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [ghanaCard, setGhanaCard] = useState<File | null>(null);
  const [ghanaCardUrl, setGhanaCardUrl] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
    };
    checkUser();
  }, [router]);

  const handleFileUpload = async (file: File, bucket: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      if (!profilePic || !ghanaCard) {
        throw new Error('Both profile picture and Ghana Card are mandatory for verification.');
      }

      // 1. Upload Files
      // Note: Assuming 'profiles' and 'verifications' buckets exist in Supabase
      const pUrl = await handleFileUpload(profilePic, 'profiles');
      const gUrl = await handleFileUpload(ghanaCard, 'verifications');

      // 2. Algorithm Check (Face Identity)
      const pImg = await loadImage(pUrl);
      const gImg = await loadImage(gUrl);

      // Load Models
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');

      const pDesc = await faceapi.detectSingleFace(pImg).withFaceLandmarks().withFaceDescriptor();
      const gDesc = await faceapi.detectSingleFace(gImg).withFaceLandmarks().withFaceDescriptor();

      if (!pDesc || !gDesc) {
        throw new Error('Face matching failed. Could not detect a clear face in one of the images. Please ensure faces are visible.');
      }

      const faceMatcher = new faceapi.FaceMatcher(pDesc);
      const bestMatch = faceMatcher.findBestMatch(gDesc.descriptor);

      if (bestMatch.distance > 0.6) {
        await notifyAdminOfRejection(user.id, `Face matching failed. Similarity distance: ${bestMatch.distance}`);
        throw new Error('Identity verification failed. Your Ghana Card photo does not match your profile picture. Our admin team has been notified for manual review.');
      }

      // 3. Create Profile
      const result = await createWorkerProfile(user.id, {
        ...formData,
        profilePicture: pUrl,
        ghanaCardUrl: gUrl
      });

      if (result.success) {
        router.push('/dashboard/worker');
      } else {
        throw new Error(result.error);
      }

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        
        {/* Progress Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-black text-gray-900">Worker Onboarding</h1>
            <span className="text-sm font-black text-primary bg-primary/10 px-4 py-1.5 rounded-full uppercase tracking-widest">Step {step} of 3</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out" 
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 sm:p-10 relative overflow-hidden">
          
          {error && (
            <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Briefcase size={22} />
                 </div>
                 <h2 className="text-xl font-bold text-gray-900">Business Details</h2>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Business Name (Optional)</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    placeholder="e.g. Mensah Electricals"
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g. Accra, Greater Accra"
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Years of Experience</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      required
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({...formData, experienceYears: parseInt(e.target.value)})}
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Your Category</label>
                <select 
                   value={formData.category}
                   onChange={(e) => setFormData({...formData, category: e.target.value})}
                   className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none bg-gray-50"
                >
                  <option>Electrician</option>
                  <option>Plumber</option>
                  <option>Carpenter</option>
                  <option>Cleaner</option>
                  <option>Mechanic</option>
                  <option>Delivery Rider</option>
                </select>
              </div>

              <button 
                onClick={handleNext}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all"
              >
                Continue <ArrowRight size={20} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right duration-300">
               <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <User size={22} />
                 </div>
                 <h2 className="text-xl font-bold text-gray-900">Profile & Bio</h2>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-xl overflow-hidden mb-4 group">
                  {profilePicUrl ? (
                    <Image src={profilePicUrl} alt="Preview" fill className="object-cover" />
                  ) : (
                    <User size={48} className="text-gray-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="text-white" size={24} />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setProfilePic(file);
                          setProfilePicUrl(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profile Picture (Mandatory)</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Professional Bio</label>
                <textarea
                  rows={4}
                  required
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Tell clients about your skills and why they should hire you..."
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleBack}
                  className="flex-1 py-4 border-2 border-gray-100 text-gray-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                >
                  <ArrowLeft size={20} /> Back
                </button>
                <button 
                  onClick={handleNext}
                  className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transform active:scale-[0.98] transition-all"
                >
                  Continue <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right duration-300">
               <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                    <ShieldCheck size={22} />
                 </div>
                 <h2 className="text-xl font-bold text-gray-900">Security Check</h2>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                       <CreditCard size={20} />
                    </div>
                    <div>
                       <h3 className="font-bold text-blue-900 mb-1">Upload Ghana Card</h3>
                       <p className="text-sm text-blue-700 leading-relaxed">
                         Our automated face-identity algorithm will compare your Ghana Card photo with your profile picture for security.
                       </p>
                    </div>
                 </div>

                 <div className="mt-6 border-2 border-dashed border-blue-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-white/50 group hover:bg-white transition-all">
                    {ghanaCardUrl ? (
                      <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-100">
                         <Image src={ghanaCardUrl} alt="Ghana Card" fill className="object-cover" />
                         <button onClick={() => {setGhanaCard(null); setGhanaCardUrl('');}} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg shadow-lg">
                           <X size={16} />
                         </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer">
                        <Camera className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" size={40} />
                        <span className="text-sm font-bold text-blue-900">Take a photo or upload card</span>
                        <span className="text-xs text-blue-500 mt-1 font-medium">Front-side preferred</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setGhanaCard(file);
                              setGhanaCardUrl(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                    )}
                 </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex-1 py-4 border-2 border-gray-100 text-gray-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <ArrowLeft size={20} /> Back
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-[2] py-4 bg-secondary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transform active:scale-[0.98] transition-all disabled:opacity-70"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <>Complete Selection <CheckCircle size={20} /></>}
                </button>
              </div>

              <div className="text-center">
                 <div className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <ShieldCheck size={14} className="text-blue-500" /> Secure Verification Powered by AI
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

