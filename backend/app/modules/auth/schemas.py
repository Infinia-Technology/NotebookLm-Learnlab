"""
Auth schemas.

Pydantic models for authentication requests and responses.
"""

import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


# Password validation constants
PASSWORD_MIN_LENGTH = 8
UPPERCASE_REGEX = re.compile(r'[A-Z]')
LOWERCASE_REGEX = re.compile(r'[a-z]')
NUMBER_REGEX = re.compile(r'[0-9]')
SYMBOL_REGEX = re.compile(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]')


def validate_password_strength(password: str) -> str:
    """Validate password meets security requirements."""
    errors = []

    if len(password) < PASSWORD_MIN_LENGTH:
        errors.append(f"Password must be at least {PASSWORD_MIN_LENGTH} characters")
    if not UPPERCASE_REGEX.search(password):
        errors.append("Password must contain at least 1 uppercase letter (A-Z)")
    if not LOWERCASE_REGEX.search(password):
        errors.append("Password must contain at least 1 lowercase letter (a-z)")
    if not NUMBER_REGEX.search(password):
        errors.append("Password must contain at least 1 number (0-9)")
    if not SYMBOL_REGEX.search(password):
        errors.append("Password must contain at least 1 special character (!@#$%^&*)")

    if errors:
        raise ValueError("; ".join(errors))

    return password


class LoginRequest(BaseModel):
    """Login request model."""
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    """Signup request model."""
    email: EmailStr
    password: str = Field(..., min_length=PASSWORD_MIN_LENGTH)
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_password_strength(v)


class VerifyOTPRequest(BaseModel):
    """OTP verification request model."""
    email: EmailStr
    otp: str


class ForgotPasswordRequest(BaseModel):
    """Forgot password request model."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password request model."""
    email: EmailStr
    otp: str
    new_password: str = Field(..., min_length=PASSWORD_MIN_LENGTH)

    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_password_strength(v)


class UserResponse(BaseModel):
    """User response model."""
    uuid: str
    email: str
    role: Optional[str] = None  # System role (super_admin, super_viewer, or None)
    status: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    created_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None


class RequestLoginOTPRequest(BaseModel):
    """Request OTP for passwordless login."""
    email: EmailStr


class VerifyLoginOTPRequest(BaseModel):
    """Verify OTP for passwordless login."""
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
