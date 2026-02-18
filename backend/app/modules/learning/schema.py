from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from app.odm.learning_module import ModuleContentType
from app.odm.progress import ProgressStatus

class QuizSettings(BaseModel):
    passing_score: int
    max_attempts: int = 1
    time_limit: Optional[int] = None
    randomize_questions: bool = False

class AssignmentSettings(BaseModel):
    enabled: bool = False
    title: Optional[str] = None
    instructions: Optional[str] = None
    submission_type: Literal["text", "file", "url"] = "text"
    due_date: Optional[datetime] = None
    requires_approval: bool = False

class ModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    content_type: ModuleContentType
    content_url: Optional[str] = None
    file_path: Optional[str] = None
    order_index: int = 0
    estimated_duration: Optional[int] = None
    is_mandatory: bool = False
    quiz_settings: Optional[QuizSettings] = None
    assignment: Optional[AssignmentSettings] = None
    completion_criteria: Dict[str, Any] = Field(default_factory=dict)

class ModuleCreate(ModuleBase):
    course_uuid: str

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content_type: Optional[ModuleContentType] = None
    content_url: Optional[str] = None
    file_path: Optional[str] = None
    order_index: Optional[int] = None
    estimated_duration: Optional[int] = None
    is_mandatory: Optional[bool] = None
    quiz_settings: Optional[QuizSettings] = None
    assignment: Optional[AssignmentSettings] = None
    completion_criteria: Optional[Dict[str, Any]] = None

class ModuleResponse(ModuleBase):
    uuid: str
    course_uuid: str
    created_at: datetime
    
    # Progress status for current user (optional)
    status: Optional[ProgressStatus] = None

class AssignmentSubmissionCreate(BaseModel):
    module_uuid: str
    submission_content: str
    submission_type: Literal["text", "file", "url"]

class AssignmentReview(BaseModel):
    status: Literal["approved", "rejected"]
    score: Optional[float] = None
    feedback: Optional[str] = None

class AssignmentSubmissionResponse(BaseModel):
    uuid: str
    module_uuid: str
    user_uuid: str
    submission_content: str
    submission_type: str
    status: str
    score: Optional[float] = None
    feedback: Optional[str] = None
    submitted_at: datetime

class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    uuid: str
    created_at: datetime
    
    # Aggregated stats
    completion_percentage: float = 0.0

class ProgressUpdate(BaseModel):
    status: Optional[ProgressStatus] = None
    time_spent: Optional[int] = None
    completion_percentage: Optional[float] = None
    quiz_score: Optional[float] = None

class AnalyticsSummary(BaseModel):
    total_enrollments: int
    avg_completion: float
    by_course: List[Dict[str, Any]]
    by_department: List[Dict[str, Any]]
    by_user: List[Dict[str, Any]]
    activity_trend: List[Dict[str, Any]]  # [{ "name": "Mon", "active": 10, "completions": 5 }]
    content_distribution: List[Dict[str, Any]]  # [{ "name": "Video", "value": 10, "color": "#..." }]
class EnrollmentRequest(BaseModel):
    email: EmailStr
    password: str
