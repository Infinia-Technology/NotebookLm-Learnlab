"""
User and Group document models for MongoDB.

Handles authentication and user identity.
Access control is stored separately in user_access collection.
"""

import uuid as uuid_lib
from typing import Optional, List, Literal, ClassVar
from datetime import datetime
from pydantic import Field, BaseModel
from bson import ObjectId

from app.odm.document import Document, PyObjectId


# Role and status enums as string literals
SystemRoleStr = Literal["super_admin", "super_viewer", "admin", "editor", "viewer", "user"]  # System-wide roles
RoleStr = Literal["admin", "editor", "viewer", "user"]  # Company-level roles
DomainRoleStr = Literal["admin", "member"]  # Per-domain roles
UserStatusStr = Literal["pending", "active", "suspended"]

# Backward compatibility aliases
EntityRoleStr = RoleStr


# DEPRECATED: These classes are kept for backward compatibility during migration
# Access control is now in user_access collection
class EntityRole(BaseModel):
    """DEPRECATED: Use user_access collection instead."""
    entity_code: str
    entity_name: str
    role: RoleStr
    cascade: bool = True
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_by: Optional[str] = None


class CompanyRole(BaseModel):
    """DEPRECATED: Use user_access collection instead."""
    company_uuid: str
    company_name: str
    role: RoleStr
    cascade: bool = True
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_by: Optional[str] = None


class EmbeddedGroupAssignment(BaseModel):
    """DEPRECATED: Legacy group assignment."""
    group_id: PyObjectId
    group_name: str
    role: str
    assigned_by: Optional[PyObjectId] = None
    assigned_at: Optional[datetime] = None


class UserDocument(Document):
    """
    User document for authentication and identity.

    Features:
    - Password hash storage (bcrypt)
    - System-wide roles (super_admin, super_viewer)
    - Domain assignment (multi-tenant)
    - OTP support for signup/reset

    Note: Company access control is stored in user_access collection.
    """

    __collection_name__: ClassVar[str] = "users"

    # Unique identifier
    uuid: str = Field(default_factory=lambda: str(uuid_lib.uuid4()))

    # Authentication
    email: str
    password_hash: Optional[str] = None

    # System-wide role (super_admin or super_viewer)
    role: Optional[SystemRoleStr] = None

    # Account status
    status: str = "pending"  # UserStatusStr

    # Profile
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    phone_number: Optional[str] = None

    # Domain assignment (multi-tenant)
    domain_id: Optional[PyObjectId] = None
    domain_uuid: Optional[str] = None
    domain_role: Optional[DomainRoleStr] = None

    # OTP
    otp: Optional[str] = None
    otp_expires_at: Optional[datetime] = None
    otp_verified: bool = False

    # Invitation (for magic link onboarding)
    invitation_token_hash: Optional[str] = None  # bcrypt hash of invitation token
    invitation_expires_at: Optional[datetime] = None  # 24h expiry
    invited_by: Optional[str] = None  # UUID of user who sent invitation
    invited_at: Optional[datetime] = None  # When invitation was sent

    # Activity
    last_login_at: Optional[datetime] = None

    # Linked agent profile (My Profile feature)
    linked_agent_id: Optional[str] = None
    linked_agent_uuid: Optional[str] = None

    # ==================== Class Methods ====================

    @classmethod
    async def find_by_email(cls, email: str) -> Optional["UserDocument"]:
        """Find user by email."""
        return await cls.find_one({"email": email.lower()})

    @classmethod
    async def find_by_uuid(cls, uuid: str) -> Optional["UserDocument"]:
        """Find user by UUID."""
        return await cls.find_one({"uuid": uuid})

    @classmethod
    async def ensure_uuid(cls, user: "UserDocument") -> str:
        """Ensure user has a UUID, generating one if missing."""
        if not user.uuid:
            user.uuid = str(uuid_lib.uuid4())
            await user.save()
        return user.uuid

    @classmethod
    async def find_active(cls, **filters) -> List["UserDocument"]:
        """Find active users."""
        query = {"status": "active", **filters}
        return await cls.find(query)

    @classmethod
    async def find_by_role(cls, role: str) -> List["UserDocument"]:
        """Find users by system role (super_admin, super_viewer)."""
        return await cls.find({"role": role})

    @classmethod
    async def find_super_admins(cls) -> List["UserDocument"]:
        """Find all super admin users."""
        return await cls.find({"role": "super_admin"})

    @classmethod
    async def find_by_domain(cls, domain_id: str | ObjectId) -> List["UserDocument"]:
        """Find users in a domain."""
        if isinstance(domain_id, str):
            domain_id = ObjectId(domain_id)
        return await cls.find({"domain_id": domain_id})

    @classmethod
    async def find_domain_admins(cls, domain_id: str | ObjectId) -> List["UserDocument"]:
        """Find domain admins for a specific domain."""
        if isinstance(domain_id, str):
            domain_id = ObjectId(domain_id)
        return await cls.find({"domain_id": domain_id, "domain_role": "admin"})

    # ==================== Instance Methods ====================

    async def update_last_login(self):
        """Update last login timestamp."""
        self.last_login_at = datetime.utcnow()
        await self.save()

    def has_role(self, *roles: str) -> bool:
        """Check if user has one of the specified system roles."""
        return self.role in roles

    def is_super_admin(self) -> bool:
        """Check if user is super_admin."""
        return self.role == "super_admin"

    def is_super_viewer(self) -> bool:
        """Check if user is super_viewer (read-only access to everything)."""
        return self.role == "super_viewer"

    def is_super_role(self) -> bool:
        """Check if user has any super role (admin or viewer)."""
        return self.role in ("super_admin", "super_viewer")

    def is_admin(self) -> bool:
        """Check if user is super_admin (system-level admin)."""
        return self.role == "super_admin"

    def is_domain_admin(self) -> bool:
        """Check if user is a domain admin."""
        return self.domain_role == "admin"

    def get_email_domain(self) -> Optional[str]:
        """Extract domain from user's email."""
        if "@" in self.email:
            return self.email.split("@")[1].lower()
        return None

    def get_full_name(self) -> str:
        """Get user's full name."""
        parts = [self.first_name, self.last_name]
        return " ".join(filter(None, parts)) or self.email

    async def clear_invitation(self):
        """Clear invitation token after successful acceptance."""
        self.invitation_token_hash = None
        self.invitation_expires_at = None
        await self.save()

    def has_pending_invitation(self) -> bool:
        """Check if user has a pending invitation that hasn't expired."""
        if not self.invitation_token_hash or not self.invitation_expires_at:
            return False
        return self.invitation_expires_at > datetime.utcnow()


class GroupDocument(Document):
    """
    Group document for organizational access control.

    Groups represent organizational units (e.g., "ESG Group", "Palms Sports").
    """

    __collection_name__: ClassVar[str] = "groups"

    # Identity
    name: str
    short_name: Optional[str] = None
    description: Optional[str] = None

    # Root entity reference
    root_entity_id: Optional[PyObjectId] = None
    root_entity_name: Optional[str] = None  # Denormalized

    # Email domain matching
    email_domains: List[str] = Field(default_factory=list)

    # Stats (denormalized)
    entity_count: int = 0
    subsidiary_count: int = 0

    # Metadata
    sector: Optional[str] = None
    is_active: bool = True

    # ==================== Custom Class Methods ====================

    @classmethod
    async def find_by_name(cls, name: str) -> Optional["GroupDocument"]:
        """Find group by name."""
        return await cls.find_one({"name": name})

    @classmethod
    async def find_active(cls) -> List["GroupDocument"]:
        """Find all active groups."""
        return await cls.find({"is_active": True}, sort=[("name", 1)])

    @classmethod
    async def find_by_email_domain(cls, domain: str) -> Optional["GroupDocument"]:
        """Find group by email domain."""
        return await cls.find_one({"email_domains": domain.lower()})

    async def update_stats(self, entity_count: int, subsidiary_count: int):
        """Update group statistics."""
        self.entity_count = entity_count
        self.subsidiary_count = subsidiary_count
        await self.save()


class AuditLogDocument(Document):
    """
    Audit log document for tracking changes.

    Records all significant actions for compliance and debugging.
    """

    __collection_name__: ClassVar[str] = "audit_log"

    # User reference
    user_id: Optional[PyObjectId] = None
    user_email: Optional[str] = None  # Denormalized

    # Action details
    action: str  # login, upload, view, create, update, delete, merge
    resource_type: Optional[str] = None
    resource_id: Optional[PyObjectId] = None

    # Details
    details: dict = Field(default_factory=dict)

    # Request info
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    @classmethod
    async def log_action(
        cls,
        action: str,
        user_id: ObjectId = None,
        user_email: str = None,
        resource_type: str = None,
        resource_id: ObjectId = None,
        details: dict = None,
        ip_address: str = None,
        user_agent: str = None
    ) -> "AuditLogDocument":
        """Create an audit log entry."""
        return await cls.create(
            action=action,
            user_id=user_id,
            user_email=user_email,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent
        )

    @classmethod
    async def find_by_user(
        cls,
        user_id: str | ObjectId,
        limit: int = 100
    ) -> List["AuditLogDocument"]:
        """Find audit logs for a user."""
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        return await cls.find(
            {"user_id": user_id},
            sort=[("created_at", -1)],
            limit=limit
        )

    @classmethod
    async def find_recent(cls, limit: int = 100) -> List["AuditLogDocument"]:
        """Find recent audit logs."""
        return await cls.find(
            {},
            sort=[("created_at", -1)],
            limit=limit
        )
