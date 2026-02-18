import { cn } from '../../lib/utils';
import { Link, type LinkProps } from 'react-router-dom';
import type { ReactNode } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';

  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary:
      'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary:
      'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500',
    outline:
      'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 focus:ring-gray-500',
    ghost:
      'text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 focus:ring-gray-500',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };


  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

// Shared styling for buttons - use these in components
export const buttonVariants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 focus:ring-gray-500',
  ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
};

export const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
};


export const buttonBase = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

// LinkButton - for router links styled as buttons
export interface LinkButtonProps extends Omit<LinkProps, 'className'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
}

export function LinkButton({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(
        buttonBase,
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}
