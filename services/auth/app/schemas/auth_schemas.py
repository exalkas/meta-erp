"""
SAP-Style Authentication API Schemas

Pydantic models for FastAPI endpoints with:
- Multi-method authentication requests/responses
- Session management
- Tenant configuration
- Compliance and audit data
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Annotated
from pydantic import BaseModel, Field, field_validator
from enum import Enum
from uuid import UUID
import re

# Custom email type that allows .local domains for development
def validate_development_email(v: str) -> str:
    """Validate email allowing .local domains for development"""
    if not isinstance(v, str):
        raise ValueError('string required')
    
    # Basic email regex that allows .local domains
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.local$'
    if not re.match(email_pattern, v):
        raise ValueError('invalid email format')
    
    return v

# Development email type using Annotated
DevelopmentEmail = Annotated[str, Field(description="Email address supporting .local domains")]

# =============================================
# ENUMS
# =============================================

class AuthMethodTypeSchema(str, Enum):
    PASSWORD = "password"
    MAGIC_LINK = "magic_link"
    PASSKEY = "passkey"
    TOTP = "totp"
    SSO_SAML = "sso_saml"
    SSO_OAUTH = "sso_oauth"

class MagicLinkPurposeSchema(str, Enum):
    LOGIN = "login"
    REGISTRATION = "registration"
    PASSWORD_RESET = "password_reset"
    EMAIL_VERIFICATION = "email_verification"

class SessionStatusSchema(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    SUSPICIOUS = "suspicious"

class ComplianceLevelSchema(str, Enum):
    BASIC = "basic"
    ENHANCED = "enhanced"
    STRICT = "strict"
    CRITICAL = "critical"

class UserStatusSchema(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"
    LOCKED = "locked"

# =============================================
# REQUEST SCHEMAS
# =============================================

class PasswordAuthRequest(BaseModel):
    """Password authentication request"""
    tenant_id: UUID
    email: DevelopmentEmail
    password: str = Field(..., min_length=1, max_length=255)
    totp_code: Optional[str] = Field(None, min_length=6, max_length=8)
    device_name: Optional[str] = Field(None, max_length=255)
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        return validate_development_email(v)
    
    class Config:
        json_schema_extra = {
            "example": {
                "tenant_id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "password": "",
                "totp_code": "123456",
                "device_name": "iPhone 15 Pro",
                "remember_me": False
            }
        }

class MagicLinkRequest(BaseModel):
    """Magic link authentication request"""
    tenant_id: UUID
    email: DevelopmentEmail
    purpose: MagicLinkPurposeSchema = MagicLinkPurposeSchema.LOGIN
    registration_data: Optional[Dict[str, Any]] = None
    redirect_url: Optional[str] = Field(None, max_length=500)
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        return validate_development_email(v)
    
    class Config:
        json_schema_extra = {
            "example": {
                "tenant_id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "purpose": "login",
                "redirect_url": "https://myapp.com/dashboard"
            }
        }

class MagicLinkVerifyRequest(BaseModel):
    """Magic link verification request"""
    token: str = Field(..., min_length=10, max_length=500)
    device_name: Optional[str] = Field(None, max_length=200)
    
    class Config:
        json_schema_extra = {
            "example": {
                "token": "",
                "device_name": "MacBook Pro"
            }
        }

class UserRegistrationRequest(BaseModel):
    """User registration request"""
    tenant_id: UUID
    email: DevelopmentEmail
    password: Optional[str] = Field(None, min_length=8, max_length=255)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    language: str = Field("en", min_length=2, max_length=5)
    timezone: str = Field("UTC", max_length=50)
    terms_accepted: bool = False
    privacy_accepted: bool = False
    marketing_consent: bool = False
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        return validate_development_email(v)
    
    @field_validator('password')
    def validate_password(cls, v, info):
        if v and len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "tenant_id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "newuser@example.com",
                "password": "",
                "first_name": "John",
                "last_name": "Doe",
                "phone": "+1234567890",
                "timezone": "America/New_York",
                "locale": "en",
                "terms_accepted": True,
                "privacy_accepted": True,
                "marketing_consent": False
            }
        }

class SessionRevokeRequest(BaseModel):
    """Session revocation request"""
    session_id: Optional[UUID] = None  # If None, revoke all sessions
    reason: str = Field("user_requested", max_length=200)
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "123e4567-e89b-12d3-a456-426614174000",
                "reason": "user_requested"
            }
        }

class RefreshTokenRequest(BaseModel):
    """Token refresh request"""
    refresh_token: str = Field(..., min_length=1, max_length=512)
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": ""
            }
        }

class TenantConfigUpdateRequest(BaseModel):
    """Tenant authentication configuration update"""
    vertical: Optional[str] = Field(None, max_length=50)
    enabled_auth_methods: Optional[List[AuthMethodTypeSchema]] = None
    session_timeout_minutes: Optional[int] = Field(None, ge=5, le=43200)  # 5 min to 30 days
    max_concurrent_sessions: Optional[int] = Field(None, ge=1, le=100)
    require_2fa: Optional[bool] = None
    require_email_verification: Optional[bool] = None
    password_policy: Optional[Dict[str, Any]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "vertical": "ecommerce",
                "enabled_auth_methods": ["password", "magic_link", "sso_oauth"],
                "session_timeout_minutes": 1440,
                "max_concurrent_sessions": 5,
                "require_2fa": False,
                "require_email_verification": True,
                "password_policy": {
                    "min_length": 8,
                    "require_uppercase": True,
                    "require_numbers": True
                }
            }
        }

# =============================================
# RESPONSE SCHEMAS
# =============================================

class UserProfileResponse(BaseModel):
    """User profile information"""
    user_id: UUID
    tenant_id: UUID
    email: str
    first_name: str
    last_name: str
    display_name: Optional[str]
    status: UserStatusSchema
    is_verified: bool
    phone: Optional[str]
    phone_verified: bool
    avatar_url: Optional[str]
    timezone: str
    locale: str
    two_factor_enabled: bool
    passkey_enabled: bool
    compliance_level: ComplianceLevelSchema
    roles: Optional[List[str]] = []  # Role names like ["SAP_SYSTEM_ADMIN", "SAP_TENANT_ADMIN"] 
    permissions: Optional[List[str]] = []  # Resolved permissions like ["TENANT.APPLICATIONS.BUILDER.CREATE"]
    last_login: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "tenant_id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "display_name": "John Doe",
                "status": "active",
                "is_verified": True,
                "phone": "+1234567890",
                "phone_verified": True,
                "timezone": "America/New_York",
                "locale": "en",
                "two_factor_enabled": False,
                "passkey_enabled": False,
                "compliance_level": "basic",
                "roles": ["SAP_TENANT_ADMIN", "SAP_BUSINESS_ADMIN"],
                "permissions": ["TENANT.APPLICATIONS.BUILDER.CREATE", "TENANT.USERS.MANAGEMENT.CREATE"],
                "last_login": "2025-01-28T10:30:00Z",
                "created_at": "2025-01-15T08:00:00Z"
            }
        }

class SessionResponse(BaseModel):
    """Session information"""
    session_id: UUID
    status: SessionStatusSchema
    device_name: Optional[str]
    device_type: str
    ip_address: Optional[str]
    location_country: Optional[str]
    location_city: Optional[str]
    created_at: datetime
    expires_at: datetime
    last_activity: datetime
    is_current: bool = False
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "session_id": "123e4567-e89b-12d3-a456-426614174000",
                "status": "active",
                "device_name": "iPhone 15 Pro",
                "device_type": "mobile",
                "ip_address": "192.168.1.100",
                "location_country": "US",
                "location_city": "New York",
                "created_at": "2025-01-28T10:30:00Z",
                "expires_at": "2025-01-29T10:30:00Z",
                "last_activity": "2025-01-28T14:15:00Z",
                "is_current": True
            }
        }

class AuthSuccessResponse(BaseModel):
    """Successful authentication response"""
    success: bool = True
    message: str = "Authentication successful"
    user: UserProfileResponse
    session: SessionResponse
    access_token: str
    refresh_token: str
    expires_in: int  # seconds
    token_type: str = "Bearer"
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Authentication successful",
                "user": {
                    "user_id": "123e4567-e89b-12d3-a456-426614174000",
                    "email": "user@example.com",
                    "first_name": "John",
                    "last_name": "Doe"
                },
                "access_token": "",
                "refresh_token": "",
                "expires_in": 900,
                "token_type": "Bearer"
            }
        }

class MagicLinkResponse(BaseModel):
    """Magic link creation response"""
    success: bool = True
    message: str = "Magic link sent successfully"
    email: str
    expires_in: int  # seconds
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Magic link sent successfully",
                "email": "user@example.com",
                "expires_in": 900
            }
        }

class TenantConfigResponse(BaseModel):
    """Tenant authentication configuration"""
    tenant_id: UUID
    vertical: Optional[str]
    compliance_level: ComplianceLevelSchema
    enabled_auth_methods: List[AuthMethodTypeSchema]
    default_auth_method: AuthMethodTypeSchema
    session_timeout_minutes: int
    max_concurrent_sessions: int
    idle_timeout_minutes: int
    require_2fa: bool
    require_2fa_for_admin: bool
    require_email_verification: bool
    require_phone_verification: bool
    password_policy: Dict[str, Any]
    industry_requirements: Optional[Dict[str, Any]]
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "tenant_id": "123e4567-e89b-12d3-a456-426614174000",
                "vertical": "ecommerce",
                "compliance_level": "basic",
                "enabled_auth_methods": ["password", "magic_link", "sso_oauth"],
                "default_auth_method": "password",
                "session_timeout_minutes": 1440,
                "max_concurrent_sessions": 5,
                "idle_timeout_minutes": 60,
                "require_2fa": False,
                "require_2fa_for_admin": True,
                "require_email_verification": True,
                "require_phone_verification": False,
                "password_policy": {
                    "min_length": 8,
                    "require_uppercase": True,
                    "require_numbers": True
                },
                "industry_requirements": {
                    "guest_checkout": True,
                    "social_login": True
                }
            }
        }

class SessionListResponse(BaseModel):
    """List of user sessions"""
    sessions: List[SessionResponse]
    total_sessions: int
    active_sessions: int
    current_session_id: UUID
    
    class Config:
        json_schema_extra = {
            "example": {
                "sessions": [
                    {
                        "session_id": "123e4567-e89b-12d3-a456-426614174000",
                        "device_name": "iPhone 15 Pro",
                        "device_type": "mobile",
                        "is_current": True
                    }
                ],
                "total_sessions": 3,
                "active_sessions": 2,
                "current_session_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }

# =============================================
# ERROR RESPONSE SCHEMAS
# =============================================

class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    error: Dict[str, Any]
    timestamp: datetime
    request_id: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "error": {
                    "code": "AUTH_1001",
                    "message": "Invalid credentials",
                    "details": {},
                    "tenant_id": "123e4567-e89b-12d3-a456-426614174000"
                },
                "timestamp": "2025-01-28T10:30:00Z",
                "request_id": "req_123456789"
            }
        }

class TwoFactorRequiredResponse(BaseModel):
    """Two-factor authentication required response"""
    success: bool = False
    message: str = "Two-factor authentication required"
    available_methods: List[str]
    user_id: UUID
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "message": "Two-factor authentication required",
                "available_methods": ["totp", "backup_code"],
                "user_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }

class ComplianceRequiredResponse(BaseModel):
    """Compliance requirement response"""
    success: bool = False
    message: str
    compliance_type: str
    required_actions: List[str]
    details: Dict[str, Any]
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "message": "KYC verification required",
                "compliance_type": "kyc_verification",
                "required_actions": ["identity_document", "proof_of_address"],
                "details": {
                    "deadline": "2025-02-28T23:59:59Z",
                    "supported_documents": ["passport", "drivers_license"]
                }
            }
        }

# =============================================
# UTILITY SCHEMAS
# =============================================

class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str = "healthy"
    timestamp: datetime
    version: str
    database_status: str
    redis_status: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "timestamp": "2025-01-28T10:30:00Z",
                "version": "1.5.0",
                "database_status": "connected",
                "redis_status": "connected"
            }
        }

class AuditLogResponse(BaseModel):
    """Audit log entry"""
    log_id: UUID
    event_type: str
    event_category: str
    event_result: str
    event_timestamp: datetime
    user_id: Optional[UUID]
    session_id: Optional[UUID]
    ip_address: Optional[str]
    details: Dict[str, Any]
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "log_id": "123e4567-e89b-12d3-a456-426614174000",
                "event_type": "login_success",
                "event_category": "authentication",
                "event_result": "success",
                "event_timestamp": "2025-01-28T10:30:00Z",
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "session_id": "123e4567-e89b-12d3-a456-426614174000",
                "ip_address": "192.168.1.100",
                "details": {
                    "method": "password",
                    "device_type": "mobile"
                }
            }
        } 