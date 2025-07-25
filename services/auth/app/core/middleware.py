"""
Authentication Service Middleware

Custom middleware for request logging and security in the auth service.
"""

import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import get_logger, get_auth_logger

logger = get_logger("auth_middleware")
auth_logger = get_auth_logger("auth_middleware")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests and responses for debugging and security auditing."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Get client information
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Start timing
        start_time = time.time()
        
        # Log request start
        logger.info(
            "Request started",
            request_id=request_id,
            method=request.method,
            url=str(request.url),
            client_ip=client_ip,
            user_agent=user_agent,
        )
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            # Log request completion
            logger.info(
                "Request completed",
                request_id=request_id,
                method=request.method,
                url=str(request.url),
                status_code=response.status_code,
                duration_ms=round(duration_ms, 2),
                client_ip=client_ip,
            )
            
            return response
            
        except Exception as exc:
            # Calculate duration for failed requests
            duration_ms = (time.time() - start_time) * 1000
            
            # Log request failure
            logger.error(
                "Request failed with exception",
                request_id=request_id,
                method=request.method,
                url=str(request.url),
                duration_ms=round(duration_ms, 2),
                client_ip=client_ip,
                exception_type=type(exc).__name__,
                exception_message=str(exc),
            )
            
            raise


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none';"
        )
        
        # Add custom auth service headers
        response.headers["X-Auth-Service"] = "Metadata-ERP-Auth/1.0.0"
        
        return response


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Basic rate limiting for authentication endpoints."""
    
    def __init__(self, app, max_requests: int = 10, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.request_counts = {}  # In production, use Redis
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Only apply rate limiting to auth endpoints
        if not request.url.path.startswith("/auth/"):
            return await call_next(request)
        
        # Check rate limit
        current_time = time.time()
        window_start = current_time - self.window_seconds
        
        # Clean old entries
        self.request_counts = {
            ip: [(timestamp, path) for timestamp, path in requests 
                if timestamp > window_start]
            for ip, requests in self.request_counts.items()
        }
        
        # Count requests for this IP
        client_requests = self.request_counts.get(client_ip, [])
        
        if len(client_requests) >= self.max_requests:
            logger.warning(
                "Rate limit exceeded",
                client_ip=client_ip,
                path=request.url.path,
                request_count=len(client_requests),
                max_requests=self.max_requests
            )
            
            # Return rate limit error
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "message": "Rate limit exceeded. Please try again later.",
                        "code": "RATE_LIMIT_EXCEEDED"
                    },
                    "success": False
                }
            )
        
        # Add this request to the count
        client_requests.append((current_time, request.url.path))
        self.request_counts[client_ip] = client_requests
        
        # Process request
        return await call_next(request)


class AuthenticationLoggingMiddleware(BaseHTTPMiddleware):
    """Special logging for authentication events."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only process auth endpoints
        if not request.url.path.startswith("/auth/"):
            return await call_next(request)
        
        # Get client information
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Process request
        response = await call_next(request)
        
        # Log specific auth events based on endpoint and status
        endpoint = request.url.path
        status_code = response.status_code
        
        if endpoint == "/auth/login":
            if status_code == 200:
                auth_logger.logger.info(
                    "Successful login attempt",
                    endpoint=endpoint,
                    client_ip=client_ip,
                    user_agent=user_agent,
                    status_code=status_code
                )
            else:
                auth_logger.logger.warning(
                    "Failed login attempt",
                    endpoint=endpoint,
                    client_ip=client_ip,
                    user_agent=user_agent,
                    status_code=status_code
                )
        
        elif endpoint == "/auth/logout":
            auth_logger.logger.info(
                "Logout attempt",
                endpoint=endpoint,
                client_ip=client_ip,
                status_code=status_code
            )
        
        elif endpoint.startswith("/auth/magic-link"):
            auth_logger.logger.info(
                "Magic link operation",
                endpoint=endpoint,
                client_ip=client_ip,
                status_code=status_code
            )
        
        return response 