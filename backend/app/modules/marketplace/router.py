from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional

from app.api.deps import get_current_user
from app.modules.marketplace.schema import (
    SystemModule, InstallModuleRequest, ModulePreviewResponse, 
    InstallCustomizationRequest
)
from app.modules.marketplace.service import MarketplaceService
from app.odm.user import UserDocument

router = APIRouter(tags=["enterprise-marketplace"])
service = MarketplaceService()

@router.get("/catalog", response_model=List[SystemModule])
async def get_catalog(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    current_user: UserDocument = Depends(get_current_user)
):
    """List available modules with advanced filtering."""
    if not current_user.domain_uuid:
        from app.modules.marketplace.service import SYSTEM_CATALOG
        return SYSTEM_CATALOG
    
    return await service.list_modules(
        current_user.domain_uuid,
        search=search,
        category=category,
        level=level
    )

@router.get("/catalog/{module_id}/preview", response_model=ModulePreviewResponse)
async def get_module_preview(
    module_id: str,
    current_user: UserDocument = Depends(get_current_user)
):
    """Fetch detailed preview for a marketplace module."""
    preview = await service.get_module_preview(module_id)
    if not preview:
        raise HTTPException(status_code=404, detail="Module not found")
    return preview

@router.post("/modules")
async def install_module(
    request: InstallModuleRequest,
    current_user: UserDocument = Depends(get_current_user)
):
    """Legacy immediate installation."""
    if not current_user.domain_uuid:
        raise HTTPException(status_code=400, detail="User does not belong to a domain")
        
    if current_user.domain_role != "admin" and current_user.role != "super_admin":
         raise HTTPException(status_code=403, detail="Only Domain Admins can install modules")

    success = await service.install_module(current_user.domain_uuid, request.module_id)
    if not success:
         raise HTTPException(status_code=404, detail="Installation failed")
    
    return {"message": f"Module {request.module_id} installed successfully"}

@router.post("/custom-install")
async def custom_install_module(
    request: InstallCustomizationRequest,
    current_user: UserDocument = Depends(get_current_user)
):
    """Custom installation with cloning and enterprise settings."""
    if not current_user.domain_uuid:
        raise HTTPException(status_code=400, detail="User does not belong to a domain")
        
    if current_user.domain_role != "admin" and current_user.role != "super_admin":
         raise HTTPException(status_code=403, detail="Only Domain Admins can install modules")

    success = await service.custom_install_module(
        current_user.domain_uuid,
        current_user.uuid,
        request
    )
    if not success:
         raise HTTPException(status_code=404, detail="Custom installation failed")
    
    return {"message": f"Module {request.module_id} cloned and configured successfully"}

@router.delete("/modules/{module_id}")
async def uninstall_module(
    module_id: str,
    current_user: UserDocument = Depends(get_current_user)
):
    """Uninstall a module for the current domain."""
    if not current_user.domain_uuid:
        raise HTTPException(status_code=400, detail="User does not belong to a domain")
        
    if current_user.domain_role != "admin" and current_user.role != "super_admin":
         raise HTTPException(status_code=403, detail="Only Domain Admins can uninstall modules")

    success = await service.uninstall_module(current_user.domain_uuid, module_id)
    if not success:
         raise HTTPException(status_code=404, detail="Uninstallation failed")
    
    return {"message": f"Module {module_id} uninstalled successfully"}
