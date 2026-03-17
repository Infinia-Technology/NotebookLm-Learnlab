"""
{{APP_NAME}} schemas for request/response validation.

Generated: {{GENERATED_AT}}
Template: {{TEMPLATE_TYPE}}
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class {{MODEL_NAME}}CreateRequest(BaseModel):
    """Request to create a new {{APP_NAME}} item."""

    name: str = Field(..., min_length=1, max_length=255, description="Item name")
    description: Optional[str] = Field(None, max_length=2000, description="Item description")
    status: str = Field(default="active", pattern="^(active|inactive|archived)$")


class {{MODEL_NAME}}UpdateRequest(BaseModel):
    """Request to update a {{APP_NAME}} item."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[str] = Field(None, pattern="^(active|inactive|archived)$")


class {{MODEL_NAME}}Response(BaseModel):
    """{{APP_NAME}} item response."""

    uuid: str
    name: str
    description: Optional[str] = None
    status: str = "active"
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class {{MODEL_NAME}}ListResponse(BaseModel):
    """List of {{APP_NAME}} items response."""

    items: List[{{MODEL_NAME}}Response]
    total: int
    skip: int = 0
    limit: int = 20


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str
