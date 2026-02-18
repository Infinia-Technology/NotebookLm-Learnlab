"""
EleVatria API - Main Application

FastAPI application with MongoDB backend.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.api.api import api_router
from app.db import connect_to_mongo, close_mongo_connection, get_database
from app.odm.document import Document
from app.odm.user import UserDocument, GroupDocument, AuditLogDocument
from app.odm.course import CourseDocument
from app.odm.learning_module import LearningModuleDocument
from app.odm.progress import ModuleProgressDocument
from app.odm.assignment_submission import AssignmentSubmissionDocument


def init_document_classes(db):
    """Initialize all document classes with database instance."""
    Document.set_db(db)
    UserDocument.set_db(db)
    GroupDocument.set_db(db)
    AuditLogDocument.set_db(db)
    CourseDocument.set_db(db)
    CourseDocument.set_db(db)
    LearningModuleDocument.set_db(db)
    ModuleProgressDocument.set_db(db)
    AssignmentSubmissionDocument.set_db(db)

# Mount static files
from fastapi.staticfiles import StaticFiles
import os

# Ensure static directory exists
os.makedirs("app/static/uploads", exist_ok=True)



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    await connect_to_mongo()
    db = get_database()

    # Initialize document classes with database
    init_document_classes(db)

    # Database seeding
    try:
        from app.db.seeder import seed_if_needed
        await seed_if_needed(db)
    except Exception as e:
        logger.error(f"Error during database seeding: {e}")

    # Log all registered routes
    logger.info("Registered Routes:")
    for route in app.routes:
        logger.info(f"{route.path} [{route.name}]")

    logger.info("Application startup complete")
    yield

    # Shutdown
    await close_mongo_connection()
    logger.info("Application shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    description="EleVatria API with MongoDB Backend",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Register custom exception handlers
register_exception_handlers(app)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")



@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "database": "MongoDB",
        "docs": "/docs",
    }
