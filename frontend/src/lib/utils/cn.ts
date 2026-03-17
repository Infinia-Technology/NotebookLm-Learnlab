import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function for combining Tailwind CSS classes with proper merging.
 * Uses clsx for conditional classes and tailwind-merge to handle conflicts.
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-blue-500', 'text-white')
 * cn('bg-red-500', 'bg-blue-500') // Returns 'bg-blue-500' (merged)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
