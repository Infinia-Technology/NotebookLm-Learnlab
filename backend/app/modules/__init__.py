"""
Business domain modules.

Each module is a self-contained feature with its own router, service, and schemas.
"""

from app.modules.health.router import router as health_router
from app.modules.auth.router import router as auth_router
from app.modules.admin.router import router as admin_router
from app.modules.account.router import router as account_router

__all__ = [
    "health_router",
    "auth_router",
    "admin_router",
    "account_router",
]
