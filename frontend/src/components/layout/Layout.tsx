import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { useSystemConfig } from '../../hooks/useSystemConfig';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export function Layout() {
  const { config } = useSystemConfig();

  // Initialize from localStorage or system config default
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
    return config.layout.sidebarCollapsedByDefault;
  });

  // Persist to localStorage when changed
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with breadcrumbs and profile */}
        <DashboardHeader />

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-3 px-6">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>© {new Date().getFullYear()} {config.app.name}</span>
            <span>{config.app.description}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
