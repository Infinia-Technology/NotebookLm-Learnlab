"""
Application configuration.

Uses Pydantic settings for type-safe configuration from environment variables.
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator, ConfigDict
from functools import lru_cache
import json
import sys


class Settings(BaseSettings):
    """
    Application settings.

    Sensitive values MUST be provided via .env file.
    Non-sensitive values have sensible defaults.
    """

    # ==========================================================================
    # Application Settings
    # ==========================================================================
    APP_NAME: str = "EleVatria"
    DEBUG: bool = False

    # ==========================================================================
    # MongoDB - REQUIRED
    # ==========================================================================
    MONGO_URI: str = ""  # Required - must be in .env
    MONGO_DB: str = "app_database"

    # ==========================================================================
    # Redis - Optional for caching
    # ==========================================================================
    REDIS_URL: str = "redis://localhost:6379"

    # ==========================================================================
    # JWT Authentication - REQUIRED
    # ==========================================================================
    JWT_SECRET: str = ""  # Required - must be in .env (use: openssl rand -hex 32)
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7

    # ==========================================================================
    # Admin User - For initial setup
    # ==========================================================================
    ADMIN_EMAIL: str = "rsanutopthree@gmail.com"
    ADMIN_PASSWORD: str = ""  # Required for admin user creation

    # ==========================================================================
    # CORS Configuration
    # ==========================================================================
    CORS_ORIGINS: str = '["http://localhost:3000","http://localhost:5173"]'

    # ==========================================================================
    # Frontend URL - For links in emails
    # ==========================================================================
    APP_BASE_URL: str = "http://localhost:3100"

    # ==========================================================================
    # Email Configuration
    # ==========================================================================
    # Provider: console (dev), smtp, or resend
    EMAIL_PROVIDER: str = "console"
    EMAIL_FROM: str = "noreply@example.com"
    EMAIL_FROM_NAME: str = "EleVatria"
    # Allow all domains (including disposable/test domains)
    ALLOW_ALL_EMAIL_DOMAINS: bool = True

    # SMTP settings (when EMAIL_PROVIDER=smtp)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False

    # Resend settings (when EMAIL_PROVIDER=resend)
    RESEND_API_KEY: str = ""


    @property
    def cors_origins_list(self) -> list[str]:
        return json.loads(self.CORS_ORIGINS)

    @field_validator('MONGO_URI')
    @classmethod
    def validate_mongo_uri(cls, v: str) -> str:
        if not v:
            print("\n" + "=" * 60)
            print("ERROR: MONGO_URI is required!")
            print("Please set MONGO_URI in your .env file")
            print("Example: MONGO_URI=mongodb://user:pass@host:port/db")
            print("=" * 60 + "\n")
            sys.exit(1)
        return v

    @field_validator('JWT_SECRET')
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        if not v:
            print("\n" + "=" * 60)
            print("ERROR: JWT_SECRET is required!")
            print("Please set JWT_SECRET in your .env file")
            print("Generate one with: openssl rand -hex 32")
            print("=" * 60 + "\n")
            sys.exit(1)
        if len(v) < 32:
            print("\n" + "=" * 60)
            print("WARNING: JWT_SECRET is too short (< 32 chars)")
            print("Use a longer secret for better security")
            print("=" * 60 + "\n")
        return v

    @field_validator('ADMIN_PASSWORD')
    @classmethod
    def validate_admin_password(cls, v: str) -> str:
        if not v:
            print("\n" + "=" * 60)
            print("WARNING: ADMIN_PASSWORD not set!")
            print("Default admin user will not be created.")
            print("Set ADMIN_PASSWORD in .env to enable admin user seeding.")
            print("=" * 60 + "\n")
        return v

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
