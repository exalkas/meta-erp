"""Custom exceptions and error handling for API service."""

from typing import Any, Dict, List, Optional, Union
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import traceback

from .logging import get_logger


class MetadataERPException(Exception):
    """Base exception for Metadata ERP system."""
    
    def __init__(
        self,
        message: str,
        error_code: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
        tenant_id: Optional[str] = None,
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        self.tenant_id = tenant_id
        super().__init__(self.message)


class ValidationException(MetadataERPException):
    """Validation related exceptions."""
    
    def __init__(
        self,
        message: str = "Validation failed",
        field_errors: Optional[List[Dict[str, Any]]] = None,
        tenant_id: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"field_errors": field_errors or []},
            tenant_id=tenant_id,
        )


class TenantNotFoundException(MetadataERPException):
    """Tenant not found exception."""
    
    def __init__(self, tenant_id: str):
        super().__init__(
            message=f"Tenant not found: {tenant_id}",
            error_code="TENANT_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"tenant_id": tenant_id},
            tenant_id=tenant_id,
        )


class EntityNotFoundException(MetadataERPException):
    """Entity not found exception."""
    
    def __init__(self, entity_name: str, tenant_id: Optional[str] = None):
        super().__init__(
            message=f"Entity not found: {entity_name}",
            error_code="ENTITY_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"entity_name": entity_name},
            tenant_id=tenant_id,
        )


class RecordNotFoundException(MetadataERPException):
    """Record not found exception."""
    
    def __init__(
        self,
        entity_name: str,
        record_id: str,
        tenant_id: Optional[str] = None,
    ):
        super().__init__(
            message=f"Record not found: {entity_name}#{record_id}",
            error_code="RECORD_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={
                "entity_name": entity_name,
                "record_id": record_id,
            },
            tenant_id=tenant_id,
        )


class FieldNotFoundException(MetadataERPException):
    """Field definition not found exception."""
    
    def __init__(
        self,
        entity_name: str,
        field_name: str,
        tenant_id: Optional[str] = None,
    ):
        super().__init__(
            message=f"Field not found: {entity_name}.{field_name}",
            error_code="FIELD_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={
                "entity_name": entity_name,
                "field_name": field_name,
            },
            tenant_id=tenant_id,
        )


class LayoutNotFoundException(MetadataERPException):
    """Layout definition not found exception."""
    
    def __init__(
        self,
        entity_name: str,
        layout_name: str,
        tenant_id: Optional[str] = None,
    ):
        super().__init__(
            message=f"Layout not found: {entity_name}.{layout_name}",
            error_code="LAYOUT_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={
                "entity_name": entity_name,
                "layout_name": layout_name,
            },
            tenant_id=tenant_id,
        )


class AuthenticationException(MetadataERPException):
    """Authentication related exceptions."""
    
    def __init__(
        self,
        message: str = "Authentication failed",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_ERROR",
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details,
        )


class AuthorizationException(MetadataERPException):
    """Authorization related exceptions."""
    
    def __init__(
        self,
        message: str = "Access denied",
        resource: Optional[str] = None,
        action: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ):
        details = {}
        if resource:
            details["resource"] = resource
        if action:
            details["action"] = action
            
        super().__init__(
            message=message,
            error_code="AUTHORIZATION_ERROR",
            status_code=status.HTTP_403_FORBIDDEN,
            details=details,
            tenant_id=tenant_id,
        )


class BusinessRuleException(MetadataERPException):
    """Business rule violation exceptions."""
    
    def __init__(
        self,
        message: str,
        rule_name: str,
        entity_name: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ):
        details = {"rule_name": rule_name}
        if entity_name:
            details["entity_name"] = entity_name
            
        super().__init__(
            message=message,
            error_code="BUSINESS_RULE_VIOLATION",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
            tenant_id=tenant_id,
        )


class DatabaseException(MetadataERPException):
    """Database related exceptions."""
    
    def __init__(
        self,
        message: str = "Database operation failed",
        operation: Optional[str] = None,
        table_name: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ):
        details = {}
        if operation:
            details["operation"] = operation
        if table_name:
            details["table_name"] = table_name
            
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
            tenant_id=tenant_id,
        )


class ExternalServiceException(MetadataERPException):
    """External service integration exceptions."""
    
    def __init__(
        self,
        message: str,
        service_name: str,
        service_error_code: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ):
        details = {"service_name": service_name}
        if service_error_code:
            details["service_error_code"] = service_error_code
            
        super().__init__(
            message=message,
            error_code="EXTERNAL_SERVICE_ERROR",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details,
            tenant_id=tenant_id,
        )


class ConfigurationException(MetadataERPException):
    """Configuration related exceptions."""
    
    def __init__(
        self,
        message: str,
        config_key: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ):
        details = {}
        if config_key:
            details["config_key"] = config_key
            
        super().__init__(
            message=message,
            error_code="CONFIGURATION_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
            tenant_id=tenant_id,
        )


def create_error_response(
    error: Union[MetadataERPException, Exception],
    request_id: Optional[str] = None,
    include_details: bool = True,
) -> Dict[str, Any]:
    """Create standardized error response."""
    
    if isinstance(error, MetadataERPException):
        response = {
            "error": {
                "code": error.error_code,
                "message": error.message,
                "status_code": error.status_code,
            }
        }
        
        if include_details and error.details:
            response["error"]["details"] = error.details
            
        if error.tenant_id:
            response["error"]["tenant_id"] = error.tenant_id
            
    else:
        # Handle unexpected exceptions
        response = {
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            }
        }
        
        if include_details:
            response["error"]["details"] = {
                "exception_type": type(error).__name__,
                "exception_message": str(error),
            }
    
    if request_id:
        response["request_id"] = request_id
    
    response["timestamp"] = "2024-01-01T00:00:00Z"  # Will be replaced with actual timestamp
    
    return response


async def metadata_exception_handler(
    request: Request,
    exc: MetadataERPException,
) -> JSONResponse:
    """Handle MetadataERP exceptions."""
    logger = get_logger("exception_handler")
    
    # Extract request ID from headers or generate new one
    request_id = request.headers.get("X-Request-ID")
    
    # Log the exception
    logger.bind_request_context(request, request_id).error(
        "Handled exception",
        error_code=exc.error_code,
        error_message=exc.message,
        status_code=exc.status_code,
        tenant_id=exc.tenant_id,
        exception_details=exc.details,
    )
    
    response_data = create_error_response(
        exc,
        request_id=request_id,
        include_details=True,
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=response_data,
    )


async def general_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """Handle general exceptions."""
    logger = get_logger("exception_handler")
    
    # Extract request ID from headers or generate new one
    request_id = request.headers.get("X-Request-ID")
    
    # Log the exception with full traceback
    logger.bind_request_context(request, request_id).exception(
        "Unhandled exception",
        exception_type=type(exc).__name__,
        exception_message=str(exc),
    )
    
    response_data = create_error_response(
        exc,
        request_id=request_id,
        include_details=False,  # Don't expose internal details in production
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=response_data,
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Handle FastAPI validation errors."""
    logger = get_logger("exception_handler")
    
    request_id = request.headers.get("X-Request-ID")
    
    # Convert FastAPI validation errors to our format
    field_errors = []
    for error in exc.errors():
        field_errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
            "input": error.get("input"),
        })
    
    validation_exc = ValidationException(
        message="Request validation failed",
        field_errors=field_errors,
    )
    
    logger.bind_request_context(request, request_id).warning(
        "Validation error",
        field_errors=field_errors,
    )
    
    response_data = create_error_response(
        validation_exc,
        request_id=request_id,
        include_details=True,
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=response_data,
    )


async def http_exception_handler(
    request: Request,
    exc: HTTPException,
) -> JSONResponse:
    """Handle FastAPI HTTP exceptions."""
    logger = get_logger("exception_handler")
    
    request_id = request.headers.get("X-Request-ID")
    
    logger.bind_request_context(request, request_id).warning(
        "HTTP exception",
        status_code=exc.status_code,
        detail=exc.detail,
    )
    
    response_data = {
        "error": {
            "code": f"HTTP_{exc.status_code}",
            "message": exc.detail,
            "status_code": exc.status_code,
        },
        "timestamp": "2024-01-01T00:00:00Z",
    }
    
    if request_id:
        response_data["request_id"] = request_id
    
    return JSONResponse(
        status_code=exc.status_code,
        content=response_data,
    ) 