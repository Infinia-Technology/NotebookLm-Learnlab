import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onClose?: () => void;
  className?: string;
}

const variantConfig = {
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: Info,
    iconColor: 'text-blue-500',
    title: 'text-blue-800',
    text: 'text-blue-700',
  },
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-500',
    title: 'text-green-800',
    text: 'text-green-700',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    icon: AlertCircle,
    iconColor: 'text-amber-500',
    title: 'text-amber-800',
    text: 'text-amber-700',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: XCircle,
    iconColor: 'text-red-500',
    title: 'text-red-800',
    text: 'text-red-700',
  },
};

export function Alert({
  children,
  variant = 'info',
  title,
  onClose,
  className,
}: AlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 p-4 border rounded-lg',
        config.bg,
        className
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={cn('font-medium mb-1', config.title)}>{title}</h4>
        )}
        <div className={cn('text-sm', config.text)}>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            'flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors',
            config.text
          )}
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
