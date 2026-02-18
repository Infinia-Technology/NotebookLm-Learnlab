
import asyncio
import sys
# Add current directory to path so imports work
sys.path.append("/app")

from app.db import connect_to_mongo, get_database
from app.odm.user import UserDocument
from app.odm.document import Document
from app.odm.course import CourseDocument
from app.odm.learning_module import LearningModuleDocument
from app.odm.progress import ModuleProgressDocument
from app.odm.assignment_submission import AssignmentSubmissionDocument
from app.core.config import settings

def init_document_classes(db):
    Document.set_db(db)
    UserDocument.set_db(db)
    CourseDocument.set_db(db)
    LearningModuleDocument.set_db(db)
    ModuleProgressDocument.set_db(db)
    AssignmentSubmissionDocument.set_db(db)

async def check_user():
    await connect_to_mongo()
    db = get_database()
    init_document_classes(db)
    
    # Use dictionary query to avoid AttributeError if direct attribute access fails
    user = await UserDocument.find_one({"email": settings.ADMIN_EMAIL})
    if user:
        print(f"User found: {user.email}")
        print(f"Is Active: {user.status}")
        print(f"Role: {user.role}")
        print(f"Password Hash: {user.password_hash[:10]}..." if user.password_hash else "NO PASSWORD")
    else:
        print(f"User NOT found: {settings.ADMIN_EMAIL}")

if __name__ == "__main__":
    asyncio.run(check_user())
