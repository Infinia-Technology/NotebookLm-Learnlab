"""
Rate limiting utility using Redis.

Provides simple IP-based rate limiting for sensitive endpoints.
"""

import redis.asyncio as redis
from fastapi import Request, HTTPException
from loguru import logger

from app.core.config import settings

# Rate limit settings
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 100  # Increased for development

_redis_client = None


async def get_redis():
    """Get or create Redis client."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


def get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies."""
    # Check X-Forwarded-For header (from nginx/proxy)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # First IP in the chain is the original client
        return forwarded.split(",")[0].strip()

    # Check X-Real-IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # Fall back to direct client IP
    return request.client.host if request.client else "unknown"


async def check_rate_limit(
    request: Request,
    key_prefix: str = "auth",
    max_requests: int = RATE_LIMIT_MAX_REQUESTS,
    window_seconds: int = RATE_LIMIT_WINDOW,
):
    """
    Check rate limit for a request.

    Args:
        request: FastAPI request object
        key_prefix: Prefix for Redis key (e.g., "auth", "login")
        max_requests: Maximum requests allowed in window
        window_seconds: Time window in seconds

    Raises:
        HTTPException: If rate limit exceeded (429 Too Many Requests)
    """
    try:
        client = await get_redis()
        ip = get_client_ip(request)
        key = f"rate_limit:{key_prefix}:{ip}"

        # Get current count
        current = await client.get(key)

        if current is None:
            # First request - set counter with expiry
            await client.setex(key, window_seconds, 1)
        elif int(current) >= max_requests:
            # Rate limit exceeded
            ttl = await client.ttl(key)
            logger.warning(f"Rate limit exceeded for IP {ip} on {key_prefix}")
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Please try again in {ttl} seconds."
            )
        else:
            # Increment counter
            await client.incr(key)

    except redis.RedisError as e:
        # If Redis is down, log warning but don't block the request
        logger.warning(f"Redis error in rate limiting: {e}")
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log other errors but don't block
        logger.error(f"Rate limit check error: {e}")
