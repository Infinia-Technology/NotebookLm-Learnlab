/**
 * Route guard components.
 *
 * Provides authentication-based route protection.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth';

interface RouteGuardProps {
  children: React.ReactNode;
}

/**
 * Protects routes that require authentication.
 * Redirects to landing page if not authenticated.
 */
export function ProtectedRoute({ children }: RouteGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * Protects routes that should only be accessed when NOT authenticated.
 * Redirects to dashboard if already authenticated.
 */
export function PublicRoute({ children }: RouteGuardProps) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
