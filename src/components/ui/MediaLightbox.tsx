'use client';

import React, { useEffect, useCallback } from 'react';
import { X, Play, Video as VideoIcon, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import SupabaseImage from './SupabaseImage';

interface MediaLightboxProps {
  url: string | null;
  onClose: () => void;
}

export default function MediaLightbox({ url, onClose }: MediaLightboxProps) {
  const isVideo = useCallback((mediaUrl: string | null) => {
    if (!mediaUrl) return false;
    return (
      mediaUrl.includes('.mp4') || 
      mediaUrl.includes('.mov') || 
      mediaUrl.includes('.webm') || 
      mediaUrl.toLowerCase().includes('video')
    );
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (url) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [url, handleKeyDown]);

  if (!url) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[210] shadow-xl group"
        aria-label="Close"
      >
        <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
      
      {/* Content container */}
      <div 
        className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center scale-in-center overflow-hidden rounded-[2rem] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo(url) ? (
          <video 
            src={url} 
            className="max-w-full max-h-[85vh] rounded-2xl" 
            controls 
            autoPlay 
          />
        ) : (
          <SupabaseImage 
            src={url} 
            alt="Enlarged Media View" 
            className="max-w-full max-h-[85vh] rounded-2xl object-contain w-auto h-auto" 
          />
        )}
      </div>
      
      <style jsx global>{`
        @keyframes scale-in-center {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .scale-in-center { animation: scale-in-center 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
      `}</style>
    </div>
  );
}
