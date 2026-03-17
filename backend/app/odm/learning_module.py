from typing import Optional, ClassVar, Literal, Dict, Any
from pydantic import Field
import uuid as uuid_lib
from datetime import datetime

from app.odm.document import Document

ModuleContentType = Literal["video", "pdf", "ppt", "quiz"]

class LearningModuleDocument(Document):
    """
    Document representing a learning module/unit within a course.
    """
    __collection_name__: ClassVar[str] = "learning_modules"

    uuid: str = Field(default_factory=lambda: str(uuid_lib.uuid4()))
    course_uuid: str
    title: str
    description: Optional[str] = None  # Rich text content
    content_type: ModuleContentType
    content_url: Optional[str] = None
    file_path: Optional[str] = None  # Local file path for uploads
    order_index: int = 0
    
    estimated_duration: Optional[int] = None  # Minutes
    is_mandatory: bool = False
    
    # Quiz Specific Settings
    # { "passing_score": int, "max_attempts": int, "time_limit": int, "randomize_questions": bool }
    quiz_settings: Optional[Dict[str, Any]] = None
    
    # Assignment Settings (Embedded)
    # { "enabled": bool, "title": str, "instructions": str, "submission_type": str, "due_date": datetime, "requires_approval": bool }
    assignment: Optional[Dict[str, Any]] = None
    
    # Example: { "min_watch_percent": 80 } or { "min_score": 70 }
    completion_criteria: Dict[str, Any] = Field(default_factory=dict)
    
    created_by: str  # user_uuid
    
    @classmethod
    async def find_by_uuid(cls, uuid: str) -> Optional["LearningModuleDocument"]:
        """Find module by UUID."""
        return await cls.find_one({"uuid": uuid})
    
    @classmethod
    async def find_by_course(cls, course_uuid: str) -> list["LearningModuleDocument"]:
        """Find modules for a course, ordered by index."""
        return await cls.find({"course_uuid": course_uuid}, sort=[("order_index", 1)])
