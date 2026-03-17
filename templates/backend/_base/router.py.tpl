"""
{{APP_NAME}} router.

{{DESCRIPTION}}

Generated: {{GENERATED_AT}}
Template: {{TEMPLATE_TYPE}}
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_db, get_current_user
from app.odm.user import UserDocument
from .schemas import (
    {{MODEL_NAME}}CreateRequest,
    {{MODEL_NAME}}UpdateRequest,
    {{MODEL_NAME}}Response,
    {{MODEL_NAME}}ListResponse,
    MessageResponse,
)
from .service import {{MODEL_NAME}}Service

router = APIRouter()


def item_to_response(item) -> {{MODEL_NAME}}Response:
    """Convert {{MODEL_NAME}}Document to {{MODEL_NAME}}Response."""
    return {{MODEL_NAME}}Response(
        uuid=item.uuid,
        name=item.name,
        description=item.description,
        status=item.status,
        created_by=item.created_by,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.post("", response_model={{MODEL_NAME}}Response)
async def create_{{SLUG_SNAKE}}(
    request: {{MODEL_NAME}}CreateRequest,
    current_user: UserDocument = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Create a new {{APP_NAME}} item.
    """
    service = {{MODEL_NAME}}Service(db)
    result = await service.create(
        name=request.name,
        description=request.description,
        status=request.status,
        created_by=current_user.uuid,
    )

    if "error" in result:
        raise HTTPException(status_code=result["status"], detail=result["error"])

    return item_to_response(result["item"])


@router.get("", response_model={{MODEL_NAME}}ListResponse)
async def list_{{SLUG_SNAKE}}(
    status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserDocument = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    List all {{APP_NAME}} items.
    """
    service = {{MODEL_NAME}}Service(db)
    items, total = await service.list(
        created_by=current_user.uuid,
        status=status,
        skip=skip,
        limit=limit,
    )

    return {{MODEL_NAME}}ListResponse(
        items=[item_to_response(i) for i in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{item_id}", response_model={{MODEL_NAME}}Response)
async def get_{{SLUG_SNAKE}}(
    item_id: str,
    current_user: UserDocument = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Get a {{APP_NAME}} item by ID.
    """
    service = {{MODEL_NAME}}Service(db)
    item = await service.get(item_id)

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Check ownership (unless super_admin)
    if item.created_by != current_user.uuid and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Access denied")

    return item_to_response(item)


@router.patch("/{item_id}", response_model={{MODEL_NAME}}Response)
async def update_{{SLUG_SNAKE}}(
    item_id: str,
    request: {{MODEL_NAME}}UpdateRequest,
    current_user: UserDocument = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Update a {{APP_NAME}} item.
    """
    service = {{MODEL_NAME}}Service(db)

    # Check ownership first
    existing = await service.get(item_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")

    if existing.created_by != current_user.uuid and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Access denied")

    result = await service.update(
        item_uuid=item_id,
        name=request.name,
        description=request.description,
        status=request.status,
    )

    if "error" in result:
        raise HTTPException(status_code=result["status"], detail=result["error"])

    return item_to_response(result["item"])


@router.delete("/{item_id}", response_model=MessageResponse)
async def delete_{{SLUG_SNAKE}}(
    item_id: str,
    current_user: UserDocument = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Delete a {{APP_NAME}} item.
    """
    service = {{MODEL_NAME}}Service(db)

    # Check ownership first
    existing = await service.get(item_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")

    if existing.created_by != current_user.uuid and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Access denied")

    result = await service.delete(item_id)

    if "error" in result:
        raise HTTPException(status_code=result["status"], detail=result["error"])

    return MessageResponse(message=result["message"])
