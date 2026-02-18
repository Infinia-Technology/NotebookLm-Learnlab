import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldX } from 'lucide-react';

interface RoleGuardProps {
  /**
   * Require user to be a super_admin
   */
  requireSuperAdmin?: boolean;
  requireDomainAdmin?: boolean;

  /**
   * Content to render if authorized
   */
  children: ReactNode;

  /**
   * Content to render if not authorized (defaults to access denied message)
   */
  fallback?: ReactNode;

  /**
   * If true, redirect to home instead of showing fallback
   */
  redirectOnFail?: boolean;
}

/**
 * RoleGuard - Conditionally renders children based on user roles
 *
 * Usage:
 *
 * // Require super_admin
 * <RoleGuard requireSuperAdmin>
 *   <AdminDashboard />
 * </RoleGuard>
 *
 * // With custom fallback
 * <RoleGuard requireSuperAdmin fallback={<UpgradePrompt />}>
 *   <PremiumFeature />
 * </RoleGuard>
 */
export function RoleGuard({
  requireSuperAdmin,
  requireDomainAdmin,
  children,
  fallback,
  redirectOnFail = false,
}: RoleGuardProps) {
  const { isSuperAdmin, isAuthenticated } = useAuth();

  // Not authenticated - redirect to landing page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check super_admin requirement
  if (requireSuperAdmin && !isSuperAdmin) {
    if (redirectOnFail) {
      return <Navigate to="/dashboard" replace />;
    }
    return fallback ? <>{fallback}</> : <AccessDenied />;
  }

  // Check domain_admin requirement
  const { isDomainAdmin } = useAuth();
  if (requireDomainAdmin && !isDomainAdmin) {
    if (redirectOnFail) {
      return <Navigate to="/dashboard" replace />;
    }
    return fallback ? <>{fallback}</> : <AccessDenied />;
  }

  return <>{children}</>;
}

/**
 * Default access denied component
 */
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <ShieldX className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-500 max-w-md">
        You don't have permission to access this page. Please contact your administrator if you believe this is an error.
      </p>
    </div>
  );
}

export default RoleGuard;
