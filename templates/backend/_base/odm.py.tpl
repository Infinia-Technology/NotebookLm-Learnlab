"""
{{APP_NAME}} ODM document model.

Generated: {{GENERATED_AT}}
Template: {{TEMPLATE_TYPE}}
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from app.odm.base import BaseDocument


class {{MODEL_NAME}}Document(BaseDocument):
    """MongoDB document model for {{APP_NAME}}."""

    collection_name = "{{SLUG_SNAKE}}"

    def __init__(
        self,
        name: str,
        description: Optional[str] = None,
        status: str = "active",
        created_by: Optional[str] = None,
        uuid: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        **kwargs,
    ):
        super().__init__(uuid=uuid, created_at=created_at, updated_at=updated_at)
        self.name = name
        self.description = description
        self.status = status
        self.created_by = created_by

    def to_dict(self) -> Dict[str, Any]:
        """Convert document to dictionary for MongoDB."""
        return {
            "uuid": self.uuid,
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "created_by": self.created_by,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "{{MODEL_NAME}}Document":
        """Create document from MongoDB dictionary."""
        return cls(
            uuid=data.get("uuid"),
            name=data.get("name", ""),
            description=data.get("description"),
            status=data.get("status", "active"),
            created_by=data.get("created_by"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
        )

    @classmethod
    async def find_by_uuid(cls, uuid: str) -> Optional["{{MODEL_NAME}}Document"]:
        """Find document by UUID."""
        db = cls.get_db()
        data = await db[cls.collection_name].find_one({"uuid": uuid})
        return cls.from_dict(data) if data else None

    @classmethod
    async def find(
        cls,
        query: Dict[str, Any],
        skip: int = 0,
        limit: int = 20,
        sort: Optional[List[tuple]] = None,
    ) -> List["{{MODEL_NAME}}Document"]:
        """Find documents matching query."""
        db = cls.get_db()
        cursor = db[cls.collection_name].find(query)

        if sort:
            cursor = cursor.sort(sort)
        else:
            cursor = cursor.sort([("created_at", -1)])

        cursor = cursor.skip(skip).limit(limit)

        docs = await cursor.to_list(length=limit)
        return [cls.from_dict(d) for d in docs]

    @classmethod
    async def count(cls, query: Dict[str, Any]) -> int:
        """Count documents matching query."""
        db = cls.get_db()
        return await db[cls.collection_name].count_documents(query)

    async def save(self) -> None:
        """Save document to MongoDB."""
        db = self.get_db()
        self.updated_at = datetime.utcnow()

        await db[self.collection_name].update_one(
            {"uuid": self.uuid},
            {"$set": self.to_dict()},
            upsert=True,
        )

    async def delete(self) -> None:
        """Delete document from MongoDB."""
        db = self.get_db()
        await db[self.collection_name].delete_one({"uuid": self.uuid})
