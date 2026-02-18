/**
 * API client for EleVatria.
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
  SystemModule,
  ModulePreview,
  InstallCustomization,
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


// ===================== Enterprise Marketplace =====================

export const getModuleCatalog = async (filters?: { search?: string; category?: string; level?: string }): Promise<SystemModule[]> => {
  const { data } = await api.get('/enterprise/catalog', { params: filters });
  return data;
};

export const getModulePreview = async (moduleId: string): Promise<ModulePreview> => {
  const { data } = await api.get(`/enterprise/catalog/${moduleId}/preview`);
  return data;
};

export const customInstallModule = async (installData: InstallCustomization): Promise<{ message: string }> => {
  const { data } = await api.post('/enterprise/custom-install', installData);
  return data;
};

export const installModule = async (moduleId: string): Promise<{ message: string }> => {
  const { data } = await api.post('/enterprise/modules', { module_id: moduleId });
  return data;
};

export const uninstallModule = async (moduleId: string): Promise<{ message: string }> => {
  const { data } = await api.delete(`/enterprise/modules/${moduleId}`);
  return data;
};

// ===================== Learning & Analytics =====================

export const listCourses = async () => {
  const { data } = await api.get('/learning/courses');
  return data;
};

export const enrollInCourse = async (courseUuid: string, credentials: { email: string; password: string }) => {
  const { data } = await api.post(`/learning/courses/${courseUuid}/enroll`, credentials);
  return data;
};

export const createCourse = async (courseData: { title: string; description?: string }) => {
  const { data } = await api.post('/learning/admin/courses', courseData);
  return data;
};

export const listModules = async (courseUuid: string) => {
  const { data } = await api.get(`/learning/courses/${courseUuid}/modules`);
  return data;
};

export const createModule = async (moduleData: any) => {
  const { data } = await api.post('/learning/admin/modules', moduleData);
  return data;
};

export const deleteModule = async (moduleUuid: string) => {
  const { data } = await api.delete(`/learning/admin/modules/${moduleUuid}`);
  return data;
};

export const updateProgress = async (moduleUuid: string, progressData: any) => {
  const { data } = await api.post(`/learning/modules/${moduleUuid}/progress`, progressData);
  return data;
};

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/learning/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const submitAssignment = async (assignmentData: any) => {
  const { data } = await api.post('/learning/assignments', assignmentData);
  return data;
};

export const reviewAssignment = async (submissionUuid: string, reviewData: any) => {
  const { data } = await api.post(`/learning/assignments/${submissionUuid}/review`, reviewData);
  return data;
};

export const getAdminAnalytics = async () => {
  const { data } = await api.get('/learning/admin/analytics/overview');
  return data;
};


export const downloadCertificate = async (courseUuid: string, courseTitle: string) => {
  const { data } = await api.get(`/learning/certificates/${courseUuid}/download`, {
    responseType: 'blob', // Important for file download
  });

  // Create a URL for the blob
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;

  // Set the filename
  const filename = `Certificate-${courseTitle.replace(/\s+/g, '-')}.pdf`;
  link.setAttribute('download', filename);

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();

  // Clean up
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const sendCertificate = async (courseUuid: string, managerEmail: string): Promise<{ message: string }> => {
  const { data } = await api.post(`/learning/certificates/${courseUuid}/send`, {
    manager_email: managerEmail,
  });
  return data;
};

export default api;

