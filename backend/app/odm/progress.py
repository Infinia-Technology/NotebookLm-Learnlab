from typing import Optional, ClassVar, Literal
from pydantic import Field
from app.odm.document import Document

ProgressStatus = Literal["not_started", "in_progress", "completed"]

class ModuleProgressDocument(Document):
    """
    Tracking learner progress at the module level.
    """
    __collection_name__: ClassVar[str] = "module_progress"

    user_uuid: str
    module_uuid: str
    course_uuid: str
    status: ProgressStatus = "not_started"
    time_spent: int = 0  # in seconds
    completion_percentage: float = 0.0
    quiz_score: Optional[float] = None

    @classmethod
    async def find_for_user_module(cls, user_uuid: str, module_uuid: str) -> Optional["ModuleProgressDocument"]:
        """Find specific progress record."""
        return await cls.find_one({"user_uuid": user_uuid, "module_uuid": module_uuid})

    @classmethod
    async def find_for_user_course(cls, user_uuid: str, course_uuid: str) -> list["ModuleProgressDocument"]:
        """Find all module progress for a user in a course."""
        return await cls.find({"user_uuid": user_uuid, "course_uuid": course_uuid})
