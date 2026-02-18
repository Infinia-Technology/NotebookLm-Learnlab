/**
 * HeaderBar - Top navigation bar with breadcrumbs and user menu
 *
 * Features:
 * - Dynamic breadcrumbs based on current route and variant
 * - User profile dropdown
 * - View switcher (Admin/User) for super_admin users
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  Settings,
  LogOut,
  ChevronDown,
  ShieldCheck,
  ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../common';

export interface HeaderBarProps {
  variant?: 'user' | 'admin';
}

// Breadcrumb configuration
interface BreadcrumbItem {
  label: string;
  href?: string;
}

// User route breadcrumbs
const userRouteBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ label: 'Dashboard' }],
  '/dashboard/account': [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Account Settings' },
  ],
};

// Admin route breadcrumbs
const adminRouteBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/admin': [{ label: 'Admin Dashboard' }],
  '/admin/users': [
    { label: 'Admin', href: '/admin' },
    { label: 'User Management' },
  ],
  '/admin/users/create': [
    { label: 'Admin', href: '/admin' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Create' },
  ],
};

// Dynamic route patterns
const userDynamicBreadcrumbs: Array<{
  pattern: RegExp;
  getBreadcrumbs: (match: RegExpMatchArray) => BreadcrumbItem[];
}> = [
    {
      pattern: /^\/dashboard\/([^/]+)$/,
      getBreadcrumbs: (match) => [
        { label: 'Dashboard', href: '/dashboard' },
        { label: match[1].charAt(0).toUpperCase() + match[1].slice(1).replace(/-/g, ' ') },
      ],
    },
  ];

const adminDynamicBreadcrumbs: Array<{
  pattern: RegExp;
  getBreadcrumbs: (match: RegExpMatchArray) => BreadcrumbItem[];
}> = [
    {
      pattern: /^\/admin\/users\/([^/]+)$/,
      getBreadcrumbs: () => [
        { label: 'Admin', href: '/admin' },
        { label: 'Users', href: '/admin/users' },
        { label: 'Edit User' },
      ],
    },
  ];

function getBreadcrumbs(pathname: string, variant: 'user' | 'admin'): BreadcrumbItem[] {
  const staticRoutes = variant === 'admin' ? adminRouteBreadcrumbs : userRouteBreadcrumbs;
  const dynamicRoutes = variant === 'admin' ? adminDynamicBreadcrumbs : userDynamicBreadcrumbs;
  const defaultLabel = variant === 'admin' ? 'Admin' : 'Dashboard';
  const defaultHref = variant === 'admin' ? '/admin' : '/dashboard';

  // Check static routes first
  if (staticRoutes[pathname]) {
    return staticRoutes[pathname];
  }

  // Check dynamic patterns
  for (const { pattern, getBreadcrumbs: getItems } of dynamicRoutes) {
    const match = pathname.match(pattern);
    if (match) {
      return getItems(match);
    }
  }

  // Default fallback
  return [{ label: defaultLabel, href: defaultHref }];
}

export function HeaderBar({ variant = 'user' }: HeaderBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = variant === 'admin';
  const breadcrumbs = getBreadcrumbs(location.pathname, variant);
  const homeHref = isAdmin ? '/admin' : '/dashboard';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.email || 'User';

  const initials = user?.first_name
    ? `${user.first_name.charAt(0)}${user.last_name?.charAt(0) || ''}`
    : user?.email?.charAt(0).toUpperCase() || 'U';

  // Avatar colors based on variant
  const avatarColors = isAdmin
    ? 'from-purple-500 to-purple-700'
    : 'from-[var(--btn-primary-bg)] to-sky-400';

  return (
    <header className="bg-white/40 dark:bg-[#141414]/40 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10 rounded-tl-2xl backdrop-blur-md transition-colors duration-300">
      <div className="flex items-center justify-between h-14 px-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-1 text-sm">
          <Link
            to={homeHref}
            className={cn(
              'transition-all duration-200 p-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800',
              isAdmin
                ? 'text-purple-500 hover:text-purple-700'
                : 'text-gray-400 hover:text-[var(--btn-primary-bg)]'
            )}
          >
            <Home className="w-4 h-4" />
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-0.5" />
              {crumb.href && index < breadcrumbs.length - 1 ? (
                <Link
                  to={crumb.href}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-1.5 py-0.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-900 dark:text-gray-100 font-medium px-1.5 py-0.5">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Right side: View Switcher + Profile */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* View Switcher - Only for super_admin */}
          {isSuperAdmin && (
            isAdmin ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span className="hidden sm:inline">User View</span>
              </Link>
            ) : (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-200"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )
          )}

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200',
                dropdownOpen ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm bg-gradient-to-br',
                avatarColors
              )}>
                <span className="text-white text-xs font-semibold">{initials}</span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block max-w-[120px] truncate">
                {displayName}
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-gray-400 transition-transform duration-200 hidden sm:block',
                  dropdownOpen && 'rotate-180'
                )}
              />
            </Button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1c1c1c] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{displayName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{user?.email}</p>
                  {user?.role && (
                    <span className={cn(
                      'inline-flex items-center mt-2 px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                      isAdmin
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                    )}>
                      {user.role.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {/* Menu Items */}
                <div className="py-1.5">
                  <Link
                    to="/dashboard/account"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    Account Settings
                  </Link>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 justify-start rounded-none transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderBar;
