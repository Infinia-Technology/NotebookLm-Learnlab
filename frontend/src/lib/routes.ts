/**
 * Centralized route definitions and utilities.
 *
 * Use these functions to generate route paths consistently across the app.
 */

// Base paths
const DASHBOARD_BASE = '/dashboard';
const AUTH_BASE = '/auth';
const ADMIN_BASE = '/admin';

// Route generators for dashboard routes
export const routes = {
  // Landing
  landing: () => '/',

  // Auth
  auth: {
    login: () => `${AUTH_BASE}/login`,
    signup: () => `${AUTH_BASE}/signup`,
    verify: () => `${AUTH_BASE}/verify`,
    forgotPassword: () => `${AUTH_BASE}/forgot-password`,
    resetPassword: () => `${AUTH_BASE}/reset-password`,
  },

  // Dashboard
  dashboard: () => DASHBOARD_BASE,

  // Account
  account: () => `${DASHBOARD_BASE}/account`,

  // Admin
  admin: {
    dashboard: () => ADMIN_BASE,
    users: () => `${ADMIN_BASE}/users`,
    createUser: () => `${ADMIN_BASE}/users/create`,
    editUser: (userId: string) => `${ADMIN_BASE}/users/${userId}`,
  },
} as const;

export default routes;
