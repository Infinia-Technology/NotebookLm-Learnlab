"""Account router for user profile management."""

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_db, get_current_user
from app.odm.user import UserDocument
from .schemas import AccountUpdateRequest, PasswordChangeRequest, AccountResponse
from .service import AccountService

router = APIRouter()


@router.get("", response_model=AccountResponse)
async def get_account(
    current_user: UserDocument = Depends(get_current_user),
):
    """Get current user account profile."""
    return AccountResponse(
        uuid=current_user.uuid,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        department=current_user.department,
        phone_number=current_user.phone_number,
        role=current_user.role,
        status=current_user.status,
        created_at=current_user.created_at,
        last_login_at=current_user.last_login_at,
    )


@router.put("", response_model=AccountResponse)
async def update_account(
    request: AccountUpdateRequest,
    current_user: UserDocument = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Update current user account profile."""
    service = AccountService(db)
    user = await service.update_profile(
        current_user,
        first_name=request.first_name,
        last_name=request.last_name,
        department=request.department,
        phone_number=request.phone_number,
    )
    return AccountResponse(
        uuid=user.uuid,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        department=user.department,
        phone_number=user.phone_number,
        role=user.role,
        status=user.status,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
    )


@router.post("/change-password")
async def change_password(
    request: PasswordChangeRequest,
    current_user: UserDocument = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Change current user password."""
    service = AccountService(db)
    result = await service.change_password(
        current_user,
        request.current_password,
        request.new_password,
    )

    if "error" in result:
        raise HTTPException(status_code=result["status"], detail=result["error"])

    return result
