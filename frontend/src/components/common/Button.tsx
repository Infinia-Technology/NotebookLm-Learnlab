import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    bg-[var(--color-primary-600)] text-white
    hover:bg-[var(--color-primary-700)]
    focus-visible:ring-[var(--color-primary-500)]
  `,
  secondary: `
    bg-[var(--gpt-hover)] text-[var(--gpt-text-primary)]
    hover:bg-[var(--gpt-border)]
    focus-visible:ring-[var(--gpt-border)]
  `,
  ghost: `
    bg-transparent text-[var(--gpt-text-primary)]
    hover:bg-[var(--gpt-hover)]
    focus-visible:ring-[var(--gpt-border)]
  `,
  outline: `
    bg-transparent text-[var(--gpt-text-primary)]
    border border-[var(--gpt-border)]
    hover:bg-[var(--gpt-hover)]
    focus-visible:ring-[var(--gpt-border)]
  `,
  danger: `
    bg-[var(--color-danger-500)] text-white
    hover:bg-[var(--color-danger-600)]
    focus-visible:ring-[var(--color-danger-500)]
  `,
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: '[&>svg]:w-3.5 [&>svg]:h-3.5',
  md: '[&>svg]:w-4 [&>svg]:h-4',
  lg: '[&>svg]:w-5 [&>svg]:h-5',
};

/**
 * Button component with multiple variants and sizes.
 * Supports icons, loading state, and full width.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      leftIcon,
      rightIcon,
      isLoading = false,
      fullWidth = false,
      disabled,
      className,
      children,
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
          'inline-flex items-center justify-center rounded-lg font-medium',
          'transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variant styles
          variantClasses[variant],
          // Size styles
          sizeClasses[size],
          iconSizeClasses[size],
          // Full width
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin mr-2"
            width="16"
            height="16"
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
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);
