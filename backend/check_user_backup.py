
import asyncio
from app.db import connect_to_mongo, get_database
from app.odm.user import UserDocument
from app.core.config import settings

async def check_user():
    await connect_to_mongo()
    user = await UserDocument.find_one(UserDocument.email == settings.ADMIN_EMAIL)
    if user:
        print(f"User found: {user.email}")
        print(f"Is Active: {user.is_active}")
        print(f"Is Verified: {user.is_verified}")
    else:
        print("User NOT found")

if __name__ == "__main__":
    asyncio.run(check_user())
