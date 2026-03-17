"""
Blocked Email Domains

Provides blocklist functionality for email domain validation.
This is a minimal implementation for the core platform template.

Customize this file to add blocked domains as needed:
- Disposable email domains
- Free email providers
- Temporary email services
"""

from typing import Optional, Tuple, Set

# Blocked domains by category
# Extend these sets as needed for your use case
DISPOSABLE_DOMAINS: Set[str] = {
    "mailinator.com",
    "guerrillamail.com",
    "tempmail.com",
    "throwaway.email",
    "temp-mail.org",
    "10minutemail.com",
}

FREE_EMAIL_DOMAINS: Set[str] = set()
# To block free email providers, add them here:
# FREE_EMAIL_DOMAINS = {
#     "gmail.com",
#     "yahoo.com",
#     "hotmail.com",
#     "outlook.com",
# }

# Combined blocklist
BLOCKED_DOMAINS: Set[str] = DISPOSABLE_DOMAINS | FREE_EMAIL_DOMAINS


def is_domain_in_blocklist(domain: str) -> bool:
    """
    Check if a domain is in the blocklist.

    Args:
        domain: Email domain to check (lowercase)

    Returns:
        True if domain is blocked
    """
    domain = domain.lower().strip()
    return domain in BLOCKED_DOMAINS


def get_domain_category(domain: str) -> Optional[str]:
    """
    Get the category of a blocked domain.

    Args:
        domain: Email domain to check

    Returns:
        Category name if blocked, None otherwise
    """
    domain = domain.lower().strip()

    if domain in DISPOSABLE_DOMAINS:
        return "disposable"
    if domain in FREE_EMAIL_DOMAINS:
        return "free_email"

    return None


async def is_domain_blocked_combined(domain: str) -> Tuple[bool, Optional[str]]:
    """
    Check if domain is blocked (basic blocklist + database custom blocklist).

    Args:
        domain: Email domain to check

    Returns:
        Tuple of (is_blocked, source) where source is "basic" or "custom"
    """
    domain = domain.lower().strip()

    # Check basic blocklist
    if is_domain_in_blocklist(domain):
        return True, "basic"

    # TODO: Add database custom blocklist check if needed
    # Example:
    # from app.core.database import get_database
    # db = get_database()
    # custom_blocklist = await db.config.find_one({"key": "domain_blocklist"})
    # if custom_blocklist and domain in custom_blocklist.get("domains", []):
    #     return True, "custom"

    return False, None
