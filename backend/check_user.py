
import asyncio
from app.db import connect_to_mongo
from app.odm.user import UserDocument
from app.core.config import settings

async def check_user():
    await connect_to_mongo()
    # Use dictionary query to avoid AttributeError if direct attribute access fails
    user = await UserDocument.find_one({"email": settings.ADMIN_EMAIL})
    if user:
        print(f"User found: {user.email}")
        print(f"Is Active: {user.status}")
        print(f"Role: {user.role}")
        print(f"Password Check: {'Has Password' if user.password_hash else 'NO PASSWORD'}")
    else:
        print(f"User NOT found: {settings.ADMIN_EMAIL}")

if __name__ == "__main__":
    asyncio.run(check_user())
