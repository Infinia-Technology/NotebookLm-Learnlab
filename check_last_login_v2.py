
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check():
    url = os.environ.get('MONGO_URI')
    if not url:
        print("MONGO_URI not set")
        return
    client = AsyncIOMotorClient(url)
    db = client.get_default_database()
    print('Users in DB:')
    async for u in db.users.find({}, {'email': 1, 'last_login_at': 1, 'role': 1}):
        last_login = u.get('last_login_at')
        if last_login:
            # Check if it's a datetime object or a string
            type_str = type(last_login).__name__
            print(f"{u.get('email')}: {last_login} ({type_str}) - Role: {u.get('role')}")
        else:
            print(f"{u.get('email')}: Never - Role: {u.get('role')}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
