"""Service layer for admin module."""

from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import math
import bcrypt
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.core.error_codes import ErrorCode
from app.core.exceptions import ConflictError, NotFoundError
from app.odm.user import UserDocument
from app.odm.system_settings import SystemSettings
from app.modules.admin.schemas import (
    UserListParams,
    CreateUserRequest,
    UpdateUserRequest,
    UserResponse,
    UserListResponse,
    AdminStatsResponse,
)
from app.services.email.service import send_admin_created_user_email


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def user_to_response(user: UserDocument) -> UserResponse:
    """Convert UserDocument to UserResponse schema."""
    return UserResponse(
        uuid=user.uuid,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        department=user.department,
        phone_number=user.phone_number,
        role=user.role,
        status=user.status,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login_at=user.last_login_at,
    )


class AdminService:
    """Service for admin operations."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def list_users(self, params: UserListParams) -> UserListResponse:
        """List users with filtering and pagination."""
        query = {}

        # Search filter (email, name)
        if params.search:
            search_regex = {"$regex": params.search, "$options": "i"}
            query["$or"] = [
                {"email": search_regex},
                {"first_name": search_regex},
                {"last_name": search_regex},
            ]

        # Role filter
        if params.role:
            query["role"] = params.role

        # Status filter
        if params.status:
            query["status"] = params.status

        # Get total count
        total = await self.db.users.count_documents(query)

        # Calculate pagination
        skip = (params.page - 1) * params.per_page
        pages = math.ceil(total / params.per_page) if total > 0 else 1

        # Fetch users
        cursor = self.db.users.find(query).skip(skip).limit(params.per_page).sort("created_at", -1)
        users_data = await cursor.to_list(length=params.per_page)

        # Convert to UserDocument objects
        items = []
        for user_data in users_data:
            user = UserDocument(**user_data)
            items.append(user_to_response(user))

        return UserListResponse(
            items=items,
            total=total,
            page=params.page,
            per_page=params.per_page,
            pages=pages,
        )

    async def get_user(self, user_uuid: str) -> UserResponse:
        """Get a single user by UUID."""
        user = await UserDocument.find_by_uuid(user_uuid)
        if not user:
            raise NotFoundError(
                message="User not found",
                code=ErrorCode.USER_NOT_FOUND
            )
        return user_to_response(user)

    async def create_user(
        self,
        data: CreateUserRequest,
        created_by: str
    ) -> UserResponse:
        """Create a new user (bypass normal signup flow)."""
        # Check if email already exists
        existing = await UserDocument.find_by_email(data.email)
        if existing:
            raise ConflictError(
                message=f"User with email {data.email} already exists",
                code=ErrorCode.EMAIL_ALREADY_EXISTS
            )

        try:
            user = await UserDocument.create(
                email=data.email.lower(),
                password_hash=hash_password(data.password),
                first_name=data.first_name,
                last_name=data.last_name,
                department=data.department,
                phone_number=data.phone_number,
                role=data.role,
                status=data.status,
                otp_verified=True,  # Skip OTP verification for admin-created users
            )
        except DuplicateKeyError:
            raise ConflictError(
                message=f"User with email {data.email} already exists",
                code=ErrorCode.EMAIL_ALREADY_EXISTS
            )

        # Send welcome email to user with their credentials
        await send_admin_created_user_email(
            email=user.email,
            password=data.password,
            first_name=user.first_name
        )

        return user_to_response(user)

    async def update_user(
        self,
        user_uuid: str,
        data: UpdateUserRequest,
        updated_by: str
    ) -> UserResponse:
        """Update a user."""
        user = await UserDocument.find_by_uuid(user_uuid)
        if not user:
            raise NotFoundError(
                message="User not found",
                code=ErrorCode.USER_NOT_FOUND
            )

        # Update fields if provided
        if data.first_name is not None:
            user.first_name = data.first_name
        if data.last_name is not None:
            user.last_name = data.last_name
        if data.department is not None:
            user.department = data.department
        if data.phone_number is not None:
            user.phone_number = data.phone_number
        if data.status is not None:
            user.status = data.status
        if data.password is not None:
            user.password_hash = hash_password(data.password)

        # Handle role update
        if "role" in data.model_fields_set:
            user.role = data.role

        await user.save()
        return user_to_response(user)

    async def delete_user(self, user_id: str) -> bool:
        """Permanently delete a user."""
        user = await UserDocument.find_one({"uuid": user_id})
        if not user:
            raise NotFoundError("User not found")
        return await user.delete()

    async def get_ai_settings(self) -> Dict[str, Any]:
        """Get AI integration settings with optimal defaults."""
        settings = await SystemSettings.get_settings()
        
        # Seed API credentials from env if empty
        if not settings.ai_api_key:
            settings.ai_api_key = os.getenv("LITELLM_API_KEY")
        if not settings.ai_base_url:
            base_url = os.getenv("LITELLM_BASE_URL")
            if base_url:
                settings.ai_base_url = base_url
            
        # Ensure all model keys are present (Perfect Agent in Perfect Service)
        defaults = {
            "chat": "deepseek-ai/DeepSeek-V3.1",
            "transcribe": "openai/whisper-large-v3",
            "vision": "Qwen/Qwen3-VL-235B",
            "embeddings": "Qwen3-Embedding-8B",
            "infographic": "deepseek-ai/DeepSeek-V3.1"
        }
        
        updated_mappings = defaults.copy()
        if settings.model_mappings:
            updated_mappings.update(settings.model_mappings)
        
        settings.model_mappings = updated_mappings
        # We don't save automatically here to avoid unintended DB writes, 
        # but we return the "perfect" setup to the UI.
            
        return {
            "ai_api_key": settings.ai_api_key,
            "ai_base_url": settings.ai_base_url,
            "model_mappings": settings.model_mappings
        }

    async def test_ai_connection(self) -> Dict[str, Any]:
        """Verify the current AI configuration by making a simple request."""
        from app.modules.knowledge.service import call_ai, call_vision_ai
        import base64
        
        problems = []
        
        # 1. Test Chat
        try:
            chat_result = await call_ai(
                system_prompt="You are a system health checker.",
                user_prompt="Respond with 'OK' if you see this.",
                service_name="chat"
            )
            if "error" in chat_result.lower() or "failed" in chat_result.lower() or "⚠️" in chat_result:
                problems.append(f"Chat: {chat_result}")
        except Exception as e:
            problems.append(f"Chat: {str(e)}")
            
        # 2. Test Vision (Small 1x1 black pixel)
        try:
            # A tiny 1x1 black pixel GIF in base64
            pixel_b64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
            vision_result = await call_vision_ai(
                system_prompt="OCR test",
                user_prompt="Is this an image?",
                image_data_base64=pixel_b64
            )
            if "error" in vision_result.lower() or "failed" in vision_result.lower() or "⚠️" in vision_result:
                problems.append(f"Vision (OCR): {vision_result}")
        except Exception as e:
            problems.append(f"Vision (OCR): {str(e)}")
            
        if problems:
            return {
                "success": False, 
                "message": "Connection issues found: " + " | ".join(problems)
            }
                
        return {"success": True, "message": "All systems (Chat & Vision) are responding correctly!"}

    async def update_ai_settings(self, data: Any) -> Dict[str, Any]:
        """Update AI integration settings."""
        settings = await SystemSettings.get_settings()
        
        if data.ai_api_key is not None:
            settings.ai_api_key = data.ai_api_key.strip()
        if data.ai_base_url is not None:
            settings.ai_base_url = data.ai_base_url.strip()
        if data.model_mappings is not None:
            # Merge model mappings
            settings.model_mappings.update(data.model_mappings)
            
        await settings.save()
        return {
            "ai_api_key": settings.ai_api_key,
            "ai_base_url": settings.ai_base_url,
            "model_mappings": settings.model_mappings
        }

    async def get_stats(self) -> AdminStatsResponse:
        """Get admin dashboard statistics."""
        # Get counts using aggregation
        pipeline = [
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        status_counts = await self.db.users.aggregate(pipeline).to_list(None)
        by_status = {item["_id"]: item["count"] for item in status_counts}

        total_users = sum(by_status.values())
        active_users = by_status.get("active", 0)
        pending_users = by_status.get("pending", 0)
        suspended_users = by_status.get("suspended", 0)

        # Count super admins
        super_admins = await self.db.users.count_documents({"role": "super_admin"})

        return AdminStatsResponse(
            total_users=total_users,
            active_users=active_users,
            pending_users=pending_users,
            suspended_users=suspended_users,
            super_admins=super_admins,
            by_status=by_status,
        )
