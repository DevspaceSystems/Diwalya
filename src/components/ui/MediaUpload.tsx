'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/image-utils';
import MediaLightbox from './MediaLightbox';

interface MediaUploadProps {
  label?: string;
  accept?: string;
  maxFiles?: number;
  bucket: string;
  folder: string;
  existingUrls?: string[];
  onUploadComplete: (urls: string[]) => void;
  className?: string;
}

export default function MediaUpload({
  label = 'Upload Media',
  accept = 'image/*,video/*',
  maxFiles = 3,
  bucket,
  folder,
  existingUrls = [],
  onUploadComplete,
  className = ''
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(existingUrls);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isVideo = (url: string) =>
    url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') || url.includes('video');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');

    const remaining = maxFiles - uploadedUrls.length;
    if (remaining <= 0) {
      setError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remaining);
    
    // Check for video size limit
    const overLimit = selectedFiles.find(f => !f.type.startsWith('image/') && f.size > 1 * 1024 * 1024);
    if (overLimit) {
      setError(`Video "${overLimit.name}" exceeds the 1MB limit. Please upload a smaller video.`);
      return;
    }

    setUploading(true);

    try {
      const newUrls: string[] = [];

      for (const file of selectedFiles) {
        let uploadFile = file;
        
        // Auto-compress if image
        if (file.type.startsWith('image/')) {
          try {
            uploadFile = await compressImage(file, 0.9);
          } catch (err) {
            console.error('Compression failed:', err);
          }
        }

        const ext = file.name.split('.').pop();
        const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filename, uploadFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
        newUrls.push(data.publicUrl);
      }

      const all = [...uploadedUrls, ...newUrls];
      setUploadedUrls(all);
      onUploadComplete(all);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Check Supabase Storage bucket permissions.');
    } finally {
      setUploading(false);
    }
  };

  const removeUrl = (urlToRemove: string) => {
    const updated = uploadedUrls.filter(u => u !== urlToRemove);
    setUploadedUrls(updated);
    onUploadComplete(updated);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <MediaLightbox 
        url={selectedMedia} 
        onClose={() => setSelectedMedia(null)} 
      />
      {label && (
        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1 block">
          {label} ({uploadedUrls.length}/{maxFiles})
        </label>
      )}

      {/* Drop Zone */}
      {uploadedUrls.length < maxFiles && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
          className={`
            w-full border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
            ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-slate-200 bg-slate-50 hover:border-primary/50 hover:bg-primary/[0.02]'}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="text-primary animate-spin" />
              <p className="text-sm font-bold text-slate-700">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                <Upload size={24} className="text-primary" />
              </div>
              <div>
                <p className="font-black text-slate-700 text-sm">Drop files here or click to upload</p>
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mt-1">
                  {accept.includes('video') ? 'Images & Videos' : 'Images'} • Max {maxFiles} files
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 text-xs font-bold">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Preview Grid */}
      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {uploadedUrls.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
              {isVideo(url) ? (
                <video
                  src={url}
                  className="w-full h-full object-cover"
                  muted
                />
              ) : (
                <img
                  src={url}
                  alt={`Upload ${i + 1}`}
                  onClick={() => setSelectedMedia(url)}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 cursor-zoom-in"
                />
              )}
              {/* Overlay for Video click since <video> might not trigger onClick easily if it's just a preview */}
              {isVideo(url) && (
                <div 
                  onClick={() => setSelectedMedia(url)}
                  className="absolute inset-0 cursor-zoom-in z-10"
                />
              )}
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeUrl(url)}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
              >
                <X size={14} />
              </button>
              {/* Type badge */}
              <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {isVideo(url)
                  ? <Video size={14} className="text-white drop-shadow" />
                  : <ImageIcon size={14} className="text-white drop-shadow" />
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
