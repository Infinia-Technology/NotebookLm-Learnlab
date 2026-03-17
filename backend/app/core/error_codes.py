"""
Error codes for standardized API responses.

Provides a unified set of error codes for consistent error handling across the API.
"""

from enum import Enum


class ErrorCode(str, Enum):
    """Standardized error codes for API responses."""

    # Authentication errors
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED"
    ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED"
    ACCOUNT_PENDING = "ACCOUNT_PENDING"
    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"
    INVALID_OTP = "INVALID_OTP"
    OTP_EXPIRED = "OTP_EXPIRED"
    OTP_COOLDOWN = "OTP_COOLDOWN"

    # Resource errors
    USER_NOT_FOUND = "USER_NOT_FOUND"
    NOT_FOUND = "NOT_FOUND"

    # Validation errors
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_EMAIL_DOMAIN = "INVALID_EMAIL_DOMAIN"
    WEAK_PASSWORD = "WEAK_PASSWORD"

    # Permission errors
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"

    # Rate limiting
    RATE_LIMITED = "RATE_LIMITED"

    # Generic errors
    INTERNAL_ERROR = "INTERNAL_ERROR"
    CONFLICT = "CONFLICT"
