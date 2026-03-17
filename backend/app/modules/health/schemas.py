"""
Health check schemas.

Pydantic models for health check requests and responses.
"""

from pydantic import BaseModel
from typing import Optional


class HealthResponse(BaseModel):
    """Basic health check response."""
    status: str
    service: str
    database: str


class DbHealthResponse(BaseModel):
    """Database health check response."""
    status: str
    database: str
    type: Optional[str] = None
    error: Optional[str] = None


class CountsModel(BaseModel):
    """Database counts model."""
    entities: int
    financial_periods: int
    users: int


class StatsResponse(BaseModel):
    """Database statistics response."""
    status: str
    database: Optional[str] = None
    collections: Optional[int] = None
    data_size_mb: Optional[float] = None
    storage_size_mb: Optional[float] = None
    counts: Optional[CountsModel] = None
    message: Optional[str] = None
