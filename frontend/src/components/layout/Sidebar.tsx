import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  ChevronRight,
  Store,
  ScanText,
  BarChart3,
  Scale,
  ShieldAlert,
  Workflow,
  Bot,
  Folder,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSystemConfig } from '../../hooks/useSystemConfig';
import { useGeneratedApps } from '../../hooks/useGeneratedApps';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { GeneratedApp } from '../../types/navigation';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  id: string;
  name: string;
  items: NavItem[];
  badge?: number;
}

// Icon mapping for generated apps based on template type
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Store,
  ScanText,
  BarChart3,
  Scale,
  ShieldAlert,
  Workflow,
  Bot,
  Folder,
};

// Get icon component from icon name
function getIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || Folder;
}

// Core navigation items
const coreNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
];

// Settings navigation items
const settingsNavigation: NavItem[] = [
  { name: 'Account', href: '/dashboard/account', icon: Settings },
];

// Convert generated apps to nav items
function generatedAppsToNavItems(apps: GeneratedApp[]): NavItem[] {
  return apps.map((app) => ({
    name: app.name,
    href: `/dashboard/${app.slug}`,
    icon: getIcon(app.icon),
  }));
}

// Logo Component
function Logo({ collapsed }: { collapsed: boolean }) {
  const { config } = useSystemConfig();

  if (collapsed) {
    return (
      <div className="w-10 h-10 flex items-center justify-center">
        <img
          src="/logo-icon.svg"
          alt={config.app.name}
          className="w-8 h-8 text-[var(--btn-primary-bg)]"
          style={{ filter: 'brightness(0) invert(1)' }}
          onError={(e) => {
            // Fallback to text if image fails
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.innerHTML = `
              <div class="w-8 h-8 bg-[var(--btn-primary-bg)] rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">${config.app.name.charAt(0).toUpperCase()}</span>
              </div>
            `;
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 bg-[var(--btn-primary-bg)] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/20">
        <img
          src="/logo-icon.svg"
          alt=""
          className="w-6 h-6"
          style={{ filter: 'brightness(0) invert(1)' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="font-bold text-white text-base leading-tight truncate">
          {config.app.name.split(' ')[0]}
        </h1>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider truncate">
          {config.app.name.split(' ').slice(1).join(' ') || 'Platform'}
        </p>
      </div>
    </div>
  );
}

// Collapsible Nav Group Component
function NavGroupSection({
  group,
  collapsed: sidebarCollapsed,
  isExpanded,
  onToggle,
}: {
  group: NavGroup;
  collapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  // If sidebar is collapsed, don't show group headers
  if (sidebarCollapsed) {
    return (
      <div className="space-y-1">
        {group.items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/dashboard'}
            title={item.name}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-center py-2.5 px-2 text-sm font-medium rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-[var(--btn-primary-bg)] text-white shadow-lg shadow-sky-500/25'
                  : 'text-gray-400 hover:bg-gray-800/80 hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5" />
          </NavLink>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Group Header */}
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-400 transition-colors"
      >
        <span className="flex items-center gap-2">
          {group.name}
          {group.badge !== undefined && group.badge > 0 && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-gray-700 text-gray-300">
              {group.badge}
            </Badge>
          )}
        </span>
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Group Items */}
      {isExpanded && (
        <div className="space-y-0.5">
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/dashboard'}
              className={({ isActive }) =>
                cn(
                  'flex items-center py-2.5 px-3 text-sm font-medium rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-[var(--btn-primary-bg)] text-white shadow-lg shadow-sky-500/25'
                    : 'text-gray-400 hover:bg-gray-800/80 hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const { data: generatedApps = [] } = useGeneratedApps();

  // Track expanded state for each group
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('sidebar-expanded-groups');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { core: true, apps: true, settings: true };
      }
    }
    return { core: true, apps: true, settings: true };
  });

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-expanded-groups', JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Build navigation groups
  const navGroups: NavGroup[] = [
    {
      id: 'core',
      name: 'Core',
      items: coreNavigation,
    },
  ];

  // Only add generated apps group if there are apps
  if (generatedApps.length > 0) {
    navGroups.push({
      id: 'apps',
      name: 'Generated Apps',
      items: generatedAppsToNavItems(generatedApps),
      badge: generatedApps.length,
    });
  }

  navGroups.push({
    id: 'settings',
    name: 'Settings',
    items: settingsNavigation,
  });

  return (
    <div
      className={cn(
        'flex flex-col h-full flex-shrink-0 transition-all duration-300 ease-in-out',
        'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo Header */}
      <div
        className={cn(
          'flex items-center h-16 border-b border-gray-800/50 flex-shrink-0',
          collapsed ? 'justify-center px-3' : 'px-4'
        )}
      >
        <Logo collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          'flex-1 py-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent',
          collapsed ? 'px-3' : 'px-3'
        )}
      >
        {navGroups.map((group) => (
          <NavGroupSection
            key={group.id}
            group={group}
            collapsed={collapsed}
            isExpanded={expandedGroups[group.id] ?? true}
            onToggle={() => toggleGroup(group.id)}
          />
        ))}
      </nav>

      {/* Collapse Toggle at Bottom */}
      <div
        className={cn(
          'p-3 border-t border-gray-800/50',
          collapsed ? 'flex justify-center' : ''
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            'text-gray-500 hover:text-white hover:bg-gray-800/80 transition-all duration-200',
            collapsed ? 'p-2.5 rounded-xl' : 'w-full justify-start rounded-xl'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <>
              <PanelLeftClose className="w-5 h-5 mr-2" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
