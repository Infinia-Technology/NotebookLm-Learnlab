
import asyncio
import sys
import json
from datetime import datetime

# Add current directory to path so imports work
sys.path.append("/app")

from app.db import connect_to_mongo, get_database
from app.odm.document import Document
from app.odm.user import UserDocument
from app.odm.course import CourseDocument
from app.odm.learning_module import LearningModuleDocument
from app.odm.progress import ModuleProgressDocument
from app.odm.assignment_submission import AssignmentSubmissionDocument
from app.modules.learning.service import LearningService

def init_document_classes(db):
    Document.set_db(db)
    UserDocument.set_db(db)
    CourseDocument.set_db(db)
    LearningModuleDocument.set_db(db)
    ModuleProgressDocument.set_db(db)
    AssignmentSubmissionDocument.set_db(db)

async def verify():
    await connect_to_mongo()
    db = get_database()
    init_document_classes(db)
    
    service = LearningService()
    analytics = await service.get_admin_analytics()
    
    print("--- Analytics Data ---")
    print(json.dumps(analytics, default=str, indent=2))
    
    # Validation
    if "activity_trend" not in analytics:
        print("FAIL: activity_trend missing")
    else:
        print(f"PASS: activity_trend present with {len(analytics['activity_trend'])} days")
        
    if "content_distribution" not in analytics:
        print("FAIL: content_distribution missing")
    else:
        print(f"PASS: content_distribution present with {len(analytics['content_distribution'])} types")

if __name__ == "__main__":
    asyncio.run(verify())
