import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  Settings,
  LogOut,
  ChevronDown,
  ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

// Breadcrumb configuration
interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Admin route to breadcrumb mapping
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
  '/admin/domains': [
    { label: 'Admin', href: '/admin' },
    { label: 'Domain Management' },
  ],
};

// Dynamic route patterns for admin
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

function getAdminBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Check static routes first
  if (adminRouteBreadcrumbs[pathname]) {
    return adminRouteBreadcrumbs[pathname];
  }

  // Check dynamic patterns
  for (const { pattern, getBreadcrumbs } of adminDynamicBreadcrumbs) {
    const match = pathname.match(pattern);
    if (match) {
      return getBreadcrumbs(match);
    }
  }

  // Default fallback
  return [{ label: 'Admin', href: '/admin' }];
}

export function AdminHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const breadcrumbs = getAdminBreadcrumbs(location.pathname);

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

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between h-14 px-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-1 text-sm">
          <Link
            to="/admin"
            className="text-purple-500 hover:text-purple-700 transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />
              {crumb.href && index < breadcrumbs.length - 1 ? (
                <Link
                  to={crumb.href}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-900 font-medium">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Right side: View Switcher + Profile */}
        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span className="hidden sm:inline">User View</span>
          </Link>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
                dropdownOpen ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{initials}</span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {displayName}
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-gray-400 transition-transform hidden sm:block',
                  dropdownOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                    Super Admin
                  </span>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <Link
                    to="/dashboard/account"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    Account Settings
                  </Link>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
