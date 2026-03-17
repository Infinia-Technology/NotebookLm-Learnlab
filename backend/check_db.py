
import asyncio
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    try:
        mongo_uri = os.environ.get('MONGO_URI')
        db_name = os.environ.get('MONGO_DB', 'app_database')
        client = AsyncIOMotorClient(mongo_uri)
        db = client[db_name]
        
        modules = await db.learning_modules.find().sort('created_at', -1).to_list(10)
        print('Recent Modules in DB:')
        for m in modules:
            print(f"UUID: {m.get('uuid')}, Title: {m.get('title')}, Course: {m.get('course_uuid')}")
            
        courses = await db.courses.find().to_list(10)
        print('\nRecent Courses in DB:')
        for c in courses:
            print(f"UUID: {c.get('uuid')}, Title: {c.get('title')}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    asyncio.run(check())
