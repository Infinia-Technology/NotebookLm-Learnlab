
"""
Mongoose-style Document base class for MongoDB with Motor.

Provides:
- Automatic timestamps (created_at, updated_at)
- Instance methods: save(), delete(), reload()
- Class methods: find(), find_one(), find_by_id(), create(), count(), aggregate()
- UUID mixin for portable document references
"""

from typing import TypeVar, Generic, Optional, List, Dict, Any, Type, ClassVar
from datetime import datetime
from enum import Enum
import uuid as uuid_lib
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorCollection

T = TypeVar("T", bound="Document")


# ==================== File Storage Enums ====================

class FileCategory(str, Enum):
    """Categories for organizing files in S3 storage."""
    # HR/Agents
    HR_CV = "hr/cv"
    HR_JD = "hr/jd"

    # Financial Data
    FINANCIAL_BALANCE_SHEET = "financial/balance_sheet"
    FINANCIAL_INCOME_STATEMENT = "financial/income_statement"
    FINANCIAL_CONSOLIDATED = "financial/consolidated"
    FINANCIAL_AUDITED = "financial/audited"

    # User Content
    USER_MEMORIES = "users/memories"
    USER_AVATAR = "users/avatar"

    # Uploads (temp/processing)
    UPLOAD_BATCH = "uploads/batch"

    # Profiles
    PROFILE_AVATAR = "profiles/avatar"

    # Chat
    CHAT_IMAGES = "chat/images"
    CHAT_DOCUMENTS = "chat/documents"


class FileReferenceType(str, Enum):
    """Types of entities that can reference files."""
    AGENT = "agent"
    USER = "user"
    ENTITY = "entity"
    UPLOAD_BATCH = "upload_batch"
    MEMORY = "memory"
    PROFILE = "profile"


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic v2."""

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema

        return core_schema.no_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError(f"Invalid ObjectId: {v}")


def generate_uuid() -> str:
    """Generate a new UUID4 string."""
    return str(uuid_lib.uuid4())


class Document(BaseModel):
    """
    Mongoose-style Document base class.

    Features:
    - Automatic timestamps (created_at, updated_at)
    - UUID for portable document references
    - Instance methods: save(), delete(), reload()
    - Class methods: find(), find_one(), find_by_id(), find_by_uuid(), create()

    Example usage:
        class UserDocument(Document):
            __collection_name__ = "users"
            email: str
            name: str

        # Find all
        users = await UserDocument.find()

        # Create new
        user = await UserDocument.create(email="test@test.com", name="Test")

        # Find by UUID (preferred)
        user = await UserDocument.find_by_uuid("550e8400-e29b-41d4-a716-446655440000")

        # Update and save
        user.name = "Updated"
        await user.save()
    """

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
    )

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    uuid: str = Field(default_factory=generate_uuid)  # Primary business ID for references
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Class-level attributes (set by subclass)
    __collection_name__: ClassVar[str] = ""
    __db__: ClassVar[AsyncIOMotorDatabase] = None

    @classmethod
    def set_db(cls, db: AsyncIOMotorDatabase):
        """Set database instance for the document class."""
        cls.__db__ = db

    @classmethod
    def collection(cls) -> AsyncIOMotorCollection:
        """Get the MongoDB collection for this document."""
        if cls.__db__ is None:
            raise RuntimeError("Database not initialized. Call set_db() first.")
        return cls.__db__[cls.__collection_name__]

    # ==================== Instance Methods ====================

    async def save(self: T) -> T:
        """Save the document (insert or update)."""
        self.updated_at = datetime.utcnow()
        data = self._to_mongo()

        if self.id:
            # Update existing
            await self.collection().update_one(
                {"_id": self.id},
                {"$set": data}
            )
        else:
            # Insert new
            self.created_at = datetime.utcnow()
            data["created_at"] = self.created_at
            result = await self.collection().insert_one(data)
            self.id = result.inserted_id

        return self

    async def delete(self) -> bool:
        """Delete the document."""
        if not self.id:
            raise ValueError("Cannot delete document without ID")
        result = await self.collection().delete_one({"_id": self.id})
        return result.deleted_count > 0

    async def reload(self: T) -> T:
        """Reload document from database."""
        if not self.id:
            raise ValueError("Cannot reload document without ID")
        doc = await self.collection().find_one({"_id": self.id})
        if doc:
            for key, value in doc.items():
                if key == "_id":
                    continue
                if hasattr(self, key):
                    setattr(self, key, value)
        return self

    # ==================== Class Methods ====================

    @classmethod
    async def find(
        cls: Type[T],
        query: Dict = None,
        skip: int = 0,
        limit: int = 100,
        sort: List[tuple] = None
    ) -> List[T]:
        """Find documents matching query."""
        query = query or {}
        cursor = cls.collection().find(query)

        if sort:
            cursor = cursor.sort(sort)
        if skip:
            cursor = cursor.skip(skip)
        if limit:
            cursor = cursor.limit(limit)

        docs = await cursor.to_list(length=limit or 1000)
        return [cls._from_mongo(doc) for doc in docs]

    @classmethod
    async def find_one(cls: Type[T], query: Dict) -> Optional[T]:
        """Find a single document."""
        doc = await cls.collection().find_one(query)
        if doc:
            return cls._from_mongo(doc)
        return None

    @classmethod
    async def find_by_id(cls: Type[T], id: ObjectId | str) -> Optional[T]:
        """Find document by MongoDB ObjectId (legacy, prefer find_by_uuid)."""
        if isinstance(id, str):
            if not ObjectId.is_valid(id):
                return None
            id = ObjectId(id)
        return await cls.find_one({"_id": id})

    @classmethod
    async def find_by_uuid(cls: Type[T], uuid: str) -> Optional[T]:
        """Find document by UUID (preferred method for lookups)."""
        return await cls.find_one({"uuid": uuid})

    @classmethod
    async def create(cls: Type[T], **data) -> T:
        """Create and save a new document."""
        doc = cls(**data)
        await doc.save()
        return doc

    @classmethod
    async def count(cls, query: Dict = None) -> int:
        """Count documents matching query."""
        query = query or {}
        return await cls.collection().count_documents(query)

    @classmethod
    async def exists(cls, query: Dict) -> bool:
        """Check if document exists."""
        doc = await cls.collection().find_one(query, {"_id": 1})
        return doc is not None

    @classmethod
    async def update_many(cls, query: Dict, update: Dict) -> int:
        """Update multiple documents."""
        update["updated_at"] = datetime.utcnow()
        result = await cls.collection().update_many(query, {"$set": update})
        return result.modified_count

    @classmethod
    async def delete_many(cls, query: Dict) -> int:
        """Delete multiple documents."""
        result = await cls.collection().delete_many(query)
        return result.deleted_count

    @classmethod
    async def aggregate(cls, pipeline: List[Dict]) -> List[Dict]:
        """Run aggregation pipeline."""
        cursor = cls.collection().aggregate(pipeline)
        return await cursor.to_list(length=None)

    @classmethod
    async def distinct(cls, field: str, query: Dict = None) -> List[Any]:
        """Get distinct values for a field."""
        query = query or {}
        return await cls.collection().distinct(field, query)

    # ==================== Private Methods ====================

    def _to_mongo(self) -> Dict:
        """Convert to MongoDB document."""
        data = self.model_dump(by_alias=True, exclude_none=True)
        if "_id" in data and data["_id"] is None:
            del data["_id"]
        return data

    @classmethod
    def _from_mongo(cls: Type[T], doc: Dict) -> T:
        """Create instance from MongoDB document."""
        return cls(**doc)

    def to_dict(self) -> Dict:
        """Convert to dictionary with string IDs for JSON serialization."""
        data = self.model_dump(by_alias=False)
        if data.get("id"):
            data["id"] = str(data["id"])
        return data
