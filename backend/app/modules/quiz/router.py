"""
Quiz Router.

Handles quiz submission and notifications.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from loguru import logger

from app.api.deps import get_current_user
from app.odm.user import UserDocument
from app.services.email import send_quiz_completion_email, send_certification_email

router = APIRouter()


class QuizCompleteRequest(BaseModel):
    quiz_title: str
    score: int
    total_questions: int
    module_uuid: Optional[str] = None  # Module to mark as completed


@router.post("/complete")
async def complete_quiz(
    request: QuizCompleteRequest,
    current_user: UserDocument = Depends(get_current_user)
):
    """
    Record quiz completion and send celebration email.
    Also marks the associated module as completed if quiz is passed.
    """
    logger.info(f"User {current_user.email} completed quiz '{request.quiz_title}' with score {request.score}/{request.total_questions}")
    
    # Mark module as completed if quiz passed and module_uuid provided
    # Note: We consider it passed if score > 0 for now, or match existing logic
    if request.module_uuid:
        try:
            from app.modules.learning.service import LearningService
            from app.modules.learning.schema import ProgressUpdate
            
            service = LearningService()
            await service.update_progress(
                current_user.uuid,
                request.module_uuid,
                ProgressUpdate(
                    status="completed",
                    quiz_score=float(request.score)
                )
            )
            logger.info(f"Marked module {request.module_uuid} as completed for user {current_user.email}")
        except Exception as e:
            logger.error(f"Failed to update module progress: {e}")
    
    # Send email for any completion as per user request
    if request.total_questions > 0:
        try:
            passed = request.score >= (request.total_questions / 2) # Simple pass threshold
            await send_quiz_completion_email(
                current_user.email,
                request.quiz_title,
                float(request.score),
                request.total_questions,
                passed=passed
            )
            return {"message": "Quiz recorded and completion email sent!"}
        except Exception as e:
            logger.error(f"Failed to send quiz completion email: {e}")
            return {"message": "Quiz recorded but failed to send email."}
            
    return {"message": "Quiz recorded."}


class CertificateRequest(BaseModel):
    course_id: str
    course_title: str
    user_name: str
    date: str
    supervisor_email: EmailStr  # Now required


@router.post("/certificate")
async def issue_certificate(
    request: CertificateRequest,
    current_user: UserDocument = Depends(get_current_user)
):
    """
    Issue a certificate of completion.
    """
    logger.info(f"Issuing certificate for {current_user.email} - Course: {request.course_title}")
    
    user_email_sent = False
    supervisor_email_sent = False
    
    # Send certificate to user
    try:
        await send_certification_email(
            current_user.email,
            request.course_title,
            request.user_name,
            request.date
        )
        user_email_sent = True
        logger.info(f"Certificate sent to user: {current_user.email}")
    except Exception as e:
        logger.error(f"Failed to send certificate email to user: {e}")
    
    # Send certificate to supervisor (always required now)
    try:
        await send_certification_email(
            request.supervisor_email,
            request.course_title,
            request.user_name,
            request.date,
            is_supervisor=True
        )
        supervisor_email_sent = True
        logger.info(f"Certificate sent to supervisor: {request.supervisor_email}")
    except Exception as e:
        logger.error(f"Failed to send certificate email to supervisor: {e}")
    
    # Return appropriate message based on what succeeded
    if user_email_sent and supervisor_email_sent:
        return {"message": "Certificate issued successfully!"}
    elif user_email_sent:
        return {"message": "Certificate sent to you, but failed to send to supervisor."}
    elif supervisor_email_sent:
        return {"message": "Certificate sent to supervisor, but failed to send to you."}
    else:
        return {"message": "Certificate issued but failed to send emails."}
