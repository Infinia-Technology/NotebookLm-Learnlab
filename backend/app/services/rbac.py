"""
Role-Based Access Control (RBAC) service.

Provides utilities for checking user permissions on domains.
"""

from typing import Optional, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.odm.user import UserDocument


# Role hierarchy levels (higher = more permissions)
ROLE_LEVELS = {
    "super_admin": 100,
    "admin": 80,
    "editor": 60,
    "viewer": 20,
    "user": 10,
}


def check_permission(user_role: Optional[str], required_role: str) -> bool:
    """
    Check if user_role meets or exceeds required_role.

    Args:
        user_role: The user's current role (or None)
        required_role: The minimum role required

    Returns:
        True if user_role >= required_role
    """
    if not user_role:
        return False

    user_level = ROLE_LEVELS.get(user_role, 0)
    required_level = ROLE_LEVELS.get(required_role, 999)

    return user_level >= required_level


def is_domain_admin(user: UserDocument) -> bool:
    """Check if user is a domain admin."""
    return user.domain_role == "admin" if user.domain_role else False


async def get_user_domain(user: UserDocument, db: AsyncIOMotorDatabase) -> Optional[dict]:
    """Get user's domain document."""
    if not user.domain_id:
        return None
    return await db.domains.find_one({"_id": ObjectId(str(user.domain_id))})


async def get_accessible_domain_ids(
    user: UserDocument,
    db: AsyncIOMotorDatabase
) -> List[ObjectId]:
    """
    Get list of domain IDs the user can access.

    - super_admin: All domains
    - domain_admin: Their domain + all descendant domains
    - domain_member: Only their own domain
    """
    # Super admin sees everything
    if user.role == "super_admin":
        all_domains = await db.domains.find({}, {"_id": 1}).to_list(None)
        return [d["_id"] for d in all_domains]

    if not user.domain_id:
        return []

    user_domain = await get_user_domain(user, db)
    if not user_domain:
        return []

    # Start with user's own domain
    accessible = [ObjectId(str(user.domain_id))]

    # Domain admins can access descendant domains
    if is_domain_admin(user):
        descendants = await db.domains.find(
            {"hierarchy_path": user_domain["domain"]}
        ).to_list(None)
        for desc in descendants:
            accessible.append(desc["_id"])

    return accessible


async def can_user_manage_domain(
    user: UserDocument,
    domain_id: str,
    db: AsyncIOMotorDatabase
) -> bool:
    """
    Check if user can manage a specific domain.

    Super admins can manage any domain.
    Domain admins can manage their domain and descendants.
    """
    if user.role == "super_admin":
        return True

    if not is_domain_admin(user):
        return False

    if not user.domain_id:
        return False

    # Check if target domain is same or descendant
    user_domain_uuid = str(user.domain_id)

    if domain_id == user_domain_uuid:
        return True

    # Check if domain_id is a descendant of user's domain
    target_domain = await db.domains.find_one({"uuid": domain_id})
    if not target_domain:
        return False

    hierarchy_path = target_domain.get("hierarchy_path", [])
    return user_domain_uuid in hierarchy_path
