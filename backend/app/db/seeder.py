"""
Database seeder for initial setup.

Creates the default admin user on application startup.
"""

import uuid
import logging
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bcrypt import hashpw, gensalt

from app.core.config import settings

logger = logging.getLogger(__name__)


async def seed_admin_user(db: AsyncIOMotorDatabase) -> dict:
    """Create default admin user if not exists."""
    # Skip if ADMIN_PASSWORD not configured
    if not settings.ADMIN_PASSWORD:
        logger.info("Admin user: skipped (ADMIN_PASSWORD not set)")
        return {"status": "skipped", "reason": "no_password"}

    admin_email = settings.ADMIN_EMAIL
    existing = await db.users.find_one({"email": admin_email})

    if existing:
        logger.info(f"Admin user: exists ({admin_email})")
        return {"status": "exists", "email": admin_email}

    now = datetime.utcnow()
    password_hash = hashpw(settings.ADMIN_PASSWORD.encode(), gensalt()).decode()

    admin_user = {
        "uuid": str(uuid.uuid4()),
        "email": admin_email,
        "password_hash": password_hash,
        "role": "super_admin",
        "status": "active",
        "first_name": "System",
        "last_name": "Administrator",
        "otp_verified": True,
        "created_at": now,
        "updated_at": now
    }

    await db.users.insert_one(admin_user)
    logger.info(f"Admin user: created ({admin_email})")
    return {"status": "created", "email": admin_email}


async def seed_if_needed(db: AsyncIOMotorDatabase) -> dict:
    """Seed database on application startup."""
    logger.info("=" * 50)
    logger.info("DATABASE SEEDING")
    logger.info("=" * 50)

    results = {}

    try:
        results["admin_user"] = await seed_admin_user(db)
    except Exception as e:
        logger.error(f"Error seeding admin user: {e}")
        results["admin_user"] = {"status": "error", "error": str(e)}

    logger.info("=" * 50)
    logger.info("SEEDING COMPLETE")
    logger.info("=" * 50)

    return results
