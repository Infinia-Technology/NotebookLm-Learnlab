from typing import List, Optional, Dict, Any
from datetime import datetime
from app.odm.domain import DomainDocument
from app.odm.course import CourseDocument
from app.odm.learning_module import LearningModuleDocument
from app.modules.marketplace.schema import SystemModule, ModulePreviewResponse, LessonPreview, InstallCustomizationRequest

# Hardcoded catalog of available system modules with enriched metadata
SYSTEM_CATALOG = [
    SystemModule(
        id="compliance",
        name="Compliance Training",
        description="Essential compliance courses for regulated industries.",
        category="Risk & Compliance",
        icon="Shield",
        duration="4h 30m",
        lessons_count=12,
        level="Intermediate",
        has_assignment=True,
        last_updated=datetime(2024, 1, 15),
        version="1.2.0"
    ),
    SystemModule(
        id="leadership",
        name="Leadership Development",
        description="Courses to grow the next generation of leaders.",
        category="Soft Skills",
        icon="Users",
        duration="6h 15m",
        lessons_count=18,
        level="Advanced",
        has_assignment=True,
        last_updated=datetime(2024, 2, 10),
        version="2.0.1"
    ),
    SystemModule(
        id="tech-skills",
        name="Technical Skills",
        description="Programming, Data Science, and IT infrastructure.",
        category="Technology",
        icon="Cpu",
        duration="10h 0m",
        lessons_count=25,
        level="Advanced",
        has_assignment=True,
        last_updated=datetime(2024, 3, 5),
        version="3.1.0"
    ),
    SystemModule(
        id="onboarding",
        name="Employee Onboarding",
        description="Streamline the new hire experience.",
        category="HR",
        icon="UserPlus",
        duration="2h 45m",
        lessons_count=8,
        level="Beginner",
        has_assignment=False,
        last_updated=datetime(2024, 1, 20),
        version="1.0.5"
    ),
    SystemModule(
        id="sales",
        name="Sales Mastery",
        description="Techniques and strategies for modern sales teams.",
        category="Sales",
        icon="TrendingUp",
        duration="5h 20m",
        lessons_count=15,
        level="Intermediate",
        has_assignment=True,
        last_updated=datetime(2024, 2, 28),
        version="1.5.2"
    ),
]

# Mock preview data
PREVIEW_DATA = {
    "compliance": {
        "full_description": "This comprehensive compliance training covers data privacy, workplace safety, and ethical conduct. Designed for corporate environments to meet regulatory standards.",
        "lessons": [
            {"title": "Introduction to Ethics", "type": "video", "duration": "10m"},
            {"title": "Data Privacy Basics (GDPR)", "type": "pdf", "duration": "20m"},
            {"title": "Workplace Safety Protocol", "type": "video", "duration": "15m"},
        ],
        "quiz_preview": {"title": "Ethics Checkpoint", "questions_count": 5},
        "assignment_preview": {"title": "Personal Ethics Statement", "type": "text"}
    },
    "tech-skills": {
        "full_description": "Master modern technical stacks. This module covers Python backend development, React frontend, and CI/CD pipelines with hands-on labs.",
        "lessons": [
            {"title": "Environment Setup", "type": "video", "duration": "15m"},
            {"title": "Python Basics", "type": "video", "duration": "45m"},
            {"title": "Building your first API", "type": "video", "duration": "60m"},
        ],
        "quiz_preview": {"title": "Python Quiz", "questions_count": 10},
        "assignment_preview": {"title": "Build a REST API", "type": "file"}
    }
}

class MarketplaceService:
    async def list_modules(
        self, 
        domain_uuid: str, 
        search: Optional[str] = None,
        category: Optional[str] = None,
        level: Optional[str] = None
    ) -> List[SystemModule]:
        """List all system modules with filtering and installation status."""
        domain = await DomainDocument.find_by_uuid(domain_uuid)
        enabled_modules = set(domain.enabled_modules) if domain else set()

        result = []
        for mod in SYSTEM_CATALOG:
            # Apply Filters
            if search and search.lower() not in mod.name.lower() and search.lower() not in mod.description.lower():
                continue
            if category and mod.category != category:
                continue
            if level and mod.level != level:
                continue

            mod_response = mod.model_copy()
            mod_response.is_installed = mod.id in enabled_modules
            result.append(mod_response)
        
        return result

    async def get_module_preview(self, module_id: str) -> Optional[ModulePreviewResponse]:
        """Fetch detailed preview data for a marketplace module."""
        # Find module basic info
        base_mod = next((m for m in SYSTEM_CATALOG if m.id == module_id), None)
        if not base_mod:
            return None
        
        # Get extended preview content
        preview = PREVIEW_DATA.get(module_id, {
            "full_description": base_mod.description,
            "lessons": [{"title": "Course Overview", "type": "video", "duration": "5m"}],
            "quiz_preview": None,
            "assignment_preview": None
        })

        return ModulePreviewResponse(
            id=base_mod.id,
            name=base_mod.name,
            full_description=preview["full_description"],
            lessons=[LessonPreview(**l) for l in preview["lessons"]],
            quiz_preview=preview.get("quiz_preview"),
            assignment_preview=preview.get("assignment_preview")
        )

    async def custom_install_module(
        self, 
        domain_uuid: str, 
        user_uuid: str,
        data: InstallCustomizationRequest
    ) -> bool:
        """Clone a marketplace module into a domain course with customizations."""
        # 1. Verify module exists
        base_mod = next((m for m in SYSTEM_CATALOG if m.id == data.module_id), None)
        if not base_mod:
            return False
        
        # 2. Add to domain's enabled list (for tracking)
        domain = await DomainDocument.find_by_uuid(domain_uuid)
        if domain and data.module_id not in domain.enabled_modules:
            domain.enabled_modules.append(data.module_id)
            await domain.save()

        # 3. Create a new Course for this installation
        course = await CourseDocument.create(
            title=data.custom_name or base_mod.name,
            description=base_mod.description
        )

        # 4. Clone Lessons/Content - For now, we'll create a single "Success" module representing the installation
        # In a real system, we'd loop through all templates and clone them.
        preview = await self.get_module_preview(data.module_id)
        
        for idx, lesson in enumerate(preview.lessons):
            await LearningModuleDocument.create(
                course_uuid=course.uuid,
                title=lesson.title,
                description=f"Content for {lesson.title}",
                content_type=lesson.type,
                order_index=idx,
                is_mandatory=data.is_mandatory,
                created_by=user_uuid,
                # Store enterprise specific logic
                assignment={"enabled": data.enable_assignments} if data.enable_assignments and base_mod.has_assignment else None
            )

        return True

    async def install_module(self, domain_uuid: str, module_id: str) -> bool:
        """Enable a module for a domain (Legacy immediate install)."""
        domain = await DomainDocument.find_by_uuid(domain_uuid)
        if not domain:
            return False
        
        if module_id not in domain.enabled_modules:
            domain.enabled_modules.append(module_id)
            await domain.save()
            return True
        return True

    async def uninstall_module(self, domain_uuid: str, module_id: str) -> bool:
        """Disable a module for a domain."""
        domain = await DomainDocument.find_by_uuid(domain_uuid)
        if not domain:
            return False
        
        if module_id in domain.enabled_modules:
            domain.enabled_modules.remove(module_id)
            await domain.save()
            return True
        return True
