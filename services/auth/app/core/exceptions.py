"""
SAP-Style Authentication Exceptions

Comprehensive exception hierarchy for enterprise authentication system
with proper error codes, detailed messaging, and compliance tracking.
"""

from typing import Optional, Dict, Any, List
from enum import Enum

class ErrorCode(Enum):
    """Standardized error codes for authentication system"""
    
    # Authentication errors (1000-1999)
    INVALID_CREDENTIALS = "AUTH_1001"
    USER_NOT_FOUND = "AUTH_1002"
    PASSWORD_EXPIRED = "AUTH_1003"
    ACCOUNT_DISABLED = "AUTH_1004"
    ACCOUNT_LOCKED = "AUTH_1005"
    EMAIL_NOT_VERIFIED = "AUTH_1006"
    PHONE_NOT_VERIFIED = "AUTH_1007"
    
    # Two-factor authentication errors (2000-2999)
    TWO_FACTOR_REQUIRED = "AUTH_2001"
    INVALID_TOTP_CODE = "AUTH_2002"
    BACKUP_CODE_REQUIRED = "AUTH_2003"
    TWO_FACTOR_NOT_ENABLED = "AUTH_2004"
    
    # Session errors (3000-3999)
    SESSION_EXPIRED = "AUTH_3001"
    SESSION_INVALID = "AUTH_3002"
    SESSION_REVOKED = "AUTH_3003"
    MAX_SESSIONS_EXCEEDED = "AUTH_3004"
    CONCURRENT_SESSION_LIMIT = "AUTH_3005"
    
    # Magic link errors (4000-4999)
    MAGIC_LINK_EXPIRED = "AUTH_4001"
    MAGIC_LINK_INVALID = "AUTH_4002"
    MAGIC_LINK_USED = "AUTH_4003"
    MAGIC_LINK_REVOKED = "AUTH_4004"
    
    # Authorization errors (5000-5999)
    INSUFFICIENT_PERMISSIONS = "AUTH_5001"
    ROLE_NOT_FOUND = "AUTH_5002"
    PERMISSION_DENIED = "AUTH_5003"
    RESOURCE_ACCESS_DENIED = "AUTH_5004"
    TENANT_ACCESS_DENIED = "AUTH_5005"
    
    # Compliance errors (6000-6999)
    COMPLIANCE_VIOLATION = "AUTH_6001"
    KYC_REQUIRED = "AUTH_6002"
    DOCUMENT_VERIFICATION_REQUIRED = "AUTH_6003"
    TERMS_ACCEPTANCE_REQUIRED = "AUTH_6004"
    PRIVACY_ACCEPTANCE_REQUIRED = "AUTH_6005"
    RISK_ASSESSMENT_REQUIRED = "AUTH_6006"
    
    # Validation errors (7000-7999)
    INVALID_EMAIL_FORMAT = "AUTH_7001"
    INVALID_PHONE_FORMAT = "AUTH_7002"
    PASSWORD_TOO_WEAK = "AUTH_7003"
    PASSWORD_POLICY_VIOLATION = "AUTH_7004"
    INVALID_USER_DATA = "AUTH_7005"
    
    # Rate limiting errors (8000-8999)
    RATE_LIMIT_EXCEEDED = "AUTH_8001"
    TOO_MANY_ATTEMPTS = "AUTH_8002"
    TEMPORARY_LOCKOUT = "AUTH_8003"
    
    # System errors (9000-9999)
    INTERNAL_ERROR = "AUTH_9001"
    DATABASE_ERROR = "AUTH_9002"
    EXTERNAL_SERVICE_ERROR = "AUTH_9003"
    CONFIGURATION_ERROR = "AUTH_9004"

class BaseAuthException(Exception):
    """Base exception for all authentication-related errors"""
    
    def __init__(
        self,
        message: str,
        error_code: ErrorCode,
        details: Optional[Dict[str, Any]] = None,
        tenant_id: Optional[str] = None,
        user_id: Optional[str] = None,
        correlation_id: Optional[str] = None
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        self.tenant_id = tenant_id
        self.user_id = user_id
        self.correlation_id = correlation_id
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API responses"""
        return {
            "error": {
                "code": self.error_code.value,
                "message": self.message,
                "details": self.details,
                "tenant_id": self.tenant_id,
                "user_id": self.user_id,
                "correlation_id": self.correlation_id
            }
        }

# =============================================
# AUTHENTICATION EXCEPTIONS
# =============================================

class AuthenticationException(BaseAuthException):
    """General authentication failure"""
    
    def __init__(self, message: str = "Authentication failed", **kwargs):
        super().__init__(
            message=message,
            error_code=ErrorCode.INVALID_CREDENTIALS,
            **kwargs
        )

class UserNotFoundException(BaseAuthException):
    """User not found in tenant"""
    
    def __init__(self, email: str, tenant_id: str, **kwargs):
        super().__init__(
            message=f"User {email} not found",
            error_code=ErrorCode.USER_NOT_FOUND,
            details={"email": email},
            tenant_id=tenant_id,
            **kwargs
        )

class AccountDisabledException(BaseAuthException):
    """User account is disabled"""
    
    def __init__(self, user_id: str, reason: str = "Account disabled", **kwargs):
        super().__init__(
            message=f"Account disabled: {reason}",
            error_code=ErrorCode.ACCOUNT_DISABLED,
            details={"reason": reason},
            user_id=user_id,
            **kwargs
        )

class AccountLockedException(BaseAuthException):
    """User account is locked due to security reasons"""
    
    def __init__(
        self,
        user_id: str,
        locked_until: Optional[str] = None,
        reason: str = "Too many failed attempts",
        **kwargs
    ):
        message = f"Account locked: {reason}"
        if locked_until:
            message += f" until {locked_until}"
        
        super().__init__(
            message=message,
            error_code=ErrorCode.ACCOUNT_LOCKED,
            details={"locked_until": locked_until, "reason": reason},
            user_id=user_id,
            **kwargs
        )

class EmailNotVerifiedException(BaseAuthException):
    """Email verification required"""
    
    def __init__(self, email: str, **kwargs):
        super().__init__(
            message="Email verification required",
            error_code=ErrorCode.EMAIL_NOT_VERIFIED,
            details={"email": email},
            **kwargs
        )

class PhoneNotVerifiedException(BaseAuthException):
    """Phone verification required"""
    
    def __init__(self, phone: str, **kwargs):
        super().__init__(
            message="Phone verification required",
            error_code=ErrorCode.PHONE_NOT_VERIFIED,
            details={"phone": phone},
            **kwargs
        )

# =============================================
# TWO-FACTOR AUTHENTICATION EXCEPTIONS
# =============================================

class TwoFactorRequiredException(BaseAuthException):
    """Two-factor authentication required"""
    
    def __init__(self, methods: Optional[List[str]] = None, **kwargs):
        super().__init__(
            message="Two-factor authentication required",
            error_code=ErrorCode.TWO_FACTOR_REQUIRED,
            details={"available_methods": methods or ["totp"]},
            **kwargs
        )

class InvalidTOTPCodeException(BaseAuthException):
    """Invalid TOTP code provided"""
    
    def __init__(self, attempts_remaining: int = 0, **kwargs):
        super().__init__(
            message="Invalid authenticator code",
            error_code=ErrorCode.INVALID_TOTP_CODE,
            details={"attempts_remaining": attempts_remaining},
            **kwargs
        )

class BackupCodeRequiredException(BaseAuthException):
    """Backup code required for 2FA"""
    
    def __init__(self, **kwargs):
        super().__init__(
            message="Backup code required",
            error_code=ErrorCode.BACKUP_CODE_REQUIRED,
            **kwargs
        )

# =============================================
# SESSION EXCEPTIONS
# =============================================

class SessionExpiredException(BaseAuthException):
    """User session has expired"""
    
    def __init__(self, session_id: str, **kwargs):
        super().__init__(
            message="Session expired",
            error_code=ErrorCode.SESSION_EXPIRED,
            details={"session_id": session_id},
            **kwargs
        )

class SessionInvalidException(BaseAuthException):
    """Invalid session token"""
    
    def __init__(self, **kwargs):
        super().__init__(
            message="Invalid session",
            error_code=ErrorCode.SESSION_INVALID,
            **kwargs
        )

class SessionRevokedException(BaseAuthException):
    """Session has been revoked"""
    
    def __init__(self, session_id: str, reason: str, **kwargs):
        super().__init__(
            message=f"Session revoked: {reason}",
            error_code=ErrorCode.SESSION_REVOKED,
            details={"session_id": session_id, "reason": reason},
            **kwargs
        )

class MaxSessionsExceededException(BaseAuthException):
    """Maximum concurrent sessions exceeded"""
    
    def __init__(self, max_sessions: int, current_sessions: int, **kwargs):
        super().__init__(
            message=f"Maximum sessions exceeded ({current_sessions}/{max_sessions})",
            error_code=ErrorCode.MAX_SESSIONS_EXCEEDED,
            details={"max_sessions": max_sessions, "current_sessions": current_sessions},
            **kwargs
        )

# =============================================
# MAGIC LINK EXCEPTIONS
# =============================================

class MagicLinkExpiredException(BaseAuthException):
    """Magic link has expired or is invalid"""
    
    def __init__(self, reason: str = "expired", **kwargs):
        super().__init__(
            message=f"Magic link {reason}",
            error_code=ErrorCode.MAGIC_LINK_EXPIRED,
            details={"reason": reason},
            **kwargs
        )

class MagicLinkUsedException(BaseAuthException):
    """Magic link already used"""
    
    def __init__(self, **kwargs):
        super().__init__(
            message="Magic link already used",
            error_code=ErrorCode.MAGIC_LINK_USED,
            **kwargs
        )

# =============================================
# AUTHORIZATION EXCEPTIONS
# =============================================

class AuthorizationException(BaseAuthException):
    """General authorization failure"""
    
    def __init__(self, message: str = "Access denied", **kwargs):
        super().__init__(
            message=message,
            error_code=ErrorCode.INSUFFICIENT_PERMISSIONS,
            **kwargs
        )

class InsufficientPermissionsException(BaseAuthException):
    """User lacks required permissions"""
    
    def __init__(
        self,
        required_permission: str,
        user_permissions: Optional[List[str]] = None,
        **kwargs
    ):
        super().__init__(
            message=f"Insufficient permissions: {required_permission} required",
            error_code=ErrorCode.INSUFFICIENT_PERMISSIONS,
            details={
                "required_permission": required_permission,
                "user_permissions": user_permissions or []
            },
            **kwargs
        )

class ResourceAccessDeniedException(BaseAuthException):
    """Access denied to specific resource"""
    
    def __init__(self, resource_type: str, resource_id: str, action: str, **kwargs):
        super().__init__(
            message=f"Access denied: {action} on {resource_type} {resource_id}",
            error_code=ErrorCode.RESOURCE_ACCESS_DENIED,
            details={
                "resource_type": resource_type,
                "resource_id": resource_id,
                "action": action
            },
            **kwargs
        )

class TenantAccessDeniedException(BaseAuthException):
    """Access denied to tenant resources"""
    
    def __init__(self, tenant_id: str, user_tenant_id: str, **kwargs):
        super().__init__(
            message="Cross-tenant access denied",
            error_code=ErrorCode.TENANT_ACCESS_DENIED,
            details={
                "requested_tenant": tenant_id,
                "user_tenant": user_tenant_id
            },
            tenant_id=tenant_id,
            **kwargs
        )

# =============================================
# COMPLIANCE EXCEPTIONS
# =============================================

class ComplianceException(BaseAuthException):
    """General compliance violation"""
    
    def __init__(self, message: str, compliance_requirement: str, **kwargs):
        super().__init__(
            message=message,
            error_code=ErrorCode.COMPLIANCE_VIOLATION,
            details={"compliance_requirement": compliance_requirement},
            **kwargs
        )

class KYCRequiredException(BaseAuthException):
    """KYC verification required"""
    
    def __init__(self, required_documents: Optional[List[str]] = None, **kwargs):
        super().__init__(
            message="KYC verification required",
            error_code=ErrorCode.KYC_REQUIRED,
            details={"required_documents": required_documents or []},
            **kwargs
        )

class DocumentVerificationRequiredException(BaseAuthException):
    """Document verification required"""
    
    def __init__(self, document_types: List[str], **kwargs):
        super().__init__(
            message="Document verification required",
            error_code=ErrorCode.DOCUMENT_VERIFICATION_REQUIRED,
            details={"required_documents": document_types},
            **kwargs
        )

class TermsAcceptanceRequiredException(BaseAuthException):
    """Terms of service acceptance required"""
    
    def __init__(self, terms_version: str, **kwargs):
        super().__init__(
            message="Terms of service acceptance required",
            error_code=ErrorCode.TERMS_ACCEPTANCE_REQUIRED,
            details={"terms_version": terms_version},
            **kwargs
        )

# =============================================
# VALIDATION EXCEPTIONS
# =============================================

class ValidationException(BaseAuthException):
    """Data validation failure"""
    
    def __init__(self, field: str, message: str, **kwargs):
        super().__init__(
            message=f"Validation error: {field} - {message}",
            error_code=ErrorCode.INVALID_USER_DATA,
            details={"field": field, "validation_message": message},
            **kwargs
        )

class PasswordPolicyException(BaseAuthException):
    """Password does not meet policy requirements"""
    
    def __init__(self, requirements: List[str], **kwargs):
        super().__init__(
            message="Password does not meet policy requirements",
            error_code=ErrorCode.PASSWORD_POLICY_VIOLATION,
            details={"requirements": requirements},
            **kwargs
        )

# =============================================
# RATE LIMITING EXCEPTIONS
# =============================================

class RateLimitExceededException(BaseAuthException):
    """Rate limit exceeded"""
    
    def __init__(
        self,
        limit: int,
        window_seconds: int,
        retry_after: Optional[int] = None,
        **kwargs
    ):
        super().__init__(
            message=f"Rate limit exceeded: {limit} requests per {window_seconds} seconds",
            error_code=ErrorCode.RATE_LIMIT_EXCEEDED,
            details={
                "limit": limit,
                "window_seconds": window_seconds,
                "retry_after": retry_after
            },
            **kwargs
        )

class TooManyAttemptsException(BaseAuthException):
    """Too many failed attempts"""
    
    def __init__(
        self,
        attempts: int,
        max_attempts: int,
        lockout_duration: Optional[int] = None,
        **kwargs
    ):
        super().__init__(
            message=f"Too many failed attempts ({attempts}/{max_attempts})",
            error_code=ErrorCode.TOO_MANY_ATTEMPTS,
            details={
                "attempts": attempts,
                "max_attempts": max_attempts,
                "lockout_duration": lockout_duration
            },
            **kwargs
        )

# =============================================
# SYSTEM EXCEPTIONS
# =============================================

class InternalErrorException(BaseAuthException):
    """Internal system error"""
    
    def __init__(self, message: str = "Internal server error", **kwargs):
        super().__init__(
            message=message,
            error_code=ErrorCode.INTERNAL_ERROR,
            **kwargs
        )

class DatabaseErrorException(BaseAuthException):
    """Database operation error"""
    
    def __init__(self, operation: str, **kwargs):
        super().__init__(
            message=f"Database error during {operation}",
            error_code=ErrorCode.DATABASE_ERROR,
            details={"operation": operation},
            **kwargs
        )

class ExternalServiceErrorException(BaseAuthException):
    """External service integration error"""
    
    def __init__(self, service: str, error: str, **kwargs):
        super().__init__(
            message=f"External service error: {service} - {error}",
            error_code=ErrorCode.EXTERNAL_SERVICE_ERROR,
            details={"service": service, "error": error},
            **kwargs
        )

class ConfigurationErrorException(BaseAuthException):
    """System configuration error"""
    
    def __init__(self, config_key: str, **kwargs):
        super().__init__(
            message=f"Configuration error: {config_key}",
            error_code=ErrorCode.CONFIGURATION_ERROR,
            details={"config_key": config_key},
            **kwargs
        ) 