import asyncio
import logging
import os
import bcrypt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# Load .env
load_dotenv("../.env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def verify_user():
    logger.info("Connecting to database...")
    mongo_uri = os.getenv("MONGO_URI") or settings.MONGO_URI
    mongo_db = os.getenv("MONGO_DB") or settings.MONGO_DB
    
    if not mongo_uri:
        logger.error("MONGO_URI is missing!")
        return

    client = AsyncIOMotorClient(mongo_uri)
    db = client[mongo_db]
    
    email = "rsanutopthree@gmail.com"
    password = "Sanu@123"
    
    logger.info(f"Looking up user: {email}")
    
    user = await db.users.find_one({"email": email})
    
    if user:
        logger.info(f"User found: {user.get('uuid')}")
        stored_hash = user.get('password_hash')
        logger.info(f"Stored Hash: {stored_hash}")
        
        if stored_hash:
            try:
                # Test verification
                is_valid = bcrypt.checkpw(
                    password.encode('utf-8'),
                    stored_hash.encode('utf-8')
                )
                logger.info(f"Password '{password}' valid? {is_valid}")
            except Exception as e:
                logger.error(f"Verification failed with error: {e}")
        else:
            logger.error("No password hash found!")
            
    else:
        logger.error("User NOT found in database!")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(verify_user())
