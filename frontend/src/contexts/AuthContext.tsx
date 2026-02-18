import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

const API_BASE = '/api';

// Helper to extract error message from API errors
function extractErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as { response?: { data?: { detail?: string | Array<{ msg: string }> } } };
  const detail = axiosError?.response?.data?.detail;

  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail[0].msg || fallback;
  }
  return fallback;
}

import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isSuperAdmin: boolean;
  isDomainAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (storedToken) {
        try {
          // Verify token is still valid by fetching user info
          const response = await axios.get(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          const userData = response.data;
          setToken(storedToken);
          setUser(userData);
          setIsAuthenticated(true);
        } catch {
          // Token is invalid, clear storage
          localStorage.removeItem(TOKEN_KEY);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;

      localStorage.setItem(TOKEN_KEY, access_token);
      setToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      return { success: false, error: extractErrorMessage(error, 'Login failed') };
    }
  }, []);

  const signup = useCallback(async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    try {
      await axios.post(`${API_BASE}/auth/signup`, {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: extractErrorMessage(error, 'Signup failed') };
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/verify-otp`, { email, otp });
      const { access_token, user: userData } = response.data;

      localStorage.setItem(TOKEN_KEY, access_token);
      setToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      return { success: false, error: extractErrorMessage(error, 'OTP verification failed') };
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await axios.post(`${API_BASE}/auth/forgot-password`, { email });
      return { success: true };
    } catch (error) {
      return { success: false, error: extractErrorMessage(error, 'Failed to send reset email') };
    }
  }, []);

  const resetPassword = useCallback(async (email: string, otp: string, newPassword: string) => {
    try {
      await axios.post(`${API_BASE}/auth/reset-password`, {
        email,
        otp,
        new_password: newPassword,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: extractErrorMessage(error, 'Password reset failed') };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const isSuperAdmin = useMemo(() => user?.role === 'super_admin', [user]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      token,
      login,
      signup,
      verifyOtp,
      forgotPassword,
      resetPassword,
      logout,
      updateUser,
      isSuperAdmin,
      isDomainAdmin: user?.domain_role === 'admin' || user?.role === 'super_admin',
    }),
    [
      isAuthenticated,
      isLoading,
      user,
      token,
      login,
      signup,
      verifyOtp,
      forgotPassword,
      resetPassword,
      logout,
      updateUser,
      isSuperAdmin,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
