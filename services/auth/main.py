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

from app.core.config import get_settings
from app.core.database import init_database, check_database_health
from app.core.logging import configure_logging, get_logger
from app.core.exceptions import (
    AuthenticationException
)
from app.core.middleware import (
    RequestLoggingMiddleware,
    SecurityHeadersMiddleware,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Setup logging first
    configure_logging()
    logger = get_logger("auth_startup")
    
    # Startup
    logger.info("Starting Authentication Service...")
    
    # Initialize database (engine, connection, tables)
    await init_database()
    logger.info("Database initialization complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Authentication Service...")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title="Authentication Service",
        version="1.0.0",
        description="JWT Authentication service with session management for metadata-driven platform",
        debug=settings.DEBUG,
        lifespan=lifespan
    )
    
    # Add custom middleware (order matters - reverse of execution order)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add auth routes 
    from app.api.auth_routes import router as auth_router
    app.include_router(auth_router)
    
    # Register API routes (will be added later)
    # app.include_router(auth_routes.router)
    
    # Register exception handlers (will be implemented later)
    # app.add_exception_handler(AuthenticationException, auth_exception_handler)
    # app.add_exception_handler(RequestValidationError, validation_exception_handler)
    # app.add_exception_handler(HTTPException, http_exception_handler)
    # app.add_exception_handler(Exception, general_exception_handler)
    
    # Health check endpoint
    @app.get("/health")
    async def health_check() -> Dict[str, Any]:
        """Health check endpoint."""
        logger = get_logger("health_check")
        
        try:
            health_result = await check_database_health()
            
            status = "healthy" if health_result["status"] == "connected" else "unhealthy"
            
            health_data = {
                "service": "Authentication Service",
                "status": status,
                "version": "1.0.0",
                "environment": settings.ENVIRONMENT,
                "database": "connected" if health_result["status"] == "connected" else "disconnected",
                "timestamp": "2024-01-01T00:00:00Z",  # Will be replaced with actual timestamp
            }
            
            if health_result["status"] == "connected":
                logger.debug("Health check passed")
            else:
                logger.warning("Health check failed - database disconnected")
            
            return {
                "service": "Authentication Service",
                "status": "healthy" if health_data["status"] == "connected" else "degraded",
                "version": "1.0.0",
                "environment": settings.ENVIRONMENT,
                "database": health_data,
                "timestamp": "2024-01-01T00:00:00Z",
            }
            
        except Exception as exc:
            logger.error("Health check failed with exception", error=str(exc), exception_type=type(exc).__name__)
            return {
                "service": "Authentication Service",
                "status": "unhealthy",
                "version": "1.0.0",
                "environment": settings.ENVIRONMENT,
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
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="debug" if settings.DEBUG else "info"
    ) 