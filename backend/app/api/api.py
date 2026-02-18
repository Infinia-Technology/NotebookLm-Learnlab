"""
API Router configuration.

Registers all module routers with the main API.
Uses router-level dependencies for authentication.
"""

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.modules import (
    health_router,
    auth_router,
    admin_router,
    admin_router,
    account_router,
    quiz_router,
)
from app.modules.marketplace.router import router as marketplace_router
from app.modules.learning.router import router as learning_router

api_router = APIRouter()

# Auth dependency for protected routes
auth_required = [Depends(get_current_user)]

# ============================================
# PUBLIC ROUTES (no authentication required)
# ============================================

# Auth endpoints (login, signup, etc.)
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])

# Health check (for monitoring/load balancers)
api_router.include_router(health_router, prefix="/health", tags=["health"])

# ============================================
# PROTECTED ROUTES (authentication required)
# ============================================

# Admin - User management (super_admin only)
# Note: Role check is done at endpoint level via require_super_admin
api_router.include_router(
    admin_router,
    prefix="/admin",
    tags=["admin"],
    dependencies=auth_required
)

# Account - User's own profile and password management
api_router.include_router(
    account_router,
    prefix="/account",
    tags=["account"],
    dependencies=auth_required
)

# Quiz - Quiz completion and scoring
api_router.include_router(
    quiz_router,
    prefix="/quiz",
    tags=["quiz"],
    dependencies=auth_required
)

# Enterprise Marketplace - Module catalog and installation
api_router.include_router(
    marketplace_router,
    prefix="/enterprise",
    tags=["enterprise-marketplace"],
    dependencies=auth_required
)

# Learning - Courses, Modules and Progress
api_router.include_router(
    learning_router,
    prefix="/learning",
    tags=["learning"],
    dependencies=auth_required
)
