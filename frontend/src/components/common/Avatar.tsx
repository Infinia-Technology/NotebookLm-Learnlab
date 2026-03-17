import { User, Bot, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

type AvatarSize = 'sm' | 'md' | 'lg';
type AvatarType = 'user' | 'assistant' | 'system';

interface AvatarProps {
  type: AvatarType;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

const iconSizes: Record<AvatarSize, string> = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

/**
 * Avatar component for displaying user or system avatars.
 * Supports different sizes.
 */
export function Avatar({ type, size = 'md', className }: AvatarProps) {
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  // User avatar
  if (type === 'user') {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center flex-shrink-0',
          'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
          sizeClass,
          className
        )}
        aria-label="User"
      >
        <User className={iconSize} />
      </div>
    );
  }

  // System/special avatar
  if (type === 'system') {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center flex-shrink-0',
          'bg-gradient-to-br from-amber-500 to-orange-500 text-white',
          sizeClass,
          className
        )}
        aria-label="System"
      >
        <Sparkles className={iconSize} />
      </div>
    );
  }

  // Default assistant avatar
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0',
        'bg-gradient-to-br from-violet-500 to-purple-600 text-white',
        sizeClass,
        className
      )}
      aria-label="Assistant"
    >
      <Bot className={iconSize} />
    </div>
  );
}
