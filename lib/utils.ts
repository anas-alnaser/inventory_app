import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: any): string {
  if (!date) return 'Never';

  try {
    // Handle Firestore Timestamp (has .seconds) or standard Date or String
    const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch (e) {
    return 'Unknown';
  }
}
