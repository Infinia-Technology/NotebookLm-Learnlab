"""
Authentication module.

Provides user authentication, registration, and password management.
"""

from .router import router
from .service import AuthService
from .schemas import (
    LoginRequest,
    SignupRequest,
    VerifyOTPRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserResponse,
)

__all__ = [
    "router",
    "AuthService",
    "LoginRequest",
    "SignupRequest",
    "VerifyOTPRequest",
    "ForgotPasswordRequest",
    "ResetPasswordRequest",
    "UserResponse",
]
