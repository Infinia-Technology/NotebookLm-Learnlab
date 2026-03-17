import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils/cn';

type IconButtonVariant = 'default' | 'ghost' | 'outline' | 'primary' | 'danger';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isLoading?: boolean;
  'aria-label': string;
}

const variantClasses: Record<IconButtonVariant, string> = {
  default: `
    bg-[var(--gpt-hover)] text-[var(--gpt-text-primary)]
    hover:bg-[var(--gpt-border)]
    dark:bg-[var(--gpt-hover)] dark:hover:bg-[var(--gpt-border)]
  `,
  ghost: `
    bg-transparent text-[var(--gpt-text-secondary)]
    hover:bg-[var(--gpt-hover)] hover:text-[var(--gpt-text-primary)]
  `,
  outline: `
    bg-transparent text-[var(--gpt-text-primary)]
    border border-[var(--gpt-border)]
    hover:bg-[var(--gpt-hover)]
  `,
  primary: `
    bg-[var(--color-primary-600)] text-white
    hover:bg-[var(--color-primary-700)]
  `,
  danger: `
    bg-transparent text-[var(--color-danger-500)]
    hover:bg-[var(--color-danger-50)]
    dark:hover:bg-[var(--color-danger-500)]/10
  `,
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'w-7 h-7 p-1.5',
  md: 'w-8 h-8 p-2',
  lg: 'w-10 h-10 p-2.5',
};

const iconSizeClasses: Record<IconButtonSize, string> = {
  sm: '[&>svg]:w-3.5 [&>svg]:h-3.5',
  md: '[&>svg]:w-4 [&>svg]:h-4',
  lg: '[&>svg]:w-5 [&>svg]:h-5',
};

/**
 * IconButton component for icon-only actions.
 * Supports multiple variants (ghost, outline, primary) and sizes.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      icon,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      disabled,
      className,
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || isLoading}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-lg',
          'transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variant styles
          variantClasses[variant],
          // Size styles
          sizeClasses[size],
          iconSizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin"
            xmlns="http://www.w3.org/2000/svg"
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
          icon
        )}
      </button>
    );
  }
);
