"""
Auth service.

Business logic for authentication operations.
"""

import os
import random
import uuid
from datetime import datetime, timedelta
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from loguru import logger

from pymongo.errors import DuplicateKeyError

from app.auth.jwt import create_access_token
from app.auth.passwords import hash_password, verify_password
from app.core.error_codes import ErrorCode
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    NotFoundError,
    RateLimitError,
    ValidationError,
)
from app.core.config import settings
from app.odm.domain import DomainDocument
from app.services.email import send_otp_email, send_welcome_email, send_duplicate_account_email
from app.utils.email_validation import validate_email_for_auth_async

# OTP expiry in minutes
OTP_EXPIRY_MINUTES = 5

# OTP resend cooldown in seconds (configurable via env, default 60 seconds)
OTP_RESEND_COOLDOWN_SECONDS = int(os.environ.get("OTP_RESEND_COOLDOWN_SECONDS", 60))


def generate_otp() -> str:
    """Generate a 6-digit OTP."""
    return str(random.randint(100000, 999999))


def get_email_domain(email: str) -> str:
    """Extract domain from email."""
    return email.split("@")[1] if "@" in email else ""


def check_otp_cooldown(user: dict) -> Optional[int]:
    """
    Check if user is still in OTP resend cooldown period.

    Returns:
        Remaining seconds if in cooldown, None if can resend
    """
    otp_sent_at = user.get("otp_sent_at")
    if not otp_sent_at:
        return None

    elapsed = (datetime.utcnow() - otp_sent_at).total_seconds()
    remaining = OTP_RESEND_COOLDOWN_SECONDS - elapsed

    if remaining > 0:
        return int(remaining)
    return None


class AuthService:
    """Service for authentication operations."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def _auto_link_agent(self, user: dict) -> dict:
        """
        Automatically link user to agent if email matches.

        Returns:
            {"linked": bool, "agent_uuid": str or None}
        """
        # Skip if already linked
        if user.get("linked_agent_uuid"):
            return {"linked": False, "agent_uuid": user.get("linked_agent_uuid")}

        # Find agent by email
        agent = await self.db.agents.find_one({
            "email": user["email"].lower(),
            "is_active": True
        })

        if not agent:
            return {"linked": False, "agent_uuid": None}

        agent_uuid = agent.get("uuid")

        # Link user to agent
        await self.db.users.update_one(
            {"uuid": user["uuid"]},
            {"$set": {"linked_agent_uuid": agent_uuid}}
        )

        # Link agent to user (set owner)
        await self.db.agents.update_one(
            {"uuid": agent["uuid"]},
            {"$set": {"owner_user_uuid": user["uuid"]}}
        )

        logger.info(f"Auto-linked user {user['email']} to agent {agent_uuid}")

        return {"linked": True, "agent_uuid": agent_uuid}

    async def auto_assign_domain(self, user: dict) -> Optional[dict]:
        """Auto-assign user to a domain based on email domain."""
        email_domain = get_email_domain(user.get("email", ""))

        if not email_domain:
            return None

        # Find matching domain
        domain = await self.db.domains.find_one({
            "domain": email_domain.lower(),
            "is_active": True
        })

        if not domain:
            logger.info(f"No matching domain found for {email_domain}")
            return None

        # Assign domain to user with "member" role
        await self.db.users.update_one(
            {"uuid": user["uuid"]},
            {"$set": {
                "domain_uuid": domain["uuid"],
                "domain_role": "member"
            }}
        )

        logger.info(f"Auto-assigned user {user.get('email')} to domain {domain.get('domain')}")
        return domain

    async def _get_user_access(self, user_uuid: str) -> dict | None:
        """Get user's access from user_access collection."""
        access_doc = await self.db.user_access.find_one({"user_uuid": user_uuid})
        if not access_doc:
            return None

        companies = [
            {
                "uuid": c.get("uuid", ""),
                "role": c.get("role", "viewer"),
                "cascade": c.get("cascade", True)
            }
            for c in access_doc.get("companies", [])
        ]
        return {
            "companies": companies,
            "primary_company_uuid": access_doc.get("primary_company_uuid")
        }

    async def login(self, email: str, password: str) -> dict:
        """Authenticate user and return token."""
        # Validate email domain (checks both basic and custom blocklists)
        validation = await validate_email_for_auth_async(email)
        if not validation.is_valid:
            raise ValidationError(
                message=validation.error_message,
                code=ErrorCode.INVALID_EMAIL_DOMAIN
            )

        user = await self.db.users.find_one({"email": email.lower()})

        if not user:
            raise AuthenticationError(
                message="Invalid email or password",
                code=ErrorCode.INVALID_CREDENTIALS
            )

        if not user.get("password_hash") or not verify_password(password, user["password_hash"]):
            raise AuthenticationError(
                message="Invalid email or password",
                code=ErrorCode.INVALID_CREDENTIALS
            )

        if user.get("status") == "pending":
            raise AuthorizationError(
                message="Please verify your email before logging in.",
                code=ErrorCode.EMAIL_NOT_VERIFIED
            )

        if user.get("status") == "suspended":
            raise AuthorizationError(
                message="Your account has been suspended",
                code=ErrorCode.ACCOUNT_SUSPENDED
            )

        # Auto-link agent if email matches
        agent_link_result = await self._auto_link_agent(user)

        # Update last login
        await self.db.users.update_one(
            {"uuid": user["uuid"]},
            {"$set": {"last_login_at": datetime.utcnow()}}
        )

        # Re-fetch user to get updated linked_agent_uuid
        user = await self.db.users.find_one({"uuid": user["uuid"]})

        # Create token with UUID as user_id
        token, expires_at = create_access_token(
            user_id=user["uuid"],
            email=user["email"],
            role=user.get("role", "viewer"),
        )

        # Get access from user_access collection
        access = await self._get_user_access(user["uuid"])

        # Get enabled modules from domain
        enabled_modules = []
        if user.get("domain_uuid"):
            domain = await DomainDocument.find_by_uuid(user["domain_uuid"])
            if domain:
                enabled_modules = domain.enabled_modules

        return {
            "access_token": token,
            "expires_at": expires_at,
            "user": {
                "uuid": user["uuid"],
                "email": user["email"],
                "role": user.get("role"),  # System role (super_admin, super_viewer, or None)
                "status": user.get("status"),
                "first_name": user.get("first_name"),
                "last_name": user.get("last_name"),
                "department": user.get("department"),
                "linked_agent_uuid": user.get("linked_agent_uuid"),
                "domain_uuid": user.get("domain_uuid"),
                "domain_role": user.get("domain_role"),
                "enabled_modules": enabled_modules,
                "access": access,
                "created_at": user.get("created_at"),
                "last_login_at": user.get("last_login_at"),
            },
            "agent_linked": agent_link_result.get("linked", False),
        }

    async def signup(self, email: str, password: str, first_name: Optional[str], last_name: Optional[str]) -> dict:
        """Create a new user account."""
        # Validate email domain (checks both basic and custom blocklists)
        validation = await validate_email_for_auth_async(email)
        if not validation.is_valid:
            raise ValidationError(
                message=validation.error_message,
                code=ErrorCode.INVALID_EMAIL_DOMAIN
            )

        existing = await self.db.users.find_one({"email": email.lower()})

        if existing:
            # Send duplicate account email
            await send_duplicate_account_email(email, existing.get("first_name"))
            
            raise ConflictError(
                message="Email already registered",
                code=ErrorCode.EMAIL_ALREADY_EXISTS
            )

        password_hash = hash_password(password)
        otp = generate_otp()
        now = datetime.utcnow()
        otp_expires = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

        user = {
            "uuid": str(uuid.uuid4()),
            "email": email.lower(),
            "password_hash": password_hash,
            "first_name": first_name,
            "last_name": last_name,
            "role": None,  # System role (super_admin, super_viewer, or None)
            "status": "pending",
            "otp": otp,
            "otp_expires_at": otp_expires,
            "otp_sent_at": now,
            "otp_verified": False,
            "otp_attempts": 0,
            "created_at": now,
            "updated_at": now,
        }

        try:
            await self.db.users.insert_one(user)
        except DuplicateKeyError:
            # Race condition: another request created this user between our check and insert
            raise ConflictError(
                message="Email already registered",
                code=ErrorCode.EMAIL_ALREADY_EXISTS
            )

        try:
            await send_otp_email(email, otp, "signup")
        except Exception as e:
            logger.error(f"Failed to send signup OTP to {email}: {e}")
            # Continue execution so signup doesn't fail
            # OTP will still be logged by the email service if configured

        return {
            "message": "Account created. Please verify your email with the OTP sent.",
            "email": email,
        }

    async def verify_otp(self, email: str, otp: str) -> dict:
        """Verify OTP and activate account."""
        user = await self.db.users.find_one({"email": email.lower()})

        if not user:
            raise NotFoundError(
                message="User not found",
                code=ErrorCode.USER_NOT_FOUND
            )

        # Master OTP for demo/testing
        if otp == "123456":
            pass # Skip OTP check if master code is used
        elif user.get("otp_attempts", 0) >= 5:
            raise RateLimitError(
                message="Too many failed attempts. Please request a new code.",
                code=ErrorCode.RATE_LIMIT_EXCEEDED
            )
        elif user.get("otp") != otp:
            # Increment attempts
            await self.db.users.update_one(
                {"uuid": user["uuid"]},
                {"$inc": {"otp_attempts": 1}}
            )
            raise ValidationError(
                message="Invalid OTP",
                code=ErrorCode.INVALID_OTP
            )
        elif user.get("otp_expires_at") and datetime.utcnow() > user["otp_expires_at"]:
            raise ValidationError(
                message="OTP has expired",
                code=ErrorCode.OTP_EXPIRED
            )

        # Activate user
        await self.db.users.update_one(
            {"uuid": user["uuid"]},
            {"$set": {
                "status": "active",
                "otp_verified": True,
                "otp": None,
                "otp_expires_at": None,
                "otp_sent_at": None,
                "last_login_at": datetime.utcnow(),
            }}
        )

        # Send welcome email
        try:
            await send_welcome_email(user["email"], user.get("first_name"))
        except Exception as e:
            logger.error(f"Failed to send welcome email to {user['email']}: {e}")

        await self.auto_assign_domain(user)

        # Re-fetch user
        user = await self.db.users.find_one({"uuid": user["uuid"]})

        # Auto-link agent if email matches
        agent_link_result = await self._auto_link_agent(user)

        # Re-fetch user again to get linked_agent_uuid
        user = await self.db.users.find_one({"uuid": user["uuid"]})

        # Create token with UUID as user_id
        token, expires_at = create_access_token(
            user_id=user["uuid"],
            email=user["email"],
            role=user.get("role", "viewer"),
        )

        # Get access from user_access collection
        access = await self._get_user_access(user["uuid"])

        # Get enabled modules from domain
        enabled_modules = []
        if user.get("domain_uuid"):
            domain = await DomainDocument.find_by_uuid(user["domain_uuid"])
            if domain:
                enabled_modules = domain.enabled_modules

        return {
            "access_token": token,
            "expires_at": expires_at,
            "user": {
                "uuid": user["uuid"],
                "email": user["email"],
                "role": user.get("role"),  # System role (super_admin, super_viewer, or None)
                "status": user.get("status"),
                "first_name": user.get("first_name"),
                "last_name": user.get("last_name"),
                "department": user.get("department"),
                "linked_agent_uuid": user.get("linked_agent_uuid"),
                "domain_uuid": user.get("domain_uuid"),
                "domain_role": user.get("domain_role"),
                "enabled_modules": enabled_modules,
                "access": access,
                "created_at": user.get("created_at"),
                "last_login_at": user.get("last_login_at"),
            },
            "agent_linked": agent_link_result.get("linked", False),
        }

    async def forgot_password(self, email: str) -> dict:
        """Request password reset."""
        # Validate email domain (checks both basic and custom blocklists)
        validation = await validate_email_for_auth_async(email)
        if not validation.is_valid:
            raise ValidationError(
                message=validation.error_message,
                code=ErrorCode.INVALID_EMAIL_DOMAIN
            )

        user = await self.db.users.find_one({"email": email.lower()})

        if not user:
            return {"message": "If the email exists, an OTP has been sent."}

        # Don't allow password reset for suspended users
        if user.get("status") == "suspended":
            raise AuthorizationError(
                message="Your account has been suspended",
                code=ErrorCode.ACCOUNT_SUSPENDED
            )

        # Check cooldown
        remaining = check_otp_cooldown(user)
        if remaining:
            raise RateLimitError(
                message=f"Please wait {remaining} seconds before requesting another code.",
                retry_after=remaining,
                code=ErrorCode.OTP_COOLDOWN
            )

        otp = generate_otp()
        now = datetime.utcnow()
        otp_expires = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

        await self.db.users.update_one(
            {"uuid": user["uuid"]},
            {"$set": {
                "otp": otp,
                "otp_expires_at": otp_expires,
                "otp_sent_at": now
            }}
        )

        await send_otp_email(email, otp, "reset")

        return {"message": "If the email exists, an OTP has been sent."}

    async def reset_password(self, email: str, otp: str, new_password: str) -> dict:
        """Reset password using OTP."""
        user = await self.db.users.find_one({"email": email.lower()})

        if not user:
            raise NotFoundError(
                message="User not found",
                code=ErrorCode.USER_NOT_FOUND
            )

        # Don't allow password reset for suspended users
        if user.get("status") == "suspended":
            raise AuthorizationError(
                message="Your account has been suspended",
                code=ErrorCode.ACCOUNT_SUSPENDED
            )

        if MASTER_OTP and otp == MASTER_OTP:
            pass
        elif user.get("otp") != otp:
            raise ValidationError(
                message="Invalid OTP",
                code=ErrorCode.INVALID_OTP
            )
        elif user.get("otp_expires_at") and datetime.utcnow() > user["otp_expires_at"]:
            raise ValidationError(
                message="OTP has expired",
                code=ErrorCode.OTP_EXPIRED
            )

        # Update password and activate if pending (OTP verifies email)
        update_fields = {
            "password_hash": hash_password(new_password),
            "otp": None,
            "otp_expires_at": None,
            "otp_sent_at": None,
        }

        # If user was pending (e.g., invited user), activate them
        if user.get("status") == "pending":
            update_fields["status"] = "active"
            update_fields["otp_verified"] = True

        await self.db.users.update_one(
            {"uuid": user["uuid"]},
            {"$set": update_fields}
        )

        return {"message": "Password reset successfully"}

    async def resend_otp(self, email: str) -> dict:
        """Resend OTP for email verification or password reset."""
        user = await self.db.users.find_one({"email": email.lower()})

        if not user:
            return {"message": "If the email exists, an OTP has been sent."}

        # Don't allow OTP resend for suspended users
        if user.get("status") == "suspended":
            raise AuthorizationError(
                message="Your account has been suspended",
                code=ErrorCode.ACCOUNT_SUSPENDED
            )

        # Check cooldown
        remaining = check_otp_cooldown(user)
        if remaining:
            raise RateLimitError(
                message=f"Please wait {remaining} seconds before requesting another code.",
                retry_after=remaining,
                code=ErrorCode.OTP_COOLDOWN
            )

        otp = generate_otp()
        now = datetime.utcnow()
        otp_expires = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

        await self.db.users.update_one(
            {"uuid": user["uuid"]},
            {"$set": {
                "otp": otp,
                "otp_expires_at": otp_expires,
                "otp_sent_at": now,
                "otp_attempts": 0
            }}
        )

        purpose = "signup" if user.get("status") == "pending" else "verify"
        await send_otp_email(email, otp, purpose)

        return {"message": "OTP has been sent to your email."}

    async def request_login_otp(self, email: str) -> dict:
        """Send OTP for passwordless login."""
        # Validate email domain (checks both basic and custom blocklists)
        validation = await validate_email_for_auth_async(email)
        if not validation.is_valid:
            raise ValidationError(
                message=validation.error_message,
                code=ErrorCode.INVALID_EMAIL_DOMAIN
            )

        user = await self.db.users.find_one({"email": email.lower()})

        if not user:
            raise NotFoundError(
                message="We couldn't find an account with that email.",
                code=ErrorCode.USER_NOT_FOUND
            )

        if user.get("status") == "suspended":
            raise AuthorizationError(
                message="Your account has been suspended",
                code=ErrorCode.ACCOUNT_SUSPENDED
            )

        if user.get("status") == "pending":
            raise AuthorizationError(
                message="Please verify your account first",
                code=ErrorCode.ACCOUNT_PENDING
            )

        # Check cooldown
        remaining = check_otp_cooldown(user)
        if remaining:
            raise RateLimitError(
                message=f"Please wait {remaining} seconds before requesting another code.",
                retry_after=remaining,
                code=ErrorCode.OTP_COOLDOWN
            )

        otp = generate_otp()
        now = datetime.utcnow()
        otp_expires = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

        await self.db.users.update_one(
            {"uuid": user["uuid"]},
            {"$set": {
                "otp": otp,
                "otp_expires_at": otp_expires,
                "otp_sent_at": now
            }}
        )

        await send_otp_email(email, otp, "login")

        return {"message": "Code sent to your email."}

    async def verify_login_otp(self, email: str, otp: str) -> dict:
        """Verify OTP and log user in (passwordless)."""
        user = await self.db.users.find_one({"email": email.lower()})

        if not user:
            raise AuthenticationError(
                message="Invalid email or OTP",
                code=ErrorCode.INVALID_CREDENTIALS
            )

        if user.get("status") == "suspended":
            raise AuthorizationError(
                message="Your account has been suspended",
                code=ErrorCode.ACCOUNT_SUSPENDED
            )

        if user.get("status") == "pending":
            raise AuthorizationError(
                message="Please verify your account first",
                code=ErrorCode.ACCOUNT_PENDING
            )

        if user.get("otp") != otp:
            raise AuthenticationError(
                message="Invalid email or OTP",
                code=ErrorCode.INVALID_OTP
            )
        elif user.get("otp_expires_at") and datetime.utcnow() > user["otp_expires_at"]:
            raise ValidationError(
                message="OTP has expired",
                code=ErrorCode.OTP_EXPIRED
            )

        # Clear OTP and update login
        await self.db.users.update_one(
            {"uuid": user["uuid"]},
            {"$set": {
                "otp": None,
                "otp_expires_at": None,
                "otp_sent_at": None,
                "last_login_at": datetime.utcnow()
            }}
        )

        # Auto-link agent if email matches
        agent_link_result = await self._auto_link_agent(user)

        # Re-fetch user to get updated linked_agent_uuid
        user = await self.db.users.find_one({"uuid": user["uuid"]})

        # Create token with UUID as user_id
        token, expires_at = create_access_token(
            user_id=user["uuid"],
            email=user["email"],
            role=user.get("role", "viewer"),
        )

        # Get access from user_access collection
        access = await self._get_user_access(user["uuid"])

        # Get enabled modules from domain
        enabled_modules = []
        if user.get("domain_uuid"):
            domain = await DomainDocument.find_by_uuid(user["domain_uuid"])
            if domain:
                enabled_modules = domain.enabled_modules

        return {
            "access_token": token,
            "expires_at": expires_at,
            "user": {
                "uuid": user["uuid"],
                "email": user["email"],
                "role": user.get("role"),  # System role (super_admin, super_viewer, or None)
                "status": user.get("status"),
                "first_name": user.get("first_name"),
                "last_name": user.get("last_name"),
                "department": user.get("department"),
                "linked_agent_uuid": user.get("linked_agent_uuid"),
                "domain_uuid": user.get("domain_uuid"),
                "domain_role": user.get("domain_role"),
                "enabled_modules": enabled_modules,
                "access": access,
            },
            "agent_linked": agent_link_result.get("linked", False),
        }
