import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.modules.auth.service import AuthService
from app.core.exceptions import ConflictError

@pytest.mark.asyncio
async def test_signup_duplicate_email_sends_notification():
    # Mock database
    mock_db = AsyncMock()
    
    # Mock existing user
    existing_user = {
        "email": "test@example.com",
        "first_name": "Test",
        "uuid": "existing-uuid"
    }
    mock_db.users.find_one.return_value = existing_user

    # Mock email service
    with patch("app.modules.auth.service.send_duplicate_account_email", new_callable=AsyncMock) as mock_send_email:
        with patch("app.modules.auth.service.validate_email_for_auth_async", new_callable=AsyncMock) as mock_validate:
            # Mock validation success
            mock_validation_result = MagicMock()
            mock_validation_result.is_valid = True
            mock_validate.return_value = mock_validation_result

            # Initialize service
            auth_service = AuthService(mock_db)

            # Expect ConflictError
            with pytest.raises(ConflictError):
                await auth_service.signup(
                    email="test@example.com",
                    password="Password123!",
                    first_name="New",
                    last_name="User"
                )

            # Verify email was sent
            mock_send_email.assert_called_once_with("test@example.com", "Test")
