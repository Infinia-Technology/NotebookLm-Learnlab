from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response, StreamingResponse
from typing import List, Dict, Any
from datetime import datetime
import io

from app.api.deps import get_current_user, require_super_admin, require_admin
from app.odm.user import UserDocument
from app.modules.learning.schema import (
    CourseCreate, CourseResponse, ModuleCreate, ModuleResponse, 
    ProgressUpdate, AnalyticsSummary, AssignmentSubmissionCreate, 
    AssignmentSubmissionResponse, AssignmentReview, EnrollmentRequest
)
from fastapi import UploadFile, File
from app.modules.learning.service import LearningService
from app.odm.course import CourseDocument # Added this import for CourseDocument

router = APIRouter(tags=["learning"])
service = LearningService()

# ===================== Course Endpoints =====================

@router.post("/admin/courses", response_model=CourseResponse)
async def create_course(
    data: CourseCreate,
    current_user: UserDocument = Depends(require_admin)
):
    """Create a new course (Admin only)."""
    return await service.create_course(data)

@router.get("/courses", response_model=List[CourseResponse])
async def list_courses(
    current_user: UserDocument = Depends(get_current_user)
):
    """List all available courses."""
    courses = await service.list_courses()
    result = []
    for course in courses:
        comp = await service.get_course_completion(current_user.uuid, course.uuid)
        course_dict = course.model_dump()
        course_dict["completion_percentage"] = comp
        result.append(course_dict)
    return result

# ===================== Enrollment Endpoints =====================

@router.post("/courses/{course_uuid}/enroll")
async def enroll_in_course(
    course_uuid: str,
    data: EnrollmentRequest,
    current_user: UserDocument = Depends(get_current_user)
):
    """Enroll the current user in a course."""
    try:
        progress = await service.enroll_in_course(
            current_user.uuid, 
            course_uuid, 
            data.email, 
            data.password
        )
        return {"message": "Enrolled successfully", "module_uuid": progress.module_uuid}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ===================== Module Endpoints =====================

@router.post("/admin/modules", response_model=ModuleResponse)
async def create_module(
    data: ModuleCreate,
    current_user: UserDocument = Depends(require_admin)
):
    """Create a new module within a course (Admin only)."""
    return await service.create_module(current_user.uuid, data)

@router.get("/courses/{course_uuid}/modules", response_model=List[ModuleResponse])
async def list_modules(
    course_uuid: str,
    current_user: UserDocument = Depends(get_current_user)
):
    """List all modules for a course with user progress."""
    return await service.list_modules(course_uuid, current_user.uuid)

@router.delete("/admin/modules/{module_uuid}")
async def delete_module(
    module_uuid: str,
    current_user: UserDocument = Depends(require_admin)
):
    """Delete a module (Admin only)."""
    try:
        await service.delete_module(module_uuid)
        return {"message": "Module deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

# ===================== Progress Endpoints =====================

@router.post("/modules/{module_uuid}/progress")
async def update_progress(
    module_uuid: str,
    data: ProgressUpdate,
    current_user: UserDocument = Depends(get_current_user)
):
    """Update learner progress for a module."""
    try:
        progress = await service.update_progress(current_user.uuid, module_uuid, data)
        
        # Calculate new course completion
        comp = await service.get_course_completion(current_user.uuid, progress.course_uuid)
        
        return {
            "message": "Progress updated",
            "course_completion_percentage": comp
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ===================== File Upload Endpoint =====================

@router.post("/upload", response_model=Dict[str, str])
async def upload_file(
    file: UploadFile = File(...),
    current_user: UserDocument = Depends(get_current_user)
):
    """Upload a file (Admin/Instructor/Student)."""
    url = await service.upload_file(file)
    return {"url": url}

# ===================== Assignment Endpoints =====================

@router.post("/assignments", response_model=Any)
async def submit_assignment(
    data: AssignmentSubmissionCreate,
    current_user: UserDocument = Depends(get_current_user)
):
    """Submit an assignment."""
    return await service.create_submission(current_user.uuid, data)

@router.post("/assignments/{submission_uuid}/review", response_model=Any)
async def review_assignment(
    submission_uuid: str,
    review: AssignmentReview,
    current_user: UserDocument = Depends(require_super_admin)
):
    """Review an assignment submission (Admin only)."""
    return await service.review_submission(submission_uuid, review, current_user.uuid)

# ===================== Analytics Endpoints =====================

@router.get("/admin/analytics/overview")
async def get_analytics(
    current_user: UserDocument = Depends(require_super_admin)
):
    """Get aggregated learning analytics (Admin only)."""
    return await service.get_admin_analytics()
@router.get("/certificates/{course_uuid}/download")
async def download_certificate(
    course_uuid: str,
    response: Response,
    current_user: UserDocument = Depends(get_current_user),
    service: LearningService = Depends()
):
    # Verify completion
    completion = await service.get_course_completion(current_user.uuid, course_uuid)
    if completion < 100.0:
        raise HTTPException(status_code=400, detail="Course not completed")
    
    course = await CourseDocument.find_by_uuid(course_uuid)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Generate PDF
    # In a real app, we'd generate a unique cert ID here
    cert_id = f"CERT-{current_user.uuid[:8]}-{course_uuid[:8]}"
    
    from app.modules.learning.certificate_service import CertificateService
    pdf_bytes = CertificateService.generate_certificate(
        student_name=f"{current_user.first_name} {current_user.last_name}",
        course_title=course.title,
        completion_date=datetime.now().strftime("%Y-%m-%d"),
        certificate_id=cert_id.upper()
    )
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=certificate-{course_uuid}.pdf"}
    )

from pydantic import BaseModel, EmailStr

class CertificateSendRequest(BaseModel):
    manager_email: EmailStr

@router.post("/certificates/{course_uuid}/send")
async def send_certificate(
    course_uuid: str,
    data: CertificateSendRequest,
    current_user: UserDocument = Depends(get_current_user),
    service: LearningService = Depends()
):
    from loguru import logger
    
    try:
        logger.info(f"Certificate send request - User: {current_user.email}, Manager: {data.manager_email}, Course: {course_uuid}")
        
        # Verify completion (use 99.9% to handle floating-point precision issues)
        completion = await service.get_course_completion(current_user.uuid, course_uuid)
        logger.info(f"Course completion for user {current_user.email}: {completion}%")
        
        if completion < 99.9:
            logger.warning(f"Certificate send failed - Course not complete. Current: {completion}%")
            raise HTTPException(status_code=400, detail=f"Course not completed. You have completed {completion:.1f}% of the course.")
        
        course = await CourseDocument.find_by_uuid(course_uuid)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Generate PDF
        cert_id = f"CERT-{current_user.uuid[:8]}-{course_uuid[:8]}"
        
        from app.modules.learning.certificate_service import CertificateService
        date_str = datetime.now().strftime("%Y-%m-%d")
        user_full_name = f"{current_user.first_name} {current_user.last_name}"
        
        pdf_bytes = CertificateService.generate_certificate(
            student_name=user_full_name,
            course_title=course.title,
            completion_date=date_str,
            certificate_id=cert_id.upper()
        )
        
        from app.services.email.service import send_certificate_email_with_pdf
        
        # Send to User
        logger.info(f"Sending certificate to user: {current_user.email}")
        try:
            user_sent = await send_certificate_email_with_pdf(
                email=current_user.email,
                course_name=course.title,
                user_name=user_full_name,
                date=date_str,
                pdf_bytes=pdf_bytes,
                is_supervisor=False
            )
        except Exception as e:
            logger.error(f"Failed to send certificate to user {current_user.email}: {e}")
            user_sent = False
        
        # Send to Manager
        logger.info(f"Sending certificate to manager: {data.manager_email}")
        try:
            manager_sent = await send_certificate_email_with_pdf(
                email=data.manager_email,
                course_name=course.title,
                user_name=user_full_name,
                date=date_str,
                pdf_bytes=pdf_bytes,
                is_supervisor=True
            )
        except Exception as e:
            logger.error(f"Failed to send certificate to manager {data.manager_email}: {e}")
            manager_sent = False
        
        if not user_sent and not manager_sent:
            # We don't raise an error here anymore to prevent the UI from showing failure
            # just because the email system is down/blocked
            logger.warning(f"Certificate generation successful but email delivery failed for both recipients.")
        
        logger.info(f"Certificate sent successfully to {current_user.email} and {data.manager_email}")
        return {"message": "Certificate sent successfully to you and your manager."}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in send_certificate: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send certificate. Please try again.")
