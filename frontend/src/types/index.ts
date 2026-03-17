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
  // Domain fields
  domain_uuid?: string;
  domain_role?: string;
  enabled_modules?: string[];
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
  // Domain fields
  domain_uuid?: string;
  domain_role?: string;
  enabled_modules?: string[];
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
// Marketplace types
export interface SystemModule {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  is_installed: boolean;
  duration: string;
  lessons_count: number;
  level: string;
  has_assignment: boolean;
  last_updated: string;
  version: string;
}

export interface LessonPreview {
  title: string;
  type: string;
  duration?: string;
}

export interface ModulePreview {
  id: string;
  name: string;
  full_description: string;
  lessons: LessonPreview[];
  quiz_preview?: {
    title: string;
    questions_count: number;
  } | null;
  assignment_preview?: {
    title: string;
    type: string;
  } | null;
}

export interface InstallCustomization {
  module_id: string;
  custom_name?: string;
  target_departments?: string[];
  is_mandatory: boolean;
  deadline?: string;
  enable_assignments: boolean;
}

// Knowledge Notes
export interface KnowledgeNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NoteCreate {
  title: string;
  content: string;
}
