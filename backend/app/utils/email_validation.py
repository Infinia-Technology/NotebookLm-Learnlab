"""
Email Validation Utilities

This module provides functions for validating email addresses,
specifically for checking if email domains are allowed for
registration and login.

Supports two blocklist sources:
1. BASIC (hardcoded): ~400+ domains in blocked_domains.py
2. CUSTOM (database): Domains from admin config (domain_blocklist)
"""

import re
from typing import NamedTuple, Optional

from .blocked_domains import (
    is_domain_in_blocklist,
    get_domain_category,
    is_domain_blocked_combined,
)
from app.core.config import settings


class EmailValidationResult(NamedTuple):
    """Result of email validation."""

    is_valid: bool
    error_message: Optional[str]
    domain: Optional[str]
    category: Optional[str]  # Category of blocked domain if blocked


# Email regex pattern for basic validation
EMAIL_PATTERN = re.compile(
    r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
)


def get_email_domain(email: str) -> Optional[str]:
    """
    Extract the domain from an email address.

    Args:
        email: Email address string

    Returns:
        Domain part of the email (lowercase) or None if invalid
    """
    if not email or "@" not in email:
        return None
    try:
        _, domain = email.rsplit("@", 1)
        return domain.lower().strip()
    except ValueError:
        return None


def is_valid_email_format(email: str) -> bool:
    """
    Check if email has a valid format.

    Args:
        email: Email address string

    Returns:
        True if email format is valid
    """
    if not email:
        return False
    return bool(EMAIL_PATTERN.match(email.strip()))


def is_email_domain_blocked(email: str) -> bool:
    """
    Check if the email domain is in the blocklist.

    Args:
        email: Email address string

    Returns:
        True if domain is blocked, False otherwise
    """
    domain = get_email_domain(email)
    if not domain:
        return False
    return is_domain_in_blocklist(domain)


def validate_email_for_auth(email: str) -> EmailValidationResult:
    """
    Validate an email address for authentication (signup/login).

    This performs full validation including:
    1. Email format validation
    2. Domain blocklist check

    Args:
        email: Email address to validate

    Returns:
        EmailValidationResult with validation status and error details
    """
    # Basic format validation
    if not email:
        return EmailValidationResult(
            is_valid=False,
            error_message="Email address is required.",
            domain=None,
            category=None,
        )

    email = email.strip().lower()

    if not is_valid_email_format(email):
        return EmailValidationResult(
            is_valid=False,
            error_message="Please enter a valid email address.",
            domain=None,
            category=None,
        )

    # Extract domain
    domain = get_email_domain(email)
    if not domain:
        return EmailValidationResult(
            is_valid=False,
            error_message="Please enter a valid email address.",
            domain=None,
            category=None,
        )

    # Check blocklist
    if is_domain_in_blocklist(domain):
        category = get_domain_category(domain)
        return EmailValidationResult(
            is_valid=False,
            error_message="This email domain is not allowed. Please use your corporate email address.",
            domain=domain,
            category=category,
        )

    # All validations passed
    return EmailValidationResult(
        is_valid=True,
        error_message=None,
        domain=domain,
        category=None,
    )


async def validate_email_for_auth_async(email: str) -> EmailValidationResult:
    """
    Async version of email validation with blocklist support.

    Validation logic:
    1. Email format validation
    2. Check blocklist (basic + custom)

    Args:
        email: Email address to validate

    Returns:
        EmailValidationResult with validation status and error details
    """
    # Basic format validation
    if not email:
        return EmailValidationResult(
            is_valid=False,
            error_message="Email address is required.",
            domain=None,
            category=None,
        )

    email = email.strip().lower()

    if not is_valid_email_format(email):
        return EmailValidationResult(
            is_valid=False,
            error_message="Please enter a valid email address.",
            domain=None,
            category=None,
        )

    # Extract domain
    domain = get_email_domain(email)
    if not domain:
        return EmailValidationResult(
            is_valid=False,
            error_message="Please enter a valid email address.",
            domain=None,
            category=None,
        )

    # Check blocklist (basic + custom)
    # Skip if ALLOW_ALL_EMAIL_DOMAINS is enabled
    if settings.ALLOW_ALL_EMAIL_DOMAINS:
        return EmailValidationResult(
            is_valid=True,
            error_message=None,
            domain=domain,
            category=None,
        )

    is_blocked, source = await is_domain_blocked_combined(domain)
    if is_blocked:
        category = get_domain_category(domain) if source == "basic" else "custom"
        return EmailValidationResult(
            is_valid=False,
            error_message="This email domain is not allowed. Please use your corporate email address.",
            domain=domain,
            category=category,
        )

    # All validations passed
    return EmailValidationResult(
        is_valid=True,
        error_message=None,
        domain=domain,
        category=None,
    )
