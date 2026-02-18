import asyncio
import os
from dotenv import load_dotenv

# Load .env file explicitly
load_dotenv()

from app.services.email.providers import SMTPProvider

async def test_email():
    print("Initializing SMTP Provider...")
    provider = SMTPProvider()
    print(f"Host: {provider.host}")
    print(f"Port: {provider.port}")
    print(f"User: {provider.user}")
    # Hide password in output
    print(f"Password configured: {'Yes' if provider.password else 'No'}")
    
    print("\nAttempting to send email...")
    try:
        success = await provider.send(
            to_email="rsanutopthree@gmail.com",
            subject="SAIL System Test Email",
            body_html="<h1>System Test</h1><p>This is a test email from the SAIL backend diagnostic tool.</p>",
            from_email="sailerkit@gmail.com",
            from_name="SAIL Admin"
        )
        print(f"\nResult: {success}")
        if success:
            print("Email sent successfully!")
        else:
            print("Email failed to send (check logs if available).")
            
    except Exception as e:
        print(f"\nCRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_email())
