"""
Database connection module.

Re-exports MongoDB connection utilities from app.db for modular structure.
"""

from app.db import (
    mongo,
    connect_to_mongo,
    close_mongo_connection,
    get_database,
)

__all__ = [
    "mongo",
    "connect_to_mongo",
    "close_mongo_connection",
    "get_database",
]
