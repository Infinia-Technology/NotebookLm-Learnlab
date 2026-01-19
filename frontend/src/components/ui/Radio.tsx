import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className, id, checked, ...props }, ref) => {
    const radioId = id || `radio-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <label
        htmlFor={radioId}
        className={cn(
          'flex items-start gap-3 cursor-pointer group',
          props.disabled && 'cursor-not-allowed opacity-60',
          className
        )}
      >
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            checked={checked}
            className="sr-only peer"
            {...props}
          />
          <div
            className={cn(
              'w-5 h-5 border-2 rounded-full transition-colors flex items-center justify-center',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--btn-primary-bg)]/20 peer-focus-visible:ring-offset-1',
              checked
                ? 'border-[var(--btn-primary-bg)]'
                : 'border-gray-300 group-hover:border-gray-400'
            )}
          >
            {checked && (
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--btn-primary-bg)]" />
            )}
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-gray-900">{label}</span>
            )}
            {description && (
              <span className="text-sm text-gray-500">{description}</span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Radio.displayName = 'Radio';

export interface RadioGroupProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export function RadioGroup({ label, children, className }: RadioGroupProps) {
  return (
    <fieldset className={className}>
      {label && (
        <legend className="text-sm font-medium text-gray-700 mb-3">{label}</legend>
      )}
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}
