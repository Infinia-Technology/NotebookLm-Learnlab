"""Schemas for admin module."""

from typing import Optional, List, Literal, Dict
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# Role types
SystemRoleType = Literal["super_admin", "super_viewer", "admin", "editor", "viewer", "user"]

UserStatusType = Literal["pending", "active", "suspended"]


class UserListParams(BaseModel):
    """Query parameters for listing users."""
    search: Optional[str] = None
    role: Optional[str] = None
    status: Optional[UserStatusType] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)


class CreateUserRequest(BaseModel):
    """Request schema for creating a new user."""
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[SystemRoleType] = None
    status: UserStatusType = "active"


class UpdateUserRequest(BaseModel):
    """Request schema for updating a user."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[SystemRoleType] = None
    status: Optional[UserStatusType] = None
    password: Optional[str] = Field(default=None, min_length=8)


class UserResponse(BaseModel):
    """Response schema for a user."""
    uuid: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Response schema for user list with pagination."""
    items: List[UserResponse]
    total: int
    page: int
    per_page: int
    pages: int


class AISettingsResponse(BaseModel):
    ai_api_key: Optional[str] = None
    ai_base_url: Optional[str] = None
    model_mappings: Dict[str, str]

class UpdateAISettingsRequest(BaseModel):
    ai_api_key: Optional[str] = None
    ai_base_url: Optional[str] = None
    model_mappings: Optional[Dict[str, str]] = None


class ConnectionTestResponse(BaseModel):
    success: bool
    message: str


class AdminStatsResponse(BaseModel):
    """Response schema for admin dashboard stats."""
    total_users: int
    active_users: int
    pending_users: int
    suspended_users: int
    super_admins: int
    by_status: Dict[str, int]
