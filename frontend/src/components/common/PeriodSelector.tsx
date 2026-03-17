import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  PERIOD_TYPES,
  FISCAL_YEARS,
  DEFAULT_FISCAL_YEAR,
  DEFAULT_PERIOD_MONTH,
  DEFAULT_PERIOD_TYPE,
  getMonthsForPeriodType,
  isMonthSelectorDisabled,
  getAdjustedMonth,
  periodExists,
  type PeriodType,
} from '../../lib/period-utils';

interface PeriodSelectorProps {
  fiscalYear: number;
  periodMonth: number;
  periodType: PeriodType;
  onFiscalYearChange: (year: number) => void;
  onPeriodMonthChange: (month: number) => void;
  onPeriodTypeChange: (type: PeriodType) => void;
  existingPeriods?: Array<{ fiscal_year: number; period_month: number; period_type?: string }>;
  /** Color theme for focus ring (e.g., 'purple', 'orange', 'teal') */
  colorTheme?: 'purple' | 'orange' | 'teal' | 'blue';
  /** Hide the Period Type dropdown (defaults to false) */
  hidePeriodType?: boolean;
  /** Info message to display above the period selector */
  infoMessage?: string;
}

const colorClasses = {
  purple: 'focus:ring-purple-500 focus:border-purple-500',
  orange: 'focus:ring-orange-500 focus:border-orange-500',
  teal: 'focus:ring-teal-500 focus:border-teal-500',
  blue: 'focus:ring-blue-500 focus:border-blue-500',
};

export function PeriodSelector({
  fiscalYear,
  periodMonth,
  periodType,
  onFiscalYearChange,
  onPeriodMonthChange,
  onPeriodTypeChange,
  existingPeriods = [],
  colorTheme = 'blue',
  hidePeriodType = false,
  infoMessage,
}: PeriodSelectorProps) {
  const focusClass = colorClasses[colorTheme];
  const monthDisabled = isMonthSelectorDisabled(periodType);
  const availableMonths = getMonthsForPeriodType(periodType);
  const showPeriodWarning = periodExists(existingPeriods, fiscalYear, periodMonth, periodType);

  // Handle period type changes - adjust month accordingly
  useEffect(() => {
    const adjustedMonth = getAdjustedMonth(periodType, periodMonth);
    if (adjustedMonth !== periodMonth) {
      onPeriodMonthChange(adjustedMonth);
    }
  }, [periodType]);

  return (
    <div className="space-y-4">
      {/* Info message */}
      {infoMessage && (
        <p className="text-sm text-gray-600 italic">{infoMessage}</p>
      )}

      <div className={`grid ${hidePeriodType ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
        {/* Fiscal Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fiscal Year
          </label>
          <select
            value={fiscalYear}
            onChange={(e) => onFiscalYearChange(parseInt(e.target.value))}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${focusClass}`}
          >
            {FISCAL_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Period Month */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Period Month
          </label>
          <select
            value={periodMonth}
            onChange={(e) => onPeriodMonthChange(parseInt(e.target.value))}
            disabled={monthDisabled}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${focusClass} ${
              monthDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          >
            {availableMonths.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Period Type - conditionally rendered */}
        {!hidePeriodType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period Type
            </label>
            <select
              value={periodType}
              onChange={(e) => onPeriodTypeChange(e.target.value as PeriodType)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${focusClass}`}
            >
              {PERIOD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Period exists warning */}
      {showPeriodWarning && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-700">
            Data already exists for this period. Please select a different period or edit the existing data.
          </p>
        </div>
      )}
    </div>
  );
}

// Re-export defaults for convenience
export {
  DEFAULT_FISCAL_YEAR,
  DEFAULT_PERIOD_MONTH,
  DEFAULT_PERIOD_TYPE,
  type PeriodType,
};
