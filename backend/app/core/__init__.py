"""
Core infrastructure module.

Provides database connections, configuration, security, and exception handling.
"""

from .config import settings, get_settings
from .exceptions import (
    AppException,
    NotFoundError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
)

# Database utilities are available from app.db to avoid circular imports
# Use: from app.db import get_database, connect_to_mongo, close_mongo_connection

__all__ = [
    "settings",
    "get_settings",
    "AppException",
    "NotFoundError",
    "ValidationError",
    "AuthenticationError",
    "AuthorizationError",
]
