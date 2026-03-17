import asyncio
import logging
import os
from dotenv import load_dotenv

# Load .env from project root (one level up from backend)
load_dotenv("../.env")

# Ensure app.core.config can read env vars
from motor.motor_asyncio import AsyncIOMotorClient
from bcrypt import hashpw, gensalt
from app.core.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def update_password():
    logger.info("Connecting to database...")
    # Manual fallback if settings fail
    mongo_uri = os.getenv("MONGO_URI") or settings.MONGO_URI
    mongo_db = os.getenv("MONGO_DB") or settings.MONGO_DB
    admin_email = os.getenv("ADMIN_EMAIL") or settings.ADMIN_EMAIL
    admin_password = os.getenv("ADMIN_PASSWORD") or settings.ADMIN_PASSWORD
    
    if not mongo_uri:
        logger.error("MONGO_URI is missing!")
        return

    client = AsyncIOMotorClient(mongo_uri)
    db = client[mongo_db]
    
    email = admin_email
    new_password = admin_password
    
    logger.info(f"Updating password for {email}...")
    
    # Generate new hash
    password_hash = hashpw(new_password.encode(), gensalt()).decode()
    
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"password_hash": password_hash}}
    )
    
    if result.modified_count > 0:
        logger.info("Password updated successfully!")
    else:
        logger.warning("User not found or password unchanged.")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(update_password())
