import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, ProtectedRoute, PublicRoute } from './core';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { AuthLayout } from './components/layout/AuthLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { RoleGuard } from './components/auth/RoleGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './pages/LandingPage';
import { DesignSystemGuide } from './pages/DesignSystemGuide';
import { NotFound } from './pages/NotFound';
import {
  LoginPage,
  SignupPage,
  VerifyOtpPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from './pages/auth';
import { UsersPage } from './pages/admin/Users';
import { CreateUserPage } from './pages/admin/CreateUser';
import { EditUserPage } from './pages/admin/EditUser';
import { DomainsPage } from './pages/admin/Domains';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import DashboardV2 from './pages/DashboardV2';
import AccountSettings from './pages/AccountSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Design System Guide - public for development reference */}
      <Route path="/design-system" element={<DesignSystemGuide />} />

      {/* Redirect /login to landing page */}
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* Auth routes with shared AuthLayout */}
      <Route
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/auth/verify" element={<VerifyOtpPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Protected dashboard routes with Layout wrapper */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardV2 />} />
        <Route path="/dashboard/account" element={<AccountSettings />} />
      </Route>

      {/* Admin routes with AdminLayout - super_admin only */}
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard requireSuperAdmin redirectOnFail>
              <AdminLayout />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<DashboardAdmin />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/users/create" element={<CreateUserPage />} />
        <Route path="/admin/users/:userId" element={<EditUserPage />} />
        <Route path="/admin/domains" element={<DomainsPage />} />
      </Route>

      {/* 404 Not Found - Catch all unmatched routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
