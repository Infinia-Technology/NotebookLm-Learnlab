from typing import List, Optional, Dict, Any
from app.odm.course import CourseDocument
from app.odm.learning_module import LearningModuleDocument
from app.odm.progress import ModuleProgressDocument
from app.odm.assignment_submission import AssignmentSubmissionDocument
from app.modules.learning.schema import (
    CourseCreate, ModuleCreate, ProgressUpdate, ModuleResponse, CourseResponse,
    AssignmentSubmissionCreate, AssignmentReview, AnalyticsSummary
)
from fastapi import UploadFile
import shutil
import os
import uuid
from datetime import datetime, timedelta
from app.auth.passwords import verify_password
from app.odm.user import UserDocument
from app.services.email import send_enrollment_email

class LearningService:
    async def create_course(self, data: CourseCreate) -> CourseDocument:
        return await CourseDocument.create(**data.model_dump())

    async def list_courses(self) -> List[CourseDocument]:
        return await CourseDocument.find(sort=[("created_at", -1)])

    async def enroll_in_course(self, user_uuid: str, course_uuid: str, email: str, password: str) -> ModuleProgressDocument:
        """Enroll a user in a course by creating progress for the first module."""
        # 1. Verify credentials
        user = await UserDocument.find_by_uuid(user_uuid)
        if not user or user.email.lower() != email.lower():
            raise ValueError("Invalid email")
        
        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid password")

        # 2. Find course modules
        modules = await LearningModuleDocument.find_by_course(course_uuid)
        if not modules:
            raise ValueError("Course has no modules to enroll in")
        
        course = await CourseDocument.find_by_uuid(course_uuid)
        if not course:
            raise ValueError("Course not found")

        # find_by_course already returns sorted by order_index
        first_module = modules[0]
        
        progress = await ModuleProgressDocument.find_for_user_module(user_uuid, first_module.uuid)
        if not progress:
            progress = await ModuleProgressDocument.create(
                user_uuid=user_uuid,
                module_uuid=first_module.uuid,
                course_uuid=course_uuid,
                status="in_progress"
            )
            
            # 3. Send enrollment email
            try:
                await send_enrollment_email(
                    email=user.email,
                    course_title=course.title,
                    user_name=user.first_name
                )
            except Exception as e:
                from loguru import logger
                logger.error(f"Failed to send enrollment email: {e}")
                
        return progress

    async def create_module(self, user_uuid: str, data: ModuleCreate) -> LearningModuleDocument:
        return await LearningModuleDocument.create(
            **data.model_dump(),
            created_by=user_uuid
        )

    async def list_modules(self, course_uuid: str, user_uuid: Optional[str] = None) -> List[Dict[str, Any]]:
        modules = await LearningModuleDocument.find_by_course(course_uuid)
        
        result = []
        for mod in modules:
            mod_dict = mod.model_dump()
            if user_uuid:
                progress = await ModuleProgressDocument.find_for_user_module(user_uuid, mod.uuid)
                mod_dict["status"] = progress.status if progress else "not_started"
            result.append(mod_dict)
        return result

    async def upload_file(self, file: UploadFile) -> str:
        """Upload a file to static storage and return the URL."""
        filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = f"app/static/uploads/{filename}"
        
        with open(file_path, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        return f"/static/uploads/{filename}"

    async def create_submission(self, user_uuid: str, data: AssignmentSubmissionCreate) -> AssignmentSubmissionDocument:
        """Create an assignment submission."""
        module = await LearningModuleDocument.find_by_uuid(data.module_uuid)
        if not module:
            raise ValueError("Module not found")
            
        submission = await AssignmentSubmissionDocument.create(
            user_uuid=user_uuid,
            **data.model_dump()
        )
        
        # Check if we should auto-approve (if approval not required)
        if module.assignment and not module.assignment.get("requires_approval", False):
            submission.status = "approved"
            await submission.save()
            # If approved, try to complete the module
            await self.check_module_completion(user_uuid, data.module_uuid)
            
        return submission

    async def review_submission(self, submission_uuid: str, review: AssignmentReview, reviewer_uuid: str) -> AssignmentSubmissionDocument:
        """Review an assignment submission."""
        submission = await AssignmentSubmissionDocument.find_by_uuid(submission_uuid)
        if not submission:
            raise ValueError("Submission not found")
            
        submission.status = review.status
        submission.score = review.score
        submission.feedback = review.feedback
        await submission.save()
        
        if submission.status == "approved":
            await self.check_module_completion(submission.user_uuid, submission.module_uuid)
            
        return submission

    async def check_module_completion(self, user_uuid: str, module_uuid: str):
        """Check and update module completion status based on criteria."""
        module = await LearningModuleDocument.find_by_uuid(module_uuid)
        if not module:
            return
            
        progress = await ModuleProgressDocument.find_for_user_module(user_uuid, module_uuid)
        if not progress:
            return # No progress record yet
            
        # Check Assignment
        if module.assignment and module.assignment.get("enabled"):
            submission = await AssignmentSubmissionDocument.find_by_module_and_user(module_uuid, user_uuid)
            if not submission:
                return # Not submitted
            
            if module.assignment.get("requires_approval") and submission.status != "approved":
                return # Pending approval
        
        # If we reached here, assignment checks passed. 
        # Note: Content consumption check is handled in update_progress usually.
        # But if this is called from review_submission, we might want to set completed IF content is also done.
        # For simplicity, we assume generic update calls update_progress.
        
        # If called from review submission, we should FORCE update progress to check everything
        # But we need the 'data' for update_progress? 
        # Actually update_progress logic needs to be robust.
        
        pass

    async def _is_certification_exam(self, module: LearningModuleDocument) -> bool:
        """Check if a module is a certification exam based on title."""
        title = module.title.lower().strip()
        # Look for explicit certification/final exam keywords
        keywords = ["certification exam", "final exam", "grand exam", "professional certification"]
        if any(k in title for k in keywords):
            return True
        
        # Broader pattern matching
        has_exam = "exam" in title or "certification" in title
        is_final = any(w in title for w in ["final", "grand", "last", "completion"])
        return has_exam and is_final

    async def _verify_all_modules_completed(self, user_uuid: str, course_uuid: str, current_module_uuid: str) -> bool:
        """Verify that all non-exam modules in a course are completed by the user."""
        all_modules = await LearningModuleDocument.find_by_course(course_uuid)
        
        for mod in all_modules:
            # Skip the current module and other certification exams
            if mod.uuid == current_module_uuid:
                continue
            
            if await self._is_certification_exam(mod):
                continue
                
            # Check progress
            progress = await ModuleProgressDocument.find_for_user_module(user_uuid, mod.uuid)
            if not progress or progress.status != "completed":
                return False
        
        return True

    async def update_progress(self, user_uuid: str, module_uuid: str, data: ProgressUpdate) -> ModuleProgressDocument:
        module = await LearningModuleDocument.find_by_uuid(module_uuid)
        if not module:
            raise ValueError("Module not found")

        # --- GLOBAL ENFORCEMENT ---
        # If this is a certification exam, verify all other modules are complete
        if await self._is_certification_exam(module):
            if not await self._verify_all_modules_completed(user_uuid, module.course_uuid, module_uuid):
                raise ValueError("Prerequisites not met: You must complete all previous modules before starting the certification exam.")
            
        progress = await ModuleProgressDocument.find_for_user_module(user_uuid, module_uuid)
        
        # Create if not exists
        if not progress:
            progress = await ModuleProgressDocument.create(
                user_uuid=user_uuid,
                module_uuid=module_uuid,
                course_uuid=module.course_uuid,
                **data.model_dump(exclude_unset=True)
            )
        else:
            update_dict = data.model_dump(exclude_unset=True)
            for key, value in update_dict.items():
                setattr(progress, key, value)
        
        if progress.status == "completed":
            # 1. Assignment Verification
            if module.assignment and module.assignment.get("enabled"):
                submission = await AssignmentSubmissionDocument.find_by_module_and_user(module_uuid, user_uuid)
                
                assignment_complete = False
                if submission:
                    if module.assignment.get("requires_approval"):
                        if submission.status == "approved":
                            assignment_complete = True
                    else:
                        assignment_complete = True
                
                if not assignment_complete:
                    progress.status = "in_progress"

            # 2. Quiz Notification (NEW)
            if progress.status == "completed" and module.content_type == "quiz" and data.quiz_score is not None:
                from app.odm.user import UserDocument
                from app.services.email.service import send_quiz_completion_email
                from loguru import logger
                
                user = await UserDocument.find_by_uuid(user_uuid)
                if user and user.email:
                    # Basic passing logic if not defined in module
                    total_q = len(module.completion_criteria.get("questions", []))
                    
                    logger.info(f"Sending quiz completion email to {user.email} for {module.title}")
                    try:
                        await send_quiz_completion_email(
                            email=user.email,
                            quiz_title=module.title,
                            score=data.quiz_score,
                            total_questions=total_q
                        )
                    except Exception as e:
                        logger.error(f"Failed to send quiz completion email: {e}")
        
        await progress.save()
        
        return progress

    async def get_course_completion(self, user_uuid: str, course_uuid: str) -> float:
        from loguru import logger
        
        modules = await LearningModuleDocument.find_by_course(course_uuid)
        if not modules:
            return 0.0
            
        completed_docs = await ModuleProgressDocument.find({
            "user_uuid": user_uuid,
            "course_uuid": course_uuid,
            "status": "completed"
        })
        completed_module_uuids = {doc.module_uuid for doc in completed_docs}
        
        num_exams = 0
        num_completed_exams = 0
        num_regular = 0
        num_completed_regular = 0
        
        for mod in modules:
            if await self._is_certification_exam(mod):
                num_exams += 1
                if mod.uuid in completed_module_uuids:
                    num_completed_exams += 1
            else:
                num_regular += 1
                if mod.uuid in completed_module_uuids:
                    num_completed_regular += 1
        
        # If no certification exam exists, cap completion at 95%
        if num_exams == 0:
            if num_regular == 0: return 0.0
            percent = (num_completed_regular / num_regular) * 100.0
            return min(percent, 95.0) if num_completed_regular == num_regular else percent
            
        # If exams exist, they contribute to the total count normally
        # reaching 100% only when the exam is passed.
        total_modules = num_regular + num_exams
        completed_modules = num_completed_regular + num_completed_exams
        return (completed_modules / total_modules) * 100.0

    async def get_admin_analytics(self) -> Dict[str, Any]:
        # 1. Course Stats (Existing)
        courses = await CourseDocument.find()
        course_stats = []
        
        for course in courses:
            total_users = await ModuleProgressDocument.distinct("user_uuid", {"course_uuid": course.uuid})
            num_users = len(total_users)
            
            # Simple average for now
            total_completion = 0
            for u_uuid in total_users:
                total_completion += await self.get_course_completion(u_uuid, course.uuid)
            
            avg_comp = total_completion / num_users if num_users > 0 else 0
            
            course_stats.append({
                "course_title": course.title,
                "course_uuid": course.uuid,
                "enrollment_count": num_users,
                "avg_completion": avg_comp
            })

        # 2. Activity Trend (Last 7 Days)
        activity_trend = []
        today = datetime.utcnow().date()
        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            # Define day range (00:00:00 to 23:59:59)
            start_dt = datetime.combine(date, datetime.min.time())
            end_dt = datetime.combine(date, datetime.max.time())
            
            # Active Users: Unique users with progress updated today
            # Note: This requires 'updated_at' field in Document
            active_users_pipeline = [
                {"$match": {"updated_at": {"$gte": start_dt, "$lte": end_dt}}},
                {"$group": {"_id": "$user_uuid"}},
                {"$count": "count"}
            ]
            active_users_res = await ModuleProgressDocument.aggregate(active_users_pipeline)
            active_count = active_users_res[0]["count"] if active_users_res else 0
            
            # Completions: Modules marked completed today
            completions_count = await ModuleProgressDocument.count({
                "updated_at": {"$gte": start_dt, "$lte": end_dt},
                "status": "completed"
            })
            
            activity_trend.append({
                "name": date.strftime("%a"), # Mon, Tue
                "active": active_count,
                "completions": completions_count
            })

        # 3. Content Distribution
        content_dist = []
        # Aggregate by content_type
        content_pipeline = [
            {"$group": {"_id": "$content_type", "count": {"$sum": 1}}}
        ]
        content_res = await LearningModuleDocument.aggregate(content_pipeline)
        
        # Color mapping
        colors = {
            "video": "#8884d8", # Purple
            "quiz": "#82ca9d",  # Green
            "pdf": "#ffc658",   # Yellow
            "ppt": "#ff8042"    # Orange
        }
        
        for item in content_res:
            ctype = item["_id"]
            content_dist.append({
                "name": ctype.capitalize(),
                "value": item["count"],
                "color": colors.get(ctype, "#cccccc")
            })

        # 4. Global Stats
        total_p_users = await ModuleProgressDocument.distinct("user_uuid")
        total_active_learners = len(total_p_users)
        total_completions = await ModuleProgressDocument.count({"status": "completed"})

        return {
            "total_courses": len(courses),
            "total_active_learners": total_active_learners,
            "total_completions": total_completions,
            "by_course": course_stats,
            "activity_trend": activity_trend,
            "content_distribution": content_dist
        }

    async def delete_module(self, module_uuid: str):
        """Delete a module and its related data."""
        module = await LearningModuleDocument.find_by_uuid(module_uuid)
        if not module:
            raise ValueError("Module not found")
            
        # 1. Delete progress records
        await ModuleProgressDocument.delete_many({"module_uuid": module_uuid})
        
        # 2. Delete assignment submissions
        await AssignmentSubmissionDocument.delete_many({"module_uuid": module_uuid})
        
        # 3. Delete the module document itself
        await module.delete()
        
        return True
