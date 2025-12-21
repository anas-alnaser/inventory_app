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

export function formatCurrency(amount: number | string, currencyCode: string = 'JOD'): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return `0.00 ${currencyCode}`;
  
  // Map currency codes to locale strings for proper formatting
  const localeMap: Record<string, string> = {
    'JOD': 'en-JO',
    'USD': 'en-US',
    'EUR': 'en-IE', // Using Ireland locale for EUR formatting
  };
  
  const locale = localeMap[currencyCode] || 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2
  }).format(value);
}

/**
 * Escapes a CSV field value by wrapping it in quotes if it contains commas, quotes, or newlines
 */
function escapeCSVField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts an array of objects to CSV format and triggers a download
 * @param data Array of objects to convert to CSV
 * @param filename Name of the file to download (without extension)
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows: string[] = [];
  
  // Add header row
  csvRows.push(headers.map(escapeCSVField).join(','));
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => escapeCSVField(row[header]));
    csvRows.push(values.join(','));
  });
  
  // Combine all rows
  const csvContent = csvRows.join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}
