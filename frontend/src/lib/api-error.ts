/**
 * API error handling utilities.
 *
 * Provides utilities for extracting error information from the standardized
 * API error response format:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human-readable error message"
 *   }
 * }
 */

/**
 * Standardized API error structure.
 */
export interface APIError {
  code: string;
  message: string;
  retry_after?: number;
}

/**
 * Full API error response structure.
 */
export interface APIErrorResponse {
  success: false;
  error: APIError;
}

/**
 * Error codes returned by the API.
 * Mirrors backend/app/core/error_codes.py.
 */
export const ErrorCode = {
  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCOUNT_PENDING: 'ACCOUNT_PENDING',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_OTP: 'INVALID_OTP',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_COOLDOWN: 'OTP_COOLDOWN',

  // Resources
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  NOT_FOUND: 'NOT_FOUND',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_EMAIL_DOMAIN: 'INVALID_EMAIL_DOMAIN',
  WEAK_PASSWORD: 'WEAK_PASSWORD',

  // Permission
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',

  // Generic
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONFLICT: 'CONFLICT',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

/**
 * Check if an error response is in the standardized API error format.
 */
function isAPIErrorResponse(data: unknown): data is APIErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    data.success === false &&
    'error' in data &&
    typeof (data as { error: unknown }).error === 'object' &&
    (data as { error: unknown }).error !== null &&
    'code' in (data as { error: { code: unknown } }).error &&
    'message' in (data as { error: { message: unknown } }).error
  );
}

/**
 * Extract the error message from various error formats.
 *
 * Handles:
 * - Standardized API error response: { success: false, error: { code, message } }
 * - Legacy API error response: { detail: string }
 * - Axios error response: { response: { data: ... } }
 * - Generic Error objects
 * - Unknown error types
 *
 * @param error - The error to extract message from
 * @returns Human-readable error message
 */
export function getErrorMessage(error: unknown): string {
  // Handle Axios-style errors with response.data
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response: unknown }).response === 'object' &&
    (error as { response: unknown }).response !== null
  ) {
    const response = (error as { response: { data?: unknown } }).response;
    const data = response.data;

    // Standardized API error format
    if (isAPIErrorResponse(data)) {
      return data.error.message;
    }

    // Legacy format with detail
    if (
      typeof data === 'object' &&
      data !== null &&
      'detail' in data &&
      typeof (data as { detail: unknown }).detail === 'string'
    ) {
      return (data as { detail: string }).detail;
    }
  }

  // Direct standardized error response
  if (isAPIErrorResponse(error)) {
    return error.error.message;
  }

  // Standard Error object
  if (error instanceof Error) {
    return error.message;
  }

  // String error
  if (typeof error === 'string') {
    return error;
  }

  // Fallback
  return 'An unexpected error occurred';
}

/**
 * Extract the error code from various error formats.
 *
 * @param error - The error to extract code from
 * @returns Error code string or null if not available
 */
export function getErrorCode(error: unknown): string | null {
  // Handle Axios-style errors with response.data
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response: unknown }).response === 'object' &&
    (error as { response: unknown }).response !== null
  ) {
    const response = (error as { response: { data?: unknown } }).response;
    const data = response.data;

    if (isAPIErrorResponse(data)) {
      return data.error.code;
    }
  }

  // Direct standardized error response
  if (isAPIErrorResponse(error)) {
    return error.error.code;
  }

  return null;
}

/**
 * Extract retry_after value from rate limit errors.
 *
 * @param error - The error to extract retry_after from
 * @returns Seconds to wait before retrying, or null if not a rate limit error
 */
export function getRetryAfter(error: unknown): number | null {
  // Handle Axios-style errors with response.data
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response: unknown }).response === 'object' &&
    (error as { response: unknown }).response !== null
  ) {
    const response = (error as { response: { data?: unknown } }).response;
    const data = response.data;

    if (isAPIErrorResponse(data) && data.error.retry_after !== undefined) {
      return data.error.retry_after;
    }
  }

  // Direct standardized error response
  if (isAPIErrorResponse(error) && error.error.retry_after !== undefined) {
    return error.error.retry_after;
  }

  return null;
}

/**
 * Check if an error is of a specific error code.
 *
 * @param error - The error to check
 * @param code - The error code to match
 * @returns True if the error matches the specified code
 */
export function isErrorCode(error: unknown, code: ErrorCodeType): boolean {
  return getErrorCode(error) === code;
}

/**
 * Check if an error is a rate limit error.
 */
export function isRateLimitError(error: unknown): boolean {
  return getErrorCode(error) === ErrorCode.RATE_LIMITED ||
         getErrorCode(error) === ErrorCode.OTP_COOLDOWN;
}

/**
 * Check if an error is an authentication error.
 */
export function isAuthError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === ErrorCode.INVALID_CREDENTIALS ||
         code === ErrorCode.UNAUTHORIZED ||
         code === ErrorCode.EMAIL_NOT_VERIFIED ||
         code === ErrorCode.ACCOUNT_PENDING;
}

/**
 * Check if an error is a suspended account error.
 */
export function isSuspendedError(error: unknown): boolean {
  return getErrorCode(error) === ErrorCode.ACCOUNT_SUSPENDED;
}
