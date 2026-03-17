
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_users():
    mongodb_url = os.environ.get("MONGODB_URL", "mongodb://mongoadmin:secret@localhost:27017")
    client = AsyncIOMotorClient(mongodb_url)
    db = client.sail_db
    
    print("Checking users collection...")
    async for user in db.users.find({}, {"email": 1, "last_login_at": 1, "created_at": 1}):
        print(f"User: {user.get('email')}, Last Login At: {user.get('last_login_at')}, Created At: {user.get('created_at')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_users())
