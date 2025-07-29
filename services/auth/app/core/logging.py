"""
SAP-Style Authentication Logging

Structured logging system for enterprise authentication with:
- Contextual logging with tenant/user tracking
- Security event logging
- Audit trail capabilities
- Performance monitoring
- Compliance logging
"""

import logging
import json
import time
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, Union
from contextvars import ContextVar
from functools import wraps

# Context variables for tracking across async calls
request_id_context: ContextVar[Optional[str]] = ContextVar('request_id', default=None)
tenant_id_context: ContextVar[Optional[str]] = ContextVar('tenant_id', default=None)
user_id_context: ContextVar[Optional[str]] = ContextVar('user_id', default=None)
session_id_context: ContextVar[Optional[str]] = ContextVar('session_id', default=None)

class SecurityEventType:
    """Security event types for compliance logging"""
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    PASSWORD_CHANGED = "password_changed"
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_UNLOCKED = "account_unlocked"
    PERMISSION_DENIED = "permission_denied"
    ROLE_CHANGED = "role_changed"
    SESSION_CREATED = "session_created"
    SESSION_EXPIRED = "session_expired"
    SESSION_REVOKED = "session_revoked"
    TWO_FACTOR_ENABLED = "two_factor_enabled"
    TWO_FACTOR_DISABLED = "two_factor_disabled"
    MAGIC_LINK_CREATED = "magic_link_created"
    MAGIC_LINK_USED = "magic_link_used"
    COMPLIANCE_VIOLATION = "compliance_violation"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"

class StructuredFormatter(logging.Formatter):
    """JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as structured JSON"""
        
        # Base log structure
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add context information
        if request_id := request_id_context.get():
            log_data["request_id"] = request_id
        if tenant_id := tenant_id_context.get():
            log_data["tenant_id"] = tenant_id
        if user_id := user_id_context.get():
            log_data["user_id"] = user_id
        if session_id := session_id_context.get():
            log_data["session_id"] = session_id
        
        # Add exception information
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": self.formatException(record.exc_info)
            }
        
        # Add custom fields from extra
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 
                          'filename', 'module', 'exc_info', 'exc_text', 'stack_info',
                          'lineno', 'funcName', 'created', 'msecs', 'relativeCreated',
                          'thread', 'threadName', 'processName', 'process', 'getMessage']:
                log_data[key] = value
        
        return json.dumps(log_data, ensure_ascii=False, default=str)

class AuthLogger:
    """Enhanced logger for authentication system"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        
        # Configure structured formatter if not already configured
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            handler.setFormatter(StructuredFormatter())
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)
        
        self.logger.propagate = False
    
    def _log_with_context(
        self,
        level: int,
        message: str,
        **kwargs
    ):
        """Log with additional context"""
        extra = {}
        
        # Add performance timing if available
        if 'start_time' in kwargs:
            extra['duration_ms'] = round((time.time() - kwargs.pop('start_time')) * 1000, 2)
        
        # Add all other kwargs as extra fields
        extra.update(kwargs)
        
        self.logger.log(level, message, extra=extra)
    
    def debug(self, message: str, **kwargs):
        """Debug level logging"""
        self._log_with_context(logging.DEBUG, message, **kwargs)
    
    def info(self, message: str, **kwargs):
        """Info level logging"""
        self._log_with_context(logging.INFO, message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Warning level logging"""
        self._log_with_context(logging.WARNING, message, **kwargs)
    
    def error(self, message: str, **kwargs):
        """Error level logging"""
        self._log_with_context(logging.ERROR, message, **kwargs)
    
    def critical(self, message: str, **kwargs):
        """Critical level logging"""
        self._log_with_context(logging.CRITICAL, message, **kwargs)
    
    def security_event(
        self,
        event_type: str,
        event_result: str = "success",
        **kwargs
    ):
        """Log security-specific events for audit trails"""
        self._log_with_context(
            logging.INFO,
            f"Security event: {event_type}",
            event_type=event_type,
            event_category="security",
            event_result=event_result,
            **kwargs
        )
    
    def performance(
        self,
        operation: str,
        duration_ms: float,
        **kwargs
    ):
        """Log performance metrics"""
        self._log_with_context(
            logging.INFO,
            f"Performance: {operation}",
            operation=operation,
            duration_ms=duration_ms,
            category="performance",
            **kwargs
        )
    
    def audit(
        self,
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        result: str = "success",
        **kwargs
    ):
        """Log audit events for compliance"""
        self._log_with_context(
            logging.INFO,
            f"Audit: {action}",
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            result=result,
            category="audit",
            **kwargs
        )
    
    def compliance(
        self,
        compliance_type: str,
        status: str,
        **kwargs
    ):
        """Log compliance-related events"""
        self._log_with_context(
            logging.INFO,
            f"Compliance: {compliance_type} - {status}",
            compliance_type=compliance_type,
            compliance_status=status,
            category="compliance",
            **kwargs
        )

def get_logger(name: str) -> AuthLogger:
    """Get an enhanced authentication logger"""
    return AuthLogger(name)

def set_context(
    request_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None
):
    """Set logging context for current request"""
    if request_id:
        request_id_context.set(request_id)
    if tenant_id:
        tenant_id_context.set(tenant_id)
    if user_id:
        user_id_context.set(user_id)
    if session_id:
        session_id_context.set(session_id)

def clear_context():
    """Clear logging context"""
    request_id_context.set(None)
    tenant_id_context.set(None)
    user_id_context.set(None)
    session_id_context.set(None)

def log_performance(operation_name: str):
    """Decorator to log performance of operations"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            logger = get_logger(func.__module__)
            start_time = time.time()
            
            try:
                result = await func(*args, **kwargs)
                duration_ms = round((time.time() - start_time) * 1000, 2)
                
                logger.performance(
                    operation=operation_name,
                    duration_ms=duration_ms,
                    success=True
                )
                
                return result
            except Exception as e:
                duration_ms = round((time.time() - start_time) * 1000, 2)
                
                logger.performance(
                    operation=operation_name,
                    duration_ms=duration_ms,
                    success=False,
                    error_type=type(e).__name__,
                    error_message=str(e)
                )
                
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            logger = get_logger(func.__module__)
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                duration_ms = round((time.time() - start_time) * 1000, 2)
                
                logger.performance(
                    operation=operation_name,
                    duration_ms=duration_ms,
                    success=True
                )
                
                return result
            except Exception as e:
                duration_ms = round((time.time() - start_time) * 1000, 2)
                
                logger.performance(
                    operation=operation_name,
                    duration_ms=duration_ms,
                    success=False,
                    error_type=type(e).__name__,
                    error_message=str(e)
                )
                
                raise
        
        # Return appropriate wrapper based on function type
        if hasattr(func, '__code__') and func.__code__.co_flags & 0x80:  # CO_COROUTINE
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

def log_security_event(event_type: str, result: str = "success"):
    """Decorator to log security events"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            logger = get_logger(func.__module__)
            
            try:
                result_data = await func(*args, **kwargs)
                
                logger.security_event(
                    event_type=event_type,
                    event_result=result,
                    function=func.__name__
                )
                
                return result_data
            except Exception as e:
                logger.security_event(
                    event_type=event_type,
                    event_result="failure",
                    function=func.__name__,
                    error_type=type(e).__name__,
                    error_message=str(e)
                )
                
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            logger = get_logger(func.__module__)
            
            try:
                result_data = func(*args, **kwargs)
                
                logger.security_event(
                    event_type=event_type,
                    event_result=result,
                    function=func.__name__
                )
                
                return result_data
            except Exception as e:
                logger.security_event(
                    event_type=event_type,
                    event_result="failure",
                    function=func.__name__,
                    error_type=type(e).__name__,
                    error_message=str(e)
                )
                
                raise
        
        # Return appropriate wrapper based on function type
        if hasattr(func, '__code__') and func.__code__.co_flags & 0x80:  # CO_COROUTINE
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

def log_audit_event(action: str, resource_type: Optional[str] = None):
    """Decorator to log audit events"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            logger = get_logger(func.__module__)
            
            try:
                result = await func(*args, **kwargs)
                
                # Try to extract resource_id from result or args
                resource_id = None
                if hasattr(result, 'id'):
                    resource_id = str(result.id)
                elif hasattr(result, 'user_id'):
                    resource_id = str(result.user_id)
                
                logger.audit(
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    result="success",
                    function=func.__name__
                )
                
                return result
            except Exception as e:
                logger.audit(
                    action=action,
                    resource_type=resource_type,
                    result="failure",
                    function=func.__name__,
                    error_type=type(e).__name__,
                    error_message=str(e)
                )
                
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            logger = get_logger(func.__module__)
            
            try:
                result = func(*args, **kwargs)
                
                # Try to extract resource_id from result or args
                resource_id = None
                if hasattr(result, 'id'):
                    resource_id = str(result.id)
                elif hasattr(result, 'user_id'):
                    resource_id = str(result.user_id)
                
                logger.audit(
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    result="success",
                    function=func.__name__
                )
                
                return result
            except Exception as e:
                logger.audit(
                    action=action,
                    resource_type=resource_type,
                    result="failure",
                    function=func.__name__,
                    error_type=type(e).__name__,
                    error_message=str(e)
                )
                
                raise
        
        # Return appropriate wrapper based on function type
        if hasattr(func, '__code__') and func.__code__.co_flags & 0x80:  # CO_COROUTINE
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

class LogContext:
    """Context manager for setting logging context"""
    
    def __init__(
        self,
        request_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ):
        self.request_id = request_id
        self.tenant_id = tenant_id
        self.user_id = user_id
        self.session_id = session_id
        
        # Store previous values for restoration
        self.prev_request_id = None
        self.prev_tenant_id = None
        self.prev_user_id = None
        self.prev_session_id = None
    
    def __enter__(self):
        # Store current values
        self.prev_request_id = request_id_context.get()
        self.prev_tenant_id = tenant_id_context.get()
        self.prev_user_id = user_id_context.get()
        self.prev_session_id = session_id_context.get()
        
        # Set new values
        set_context(
            request_id=self.request_id,
            tenant_id=self.tenant_id,
            user_id=self.user_id,
            session_id=self.session_id
        )
        
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        # Restore previous values
        set_context(
            request_id=self.prev_request_id,
            tenant_id=self.prev_tenant_id,
            user_id=self.prev_user_id,
            session_id=self.prev_session_id
        )

# Configure root logger for the auth service
def configure_logging(level: str = "INFO", format_type: str = "structured"):
    """Configure logging for the auth service"""
    
    # Convert string level to logging constant
    log_level = getattr(logging, level.upper(), logging.INFO)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Add structured handler
    if format_type == "structured":
        handler = logging.StreamHandler()
        handler.setFormatter(StructuredFormatter())
        root_logger.addHandler(handler)
    else:
        # Simple format for development
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

# Example usage and testing
if __name__ == "__main__":
    # Configure logging
    configure_logging("DEBUG", "structured")
    
    # Create logger
    logger = get_logger("test")
    
    # Test context logging
    with LogContext(request_id="req-123", tenant_id="tenant-456", user_id="user-789"):
        logger.info("Test message with context")
        logger.security_event("login_success", user_email="test@example.com")
        logger.audit("user_created", resource_type="user", resource_id="user-789")
    
    # Test performance logging
    @log_performance("test_operation")
    async def test_operation():
        import asyncio
        await asyncio.sleep(0.1)
        return "success"
    
    # Test error logging
    try:
        raise ValueError("Test error")
    except Exception as e:
        logger.error("Test error occurred", exception_type=type(e).__name__) 