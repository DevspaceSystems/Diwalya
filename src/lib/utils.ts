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
