/**
 * Format currency values in AED'000 format
 * Values are assumed to be in thousands (as per Excel import)
 * Display: M for millions (of thousands = billions), K for thousands (of thousands = millions)
 *
 * Example:
 * - Input: 111200 (meaning 111,200 thousands = 111.2M AED)
 * - Output: "111.2M" (column header shows AED'000)
 */
export function formatAmount(
  value: number | string | null | undefined,
  options: {
    showSign?: boolean;
    decimals?: number;
  } = {}
): string {
  if (value === null || value === undefined || value === '') return '-';

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';

  const { showSign = false, decimals = 1 } = options;
  const absNum = Math.abs(num);

  let displayValue: number;
  let suffix = '';

  // Values are in thousands, so:
  // 1,000,000 thousands = 1 billion = show as 1,000M or 1B
  // 1,000 thousands = 1 million = show as 1M
  // 1 thousand = show as 1K or just the number

  if (absNum >= 1_000_000) {
    // Billions (show as B)
    displayValue = num / 1_000_000;
    suffix = 'B';
  } else if (absNum >= 1_000) {
    // Millions (show as M)
    displayValue = num / 1_000;
    suffix = 'M';
  } else if (absNum >= 1) {
    // Thousands (show as K)
    displayValue = num;
    suffix = 'K';
  } else {
    displayValue = num;
    suffix = '';
  }

  const formatted = Math.abs(displayValue).toLocaleString('en-US', {
    minimumFractionDigits: suffix ? decimals : 0,
    maximumFractionDigits: suffix ? decimals : 2,
  });

  const sign = num < 0 ? '-' : (showSign && num > 0 ? '+' : '');
  return `${sign}${formatted}${suffix}`;
}

/**
 * Format currency with full prefix for display in headers/labels
 * Example: "AED 111.2M"
 */
export function formatCurrencyFull(
  value: number | string | null | undefined,
  currency: string = 'AED'
): string {
  const amount = formatAmount(value);
  if (amount === '-') return '-';
  return `${currency} ${amount}`;
}

/**
 * Format raw number without suffix (for table cells with unit in header)
 * Shows number with thousands separator
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-';

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Format percentage with optional sign
 */
export function formatPercentage(
  value: number | string | null | undefined,
  options: { showSign?: boolean; decimals?: number } = {}
): string {
  if (value === null || value === undefined || value === '') return '-';

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';

  const { showSign = false, decimals = 1 } = options;
  const sign = num > 0 && showSign ? '+' : '';

  return `${sign}${num.toFixed(decimals)}%`;
}

/**
 * Get the column header unit label
 */
export function getUnitLabel(currency: string = 'AED'): string {
  return `${currency}'000`;
}

/**
 * Utility to join class names
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get color class based on positive/negative value
 */
export function getChangeColor(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'text-gray-500';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'text-gray-500';
  if (num > 0) return 'text-green-600';
  if (num < 0) return 'text-red-600';
  return 'text-gray-500';
}

/**
 * Get background color class based on positive/negative value
 */
export function getChangeBgColor(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'bg-gray-50';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'bg-gray-50';
  if (num > 0) return 'bg-green-50';
  if (num < 0) return 'bg-red-50';
  return 'bg-gray-50';
}

// Legacy export for backwards compatibility
export const formatCurrency = formatCurrencyFull;
