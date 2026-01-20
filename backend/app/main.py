"""
SAIL Starter Kit API - Main Application

FastAPI application with MongoDB backend.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import settings
from app.api.api import api_router
from app.db import connect_to_mongo, close_mongo_connection, get_database
from app.odm.document import Document
from app.odm.user import UserDocument, GroupDocument, AuditLogDocument


def init_document_classes(db):
    """Initialize all document classes with database instance."""
    Document.set_db(db)
    UserDocument.set_db(db)
    GroupDocument.set_db(db)
    AuditLogDocument.set_db(db)


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

    logger.info("Application startup complete")
    yield

    # Shutdown
    await close_mongo_connection()
    logger.info("Application shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    description="SAIL Starter Kit API with MongoDB Backend",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

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


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "database": "MongoDB",
        "docs": "/docs",
    }
