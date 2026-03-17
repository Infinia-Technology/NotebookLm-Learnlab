"""
Email Service.

Provides high-level email sending functions using configured provider.
"""

import os
from typing import Optional
from datetime import datetime

from loguru import logger

from .providers import get_provider, EmailProvider


# Email configuration (set via environment variables)
EMAIL_PROVIDER = os.environ.get("EMAIL_PROVIDER", "console")  # console, smtp, resend
EMAIL_FROM = os.environ.get("EMAIL_FROM", "noreply@example.com")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "EleVatria")

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
    attachments: Optional[list[dict[str, str | bytes]]] = None,
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
        attachments: List of dicts with keys: filename, content, content_type

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
        attachments=attachments,
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
    
    # FAIL-SAFE: Write OTP to local file
    try:
        with open("OTP_LOG.txt", "a") as f:
            f.write(f"[{datetime.utcnow()}] Email: {email} | OTP: {otp} | Purpose: {purpose}\n")
    except Exception as e:
        logger.error(f"Failed to write OTP to log file: {e}")

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
                                    Use the code below to complete your request. This code will expire in 5 minutes.
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

This code will expire in 5 minutes.

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


async def send_quiz_completion_email(
    email: str,
    quiz_title: str,
    score: float,
    total_questions: int,
    passed: bool = True
) -> bool:
    """
    Send an email notification with the quiz score.

    Args:
        email: Recipient email address
        quiz_title: Title of the quiz
        score: The score achieved (can be percentage or raw score)
        total_questions: Total number of questions
        passed: Whether the user passed the quiz (if applicable)

    Returns:
        True if email was sent successfully
    """
    app_name = EMAIL_FROM_NAME
    
    is_exam = "exam" in quiz_title.lower()
    type_label = "Exam" if is_exam else "Quiz"
    
    if passed:
        subject = f"Great job! You've completed your {type_label}: {quiz_title} 🎉"
        header_color = "linear-gradient(135deg, #10b981 0%, #059669 100%)"
        status_text = f"{type_label} Completed!"
        emoji = "🎓" if is_exam else "🌟"
    else:
        subject = f"{type_label} Results: {quiz_title}"
        header_color = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
        status_text = f"{type_label} Results"
        emoji = "📝"

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
                            <td style="background: {header_color}; padding: 32px 40px; text-align: center;">
                                <h1 style="margin: 0; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600;">
                                    {app_name}
                                </h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="margin: 0 0 16px 0; color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 600;">
                                    {status_text} {emoji}
                                </h2>
                                <p style="margin: 0 0 24px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6;">
                                    You have successfully completed the <strong>{quiz_title}</strong>{f' {type_label.lower()}' if type_label.lower() not in quiz_title.lower() else ''}.
                                </p>
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                                    <p style="margin: 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Score</p>
                                    <h3 style="margin: 0; color: #1e293b; font-size: 36px; font-weight: 700;">{score}/{total_questions}</h3>
                                </div>
                                <p style="margin: 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6;">
                                    {"Check your dashboard to claim your certificate!" if is_exam and passed else "Keep up the momentum in your learning journey!"}
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
{status_text} {emoji}

You have completed the {quiz_title}{f' {type_label.lower()}' if type_label.lower() not in quiz_title.lower() else ''} with a score of {score}/{total_questions}.

{"Visit the dashboard to claim your certificate!" if is_exam and passed else "Keep up the great work!"}

---
{app_name}
    """

    return await send_email(email, subject, body_html, body_text)


async def send_certification_email(
    email: str,
    course_name: str,
    user_name: str,
    date: str,
    is_supervisor: bool = False
) -> bool:
    """
    Send a certificate of completion email.

    Args:
        email: Recipient email address
        course_name: Name of the completed course
        user_name: Name of the user
        date: Completion date
        is_supervisor: If True, customizes message for supervisor recipient

    Returns:
        True if email was sent successfully
    """
    app_name = EMAIL_FROM_NAME
    
    if is_supervisor:
        subject = f"Certificate of Completion - {user_name} - {course_name}"
    else:
        subject = f"You're Certified! 🎓 {course_name} Completion"

    # Build supervisor banner separately to avoid f-string backslash issues
    supervisor_banner_html = ""
    if is_supervisor:
        supervisor_banner_html = '<p style="margin: 0 0 24px 0; color: #0284c7; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 14px; font-weight: 600; background: #f0f9ff; padding: 12px; border-radius: 8px;">This certificate has been shared with you as the supervisor/manager of the learner below.</p>'

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
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 4px solid #d4af37;">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 40px; text-align: center;">
                                <h1 style="margin: 0; color: #d4af37; font-family: 'Times New Roman', serif; font-size: 32px; font-weight: 700; letter-spacing: 2px;">
                                    CERTIFICATE
                                </h1>
                                <p style="margin: 8px 0 0 0; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                                    OF COMPLETION
                                </p>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 60px 40px; text-align: center;">
                                {supervisor_banner_html}
                                <p style="margin: 0 0 24px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px;">
                                    This certifies that
                                </p>
                                <h2 style="margin: 0 0 24px 0; color: #1e293b; font-family: 'Times New Roman', serif; font-size: 36px; font-weight: 700; border-bottom: 2px solid #e2e8f0; display: inline-block; padding-bottom: 12px;">
                                    {user_name}
                                </h2>
                                <p style="margin: 0 0 24px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px;">
                                    has successfully completed the course
                                </p>
                                <h3 style="margin: 0 0 40px 0; color: #0284c7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600;">
                                    {course_name}
                                </h3>
                                
                                <div style="display: inline-block; padding: 12px 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                                    <p style="margin: 0; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px;">
                                        Date: <strong>{date}</strong>
                                    </p>
                                </div>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="left">
                                            <p style="margin: 0; color: #a1a1aa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px;">
                                                Start your journey.
                                            </p>
                                        </td>
                                        <td align="right">
                                            <p style="margin: 0; color: #a1a1aa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 600;">
                                                {app_name}
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    if is_supervisor:
        supervisor_note = "\n\nNote: This certificate has been shared with you as the supervisor/manager of the learner.\n"
    else:
        supervisor_note = ""
    
    body_text = f"""
CERTIFICATE OF COMPLETION
{supervisor_note}
This certifies that {user_name} has successfully completed the course:
{course_name}

Date: {date}

---
{app_name}
    """

    return await send_email(email, subject, body_html, body_text)


async def send_duplicate_account_email(
    email: str,
    first_name: Optional[str] = None
) -> bool:
    """
    Send an email notification when a signup is attempted with an existing email.

    Args:
        email: Recipient email address
        first_name: User's first name (optional)

    Returns:
        True if email was sent successfully
    """
    app_name = EMAIL_FROM_NAME
    subject = f"Attempt to create account with your email on {app_name}"
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
                            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 40px; text-align: center;">
                                <h1 style="margin: 0; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600;">
                                    {app_name}
                                </h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="margin: 0 0 16px 0; color: #18181b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 600;">
                                    Account Already Exists
                                </h2>
                                <p style="margin: 0 0 16px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6;">
                                    {greeting},
                                </p>
                                <p style="margin: 0 0 16px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6;">
                                    We noticed an attempt to create a new account using this email address (<strong>{email}</strong>).
                                </p>
                                <p style="margin: 0 0 24px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6;">
                                    Since you already have an account with us, you can simply log in. If you've forgotten your password, you can reset it from the login page.
                                </p>
                                
                                <!-- CTA Button -->
                                <div style="text-align: center; margin: 0 0 24px 0;">
                                    <a href="#" style="display: inline-block; background: #f4f4f5; color: #18181b; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 500; border: 1px solid #e4e4e7;">
                                        Log In to Your Account
                                    </a>
                                </div>

                                <p style="margin: 0; color: #71717a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px;">
                                    If this wasn't you, you can safely ignore this email. Your account remains secure.
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
Account Already Exists

{greeting},

We noticed an attempt to create a new account using this email address ({email}).

Since you already have an account with us, you can simply log in. If you've forgotten your password, you can reset it from the login page.

If this wasn't you, you can safely ignore this email. Your account remains secure.

---
{app_name}
    """

    return await send_email(email, subject, body_html, body_text)


async def send_enrollment_email(email: str, course_title: str, user_name: Optional[str] = None) -> bool:
    """
    Send an email notification after successful course enrollment.

    Args:
        email: Recipient email address
        course_title: Title of the course
        user_name: User's first name (optional)

    Returns:
        True if email was sent successfully
    """
    app_name = EMAIL_FROM_NAME
    subject = f"Successfully Enrolled: {course_title}"
    greeting = f"Hi {user_name}" if user_name else "Hi there"

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
                                    Enrolled Successfully! 🎉
                                </h2>
                                <p style="margin: 0 0 16px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6;">
                                    {greeting},
                                </p>
                                <p style="margin: 0 0 16px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6;">
                                    You have successfully enrolled in the course: <strong>{course_title}</strong>.
                                </p>
                                <p style="margin: 0 0 24px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6;">
                                    We're excited to have you on this learning journey with us. Keep learning and growing!
                                </p>
                                
                                <!-- CTA Button -->
                                <div style="text-align: center; margin: 0 0 24px 0;">
                                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600;">
                                        Continue Learning
                                    </a>
                                </div>
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
Enrolled Successfully!

{greeting},

You have successfully enrolled in the course: {course_title}.

We're excited to have you on this learning journey with us. Keep learning and growing!

---
{app_name}
    """

    return await send_email(email, subject, body_html, body_text)


async def send_certificate_email_with_pdf(
    email: str,
    course_name: str,
    user_name: str,
    date: str,
    pdf_bytes: bytes,
    is_supervisor: bool = False
) -> bool:
    """
    Send certificate email with PDF attachment.
    """
    app_name = EMAIL_FROM_NAME
    
    if is_supervisor:
        subject = f"Certificate of Completion - {user_name} - {course_name}"
    else:
        subject = f"You're Certified! 🎓 {course_name} Completion"

    supervisor_banner_html = ""
    if is_supervisor:
        supervisor_banner_html = '<p style="margin: 0 0 24px 0; color: #0284c7; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 14px; font-weight: 600; background: #f0f9ff; padding: 12px; border-radius: 8px;">This certificate has been shared with you as the supervisor/manager of the learner below.</p>'

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
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 4px solid #d4af37;">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 40px; text-align: center;">
                                <h1 style="margin: 0; color: #d4af37; font-family: 'Times New Roman', serif; font-size: 32px; font-weight: 700; letter-spacing: 2px;">
                                    CERTIFICATE
                                </h1>
                                <p style="margin: 8px 0 0 0; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                                    OF COMPLETION
                                </p>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 60px 40px; text-align: center;">
                                {supervisor_banner_html}
                                <p style="margin: 0 0 24px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px;">
                                    This certifies that
                                </p>
                                <h2 style="margin: 0 0 24px 0; color: #1e293b; font-family: 'Times New Roman', serif; font-size: 36px; font-weight: 700; border-bottom: 2px solid #e2e8f0; display: inline-block; padding-bottom: 12px;">
                                    {user_name}
                                </h2>
                                <p style="margin: 0 0 24px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px;">
                                    has successfully completed the course
                                </p>
                                <h3 style="margin: 0 0 40px 0; color: #0284c7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600;">
                                    {course_name}
                                </h3>
                                
                                <div style="display: inline-block; padding: 12px 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                                    <p style="margin: 0; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px;">
                                        Date: <strong>{date}</strong>
                                    </p>
                                </div>
                                <div style="margin-top: 30px;">
                                    <p style="margin: 0; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px;">
                                        Please find your certificate attached to this email.
                                    </p>
                                </div>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="left">
                                            <p style="margin: 0; color: #a1a1aa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px;">
                                                Start your journey.
                                            </p>
                                        </td>
                                        <td align="right">
                                            <p style="margin: 0; color: #a1a1aa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 600;">
                                                {app_name}
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    if is_supervisor:
        supervisor_note = "\n\nNote: This certificate has been shared with you as the supervisor/manager of the learner.\n"
    else:
        supervisor_note = ""
    
    body_text = f"""
CERTIFICATE OF COMPLETION
{supervisor_note}
This certifies that {user_name} has successfully completed the course:
{course_name}

Date: {date}

Please find the certificate attached to this email.

---
{app_name}
    """
    
    attachments = [
        {
            "filename": f"Certificate-{course_name.replace(' ', '_')}.pdf",
            "content": pdf_bytes,
            "content_type": "application/pdf"
        }
    ]

    return await send_email(email, subject, body_html, body_text, attachments=attachments)


async def send_admin_created_user_email(
    email: str,
    password: str,
    first_name: Optional[str] = None
) -> bool:
    """
    Send an email to a user created by an administrator with their credentials.
    """
    app_name = EMAIL_FROM_NAME
    subject = f"Welcome to {app_name} - Your Account Details"
    greeting = f"Hi {first_name}," if first_name else "Hi there,"

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
                                    Welcome Aboard! 🎉
                                </h2>
                                <p style="margin: 0 0 16px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6;">
                                    {greeting}
                                </p>
                                <p style="margin: 0 0 16px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6;">
                                    An account has been created for you on <strong>{app_name}</strong>. Here are your login credentials:
                                </p>
                                
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Email: <strong>{email}</strong></p>
                                    <p style="margin: 0; color: #64748b; font-size: 14px;">Initial Password: <strong>{password}</strong></p>
                                </div>

                                <p style="margin: 0 0 24px 0; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6;">
                                    For security reasons, we recommend that you change your password after your first login.
                                </p>

                                <!-- Footer Note -->
                                <p style="margin: 0; color: #71717a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px;">
                                    If you have any questions, please reach out to our team.
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
Welcome Aboard!

{greeting}

An account has been created for you on {app_name}.

Your login credentials:
Email: {email}
Initial Password: {password}

We recommend changing your password after your first login.

---
{app_name}
    """

    return await send_email(email, subject, body_html, body_text)
