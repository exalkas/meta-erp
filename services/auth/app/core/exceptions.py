"""
Authentication Service Exceptions

Custom exceptions and handlers for authentication operations.
"""

from typing import Dict, Any, Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.logging import get_logger

logger = get_logger("auth_exceptions")


class AuthenticationException(Exception):
    """Base exception for authentication errors."""
    def __init__(
        self,
        message: str,
        error_code: str,
        status_code: int = status.HTTP_401_UNAUTHORIZED,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class InvalidCredentialsException(AuthenticationException):
    """Invalid email/password credentials."""
    def __init__(self, message: str = "Invalid email or password"):
        super().__init__(
            message=message,
            error_code="INVALID_CREDENTIALS",
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class AccountLockedException(AuthenticationException):
    """Account is locked due to too many failed attempts."""
    def __init__(self, unlock_time: str = None):
        details = {"unlock_time": unlock_time} if unlock_time else {}
        super().__init__(
            message="Account is locked due to too many failed login attempts",
            error_code="ACCOUNT_LOCKED",
            status_code=status.HTTP_423_LOCKED,
            details=details
        )


class InvalidTokenException(AuthenticationException):
    """Invalid or expired JWT token."""
    def __init__(self, message: str = "Invalid or expired token"):
        super().__init__(
            message=message,
            error_code="INVALID_TOKEN",
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class SessionExpiredException(AuthenticationException):
    """User session has expired."""
    def __init__(self):
        super().__init__(
            message="Session has expired. Please log in again.",
            error_code="SESSION_EXPIRED",
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class SingleSessionViolationException(AuthenticationException):
    """Another session is already active for this user."""
    def __init__(self):
        super().__init__(
            message="Another session is already active. Previous session has been terminated.",
            error_code="SINGLE_SESSION_VIOLATION",
            status_code=status.HTTP_409_CONFLICT
        )


class InvalidMagicLinkException(AuthenticationException):
    """Invalid or expired magic link."""
    def __init__(self):
        super().__init__(
            message="Invalid or expired magic link",
            error_code="INVALID_MAGIC_LINK",
            status_code=status.HTTP_400_BAD_REQUEST
        )


class PasswordValidationException(AuthenticationException):
    """Password doesn't meet security requirements."""
    def __init__(self, message: str = "Password doesn't meet security requirements"):
        super().__init__(
            message=message,
            error_code="PASSWORD_VALIDATION_FAILED",
            status_code=status.HTTP_400_BAD_REQUEST
        )


class UserNotFoundException(AuthenticationException):
    """User not found."""
    def __init__(self):
        super().__init__(
            message="User not found",
            error_code="USER_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND
        )


class EmailAlreadyExistsException(AuthenticationException):
    """Email already registered."""
    def __init__(self):
        super().__init__(
            message="Email address is already registered",
            error_code="EMAIL_ALREADY_EXISTS",
            status_code=status.HTTP_409_CONFLICT
        )


def create_error_response(
    message: str,
    error_code: str,
    status_code: int,
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """Create standardized error response."""
    error_response = {
        "error": {
            "message": message,
            "code": error_code,
            "details": details or {}
        },
        "success": False,
        "timestamp": "2024-01-01T00:00:00Z"  # Will be replaced with actual timestamp
    }
    
    if request_id:
        error_response["request_id"] = request_id
    
    return error_response


async def auth_exception_handler(request: Request, exc: AuthenticationException) -> JSONResponse:
    """Handle authentication exceptions."""
    request_id = getattr(request.state, 'request_id', None)
    
    logger.warning(
        "Authentication exception",
        error_code=exc.error_code,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=create_error_response(
            message=exc.message,
            error_code=exc.error_code,
            status_code=exc.status_code,
            details=exc.details,
            request_id=request_id
        )
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle request validation exceptions."""
    request_id = getattr(request.state, 'request_id', None)
    
    logger.warning(
        "Request validation failed",
        errors=exc.errors(),
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=create_error_response(
            message="Request validation failed",
            error_code="VALIDATION_ERROR",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"validation_errors": exc.errors()},
            request_id=request_id
        )
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions."""
    request_id = getattr(request.state, 'request_id', None)
    
    logger.warning(
        "HTTP exception",
        status_code=exc.status_code,
        detail=exc.detail,
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=create_error_response(
            message=str(exc.detail),
            error_code="HTTP_ERROR",
            status_code=exc.status_code,
            request_id=request_id
        )
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    request_id = getattr(request.state, 'request_id', None)
    
    logger.exception(
        "Unexpected exception",
        exception_type=type(exc).__name__,
        exception_message=str(exc),
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=create_error_response(
            message="Internal server error",
            error_code="INTERNAL_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            request_id=request_id
        )
    ) 