/**
 * API client for SAIL Starter Kit.
 */

import axios from 'axios';
import type {
  User,
  UserResponse,
  UserListResponse,
  CreateUserRequest,
  UpdateUserRequest,
  TokenResponse,
  AdminStats,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token from localStorage
      localStorage.removeItem('token');
      // Redirect to login page
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ===================== Health =====================

export const checkHealth = async () => {
  const { data } = await api.get('/health/');
  return data;
};

// ===================== Auth =====================

export const login = async (email: string, password: string): Promise<TokenResponse> => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const signup = async (
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
): Promise<{ message: string }> => {
  const { data } = await api.post('/auth/signup', {
    email,
    password,
    first_name: firstName,
    last_name: lastName,
  });
  return data;
};

export const verifyOtp = async (email: string, otp: string): Promise<TokenResponse> => {
  const { data } = await api.post('/auth/verify-otp', { email, otp });
  return data;
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string
): Promise<{ message: string }> => {
  const { data } = await api.post('/auth/reset-password', {
    email,
    otp,
    new_password: newPassword,
  });
  return data;
};

export const resendOtp = async (email: string): Promise<{ message: string }> => {
  const { data } = await api.post('/auth/resend-otp', { email });
  return data;
};

export const getCurrentUser = async (): Promise<UserResponse> => {
  const { data } = await api.get('/auth/me');
  return data;
};

// ===================== Account =====================

export const getAccount = async (): Promise<UserResponse> => {
  const { data } = await api.get('/account');
  return data;
};

// Alias for getAccount (used by AccountSettings)
export const getAccountProfile = getAccount;

export const updateAccount = async (updates: {
  first_name?: string;
  last_name?: string;
  department?: string;
  phone_number?: string;
}): Promise<UserResponse> => {
  const { data } = await api.put('/account', updates);
  return data;
};

// Alias for updateAccount (used by AccountSettings)
export const updateAccountProfile = updateAccount;

export const changePassword = async (
  newPassword: string
): Promise<{ message: string }> => {
  const { data } = await api.post('/account/change-password', {
    new_password: newPassword,
  });
  return data;
};

// ===================== Admin - Users =====================

export const getAdminStats = async (): Promise<AdminStats> => {
  const { data } = await api.get('/admin/stats');
  return data;
};

export const listUsers = async (params?: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  per_page?: number;
}): Promise<UserListResponse> => {
  const { data } = await api.get('/admin/users', { params });
  return data;
};

export const getUser = async (userId: string): Promise<User> => {
  const { data } = await api.get(`/admin/users/${userId}`);
  return data;
};

export const createUser = async (userData: CreateUserRequest): Promise<User> => {
  const { data } = await api.post('/admin/users', userData);
  return data;
};

export const updateUser = async (userId: string, updates: UpdateUserRequest): Promise<User> => {
  const { data } = await api.put(`/admin/users/${userId}`, updates);
  return data;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await api.delete(`/admin/users/${userId}`);
};

export default api;
