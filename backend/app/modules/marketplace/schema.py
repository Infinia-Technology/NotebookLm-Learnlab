from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class LessonPreview(BaseModel):
    title: str
    type: str
    duration: Optional[str] = None

class SystemModule(BaseModel):
    id: str
    name: str
    description: str
    category: str
    icon: str  # Lucide icon name
    is_installed: bool = False
    
    # New Metadata
    duration: str = "0h 0m"
    lessons_count: int = 0
    level: str = "Beginner"  # Beginner / Intermediate / Advanced
    has_assignment: bool = False
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    version: str = "1.0.0"

class ModulePreviewResponse(BaseModel):
    id: str
    name: str
    full_description: str
    lessons: List[LessonPreview]
    quiz_preview: Optional[Dict[str, Any]] = None
    assignment_preview: Optional[Dict[str, Any]] = None

class InstallCustomizationRequest(BaseModel):
    module_id: str
    custom_name: Optional[str] = None
    target_departments: List[str] = Field(default_factory=list)
    is_mandatory: bool = False
    deadline: Optional[datetime] = None
    enable_assignments: bool = True

class InstallModuleRequest(BaseModel):
    module_id: str
