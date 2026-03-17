"""
MongoDB database connection module.

Provides the Motor async MongoDB client and database access.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class MongoDB:
    """MongoDB connection manager."""
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None


mongo = MongoDB()


async def connect_to_mongo():
    """Create MongoDB connection on application startup."""
    logger.info(f"Connecting to MongoDB: {settings.MONGO_DB}")
    mongo.client = AsyncIOMotorClient(settings.MONGO_URI)
    mongo.db = mongo.client[settings.MONGO_DB]

    # Verify connection
    await mongo.client.admin.command('ping')
    logger.info(f"Connected to MongoDB: {settings.MONGO_DB}")

    # Create indexes
    await create_indexes()


async def create_indexes():
    """Create MongoDB indexes for optimal query performance."""
    from pymongo.errors import OperationFailure

    async def safe_create_index(collection, *args, **kwargs):
        """Create index, ignoring conflicts with existing indexes."""
        try:
            await collection.create_index(*args, **kwargs)
        except OperationFailure as e:
            if e.code == 86:  # IndexKeySpecsConflict
                logger.debug(f"Index already exists with different options, skipping: {args}")
            else:
                raise

    # Users indexes
    await safe_create_index(mongo.db.users, "uuid", unique=True, sparse=True)
    await safe_create_index(mongo.db.users, "email", unique=True)
    await safe_create_index(mongo.db.users, "domain_id")
    await safe_create_index(mongo.db.users, "status")

    # Domains indexes
    await safe_create_index(mongo.db.domains, "uuid", unique=True)
    await safe_create_index(mongo.db.domains, "domain", unique=True)
    await safe_create_index(mongo.db.domains, "parent_domain_uuid")

    # Groups indexes
    await safe_create_index(mongo.db.groups, "uuid", unique=True, sparse=True)
    await safe_create_index(mongo.db.groups, "name")

    # Audit log indexes
    await safe_create_index(mongo.db.audit_log, "user_id")
    await safe_create_index(mongo.db.audit_log, "action")
    await safe_create_index(mongo.db.audit_log, [("created_at", -1)])

    logger.info("MongoDB indexes created")


async def close_mongo_connection():
    """Close MongoDB connection on application shutdown."""
    if mongo.client:
        mongo.client.close()
        logger.info("MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """Get MongoDB database instance for dependency injection."""
    return mongo.db


# Export for backwards compatibility
__all__ = ["mongo", "connect_to_mongo", "close_mongo_connection", "get_database"]
