import { forwardRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, id, checked, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          'flex items-start gap-3 cursor-pointer group',
          props.disabled && 'cursor-not-allowed opacity-60',
          className
        )}
      >
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            checked={checked}
            className="sr-only peer"
            {...props}
          />
          <div
            className={cn(
              'w-5 h-5 border-2 rounded transition-colors',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--btn-primary-bg)]/20 peer-focus-visible:ring-offset-1',
              checked
                ? 'bg-[var(--btn-primary-bg)] border-[var(--btn-primary-bg)]'
                : 'bg-white border-gray-300 group-hover:border-gray-400'
            )}
          >
            {checked && (
              <Check className="w-full h-full text-white p-0.5" strokeWidth={3} />
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

Checkbox.displayName = 'Checkbox';
