"""
Email Service.

Provides high-level email sending functions using configured provider.
"""

import os
from typing import Optional

from loguru import logger

from .providers import get_provider, EmailProvider


# Email configuration (set via environment variables)
EMAIL_PROVIDER = os.environ.get("EMAIL_PROVIDER", "console")  # console, smtp, resend
EMAIL_FROM = os.environ.get("EMAIL_FROM", "noreply@example.com")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "SAIL Starter Kit")

# Cached provider instance
_provider: Optional[EmailProvider] = None


def get_email_provider() -> EmailProvider:
    """Get the configured email provider (cached)."""
    global _provider
    if _provider is None:
        _provider = get_provider(EMAIL_PROVIDER)
        logger.info(f"Email provider initialized: {_provider.name}")
    return _provider


async def send_email(
    to_email: str,
    subject: str,
    body_html: str,
    body_text: Optional[str] = None,
    from_email: Optional[str] = None,
    from_name: Optional[str] = None,
) -> bool:
    """
    Send an email using the configured provider.

    Args:
        to_email: Recipient email address
        subject: Email subject line
        body_html: HTML body content
        body_text: Plain text body (optional)
        from_email: Override default from email
        from_name: Override default from name

    Returns:
        True if email was sent successfully, False otherwise
    """
    provider = get_email_provider()

    return await provider.send(
        to_email=to_email,
        subject=subject,
        body_html=body_html,
        body_text=body_text,
        from_email=from_email or EMAIL_FROM,
        from_name=from_name or EMAIL_FROM_NAME,
    )


async def send_otp_email(email: str, otp: str, purpose: str = "verify") -> bool:
    """
    Send an OTP email for authentication.

    Args:
        email: Recipient email address
        otp: The one-time password
        purpose: Email purpose - "signup", "login", "reset", or "verify"

    Returns:
        True if email was sent successfully
    """
    subjects = {
        "signup": "Verify your email",
        "login": "Your login code",
        "reset": "Reset your password",
        "verify": "Your verification code",
    }

    subject = subjects.get(purpose, "Your verification code")
    app_name = EMAIL_FROM_NAME

    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 32px 40px; text-align: center;">
                                <h1 style="margin: 0; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600;">
                                    {app_name}
                                </h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="margin: 0 0 16px 0; color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 600;">
                                    {subject}
                                </h2>
                                <p style="margin: 0 0 24px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6;">
                                    Use the code below to complete your request. This code will expire in 10 minutes.
                                </p>
                                <!-- OTP Code -->
                                <div style="background: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                                    <span style="font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #18181b;">
                                        {otp}
                                    </span>
                                </div>
                                <p style="margin: 0; color: #71717a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px;">
                                    If you didn't request this code, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                                <p style="margin: 0; color: #a1a1aa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; text-align: center;">
                                    &copy; {app_name}. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    body_text = f"""
{subject}

Your verification code is: {otp}

This code will expire in 10 minutes.

If you didn't request this code, you can safely ignore this email.

---
{app_name}
    """

    return await send_email(email, subject, body_html, body_text)


async def send_invitation_email(
    email: str,
    invitation_url: str,
    inviter_name: str,
    company_name: Optional[str] = None,
) -> bool:
    """
    Send a team invitation email.

    Args:
        email: Recipient email address
        invitation_url: URL to accept the invitation
        inviter_name: Name of the person who sent the invitation
        company_name: Optional company/organization name

    Returns:
        True if email was sent successfully
    """
    app_name = EMAIL_FROM_NAME
    subject = f"You've been invited to join {company_name or app_name}"

    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 32px 40px; text-align: center;">
                                <h1 style="margin: 0; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600;">
                                    {app_name}
                                </h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="margin: 0 0 16px 0; color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 600;">
                                    You're invited!
                                </h2>
                                <p style="margin: 0 0 24px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6;">
                                    <strong>{inviter_name}</strong> has invited you to join <strong>{company_name or app_name}</strong>.
                                </p>
                                <!-- CTA Button -->
                                <div style="text-align: center; margin: 0 0 24px 0;">
                                    <a href="{invitation_url}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600;">
                                        Accept Invitation
                                    </a>
                                </div>
                                <p style="margin: 0 0 16px 0; color: #71717a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px;">
                                    This invitation will expire in 24 hours.
                                </p>
                                <p style="margin: 0; color: #71717a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px;">
                                    If you didn't expect this invitation, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                                <p style="margin: 0; color: #a1a1aa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; text-align: center;">
                                    &copy; {app_name}. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    body_text = f"""
You're invited!

{inviter_name} has invited you to join {company_name or app_name}.

Accept your invitation: {invitation_url}

This invitation will expire in 24 hours.

If you didn't expect this invitation, you can safely ignore this email.

---
{app_name}
    """

    return await send_email(email, subject, body_html, body_text)


async def send_welcome_email(email: str, first_name: Optional[str] = None) -> bool:
    """
    Send a welcome email after successful verification.

    Args:
        email: Recipient email address
        first_name: User's first name (optional)

    Returns:
        True if email was sent successfully
    """
    app_name = EMAIL_FROM_NAME
    subject = f"Welcome to {app_name}!"
    greeting = f"Hi {first_name}" if first_name else "Hi there"

    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 32px 40px; text-align: center;">
                                <h1 style="margin: 0; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600;">
                                    {app_name}
                                </h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="margin: 0 0 16px 0; color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 600;">
                                    {greeting}! 🎉
                                </h2>
                                <p style="margin: 0 0 16px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6;">
                                    Welcome to {app_name}! Your account has been successfully verified and you're all set to get started.
                                </p>
                                <p style="margin: 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6;">
                                    If you have any questions, feel free to reach out to our support team.
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                                <p style="margin: 0; color: #a1a1aa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; text-align: center;">
                                    &copy; {app_name}. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    body_text = f"""
{greeting}!

Welcome to {app_name}! Your account has been successfully verified and you're all set to get started.

If you have any questions, feel free to reach out to our support team.

---
{app_name}
    """

    return await send_email(email, subject, body_html, body_text)
