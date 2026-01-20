import { NavLink } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Globe,
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSystemConfig } from '../../hooks/useSystemConfig';

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNavigation: NavItem[] = [
  { name: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Domain Management', href: '/admin/domains', icon: Globe },
];

export function AdminSidebar({ collapsed = false, onToggle }: AdminSidebarProps) {
  const { config } = useSystemConfig();

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

      {/* Admin Label */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-gray-800">
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" />
            Admin
          </span>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center py-3 border-b border-gray-800">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
        </div>
      )}

      <nav className={cn('flex-1 py-4 space-y-1 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
        {adminNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/admin'}
            title={collapsed ? item.name : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center py-2 text-sm font-medium rounded-lg transition-colors',
                collapsed ? 'justify-center px-2' : 'px-3',
                isActive
                  ? 'bg-purple-900 text-purple-200'
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
