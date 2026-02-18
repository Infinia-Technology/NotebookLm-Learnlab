from typing import List, Optional, ClassVar
from pydantic import Field
from datetime import datetime
import uuid as uuid_lib

from app.odm.document import Document, PyObjectId

class DomainDocument(Document):
    """
    Domain document for multi-tenant organizations.
    
    Represents an Enterprise customer (Tenant).
    """
    __collection_name__: ClassVar[str] = "domains"

    uuid: str = Field(default_factory=lambda: str(uuid_lib.uuid4()))
    
    # Core identity
    domain: str  # e.g., "apeiro.digital"
    name: Optional[str] = None  # e.g., "Apeiro Digital"
    
    # Feature flags / Entitlements
    enabled_modules: List[str] = Field(default_factory=list)
    
    # Status
    is_active: bool = True
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @classmethod
    async def find_by_domain(cls, domain: str) -> Optional["DomainDocument"]:
        """Find domain by domain string."""
        return await cls.find_one({"domain": domain.lower()})
        
    @classmethod
    async def find_by_uuid(cls, uuid: str) -> Optional["DomainDocument"]:
        """Find domain by UUID."""
        return await cls.find_one({"uuid": uuid})
