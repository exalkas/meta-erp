"""Structured logging configuration for API service."""

import json
import logging
import sys
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

import structlog
from structlog.types import FilteringBoundLogger
from fastapi import Request

from .config import get_settings

# Configure structlog
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(colors=True) if get_settings().debug else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)


class RequestLogger:
    """Request logging utilities."""
    
    @staticmethod
    def get_request_id() -> str:
        """Generate unique request ID."""
        return str(uuid.uuid4())
    
    @staticmethod
    def extract_tenant_id(request: Request) -> Optional[str]:
        """Extract tenant ID from request headers or token."""
        # Try header first
        tenant_id = request.headers.get("X-Tenant-ID")
        if tenant_id:
            return tenant_id
            
        # Try from JWT token if available
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            # TODO: Decode JWT and extract tenant_id
            # For now, return None - will be implemented with auth service
            pass
            
        return None
    
    @staticmethod
    def extract_user_id(request: Request) -> Optional[str]:
        """Extract user ID from JWT token."""
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            # TODO: Decode JWT and extract user_id
            # For now, return None - will be implemented with auth service
            pass
            
        return None


class MetadataLogger:
    """Metadata-aware logger with context."""
    
    def __init__(self, name: str):
        self.name = name
        self.logger: FilteringBoundLogger = structlog.get_logger(name)
    
    def bind_request_context(
        self,
        request: Request,
        request_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> "MetadataLogger":
        """Bind request context to logger."""
        context = {
            "request_id": request_id or RequestLogger.get_request_id(),
            "method": request.method,
            "url": str(request.url),
            "user_agent": request.headers.get("User-Agent"),
            "client_ip": request.client.host if request.client else None,
            "tenant_id": tenant_id or RequestLogger.extract_tenant_id(request),
            "user_id": user_id or RequestLogger.extract_user_id(request),
        }
        
        # Remove None values
        context = {k: v for k, v in context.items() if v is not None}
        
        new_logger = MetadataLogger(self.name)
        new_logger.logger = self.logger.bind(**context)
        return new_logger
    
    def bind_tenant_context(self, tenant_id: str, entity_name: Optional[str] = None) -> "MetadataLogger":
        """Bind tenant-specific context."""
        context = {"tenant_id": tenant_id}
        if entity_name:
            context["entity_name"] = entity_name
            
        new_logger = MetadataLogger(self.name)
        new_logger.logger = self.logger.bind(**context)
        return new_logger
    
    def bind_operation_context(
        self,
        operation: str,
        entity_name: Optional[str] = None,
        entity_id: Optional[str] = None,
    ) -> "MetadataLogger":
        """Bind operation context for metadata operations."""
        context = {"operation": operation}
        if entity_name:
            context["entity_name"] = entity_name
        if entity_id:
            context["entity_id"] = entity_id
            
        new_logger = MetadataLogger(self.name)
        new_logger.logger = self.logger.bind(**context)
        return new_logger
    
    def debug(self, message: str, **kwargs):
        """Log debug message."""
        self.logger.debug(message, **kwargs)
    
    def info(self, message: str, **kwargs):
        """Log info message."""
        self.logger.info(message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log warning message."""
        self.logger.warning(message, **kwargs)
    
    def error(self, message: str, **kwargs):
        """Log error message."""
        self.logger.error(message, **kwargs)
    
    def critical(self, message: str, **kwargs):
        """Log critical message."""
        self.logger.critical(message, **kwargs)
    
    def exception(self, message: str, **kwargs):
        """Log exception with traceback."""
        self.logger.exception(message, **kwargs)
    
    def log_metadata_operation(
        self,
        operation: str,
        entity_type: Optional[str] = None,
        entity_name: Optional[str] = None,
        tenant_id: Optional[str] = None,
        field_count: Optional[int] = None,
        layout_sections: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> None:
        """Log metadata-specific operations."""
        context = {
            "operation": operation,
            "entity_type": entity_type,
            "entity_name": entity_name,
            "tenant_id": tenant_id,
            "field_count": field_count,
            "layout_sections": layout_sections,
        }
        
        if metadata:
            context.update(metadata)
        
        context.update(kwargs)
        
        # Remove None values
        context = {k: v for k, v in context.items() if v is not None}
        
        self.logger.info(f"Metadata {operation}", **context)


def get_logger(name: str = "metadata_erp") -> MetadataLogger:
    """Get a configured metadata logger."""
    return MetadataLogger(name)


def log_request_start(
    logger: MetadataLogger,
    request: Request,
    request_id: str,
) -> None:
    """Log request start."""
    request_logger = logger.bind_request_context(request, request_id)
    request_logger.info(
        "Request started",
        content_type=request.headers.get("Content-Type"),
        content_length=request.headers.get("Content-Length"),
    )


def log_request_end(
    logger: MetadataLogger,
    request: Request,
    request_id: str,
    status_code: int,
    duration_ms: float,
) -> None:
    """Log request completion."""
    request_logger = logger.bind_request_context(request, request_id)
    
    log_level = "info"
    if status_code >= 500:
        log_level = "error"
    elif status_code >= 400:
        log_level = "warning"
    
    getattr(request_logger, log_level)(
        "Request completed",
        status_code=status_code,
        duration_ms=duration_ms,
    )


def log_database_operation(
    logger: MetadataLogger,
    operation: str,
    table_name: str,
    tenant_id: Optional[str] = None,
    query_duration_ms: Optional[float] = None,
    **kwargs,
) -> None:
    """Log database operations."""
    context = {
        "operation": operation,
        "table_name": table_name,
        "tenant_id": tenant_id,
    }
    
    if query_duration_ms is not None:
        context["query_duration_ms"] = query_duration_ms
    
    context.update(kwargs)
    
    op_logger = logger.logger.bind(**{k: v for k, v in context.items() if v is not None})
    op_logger.info(f"Database {operation.lower()}")


def log_metadata_operation(
    logger: MetadataLogger,
    operation: str,
    entity_name: str,
    tenant_id: Optional[str] = None,
    field_count: Optional[int] = None,
    layout_sections: Optional[int] = None,
    **kwargs,
) -> None:
    """Log metadata-specific operations."""
    context = {
        "operation": operation,
        "entity_name": entity_name,
        "tenant_id": tenant_id,
        "component": "metadata_engine",
    }
    
    if field_count is not None:
        context["field_count"] = field_count
    if layout_sections is not None:
        context["layout_sections"] = layout_sections
        
    context.update(kwargs)
    
    meta_logger = logger.logger.bind(**{k: v for k, v in context.items() if v is not None})
    meta_logger.info(f"Metadata {operation.lower()}")


def setup_logging() -> None:
    """Setup application logging configuration."""
    settings = get_settings()
    
    # Configure Python logging
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        format="%(message)s",
        stream=sys.stdout,
    )
    
    # Disable SQLAlchemy echo logging in production
    if not settings.debug:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer(colors=True) if settings.debug else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.log_level.upper())
        ),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    ) 