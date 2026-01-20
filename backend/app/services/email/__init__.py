"""
Email Service with Multiple Provider Support.

Supports:
- console: Development mode - logs emails instead of sending
- smtp: Basic SMTP - works with any SMTP server (Gmail, Outlook, etc.)
- resend: Resend API - modern transactional email service

Usage:
    from app.services.email import send_email, send_otp_email

Configuration (via environment variables):
    EMAIL_PROVIDER=smtp|resend|console
    EMAIL_FROM=noreply@example.com
    EMAIL_FROM_NAME=My App

    # For SMTP:
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=your@email.com
    SMTP_PASSWORD=your-app-password
    SMTP_USE_TLS=true

    # For Resend:
    RESEND_API_KEY=re_xxxxx
"""

from .service import (
    send_email,
    send_otp_email,
    send_invitation_email,
    get_email_provider,
    EMAIL_FROM,
    EMAIL_FROM_NAME,
)

__all__ = [
    "send_email",
    "send_otp_email",
    "send_invitation_email",
    "get_email_provider",
    "EMAIL_FROM",
    "EMAIL_FROM_NAME",
]
