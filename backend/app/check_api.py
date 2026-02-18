
import asyncio
import os
import httpx

async def test_api():
    base_url = "http://localhost:8000/api"
    
    # We need to find a user to "login" as, or just bypass auth if we can't login easily.
    # Since we are inside the container, we can't easily get the password.
    # But we can look at the DB to find the first super_admin.
    
    # Actually, I'll just write a script that calls the service directly but with FULL logging.
    from app.modules.learning.service import LearningService
    from app.modules.learning.schema import ModuleCreate
    from app.odm.user import UserDocument
    from app.odm.course import CourseDocument
    from app.odm.learning_module import LearningModuleDocument
    from motor.motor_asyncio import AsyncIOMotorClient

    mongo_uri = os.environ.get('MONGO_URI')
    db_name = os.environ.get('MONGO_DB', 'app_database')
    client = AsyncIOMotorClient(mongo_uri)
    db = client[db_name]
    UserDocument.set_db(db)
    CourseDocument.set_db(db)
    LearningModuleDocument.set_db(db)

    user = await UserDocument.find_one({"role": "super_admin"})
    course = await CourseDocument.find_one({})
    
    if not user or not course:
        print("Missing user or course")
        return

    payload = {
        "title": "API Test Module",
        "description": "Test",
        "content_type": "video",
        "content_url": "",
        "file_path": "",
        "order_index": 1,
        "estimated_duration": 30,
        "is_mandatory": False,
        "completion_criteria": { "min_watch_percent": 80 },
        "quiz_settings": {
            "passing_score": 80,
            "max_attempts": 3,
            "time_limit": 30,
            "randomize_questions": False
        },
        "assignment": {
            "enabled": False,
            "title": "",
            "instructions": "",
            "submission_type": "text",
            "requires_approval": True,
            "due_date": None
        },
        "course_uuid": course.uuid
    }

    try:
        data = ModuleCreate(**payload)
        service = LearningService()
        result = await service.create_module(user.uuid, data)
        print(f"SUCCESS: Created module {result.uuid}")
    except Exception as e:
        print(f"FAILURE: {e}")

if __name__ == '__main__':
    asyncio.run(test_api())
