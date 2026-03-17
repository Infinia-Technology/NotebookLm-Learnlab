"""
Health check service.

Business logic for health checks and database statistics.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase


class HealthService:
    """Service for health check operations."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def check_database(self) -> dict:
        """Check MongoDB connectivity."""
        try:
            await self.db.command("ping")
            return {"status": "healthy", "database": "connected", "type": "mongodb"}
        except Exception as e:
            return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

    async def get_stats(self) -> dict:
        """Get database statistics."""
        try:
            stats = await self.db.command("dbStats")
            collections = await self.db.list_collection_names()

            entity_count = await self.db.entities.count_documents({})
            period_count = await self.db.financial_periods.count_documents({})
            user_count = await self.db.users.count_documents({})

            return {
                "status": "healthy",
                "database": stats.get("db"),
                "collections": len(collections),
                "data_size_mb": round(stats.get("dataSize", 0) / 1024 / 1024, 2),
                "storage_size_mb": round(stats.get("storageSize", 0) / 1024 / 1024, 2),
                "counts": {
                    "entities": entity_count,
                    "financial_periods": period_count,
                    "users": user_count
                }
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
