/**
 * PageLayout - Consistent page wrapper for all pages
 *
 * Provides:
 * - Consistent heading (title + optional subtitle)
 * - Optional icon displayed before the title
 * - Optional back button for navigation
 * - Optional actions area (right side of header)
 * - Consistent spacing between header and content
 */

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export interface PageLayoutProps {
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional icon to display before the title */
  icon?: ReactNode;
  /** Optional back button - can be a path string or true to go back in history */
  backTo?: string | boolean;
  /** Optional actions (buttons, etc.) to display on the right side of the header */
  actions?: ReactNode;
  /** Optional max width constraint (default: none) */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'none';
  /** Page content */
  children: ReactNode;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  none: '',
};

export function PageLayout({
  title,
  subtitle,
  icon,
  backTo,
  actions,
  maxWidth = 'none',
  children
}: PageLayoutProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof backTo === 'string') {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={maxWidth !== 'none' ? `${maxWidthClasses[maxWidth]} mx-auto` : ''}>
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {backTo && (
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          {icon && (
            <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center flex-shrink-0 text-sky-600 dark:text-sky-400">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            {subtitle && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}

export default PageLayout;
