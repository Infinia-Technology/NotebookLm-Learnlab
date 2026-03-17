"""
Authentication router.

Handles user login, signup, OTP verification, and password reset.
"""

from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_db, get_current_user
from app.auth.jwt import TokenResponse
from app.odm.user import UserDocument
from app.utils.rate_limit import check_rate_limit
from .schemas import (
    LoginRequest,
    SignupRequest,
    VerifyOTPRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserResponse,
    RequestLoginOTPRequest,
    VerifyLoginOTPRequest,
)
from .service import AuthService

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    req: Request,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Login with email and password. Returns JWT token on success."""
    # Rate limit: 10 attempts per minute per IP
    await check_rate_limit(req, "login", max_requests=10, window_seconds=60)

    service = AuthService(db)
    result = await service.login(request.email, request.password)

    return TokenResponse(
        access_token=result["access_token"],
        expires_at=result["expires_at"],
        user=result["user"],
    )


@router.post("/signup", response_model=dict)
async def signup(
    request: SignupRequest,
    req: Request,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new user account. Sends OTP for email verification."""
    # Rate limit: 5 attempts per minute per IP
    await check_rate_limit(req, "signup", max_requests=5, window_seconds=60)

    service = AuthService(db)
    return await service.signup(
        request.email,
        request.password,
        request.first_name,
        request.last_name,
    )


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(request: VerifyOTPRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Verify OTP and activate account. Returns JWT token on success."""
    service = AuthService(db)
    result = await service.verify_otp(request.email, request.otp)

    return TokenResponse(
        access_token=result["access_token"],
        expires_at=result["expires_at"],
        user=result["user"],
    )


@router.post("/forgot-password", response_model=dict)
async def forgot_password(
    request: ForgotPasswordRequest,
    req: Request,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Request password reset. Sends OTP to email."""
    # Rate limit: 5 attempts per minute per IP
    await check_rate_limit(req, "forgot_password", max_requests=5, window_seconds=60)

    service = AuthService(db)
    return await service.forgot_password(request.email)


@router.post("/reset-password", response_model=dict)
async def reset_password(request: ResetPasswordRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Reset password using OTP."""
    service = AuthService(db)
    return await service.reset_password(request.email, request.otp, request.new_password)


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: UserDocument = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get current user info."""
    return UserResponse(
        uuid=current_user.uuid,
        email=current_user.email,
        role=current_user.role,
        status=current_user.status,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        department=current_user.department,
        created_at=current_user.created_at,
        last_login_at=current_user.last_login_at,
    )


@router.post("/resend-otp", response_model=dict)
async def resend_otp(request: ForgotPasswordRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Resend OTP for email verification or password reset."""
    service = AuthService(db)
    return await service.resend_otp(request.email)


@router.post("/request-login-otp", response_model=dict)
async def request_login_otp(
    request: RequestLoginOTPRequest,
    req: Request,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Request OTP for passwordless login. Sends OTP to email."""
    # Rate limit: 5 attempts per minute per IP
    await check_rate_limit(req, "request_otp", max_requests=5, window_seconds=60)

    service = AuthService(db)
    return await service.request_login_otp(request.email)


@router.post("/verify-login-otp", response_model=TokenResponse)
async def verify_login_otp(request: VerifyLoginOTPRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Verify OTP for passwordless login. Returns JWT token on success."""
    service = AuthService(db)
    result = await service.verify_login_otp(request.email, request.otp)

    return TokenResponse(
        access_token=result["access_token"],
        expires_at=result["expires_at"],
        user=result["user"],
    )
