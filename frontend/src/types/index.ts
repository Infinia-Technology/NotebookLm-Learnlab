/**
 * Core type definitions for the application.
 */

// User types
export interface User {
  uuid: string;
  email: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  phone_number?: string;
  role?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
}

export interface UserResponse {
  uuid: string;
  email: string;
  role?: string;
  status: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  phone_number?: string;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  phone_number?: string;
  role?: string;
  status?: string;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  department?: string;
  phone_number?: string;
  role?: string | null;
  status?: string;
  password?: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface TokenResponse {
  access_token: string;
  expires_at: string;
  user: UserResponse;
}

// Admin stats
export interface AdminStats {
  total_users: number;
  active_users: number;
  pending_users: number;
  suspended_users: number;
  super_admins: number;
  by_status: Record<string, number>;
}
