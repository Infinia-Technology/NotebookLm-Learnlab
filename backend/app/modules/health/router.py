"""
Health check router.

Endpoints for API health monitoring.
"""

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_db
from .service import HealthService

router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check endpoint."""
    return {"status": "healthy", "service": "core-platform", "database": "mongodb"}


@router.get("/db")
async def db_health_check(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Check MongoDB connectivity."""
    service = HealthService(db)
    return await service.check_database()


@router.get("/stats")
async def db_stats(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get database statistics."""
    service = HealthService(db)
    return await service.get_stats()
