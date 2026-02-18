from typing import Optional, ClassVar
from pydantic import Field
import uuid as uuid_lib

from app.odm.document import Document

class CourseDocument(Document):
    """
    Course document representing a learning course.
    """
    __collection_name__: ClassVar[str] = "courses"

    uuid: str = Field(default_factory=lambda: str(uuid_lib.uuid4()))
    title: str
    description: Optional[str] = None
    
    @classmethod
    async def find_by_uuid(cls, uuid: str) -> Optional["CourseDocument"]:
        """Find course by UUID."""
        return await cls.find_one({"uuid": uuid})
