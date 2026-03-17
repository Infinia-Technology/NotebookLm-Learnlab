/**
 * Shared period utilities for financial data entry
 * Used across segment, employee, and revenue by country modals
 */

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;

export const QUARTER_MONTHS = [
  { value: 3, label: 'March (Q1)' },
  { value: 6, label: 'June (Q2)' },
  { value: 9, label: 'September (Q3)' },
  { value: 12, label: 'December (Q4)' },
] as const;

export const PERIOD_TYPES = ['YTD', 'FULL_YEAR', 'QUARTERLY', 'MONTHLY'] as const;

export type PeriodType = typeof PERIOD_TYPES[number];

export const FISCAL_YEARS = [2026, 2025, 2024, 2023] as const;

export const DEFAULT_FISCAL_YEAR = 2025;
export const DEFAULT_PERIOD_MONTH = 12; // December
export const DEFAULT_PERIOD_TYPE: PeriodType = 'YTD'; // YTD is default for flow data

/**
 * Get available months based on period type
 */
export function getMonthsForPeriodType(periodType: PeriodType) {
  if (periodType === 'QUARTERLY') {
    return QUARTER_MONTHS;
  }
  return MONTHS;
}

/**
 * Check if month selector should be disabled
 */
export function isMonthSelectorDisabled(periodType: PeriodType): boolean {
  return periodType === 'FULL_YEAR';
}

/**
 * Get the appropriate month value when period type changes
 */
export function getAdjustedMonth(periodType: PeriodType, currentMonth: number): number {
  if (periodType === 'FULL_YEAR') {
    return 12; // Full year always December
  }
  if (periodType === 'QUARTERLY') {
    // If current month is not a quarter-end, default to December (Q4)
    if (![3, 6, 9, 12].includes(currentMonth)) {
      return 12;
    }
  }
  return currentMonth;
}

/**
 * Format period label (e.g., "Dec-25-YTD")
 */
export function formatPeriodLabel(fiscalYear: number, periodMonth: number, periodType: PeriodType): string {
  const monthName = MONTHS.find(m => m.value === periodMonth)?.label.substring(0, 3) || 'Dec';
  const yearShort = String(fiscalYear).slice(-2);
  return `${monthName}-${yearShort}-${periodType}`;
}

/**
 * Check if a period already exists in the list (for flow data with period_type)
 */
export function periodExists(
  existingPeriods: Array<{ fiscal_year: number; period_month: number; period_type?: string }>,
  fiscalYear: number,
  periodMonth: number,
  periodType?: PeriodType
): boolean {
  return existingPeriods.some(
    (p) => p.fiscal_year === fiscalYear &&
           p.period_month === periodMonth &&
           (periodType === undefined || p.period_type === periodType)
  );
}

/**
 * Check if a snapshot already exists (for employee data)
 */
export function snapshotExists(
  existingSnapshots: Array<{ as_of_year: number; as_of_month: number }>,
  asOfYear: number,
  asOfMonth: number
): boolean {
  return existingSnapshots.some(
    (s) => s.as_of_year === asOfYear && s.as_of_month === asOfMonth
  );
}

/**
 * Get display label for flow data (Segment, Revenue by Country)
 * Examples: "FY 2025", "Q3 2025", "Sep 2025 YTD", "Sep 2025"
 */
export function getDisplayPeriodLabel(
  fiscalYear: number,
  periodMonth: number,
  periodType: PeriodType | string
): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[periodMonth - 1] || 'Dec';

  switch (periodType) {
    case 'FULL_YEAR':
      return `FY ${fiscalYear}`;
    case 'QUARTERLY': {
      const quarter = Math.ceil(periodMonth / 3);
      return `Q${quarter} ${fiscalYear}`;
    }
    case 'YTD':
      return `${monthName} ${fiscalYear} YTD`;
    case 'MONTHLY':
    default:
      return `${monthName} ${fiscalYear}`;
  }
}

/**
 * Get display label for snapshot data (Employee)
 * Example: "As of Sep 2025"
 */
export function getSnapshotLabel(asOfYear: number, asOfMonth: number): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[asOfMonth - 1] || 'Dec';
  return `As of ${monthName} ${asOfYear}`;
}
