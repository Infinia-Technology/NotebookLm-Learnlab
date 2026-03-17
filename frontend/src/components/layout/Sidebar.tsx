import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Users,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
  Package,
  Layers,
  BarChart3,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSystemConfig } from '../../hooks/useSystemConfig';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean; // For exact route matching
}

export interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  variant?: 'user' | 'admin';
}

// Default navigation items
const userNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, end: true },
  { name: 'Modules', href: '/dashboard/modules', icon: Package },
  { name: 'Certifications', href: '/dashboard/certifications', icon: ShieldCheck },
  { name: 'Notebook', href: '/dashboard/notebook', icon: Layers },
  { name: 'Account', href: '/dashboard/account', icon: Settings },
];

const adminNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, end: true },
  { name: 'Marketplace', href: '/admin/marketplace', icon: Package },
  { name: 'Module Builder', href: '/admin/module-builder', icon: Layers },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Notebook', href: '/admin/notebook', icon: Layers },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'AI Settings', href: '/admin/settings', icon: Settings },
];

// Accent colors for each variant
const variantStyles = {
  user: {
    activeIcon: 'text-sky-600 dark:text-sky-400',
    activeBg: 'bg-sky-50 dark:bg-gray-800/50',
    labelColor: 'text-sky-600 dark:text-sky-400',
  },
  admin: {
    activeIcon: 'text-purple-600 dark:text-purple-400',
    activeBg: 'bg-purple-50 dark:bg-gray-800/50',
    labelColor: 'text-purple-600 dark:text-purple-400',
  },
};

export function Sidebar({ collapsed = false, onToggle, variant = 'user' }: SidebarProps) {
  const { config } = useSystemConfig();
  const navigation = variant === 'admin' ? adminNavigation : userNavigation;
  const styles = variantStyles[variant];
  const isAdmin = variant === 'admin';

  return (
    <div
      className={cn(
        'flex flex-col h-full flex-shrink-0 transition-all duration-300 relative z-20',
        'bg-white/60 dark:bg-black/60 border-r border-gray-100 dark:border-gray-800 backdrop-blur-md',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo & Toggle */}
      <div className={cn(
        'flex items-center h-16 flex-shrink-0',
        collapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <img
              src="/logo-icon.svg"
              alt={config.app.name}
              className="h-7 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <span className="font-bold text-gray-900 dark:text-white text-lg">
              {config.app.name}
            </span>
          </div>
        ) : (
          <img
            src="/logo-icon.svg"
            alt={config.app.name}
            className="h-7 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Admin Label (only for admin variant) */}
      {isAdmin && !collapsed && (
        <div className="px-4 py-2">
          <span className={cn('text-xs font-semibold uppercase tracking-wider flex items-center gap-2', styles.labelColor)}>
            <ShieldCheck className="w-3 h-3" />
            Admin
          </span>
        </div>
      )}
      {isAdmin && collapsed && (
        <div className="flex justify-center py-2">
          <div className={cn('p-2 rounded-xl', styles.activeBg)}>
            <ShieldCheck className={cn('w-5 h-5', styles.labelColor)} />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={cn('flex-1 py-4 space-y-1 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.end}
            title={collapsed ? item.name : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center text-sm font-medium rounded-xl transition-all duration-150',
                collapsed ? 'justify-center p-3' : 'px-3 py-2.5',
                isActive
                  ? `${styles.activeBg} text-gray-900 dark:text-white`
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/30 hover:text-gray-900 dark:hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn(
                  'w-5 h-5 transition-colors',
                  !collapsed && 'mr-3',
                  isActive ? styles.activeIcon : ''
                )} />
                {!collapsed && item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Toggle button at bottom when collapsed */}
      {collapsed && (
        <div className="p-2 pb-4">
          <button
            onClick={onToggle}
            className="w-full p-3 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex justify-center"
            title="Expand sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
