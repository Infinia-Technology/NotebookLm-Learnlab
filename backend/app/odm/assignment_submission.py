from typing import Optional, ClassVar, Literal, Dict, Any
from pydantic import Field
import uuid as uuid_lib
from datetime import datetime

from app.odm.document import Document

class AssignmentSubmissionDocument(Document):
    """
    Document representing a user's submission for a module assignment.
    """
    __collection_name__: ClassVar[str] = "assignment_submissions"

    uuid: str = Field(default_factory=lambda: str(uuid_lib.uuid4()))
    module_uuid: str
    user_uuid: str
    
    # Submission content (text, URL, or file path)
    submission_content: str
    submission_type: Literal["text", "file", "url"]
    
    status: Literal["pending", "approved", "rejected"] = "pending"
    score: Optional[float] = None
    feedback: Optional[str] = None
    
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    
    @classmethod
    async def find_by_uuid(cls, uuid: str) -> Optional["AssignmentSubmissionDocument"]:
        """Find submission by UUID."""
        return await cls.find_one({"uuid": uuid})

    @classmethod
    async def find_by_module_and_user(cls, module_uuid: str, user_uuid: str) -> Optional["AssignmentSubmissionDocument"]:
        """Find submission by module and user."""
        return await cls.find_one({"module_uuid": module_uuid, "user_uuid": user_uuid})
    
    @classmethod
    async def find_by_module(cls, module_uuid: str) -> list["AssignmentSubmissionDocument"]:
        """Find all submissions for a module."""
        return await cls.find({"module_uuid": module_uuid}, sort=[("submitted_at", -1)])
