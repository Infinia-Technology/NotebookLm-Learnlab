
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def inspect_domains():
    # Use local connection with credentials from .env
    uri = "mongodb://app_admin:app_secure_pass@localhost:27017/app_database?authSource=admin"
    client = AsyncIOMotorClient(uri)
    db = client.get_default_database()
    
    # Check domains
    domain = await db.domains.find_one({})
    if domain:
        print("Found domain document:")
        # Convert ObjectId to str for printing
        domain['_id'] = str(domain['_id'])
        print(domain)
    else:
        print("No domains found in collection.")

if __name__ == "__main__":
    asyncio.run(inspect_domains())
