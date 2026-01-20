import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Users,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
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
  { name: 'Account', href: '/dashboard/account', icon: Settings },
];

const adminNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, end: true },
  { name: 'User Management', href: '/admin/users', icon: Users },
];

// Accent colors for each variant
const variantStyles = {
  user: {
    activeBg: 'bg-sky-900',
    activeText: 'text-sky-200',
    labelColor: 'text-sky-400',
  },
  admin: {
    activeBg: 'bg-purple-900',
    activeText: 'text-purple-200',
    labelColor: 'text-purple-400',
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
        'flex flex-col bg-black h-full flex-shrink-0 transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo & Toggle */}
      <div className={cn(
        'flex items-center h-16 border-b border-gray-800 flex-shrink-0',
        collapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img
              src="/logo-icon.svg"
              alt={config.app.name}
              className="h-7 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <span className="font-bold text-white text-lg">
              {config.app.name}
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Admin Label (only for admin variant) */}
      {isAdmin && !collapsed && (
        <div className="px-4 py-3 border-b border-gray-800">
          <span className={cn('text-xs font-semibold uppercase tracking-wider flex items-center gap-2', styles.labelColor)}>
            <ShieldCheck className="w-3 h-3" />
            Admin
          </span>
        </div>
      )}
      {isAdmin && collapsed && (
        <div className="flex justify-center py-3 border-b border-gray-800">
          <ShieldCheck className={cn('w-4 h-4', styles.labelColor)} />
        </div>
      )}

      <nav className={cn('flex-1 py-4 space-y-1 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.end}
            title={collapsed ? item.name : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center py-2 text-sm font-medium rounded-lg transition-colors',
                collapsed ? 'justify-center px-2' : 'px-3',
                isActive
                  ? `${styles.activeBg} ${styles.activeText}`
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <item.icon className={cn('w-5 h-5', !collapsed && 'mr-3')} />
            {!collapsed && item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
