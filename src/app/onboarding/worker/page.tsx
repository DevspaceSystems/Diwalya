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
import Tesseract from 'tesseract.js';
import { getUserProfile } from '@/app/actions/user';
import { compressImage } from '@/lib/image-utils';

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
  const [dbUser, setDbUser] = useState<any>(null);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    businessName: '',
    location: '',
    experienceYears: 0,
    bio: '',
    category: 'Electrician',
    customCategory: '',
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

      // Fetch name from public.User
      const res = await getUserProfile(session.user.id);
      if (res.success) setDbUser(res.data);
    };
    checkUser();
  }, [router]);

  const handleFileUpload = async (file: File, bucket: string, folder: string) => {
    let uploadFile = file;
    
    // Auto-compress if image
    if (file.type.startsWith('image/')) {
      try {
        uploadFile = await compressImage(file, 0.9);
      } catch (err) {
        console.error('Compression failed, trying original:', err);
      }
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(filePath, uploadFile);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!formData.businessName || !formData.location || formData.experienceYears < 0) {
        setError('Please fill in all the business details correctly.');
        return;
      }
    }
    if (step === 2) {
      if (!profilePic || !formData.bio) {
        setError('Please provide a profile picture and a bio.');
        return;
      }
    }
    setStep(step + 1);
  };
  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      if (!formData.businessName || !formData.location || !formData.bio || !formData.category) {
        throw new Error('All profile sections are mandatory. Please fill everything.');
      }
      if (!profilePic || !ghanaCard) {
        throw new Error('Both profile picture and Ghana Card are mandatory for verification.');
      }

      // 1. Initialise Checks
      let faceMatched = false;
      let nameMatched = false;
      let faceError = '';
      let nameError = '';

      // --- STEP 1: Face Matching ---
      try {
        setError('Analyzing faces...');
        const pImg = await loadImage(profilePicUrl);
        const gImg = await loadImage(ghanaCardUrl);

        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');

        const pDesc = await faceapi.detectSingleFace(pImg).withFaceLandmarks().withFaceDescriptor();
        const gDesc = await faceapi.detectSingleFace(gImg).withFaceLandmarks().withFaceDescriptor();

        if (pDesc && gDesc) {
          const faceMatcher = new faceapi.FaceMatcher(pDesc);
          const bestMatch = faceMatcher.findBestMatch(gDesc.descriptor);
          if (bestMatch.distance <= 0.6) {
            faceMatched = true;
            console.log('✅ Face Match Succeeded:', bestMatch.distance);
          } else {
            faceError = `Face mismatch (Distance: ${bestMatch.distance.toFixed(2)}).`;
          }
        } else {
          faceError = 'Could not detect clear faces in both images.';
        }
      } catch (err: any) {
        console.error('Face Match Error:', err);
        faceError = 'AI face detection failed to run.';
      }

      // --- STEP 2: Name Matching ---
      try {
        setError('Verifying name on card...');
        const { data: { text } } = await Tesseract.recognize(ghanaCardUrl, 'eng');
        const cardText = text.toLowerCase();
        
        // Fallback names: dbUser > metadata > email prefix
        const registeredName = dbUser?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || '';
        const normalizedName = registeredName.toLowerCase();
        
        const nameParts = normalizedName.split(/[\s,]+/).filter((p: string) => p.length > 2);
        if (nameParts.length > 0) {
          const matchedParts = nameParts.filter((part: string) => cardText.includes(part));
          // If we found at least 2 parts (or 1 part if the name is short), we consider it a match
          if (matchedParts.length === nameParts.length || (nameParts.length > 1 && matchedParts.length >= 2)) {
            nameMatched = true;
            console.log('✅ Name Match Succeeded:', matchedParts);
          } else {
            nameError = `Name mismatch. Card text didn't contain enough parts of "${registeredName}".`;
          }
        } else {
          nameError = 'No valid registered name found to compare against card.';
        }
      } catch (err: any) {
        console.error('OCR Error:', err);
        nameError = 'OCR name recognition failed.';
      }

      // --- STEP 3: Final Decision (Face OR Name) ---
      if (!faceMatched && !nameMatched) {
        const fullErrorReport = `${faceError} ${nameError}`.trim();
        await notifyAdminOfRejection(user.id, `Total Verification Failure. ${fullErrorReport}`);
        throw new Error(`Identity verification failed. ${fullErrorReport} Please ensure both photos are very clear.`);
      }

      console.log('🎉 Verification Passed!', { faceMatched, nameMatched });

      // 3. Upload Files - Only if verification passes
      setError('Finalizing upload...');
      const pUrl = await handleFileUpload(profilePic, 'diwalya-media', 'profiles');
      const gUrl = await handleFileUpload(ghanaCard, 'diwalya-media', 'verifications');

      // 4. Create Profile
      const finalCategory = formData.category === 'Other' ? formData.customCategory : formData.category;
      
      const result = await createWorkerProfile(user.id, {
        ...formData,
        category: finalCategory,
        profilePicture: pUrl,
        ghanaCardUrl: gUrl
      });

      if (result.success) {
        router.push('/dashboard/worker');
      } else {
        throw new Error(result.error);
      }

    } catch (err: any) {
      console.error('Onboarding Error:', err);
      setError(err.message || 'Something went wrong. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIBio = () => {
    const { businessName, location, experienceYears, category, customCategory } = formData;
    const finalCategory = category === 'Other' ? customCategory : category;
    
    const templates = [
      `Professional ${finalCategory} with ${experienceYears} years of hands-on experience based in ${location}. ${businessName ? `Working under ${businessName}, I` : 'I'} specialize in delivering high-quality, reliable results for every client. Dedicated to excellence and customer satisfaction.`,
      `With over ${experienceYears} years of expertise as a ${finalCategory} in ${location}, I provide top-tier services tailored to your needs. ${businessName ? `Representing ${businessName}, our` : 'My'} mission is to ensure quality craftmanship and efficient service in every project.`,
      `Reliable and skilled ${finalCategory} located in ${location}. I have ${experienceYears} years of experience in the industry${businessName ? ` running ${businessName}` : ''}. I pride myself on professionalism, punctuality, and great attention to detail.`,
      `Looking for a ${finalCategory} in ${location}? I bring ${experienceYears} years of professional experience to the table. ${businessName ? `At ${businessName}, we focus` : 'I focus'} on providing affordable and expert solutions for all your ${finalCategory} needs.`
    ];

    const randomBio = templates[Math.floor(Math.random() * templates.length)];
    setFormData({ ...formData, bio: randomBio });
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
                <label className="block text-sm font-bold text-gray-700 mb-2">Business or Full Name</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    placeholder="e.g. Mensah Electricals"
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300"
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
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300"
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
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Your Category</label>
                <select 
                   value={formData.category}
                   onChange={(e) => setFormData({...formData, category: e.target.value})}
                   className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none bg-gray-50 text-slate-900 font-bold"
                >
                  <optgroup label="Skilled Trades">
                    <option>Electrician</option>
                    <option>Plumber</option>
                    <option>Carpenter</option>
                    <option>Mechanic</option>
                    <option>Mason / Bricklayer</option>
                    <option>Welder</option>
                    <option>Painter</option>
                    <option>Tiler</option>
                    <option>AC Technician</option>
                    <option>CCTV Installer</option>
                  </optgroup>
                  <optgroup label="Service & General">
                    <option>Cleaner (Residential/Office)</option>
                    <option>Laundry & Dry Cleaning</option>
                    <option>Delivery Rider</option>
                    <option>Security Guard</option>
                    <option>Gardener / Landscaper</option>
                    <option>Construction Laborer</option>
                    <option>Event Usher / Staff</option>
                    <option>Sales Representative</option>
                  </optgroup>
                  <optgroup label="Digital & Professional">
                    <option>Graphic Designer</option>
                    <option>Data Entry Specialist</option>
                    <option>Software Developer</option>
                    <option>Virtual Assistant</option>
                  </optgroup>
                  <option value="Other">Other (Type below...)</option>
                </select>
              </div>

              {formData.category === 'Other' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Specify Your Category</label>
                  <input
                    type="text"
                    required
                    value={formData.customCategory}
                    onChange={(e) => setFormData({...formData, customCategory: e.target.value})}
                    placeholder="e.g. Fashion Designer, Barber, etc."
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300"
                  />
                </div>
              )}

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

                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-700">Professional Bio</label>
                  <button 
                    type="button"
                    onClick={generateAIBio}
                    className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all border border-primary/20"
                  >
                    <span className="text-sm">✨</span> Generate with AI
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 font-medium placeholder:text-slate-300"
                  placeholder="Tell clients about your skills and why they should hire you..."
                />

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

