"""
API dependencies for FastAPI endpoints.

Provides database and authentication dependencies.
"""

from typing import Callable
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db import get_database
from app.auth.jwt import verify_token
from app.odm.user import UserDocument

security = HTTPBearer()


async def get_db() -> AsyncIOMotorDatabase:
    """Dependency to get MongoDB database instance."""
    return get_database()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> UserDocument:
    """
    Dependency to get the current authenticated user from JWT token.

    Raises HTTPException if token is invalid or user not found.
    """
    token = credentials.credentials
    token_data = verify_token(token)

    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user from database by UUID (token stores UUID as user_id)
    user = await UserDocument.find_by_uuid(token_data.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def require_super_admin(
    current_user: UserDocument = Depends(get_current_user)
) -> UserDocument:
    """
    Dependency that requires the user to be a super_admin.

    Use this for admin-only endpoints like user management.
    """
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user


async def require_admin(
    current_user: UserDocument = Depends(get_current_user)
) -> UserDocument:
    """
    Dependency that requires the user to be an admin, super_admin, or editor.
    """
    allowed = ["super_admin", "admin", "editor"]
    if current_user.role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative access required"
        )
    return current_user


def require_role(role: str) -> Callable:
    """
    Dependency factory that requires a specific system-level role.

    Usage:
        @router.get("/admin/domains")
        async def list_domains(
            user: UserDocument = Depends(require_role("super_admin"))
        ):
            ...
    """
    async def checker(
        current_user: UserDocument = Depends(get_current_user)
    ) -> UserDocument:
        if role == "super_admin" and current_user.role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Super admin access required"
            )
        return current_user

    return checker


async def require_domain_admin(
    current_user: UserDocument = Depends(get_current_user)
) -> UserDocument:
    """
    Dependency that requires the user to be a domain admin or super_admin.

    Domain admins can manage users within their domain hierarchy.
    """
    if current_user.role == "super_admin":
        return current_user

    if not current_user.domain_role or current_user.domain_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Domain admin access required"
        )
    return current_user
