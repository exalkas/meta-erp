"""Middleware for request/response logging and context management."""

import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from .logging import get_logger, log_request_start, log_request_end, RequestLogger


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging requests and responses."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.logger = get_logger("request_middleware")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log details."""
        # Generate request ID if not present
        request_id = request.headers.get("X-Request-ID") or RequestLogger.get_request_id()
        
        # Add request ID to request state
        request.state.request_id = request_id
        
        # Log request start
        start_time = time.time()
        log_request_start(self.logger, request, request_id)
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            # Log request completion
            log_request_end(
                self.logger,
                request,
                request_id,
                response.status_code,
                duration_ms,
            )
            
            return response
            
        except Exception as exc:
            # Calculate duration for failed requests
            duration_ms = (time.time() - start_time) * 1000
            
            # Log request failure
            self.logger.bind_request_context(request, request_id).exception(
                "Request failed with exception",
                duration_ms=duration_ms,
                exception_type=type(exc).__name__,
                exception_message=str(exc),
            )
            
            # Re-raise the exception to be handled by error handlers
            raise


class TenantContextMiddleware(BaseHTTPMiddleware):
    """Middleware for extracting and validating tenant context."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.logger = get_logger("tenant_middleware")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Extract tenant context from request."""
        # Extract tenant ID from header
        tenant_id = request.headers.get("X-Tenant-ID")
        
        # Add tenant context to request state
        request.state.tenant_id = tenant_id
        
        # For public endpoints, tenant_id is optional
        public_paths = ["/health", "/docs", "/openapi.json", "/", "/auth"]
        is_public = any(request.url.path.startswith(path) for path in public_paths)
        
        if not is_public and not tenant_id:
            # For non-public endpoints, log missing tenant ID
            self.logger.bind_request_context(request).warning(
                "Request missing tenant ID",
                path=request.url.path,
                headers=dict(request.headers),
            )
        
        # Process request
        response = await call_next(request)
        
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware for adding security headers."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Add security headers to response."""
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Content Security Policy for API
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "connect-src 'self'; "
            "font-src 'self'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
        
        return response


class CORSHeadersMiddleware(BaseHTTPMiddleware):
    """Custom CORS middleware with tenant-aware headers."""
    
    def __init__(self, app: ASGIApp, allowed_origins: list = None):
        super().__init__(app)
        self.allowed_origins = allowed_origins or ["http://localhost:3000", "http://localhost:3001", "http://localhost:3006"]
        self.logger = get_logger("cors_middleware")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Handle CORS with tenant context."""
        origin = request.headers.get("Origin")
        
        # Handle preflight requests
        if request.method == "OPTIONS":
            response = Response()
            
            # Check if origin is allowed
            if origin in self.allowed_origins:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                response.headers["Access-Control-Allow-Headers"] = (
                    "Authorization, Content-Type, X-Tenant-ID, X-Request-ID, X-User-ID"
                )
                response.headers["Access-Control-Max-Age"] = "3600"
            else:
                self.logger.warning(
                    "CORS: Origin not allowed",
                    origin=origin,
                    allowed_origins=self.allowed_origins,
                )
            
            return response
        
        # Process actual request
        response = await call_next(request)
        
        # Add CORS headers to response
        if origin in self.allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Expose-Headers"] = "X-Request-ID, X-Total-Count"
        
        return response


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware for monitoring API performance."""
    
    def __init__(self, app: ASGIApp, slow_request_threshold_ms: float = 1000.0):
        super().__init__(app)
        self.slow_request_threshold_ms = slow_request_threshold_ms
        self.logger = get_logger("performance_middleware")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Monitor request performance."""
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000
        
        # Add performance headers
        response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"
        
        # Log slow requests
        if duration_ms > self.slow_request_threshold_ms:
            self.logger.bind_request_context(request).warning(
                "Slow request detected",
                duration_ms=duration_ms,
                threshold_ms=self.slow_request_threshold_ms,
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
            )
        
        return response 