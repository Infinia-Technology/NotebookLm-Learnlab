"""
JWT Token Management

Handles creation and verification of JWT tokens for authentication.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from pydantic import BaseModel

from app.core.config import settings

# Configuration from settings
SECRET_KEY = settings.JWT_SECRET
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_DAYS = settings.JWT_EXPIRE_DAYS


class TokenData(BaseModel):
    """Data encoded in JWT token."""
    user_id: str
    email: str
    role: Optional[str] = None  # Can be None for users without system role
    exp: datetime


class TokenResponse(BaseModel):
    """Response returned after successful login."""
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    user: dict


def create_access_token(
    user_id: str,
    email: str,
    role: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> tuple[str, datetime]:
    """
    Create a JWT access token.

    Returns:
        tuple of (token_string, expiration_datetime)
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)

    to_encode = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": expire,
        "iat": datetime.utcnow(),
    }

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, expire


def verify_token(token: str) -> Optional[TokenData]:
    """
    Verify a JWT token and extract its data.

    Returns:
        TokenData if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        exp: int = payload.get("exp")

        if user_id is None:
            return None

        return TokenData(
            user_id=user_id,
            email=email,
            role=role,
            exp=datetime.fromtimestamp(exp),
        )
    except JWTError:
        return None


def decode_token(token: str) -> dict:
    """
    Decode a JWT token without verification.
    Useful for debugging or extracting data from expired tokens.
    """
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
    except JWTError:
        return {}
