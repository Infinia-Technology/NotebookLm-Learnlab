/**
 * AppShell - Main application layout wrapper
 *
 * Provides the primary layout structure with:
 * - Collapsible sidebar with gradient background
 * - Header bar with breadcrumbs and user menu
 * - Main content area
 * - Footer
 *
 * Supports both user and admin variants with different accent colors.
 * Sidebar collapsed state is persisted to localStorage.
 */

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { HeaderBar } from './HeaderBar';
import { useSystemConfig } from '../../hooks/useSystemConfig';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export interface AppShellProps {
  variant?: 'user' | 'admin';
}

export function AppShell({ variant = 'user' }: AppShellProps) {
  const { config, loading } = useSystemConfig();

  // Initialize from localStorage or system config default
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
    return false; // Will be updated when config loads
  });

  // Update from config once loaded (only if no localStorage value)
  useEffect(() => {
    if (!loading) {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === null) {
        setSidebarCollapsed(config.layout.sidebarCollapsedByDefault);
      }
    }
  }, [loading, config.layout.sidebarCollapsedByDefault]);

  // Persist to localStorage when changed
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        variant={variant}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header with breadcrumbs and profile */}
        <HeaderBar variant={variant} />

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6 max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-100 py-3 px-6">
          <div className="flex items-center justify-between text-xs text-gray-400 max-w-[1600px] mx-auto">
            <span className="flex items-center gap-1.5">
              <span>&copy; {new Date().getFullYear()}</span>
              <span className="font-medium text-gray-500">{config.app.name}</span>
            </span>
            <span className="hidden sm:block">{config.app.description}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AppShell;
