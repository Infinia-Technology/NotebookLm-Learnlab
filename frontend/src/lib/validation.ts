/**
 * Password and form validation utilities.
 *
 * These validation rules mirror the backend Pydantic schemas in:
 * backend/app/modules/auth/schemas.py
 *
 * Keep these in sync to ensure consistent validation.
 */

// ============================================
// VALIDATION CONSTANTS (mirrors backend)
// ============================================
const PASSWORD_MIN_LENGTH = 8;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const NUMBER_REGEX = /[0-9]/;
const SYMBOL_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
const OTP_LENGTH = 6;

// ============================================
// VALIDATION RESULT TYPES
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PasswordValidation extends ValidationResult {
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

export function validatePassword(password: string): PasswordValidation {
  const checks = {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUppercase: UPPERCASE_REGEX.test(password),
    hasLowercase: LOWERCASE_REGEX.test(password),
    hasNumber: NUMBER_REGEX.test(password),
    hasSymbol: SYMBOL_REGEX.test(password),
  };

  const errors: string[] = [];

  if (!checks.minLength) {
    errors.push(`At least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!checks.hasUppercase) {
    errors.push('At least 1 uppercase letter (A-Z)');
  }
  if (!checks.hasLowercase) {
    errors.push('At least 1 lowercase letter (a-z)');
  }
  if (!checks.hasNumber) {
    errors.push('At least 1 number (0-9)');
  }
  if (!checks.hasSymbol) {
    errors.push('At least 1 special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    checks,
  };
}

export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  const { checks } = validatePassword(password);
  const passedChecks = Object.values(checks).filter(Boolean).length;

  if (passedChecks <= 2) return 'weak';
  if (passedChecks <= 4) return 'medium';
  return 'strong';
}

// ============================================
// EMAIL VALIDATION
// ============================================

/**
 * Validate email format.
 * Mirrors Pydantic EmailStr validation.
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const trimmed = email.trim();

  if (!trimmed) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(trimmed)) {
    errors.push('Please enter a valid email address');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================
// OTP VALIDATION
// ============================================

/**
 * Validate OTP code.
 * Mirrors Pydantic Field(..., min_length=6, max_length=6).
 */
export function validateOtp(otp: string): ValidationResult {
  const errors: string[] = [];
  const trimmed = otp.trim();

  if (!trimmed) {
    errors.push('Verification code is required');
  } else if (trimmed.length !== OTP_LENGTH) {
    errors.push(`Verification code must be ${OTP_LENGTH} digits`);
  } else if (!/^\d+$/.test(trimmed)) {
    errors.push('Verification code must contain only numbers');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================
// FORM VALIDATION SCHEMAS
// ============================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface ResetPasswordFormData {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

/**
 * Validate login form data.
 * Mirrors backend/app/modules/auth/schemas.py LoginRequest.
 */
export function validateLoginForm(data: LoginFormData): ValidationResult {
  const errors: string[] = [];

  const emailValidation = validateEmail(data.email);
  errors.push(...emailValidation.errors);

  if (!data.password) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate signup form data.
 * Mirrors backend/app/modules/auth/schemas.py SignupRequest.
 */
export function validateSignupForm(data: SignupFormData): ValidationResult {
  const errors: string[] = [];

  const emailValidation = validateEmail(data.email);
  errors.push(...emailValidation.errors);

  const passwordValidation = validatePassword(data.password);
  errors.push(...passwordValidation.errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate forgot password form data.
 * Mirrors backend/app/modules/auth/schemas.py ForgotPasswordRequest.
 */
export function validateForgotPasswordForm(data: ForgotPasswordFormData): ValidationResult {
  return validateEmail(data.email);
}

/**
 * Validate reset password form data.
 * Mirrors backend/app/modules/auth/schemas.py ResetPasswordRequest.
 */
export function validateResetPasswordForm(data: ResetPasswordFormData): ValidationResult {
  const errors: string[] = [];

  const emailValidation = validateEmail(data.email);
  errors.push(...emailValidation.errors);

  const otpValidation = validateOtp(data.otp);
  errors.push(...otpValidation.errors);

  const passwordValidation = validatePassword(data.newPassword);
  errors.push(...passwordValidation.errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}
