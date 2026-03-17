import { cn, formatAmount, formatPercentage, getChangeColor, getUnitLabel } from '../../lib/utils';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: number | null;
  previousValue?: number | null;
  currency?: string;
  unit?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({
  title,
  value,
  previousValue,
  currency = 'AED',
  unit: _unit,
  icon,
}: StatCardProps) {
  const change =
    value !== null && previousValue !== null && previousValue !== undefined && previousValue !== 0
      ? ((value - previousValue) / Math.abs(previousValue)) * 100
      : null;

  // Show unit label if currency is provided (not empty string)
  const showUnit = currency !== '';
  const unitLabel = showUnit ? getUnitLabel(currency) : '';

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {showUnit && (
              <span className="text-xs text-gray-400">({unitLabel})</span>
            )}
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {currency !== '' ? formatAmount(value) : (value ?? '-')}
          </p>
          {change !== null && (
            <p className={cn('mt-1 text-sm', getChangeColor(change))}>
              {formatPercentage(change)} vs prior year
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
