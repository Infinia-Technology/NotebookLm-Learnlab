"""
{{APP_NAME}} service for business logic.

Generated: {{GENERATED_AT}}
Template: {{TEMPLATE_TYPE}}
"""

from typing import Optional, List, Dict, Any, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.odm.generated.{{SLUG_SNAKE}} import {{MODEL_NAME}}Document


class {{MODEL_NAME}}Service:
    """Service for {{APP_NAME}} operations."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def create(
        self,
        name: str,
        description: Optional[str] = None,
        status: str = "active",
        created_by: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a new {{APP_NAME}} item.
        """
        # Create document
        doc = {{MODEL_NAME}}Document(
            name=name,
            description=description,
            status=status,
            created_by=created_by,
        )

        await doc.save()

        return {"item": doc, "message": "Item created successfully"}

    async def get(self, item_uuid: str) -> Optional[{{MODEL_NAME}}Document]:
        """Get an item by UUID."""
        return await {{MODEL_NAME}}Document.find_by_uuid(item_uuid)

    async def list(
        self,
        created_by: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[{{MODEL_NAME}}Document], int]:
        """
        List items with optional filters.

        Returns tuple of (items, total_count).
        """
        query: Dict[str, Any] = {}

        if created_by:
            query["created_by"] = created_by

        if status:
            query["status"] = status

        items = await {{MODEL_NAME}}Document.find(query, skip=skip, limit=limit)
        total = await {{MODEL_NAME}}Document.count(query)

        return items, total

    async def update(
        self,
        item_uuid: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        status: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Update an item.
        """
        item = await {{MODEL_NAME}}Document.find_by_uuid(item_uuid)
        if not item:
            return {"error": "Item not found", "status": 404}

        # Update fields
        if name is not None:
            item.name = name

        if description is not None:
            item.description = description

        if status is not None:
            item.status = status

        await item.save()

        return {"item": item, "message": "Item updated successfully"}

    async def delete(self, item_uuid: str) -> Dict[str, Any]:
        """
        Delete an item.
        """
        item = await {{MODEL_NAME}}Document.find_by_uuid(item_uuid)
        if not item:
            return {"error": "Item not found", "status": 404}

        await item.delete()
        return {"message": "Item deleted successfully"}
