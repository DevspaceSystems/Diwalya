'use client';

import React, { useState, useEffect } from 'react';
import { User, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupabaseImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackType?: 'initials' | 'icon';
  width?: number;
  height?: number;
  showLoader?: boolean;
  crossOrigin?: "anonymous" | "use-credentials" | "";
}

export default function SupabaseImage({
  src,
  alt,
  className,
  fallbackType = 'initials',
  width,
  height,
  showLoader = true,
  crossOrigin = "anonymous"
}: SupabaseImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setError(true);
      setLoading(false);
      return;
    }

    // Ensure URL has a cache-buster if it's a Supabase URL
    let finalSrc = src;
    if (src.includes('supabase.co') && !src.includes('?t=')) {
      finalSrc = `${src}?t=${Date.now()}`;
    }
    
    setProcessedSrc(finalSrc);
    setError(false);
    setLoading(true);
  }, [src]);

  const initials = alt
    ? alt.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'W';

  if (error || !processedSrc) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-slate-100 text-slate-400 font-bold overflow-hidden",
        className
      )} style={{ width, height }}>
        {fallbackType === 'initials' ? (
          <span className="uppercase">{initials}</span>
        ) : (
          <ImageIcon size={width ? width / 3 : 24} />
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)} style={{ width, height }}>
      {loading && showLoader && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
          <div className="w-1/2 h-1/2 bg-slate-200 rounded-full" />
        </div>
      )}
      <img
        src={processedSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          loading ? "opacity-0" : "opacity-100"
        )}
        crossOrigin={crossOrigin}
        onLoad={() => setLoading(false)}
        onError={() => {
          console.error(`Failed to load image: ${processedSrc}`);
          setError(true);
          setLoading(false);
        }}
      />
    </div>
  );
}
