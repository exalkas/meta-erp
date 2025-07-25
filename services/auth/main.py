"""
Authentication Service - Metadata-Driven Platform

FastAPI service for handling authentication, JWT tokens, and session management.
Implements one-user-one-session security policy.
"""

from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import uvicorn
import os

from app.core.config import get_auth_settings
from app.core.database import create_tables, check_db_connection
from app.core.logging import setup_logging, get_logger
from app.core.exceptions import (
    AuthenticationException,
    auth_exception_handler,
    general_exception_handler,
    validation_exception_handler,
    http_exception_handler,
)
from app.core.middleware import (
    RequestLoggingMiddleware,
    SecurityHeadersMiddleware,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Setup logging first
    setup_logging()
    logger = get_logger("auth_startup")
    
    # Startup
    logger.info("Starting Authentication Service...")
    
    # Check database connection
    if not await check_db_connection():
        logger.critical("Database connection failed!")
        raise Exception("Database connection failed")
    logger.info("Database connection successful")
    
    # Create tables
    await create_tables()
    logger.info("Database tables created/verified")
    
    logger.info("Authentication Service startup completed")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Authentication Service...")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    settings = get_auth_settings()
    
    app = FastAPI(
        title="Authentication Service",
        version="1.0.0",
        description="JWT Authentication service with session management for metadata-driven platform",
        debug=settings.debug,
        lifespan=lifespan,
    )
    
    # Add custom middleware (order matters - reverse of execution order)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add auth routes
    from app.api.auth import router as auth_router
    app.include_router(auth_router, prefix="/auth")
    
    # Add exception handlers
    app.add_exception_handler(AuthenticationException, auth_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
    
    # Health check endpoint
    @app.get("/health")
    async def health_check() -> Dict[str, Any]:
        """Health check endpoint."""
        logger = get_logger("health_check")
        
        try:
            db_healthy = await check_db_connection()
            
            status = "healthy" if db_healthy else "unhealthy"
            
            health_data = {
                "service": "Authentication Service",
                "status": status,
                "version": "1.0.0",
                "environment": settings.env,
                "database": "connected" if db_healthy else "disconnected",
                "timestamp": "2024-01-01T00:00:00Z",  # Will be replaced with actual timestamp
            }
            
            if db_healthy:
                logger.debug("Health check passed")
            else:
                logger.warning("Health check failed - database disconnected")
            
            return health_data
            
        except Exception as exc:
            logger.exception("Health check failed with exception")
            return {
                "service": "Authentication Service",
                "status": "unhealthy",
                "version": "1.0.0",
                "environment": settings.env,
                "database": "error",
                "error": str(exc),
                "timestamp": "2024-01-01T00:00:00Z",
            }
    
    # Root endpoint
    @app.get("/")
    async def root() -> Dict[str, str]:
        """Root endpoint."""
        logger = get_logger("root_endpoint")
        logger.debug("Root endpoint accessed")
        
        return {
            "service": "Authentication Service",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/health",
            "auth": "/auth",
            "status": "running",
            "timestamp": "2024-01-01T00:00:00Z",
        }
    
    return app


# Create the application instance
app = create_app()


if __name__ == "__main__":
    settings = get_auth_settings()
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,  # Auth service port
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    ) 