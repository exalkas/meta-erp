"""Main FastAPI application for API service."""

from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import uvicorn

from app.core.config import get_settings
from app.core.database import create_tables, check_db_connection
from app.core.logging import setup_logging, get_logger
from app.core.exceptions import (
    MetadataERPException,
    metadata_exception_handler,
    general_exception_handler,
    validation_exception_handler,
    http_exception_handler,
)
from app.core.middleware import (
    RequestLoggingMiddleware,
    TenantContextMiddleware,
    SecurityHeadersMiddleware,
    PerformanceMonitoringMiddleware,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Setup logging first
    setup_logging()
    logger = get_logger("startup")
    
    # Startup
    logger.info("Starting Metadata ERP API Service...")
    
    # Check database connection
    if not await check_db_connection():
        logger.critical("Database connection failed!")
        raise Exception("Database connection failed")
    logger.info("Database connection successful")
    
    # Create tables
    await create_tables()
    logger.info("Database tables created/verified")
    
    logger.info("API Service startup completed")
    
    yield
    
    # Shutdown
    logger.info("Shutting down API Service...")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Core API service for metadata-driven CRM+ERP system",
        debug=settings.debug,
        lifespan=lifespan,
    )
    
    # Add custom middleware (order matters - reverse of execution order)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(PerformanceMonitoringMiddleware, slow_request_threshold_ms=1000.0)
    app.add_middleware(TenantContextMiddleware)
    # Temporarily disabled due to logging attribute error
    # app.add_middleware(RequestLoggingMiddleware)
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add API routes
    from app.api.auth import router as auth_router
    from app.api.metadata import router as metadata_router
    from app.api.roles import router as roles_router
    app.include_router(auth_router)
    app.include_router(metadata_router)
    app.include_router(roles_router)
    
    # Add exception handlers
    app.add_exception_handler(MetadataERPException, metadata_exception_handler)
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
                "service": settings.service_name,
                "status": status,
                "version": settings.app_version,
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
                "service": settings.service_name,
                "status": "unhealthy",
                "version": settings.app_version,
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
            "service": "Metadata ERP API",
            "version": settings.app_version,
            "docs": "/docs",
            "health": "/health",
            "status": "running",
            "timestamp": "2024-01-01T00:00:00Z",
        }
    
    # Exception handlers
    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc):
        return JSONResponse(
            status_code=404,
            content={"detail": "Endpoint not found"}
        )
    
    @app.exception_handler(500)
    async def server_error_handler(request: Request, exc):
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )
    
    return app


# Create the application instance
app = create_app()


if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.service_port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    ) 