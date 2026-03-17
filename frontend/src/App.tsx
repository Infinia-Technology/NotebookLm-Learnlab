import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, ProtectedRoute, PublicRoute } from './core';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppShell } from './components/layout/AppShell';
import { AuthLayout } from './components/layout/AuthLayout';
import { RoleGuard } from './components/auth/RoleGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DocumentTitle } from './components/DocumentTitle';
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
import { ModulesPage } from './pages/admin/Modules';
import { MarketplacePage } from './pages/admin/Marketplace';
import { CoursePlayer } from './pages/course/CoursePlayer';
import { CertificationsPage } from './pages/course/Certifications';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import Dashboard from './pages/Dashboard';
import AccountSettings from './pages/AccountSettings';
import { ModuleBuilderPage } from './pages/admin/ModuleBuilder';
import { AnalyticsPage } from './pages/admin/Analytics';
import Notebook from './pages/admin/Notebook';
import { AISettingsPage } from './pages/admin/AISettings';

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

      {/* Protected dashboard routes with AppShell wrapper */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell variant="user" />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/modules" element={<ModulesPage />} />
        <Route path="/dashboard/modules/:courseId" element={<CoursePlayer />} />
        <Route path="/dashboard/certifications" element={<CertificationsPage />} />
        <Route path="/dashboard/notebook" element={<Notebook />} />
        <Route path="/dashboard/account" element={<AccountSettings />} />
      </Route>

      {/* Admin routes with AppShell (admin variant) - super_admin only */}
      <Route
        element={
          <ProtectedRoute>
            <RoleGuard requireDomainAdmin redirectOnFail>
              <AppShell variant="admin" />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<DashboardAdmin />} />
        <Route path="/admin/marketplace" element={<MarketplacePage />} />
        <Route path="/admin/module-builder" element={<ModuleBuilderPage />} />
        <Route path="/admin/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/users/create" element={<CreateUserPage />} />
        <Route path="/admin/users/:userId" element={<EditUserPage />} />
        <Route path="/admin/notebook" element={<Notebook />} />
        <Route path="/admin/settings" element={<AISettingsPage />} />
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
          <DocumentTitle />
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
