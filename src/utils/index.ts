import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with clsx and merges Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a Stellar address for display
 */
export function formatAddress(address: string, startLength = 8, endLength = 8): string {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Formats currency amount for display
 */
export function formatCurrency(amount: number, currency = 'SLR'): string {
  return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

/**
 * Formats a number for display with proper decimals
 */
export function formatNumber(num: number | string, decimals = 2): string {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(number)) return '0';
  
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
}

/**
 * Formats a timestamp for display
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Validate Stellar address format
 */
export function isValidStellarAddress(address: string): boolean {
  // Stellar public keys start with 'G' and are 56 characters long
  const stellarPublicKeyRegex = /^G[A-Z2-7]{55}$/;
  // Stellar contract addresses start with 'C' and are 56 characters long
  const stellarContractRegex = /^C[A-Z2-7]{55}$/;
  
  return stellarPublicKeyRegex.test(address) || stellarContractRegex.test(address);
}

/**
 * Generate a random color for avatars
 */
export function generateAvatarColor(seed: string): string {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}
