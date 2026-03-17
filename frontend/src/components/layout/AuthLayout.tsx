import { Outlet } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { createContext, useContext, useState } from 'react';
import { AnimatedBackground } from '../ui/AnimatedBackground';
import { useSystemConfig } from '../../hooks/useSystemConfig';

// Context for sharing messages across auth pages
interface AuthLayoutContextType {
  error: string;
  success: string;
  setError: (msg: string) => void;
  setSuccess: (msg: string) => void;
  clearMessages: () => void;
}

const AuthLayoutContext = createContext<AuthLayoutContextType | undefined>(undefined);

export function useAuthLayout() {
  const context = useContext(AuthLayoutContext);
  if (!context) {
    throw new Error('useAuthLayout must be used within AuthLayout');
  }
  return context;
}

export function AuthLayout() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { config } = useSystemConfig();

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <AuthLayoutContext.Provider value={{ error, success, setError, setSuccess, clearMessages }}>
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black overflow-hidden transition-colors duration-300">
        <AnimatedBackground />

        <div className="relative z-10 w-full max-w-lg px-6">
          {/* Auth Card - Microsoft style with subtle glow */}
          <div className="relative">
            {/* Card glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 rounded-xl blur-xl opacity-50 dark:opacity-20" />

            <div className="relative bg-bg-card border border-border-card rounded-lg shadow-2xl overflow-hidden transition-colors">

              {/* Messages */}
              {(error || success) && (
                <div className="px-10 pt-6">
                  {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                  {success && (
                    <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{success}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Auth Form - Changes based on route */}
              <Outlet />
            </div>
          </div>

          {/* Copyright */}
          <p className="mt-6 text-center text-sm text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} {config.app.name}. All rights reserved.
          </p>
        </div>
      </div>
    </AuthLayoutContext.Provider>
  );
}
