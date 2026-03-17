"""Service layer for account management."""

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.odm.user import UserDocument
from app.auth.passwords import verify_password, hash_password


class AccountService:
    """Service for account management."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def update_profile(
        self,
        user: UserDocument,
        first_name: str = None,
        last_name: str = None,
        department: str = None,
        phone_number: str = None,
    ) -> UserDocument:
        """Update user profile."""
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if department is not None:
            user.department = department
        if phone_number is not None:
            user.phone_number = phone_number

        await user.save()
        return user

    async def change_password(
        self,
        user: UserDocument,
        current_password: str,
        new_password: str,
    ) -> dict:
        """Change user password."""
        # Verify current password
        if not user.password_hash or not verify_password(current_password, user.password_hash):
            return {"error": "Current password is incorrect", "status": 400}

        # Validate new password
        if len(new_password) < 8:
            return {"error": "Password must be at least 8 characters", "status": 400}

        # Update password
        user.password_hash = hash_password(new_password)
        await user.save()

        return {"message": "Password changed successfully"}
