/**
 * Core module exports.
 *
 * Provides centralized access to core infrastructure:
 * - API client
 * - Auth context and hooks
 * - Router guards
 */

export { apiClient } from './api';
export { AuthProvider, useAuth } from './auth';
export { ProtectedRoute, PublicRoute } from './router';
