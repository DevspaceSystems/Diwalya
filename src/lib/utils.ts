import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Ghana Cedis (GHS) with the ₵ symbol.
 */
export function formatGHS(amount: number | string | null | undefined) {
  if (amount === null || amount === undefined) return '₵0.00';
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₵${val.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Returns the environment-aware site URL.
 * 1. Checks for NEXT_PUBLIC_SITE_URL (set this to https://diwalya.com in production)
 * 2. Falls back to NEXT_PUBLIC_VERCEL_URL (set by Vercel)
 * 3. Defaults to window.location.origin in the browser
 * 4. Last resort: http://localhost:3000
 */
export function getURL() {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/';

  // Ensure protocol is included
  url = url.includes('http') ? url : `https://${url}`;
  
  // Ensure trailing slash is included
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  
  // Override with window.location.origin if in browser for better local dev experience
  if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_SITE_URL) {
    url = window.location.origin;
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  }

  return url;
}
