from typing import List, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.odm.domain import DomainDocument
from app.core.exceptions import ConflictError, NotFoundError
from app.core.error_codes import ErrorCode
from pydantic import BaseModel

class DomainResponse(BaseModel):
    uuid: str
    domain: str
    name: Optional[str]
    enabled_modules: List[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

class CreateDomainRequest(BaseModel):
    domain: str
    name: Optional[str] = None
    enabled_modules: List[str] = []

class UpdateDomainModulesRequest(BaseModel):
    enabled_modules: List[str]

class DomainService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def list_domains(self) -> List[DomainResponse]:
        """List all domains."""
        domains = await DomainDocument.find_all().to_list()
        return [self._to_response(d) for d in domains]

    async def create_domain(self, data: CreateDomainRequest) -> DomainResponse:
        """Create a new domain."""
        existing = await DomainDocument.find_by_domain(data.domain)
        if existing:
            raise ConflictError(
                message=f"Domain {data.domain} already exists",
                code=ErrorCode.CONFLICT
            )
            
        domain = await DomainDocument.create(
            domain=data.domain.lower(),
            name=data.name,
            enabled_modules=data.enabled_modules
        )
        return self._to_response(domain)

    async def update_modules(self, domain_uuid: str, modules: List[str]) -> DomainResponse:
        """Update enabled modules for a domain."""
        domain = await DomainDocument.find_by_uuid(domain_uuid)
        if not domain:
            raise NotFoundError(
                message="Domain not found",
                code=ErrorCode.NOT_FOUND
            )
            
        domain.enabled_modules = modules
        domain.updated_at = datetime.utcnow()
        await domain.save()
        
        return self._to_response(domain)

    def _to_response(self, domain: DomainDocument) -> DomainResponse:
        return DomainResponse(
            uuid=domain.uuid,
            domain=domain.domain,
            name=domain.name,
            enabled_modules=domain.enabled_modules,
            is_active=domain.is_active,
            created_at=domain.created_at,
            updated_at=domain.updated_at
        )
