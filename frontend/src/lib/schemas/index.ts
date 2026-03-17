/**
 * Zod validation schemas for forms.
 *
 * These schemas mirror the backend Pydantic schemas and integrate
 * with React Hook Form via @hookform/resolvers/zod.
 */

import { z } from 'zod';

// ============================================
// BASE SCHEMAS
// ============================================

/**
 * Email validation schema.
 * Mirrors Pydantic EmailStr validation.
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

/**
 * Password validation schema with strong requirements.
 * Mirrors backend password validation rules.
 */
export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'At least 1 uppercase letter (A-Z)')
  .regex(/[a-z]/, 'At least 1 lowercase letter (a-z)')
  .regex(/[0-9]/, 'At least 1 number (0-9)')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'At least 1 special character (!@#$%^&*)');

/**
 * Simple password schema for login (just checks if not empty).
 */
export const loginPasswordSchema = z
  .string()
  .min(1, 'Password is required');

/**
 * Optional password schema for updates (validates strength only if provided).
 */
export const optionalPasswordSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true; // Empty is OK (optional)
      return val.length >= 8;
    },
    { message: 'At least 8 characters' }
  )
  .refine(
    (val) => {
      if (!val) return true;
      return /[A-Z]/.test(val);
    },
    { message: 'At least 1 uppercase letter (A-Z)' }
  )
  .refine(
    (val) => {
      if (!val) return true;
      return /[a-z]/.test(val);
    },
    { message: 'At least 1 lowercase letter (a-z)' }
  )
  .refine(
    (val) => {
      if (!val) return true;
      return /[0-9]/.test(val);
    },
    { message: 'At least 1 number (0-9)' }
  )
  .refine(
    (val) => {
      if (!val) return true;
      return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val);
    },
    { message: 'At least 1 special character (!@#$%^&*)' }
  );

/**
 * OTP validation schema.
 * Mirrors backend Field(..., min_length=6, max_length=6).
 */
export const otpSchema = z
  .string()
  .min(1, 'Verification code is required')
  .length(6, 'Verification code must be 6 digits')
  .regex(/^\d+$/, 'Verification code must contain only numbers');

// ============================================
// USER ROLE & STATUS SCHEMAS
// ============================================

export const userRoleSchema = z.enum(['viewer', 'editor', 'admin', 'super_admin', 'user']);
export const userStatusSchema = z.enum(['active', 'pending', 'suspended']);

export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;

// ============================================
// AUTH FORM SCHEMAS
// ============================================

/**
 * Login form schema.
 * Mirrors backend/app/modules/auth/schemas.py LoginRequest.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Signup form schema.
 * Mirrors backend/app/modules/auth/schemas.py SignupRequest.
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

export type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Forgot password form schema.
 * Mirrors backend/app/modules/auth/schemas.py ForgotPasswordRequest.
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Verify OTP form schema.
 * Mirrors backend/app/modules/auth/schemas.py VerifyOTPRequest.
 */
export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
});

export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;

/**
 * Reset password form schema.
 * Mirrors backend/app/modules/auth/schemas.py ResetPasswordRequest.
 */
export const resetPasswordSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  new_password: passwordSchema,
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ============================================
// ADMIN FORM SCHEMAS
// ============================================

/**
 * Create user form schema.
 * Mirrors backend/app/modules/admin/schemas.py CreateUserRequest.
 */
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  department: z.string().optional(),
  phone_number: z.string().optional(),
  role: userRoleSchema,
  status: userStatusSchema,
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

/**
 * Update user form schema.
 * Mirrors backend/app/modules/admin/schemas.py UpdateUserRequest.
 */
export const updateUserSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  department: z.string().optional(),
  phone_number: z.string().optional(),
  role: z.enum(['viewer', 'editor', 'admin', 'super_admin', 'user', '']).optional(),
  status: userStatusSchema,
  password: optionalPasswordSchema.optional(),
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

// ============================================
// ACCOUNT FORM SCHEMAS
// ============================================

/**
 * Profile update form schema.
 */
export const profileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  department: z.string().optional(),
  phone_number: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Change password form schema.
 */
export const changePasswordSchema = z
  .object({
    new_password: passwordSchema,
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
