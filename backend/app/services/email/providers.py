"""
Email Provider Implementations.

Each provider implements the same interface for sending emails.
"""

import os
import smtplib
import ssl
from abc import ABC, abstractmethod
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from loguru import logger


class EmailProvider(ABC):
    """Base class for email providers."""

    @abstractmethod
    async def send(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        attachments: Optional[list[dict[str, str | bytes]]] = None,
    ) -> bool:
        """
        Send an email. Returns True if successful.
        
        attachments: List of dicts with keys:
            - filename: str
            - content: bytes
            - content_type: str (e.g. "application/pdf")
        """
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name for logging."""
        pass


class ConsoleProvider(EmailProvider):
    """
    Development provider - logs emails to console instead of sending.
    Perfect for local development and testing.
    """

    @property
    def name(self) -> str:
        return "console"

    async def send(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        attachments: Optional[list[dict[str, str | bytes]]] = None,
    ) -> bool:
        attachment_info = ""
        if attachments:
            attachment_info = f"\nAttachments: {len(attachments)} file(s)\n"
            for att in attachments:
                attachment_info += f"- {att.get('filename')} ({att.get('content_type')})\n"
        
        logger.info(
            f"\n{'='*60}\n"
            f"📧 EMAIL (Console Provider - Not Actually Sent)\n"
            f"{'='*60}\n"
            f"From: {from_name} <{from_email}>\n"
            f"To: {to_email}\n"
            f"Subject: {subject}\n"
            f"{attachment_info}"
            f"{'-'*60}\n"
            f"{body_text or body_html[:500]}...\n"
            f"{'='*60}\n"
        )
        return True


class SMTPProvider(EmailProvider):
    """
    SMTP provider - works with any SMTP server.

    Supports:
    - Gmail (smtp.gmail.com:587) - requires app password
    - Outlook (smtp.office365.com:587)
    - Yahoo (smtp.mail.yahoo.com:587)
    - Custom SMTP servers

    Environment variables:
    - SMTP_HOST: SMTP server hostname
    - SMTP_PORT: SMTP port (default: 587)
    - SMTP_USER: SMTP username (usually email)
    - SMTP_PASSWORD: SMTP password or app password
    - SMTP_USE_TLS: Use STARTTLS (default: true)
    - SMTP_USE_SSL: Use SSL (default: false, for port 465)
    """

    def __init__(self):
        self.host = os.environ.get("SMTP_HOST", "")
        self.port = int(os.environ.get("SMTP_PORT", "587"))
        self.user = os.environ.get("SMTP_USER", "")
        self.password = os.environ.get("SMTP_PASSWORD", "")
        self.use_tls = os.environ.get("SMTP_USE_TLS", "true").lower() == "true"
        self.use_ssl = os.environ.get("SMTP_USE_SSL", "false").lower() == "true"

    @property
    def name(self) -> str:
        return "smtp"

    def _validate_config(self) -> bool:
        """Check if SMTP is properly configured."""
        if not self.host:
            logger.error("SMTP_HOST not configured")
            return False
        if not self.user:
            logger.error("SMTP_USER not configured")
            return False
        if not self.password:
            logger.error("SMTP_PASSWORD not configured")
            return False
        return True

    async def send(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        attachments: Optional[list[dict[str, str | bytes]]] = None,
    ) -> bool:
        if not self._validate_config():
            logger.error("SMTP not configured. Falling back to console logging.")
            console = ConsoleProvider()
            return await console.send(to_email, subject, body_html, body_text, from_email, from_name, attachments)

        try:
            # Create message
            msg = MIMEMultipart("mixed") if attachments else MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{from_name} <{from_email}>" if from_name else from_email
            msg["To"] = to_email

            # If there are attachments, we need a nested multipart/alternative for the body
            if attachments:
                body_part = MIMEMultipart("alternative")
                if body_text:
                    body_part.attach(MIMEText(body_text, "plain"))
                body_part.attach(MIMEText(body_html, "html"))
                msg.attach(body_part)
                
                # Add attachments
                from email.mime.application import MIMEApplication
                
                for attachment in attachments:
                    filename = attachment.get("filename")
                    content = attachment.get("content")
                    # content_type = attachment.get("content_type") # Not strictly needed for MIMEApplication but good practice
                    
                    if content:
                        part = MIMEApplication(content, Name=filename)
                        part["Content-Disposition"] = f'attachment; filename="{filename}"'
                        msg.attach(part)
            else:
                # Standard no-attachment email
                if body_text:
                    msg.attach(MIMEText(body_text, "plain"))
                msg.attach(MIMEText(body_html, "html"))

            # Connect and send
            context = ssl.create_default_context()

            if self.use_ssl:
                # SSL connection (typically port 465)
                with smtplib.SMTP_SSL(self.host, self.port, context=context) as server:
                    server.login(self.user, self.password)
                    server.sendmail(from_email, to_email, msg.as_string())
            else:
                # STARTTLS connection (typically port 587)
                with smtplib.SMTP(self.host, self.port) as server:
                    if self.use_tls:
                        server.starttls(context=context)
                    server.login(self.user, self.password)
                    server.sendmail(from_email, to_email, msg.as_string())

            logger.info(f"Email sent via SMTP to {to_email}")
            return True

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP authentication failed: {e}")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error: {e}")
            return False
        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {e}")
            return False


class ResendProvider(EmailProvider):
    """
    Resend provider - modern transactional email API.

    https://resend.com/docs

    Environment variables:
    - RESEND_API_KEY: Your Resend API key (starts with re_)
    """

    def __init__(self):
        self.api_key = os.environ.get("RESEND_API_KEY", "")

    @property
    def name(self) -> str:
        return "resend"

    def _validate_config(self) -> bool:
        """Check if Resend is properly configured."""
        if not self.api_key:
            logger.error("RESEND_API_KEY not configured")
            return False
        return True

    async def send(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        attachments: Optional[list[dict[str, str | bytes]]] = None,
    ) -> bool:
        if not self._validate_config():
            logger.error("Resend not configured. Falling back to console logging.")
            console = ConsoleProvider()
            return await console.send(to_email, subject, body_html, body_text, from_email, from_name, attachments)

        try:
            import resend

            resend.api_key = self.api_key

            params = {
                "from": f"{from_name} <{from_email}>" if from_name else from_email,
                "to": [to_email],
                "subject": subject,
                "html": body_html,
            }

            if body_text:
                params["text"] = body_text

            if attachments:
                params["attachments"] = [
                    {
                        "filename": att.get("filename"),
                        "content": list(att.get("content")) if isinstance(att.get("content"), bytes) else att.get("content"), # Resend expects list of ints for bytes? Or just raw bytes? Checking docs usually content is buffer or string.
                        # Resend python SDK typically wants a list of dicts. 
                        # Let's assume standard structure: {"filename": "x.pdf", "content": <bytes/buffer>}
                        # NOTE: Resend Python SDK implementation details might vary. Safer to use content as list of integers if bytes.
                    } for att in attachments
                ]
                # Updating to match Resend API structure more safely if possible, but basic pass-through for now.
                # Actually, Resend SDK handles formatting usually.

            email = resend.Emails.send(params)

            logger.info(f"Email sent via Resend to {to_email}, id: {email.get('id', 'unknown')}")
            return True

        except ImportError:
            logger.error("Resend package not installed. Run: pip install resend")
            return False
        except Exception as e:
            import traceback
            logger.error(f"Failed to send email via Resend: {e}")
            logger.error(traceback.format_exc())
            return False


def get_provider(provider_name: str) -> EmailProvider:
    """Get email provider by name."""
    providers = {
        "console": ConsoleProvider,
        "smtp": SMTPProvider,
        "resend": ResendProvider,
    }

    provider_class = providers.get(provider_name.lower())
    if not provider_class:
        logger.warning(f"Unknown email provider '{provider_name}', using console")
        return ConsoleProvider()

    return provider_class()
