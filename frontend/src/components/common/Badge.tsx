import { cn } from '../../lib/utils/cn';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--gpt-hover)] text-[var(--gpt-text-primary)]',
  primary: 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)] dark:text-[var(--color-primary-200)]',
  success: 'bg-[var(--color-success-100)] text-[var(--color-success-600)] dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-[var(--color-warning-100)] text-[var(--color-warning-600)] dark:bg-yellow-900/30 dark:text-yellow-400',
  danger: 'bg-[var(--color-danger-100)] text-[var(--color-danger-600)] dark:bg-red-900/30 dark:text-red-400',
  outline: 'bg-transparent border border-[var(--gpt-border)] text-[var(--gpt-text-secondary)]',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
};

/**
 * Badge component for status indicators, labels, and tags.
 */
export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Department badge with automatic coloring
 */
export function DepartmentBadge({
  department,
  size = 'sm',
  className,
}: {
  department: string;
  size?: BadgeSize;
  className?: string;
}) {
  const departmentColors: Record<string, string> = {
    'Finance': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Investment': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Legal': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'Strategy': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'Human Resources': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    'HR': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    'Executive': 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
    'Media and Communication': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    'Governance and Compliance': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'Administration': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  const colorClass = departmentColors[department] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        colorClass,
        sizeClasses[size],
        className
      )}
    >
      {department}
    </span>
  );
}
