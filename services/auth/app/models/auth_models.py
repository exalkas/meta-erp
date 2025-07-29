"""
SAP-Style Authentication Models

Enterprise-grade authentication system with:
- Multi-tenant configuration
- Metadata-driven auth flows
- Multiple authentication methods
- Industry-specific compliance
- Complete audit trails
"""

from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime, JSON, UUID,
    ForeignKey, Index, UniqueConstraint, Enum as SQLEnum, DECIMAL
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime
from typing import Optional, Dict, Any

Base = declarative_base()

# =============================================
# ENUMS
# =============================================

class AuthMethodType(enum.Enum):
    PASSWORD = "password"
    MAGIC_LINK = "magic_link"
    PASSKEY = "passkey"
    TOTP = "totp"
    SSO_SAML = "sso_saml"
    SSO_OAUTH = "sso_oauth"

class MagicLinkPurpose(enum.Enum):
    LOGIN = "login"
    REGISTRATION = "registration"
    PASSWORD_RESET = "password_reset"
    EMAIL_VERIFICATION = "email_verification"

class SessionStatus(enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    SUSPICIOUS = "suspicious"

class ComplianceLevel(enum.Enum):
    BASIC = "basic"
    ENHANCED = "enhanced"
    STRICT = "strict"
    CRITICAL = "critical"

class UserStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"
    LOCKED = "locked"

# =============================================
# CORE USER MODEL
# =============================================

class User(Base):
    """Enhanced User model with enterprise security features"""
    __tablename__ = "users"
    
    # Primary identification
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Basic information
    email = Column(String(255), nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    username = Column(String(100), nullable=True, unique=True)
    display_name = Column(String(200), nullable=True)
    
    # Account status and security
    status = Column(SQLEnum(UserStatus), default=UserStatus.PENDING_VERIFICATION, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Contact information
    phone = Column(String(20), nullable=True)
    phone_verified = Column(Boolean, default=False)
    avatar_url = Column(String(500), nullable=True)
    timezone = Column(String(50), default="UTC")
    locale = Column(String(10), default="en")
    
    # Security settings
    password_hash = Column(String(255), nullable=True)  # Nullable for SSO-only users
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    require_password_change = Column(Boolean, default=False)
    
    # Multi-factor authentication
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(32), nullable=True)
    backup_codes = Column(JSON, nullable=True)  # Array of backup codes
    
    # Passkey/WebAuthn
    passkey_enabled = Column(Boolean, default=False)
    
    # Account security
    login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    last_login_ip = Column(String(45), nullable=True)  # IPv6 support
    last_activity = Column(DateTime(timezone=True), nullable=True)
    
    # Compliance and audit
    terms_accepted_at = Column(DateTime(timezone=True), nullable=True)
    privacy_accepted_at = Column(DateTime(timezone=True), nullable=True)
    compliance_level = Column(SQLEnum(ComplianceLevel), default=ComplianceLevel.BASIC)
    
    # Metadata and customization
    metadata_json = Column(JSON, nullable=True)  # Custom fields per vertical
    preferences = Column(JSON, nullable=True)   # User preferences
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)  # Soft delete
    
    # Relationships
    sessions = relationship("AuthSession", back_populates="user", cascade="all, delete-orphan")
    auth_methods = relationship("AuthMethod", back_populates="user", cascade="all, delete-orphan")
    magic_links = relationship("MagicLink", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("tenant_id", "email", name="uq_user_tenant_email"),
        Index("idx_user_email", "email"),
        Index("idx_user_tenant_status", "tenant_id", "status"),
        Index("idx_user_last_login", "last_login"),
        Index("idx_user_compliance", "compliance_level"),
    )

# =============================================
# SESSION MANAGEMENT
# =============================================

class AuthSession(Base):
    """Enterprise session management with security tracking"""
    __tablename__ = "auth_sessions"
    
    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Session tokens
    access_token = Column(String(500), nullable=False, unique=True, index=True)
    refresh_token = Column(String(500), nullable=False, unique=True, index=True)
    session_token = Column(String(500), nullable=True, unique=True)  # For SSO
    
    # Session metadata
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.ACTIVE, nullable=False)
    device_id = Column(String(100), nullable=True)
    device_name = Column(String(200), nullable=True)
    device_type = Column(String(50), nullable=True)  # "web", "mobile", "api"
    
    # Security tracking
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    location_country = Column(String(2), nullable=True)  # ISO country code
    location_city = Column(String(100), nullable=True)
    
    # Session lifecycle
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_activity = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_reason = Column(String(200), nullable=True)
    
    # Security flags
    is_suspicious = Column(Boolean, default=False)
    risk_score = Column(DECIMAL(3, 2), default=0.0)  # 0.0 to 1.0
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    
    # Constraints and indexes
    __table_args__ = (
        Index("idx_session_user", "user_id"),
        Index("idx_session_tenant", "tenant_id"),
        Index("idx_session_status", "status"),
        Index("idx_session_expires", "expires_at"),
        Index("idx_session_activity", "last_activity"),
        Index("idx_session_suspicious", "is_suspicious"),
    )

# =============================================
# MULTI-METHOD AUTHENTICATION
# =============================================

class AuthMethod(Base):
    """Multiple authentication methods per user"""
    __tablename__ = "auth_methods"
    
    method_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    
    # Method configuration
    method_type = Column(SQLEnum(AuthMethodType), nullable=False)
    is_primary = Column(Boolean, default=False)
    is_enabled = Column(Boolean, default=True)
    
    # Method-specific data (JSON for flexibility)
    credential_data = Column(JSON, nullable=True)  # Stores method-specific info
    
    # Security settings
    max_attempts = Column(Integer, default=5)
    current_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    
    # Usage tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_used = Column(DateTime(timezone=True), nullable=True)
    last_success = Column(DateTime(timezone=True), nullable=True)
    last_failure = Column(DateTime(timezone=True), nullable=True)
    
    # Verification status
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verification_attempts = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", back_populates="auth_methods")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("user_id", "method_type", name="uq_auth_method_user_type"),
        Index("idx_auth_method_user", "user_id"),
        Index("idx_auth_method_type", "method_type"),
        Index("idx_auth_method_primary", "is_primary"),
        Index("idx_auth_method_enabled", "is_enabled"),
    )

# =============================================
# MAGIC LINK AUTHENTICATION
# =============================================

class MagicLink(Base):
    """Magic link authentication with security controls"""
    __tablename__ = "magic_links"
    
    link_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)  # Nullable for registration
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Link information
    email = Column(String(255), nullable=False, index=True)
    token = Column(String(255), nullable=False, unique=True, index=True)
    purpose = Column(SQLEnum(MagicLinkPurpose), nullable=False)
    
    # Security controls
    expires_at = Column(DateTime(timezone=True), nullable=False)
    max_uses = Column(Integer, default=1)
    current_uses = Column(Integer, default=0)
    
    # Usage tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Status
    is_revoked = Column(Boolean, default=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_reason = Column(String(200), nullable=True)
    
    # Additional data for registration flows
    registration_data = Column(JSON, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="magic_links")
    
    # Constraints and indexes
    __table_args__ = (
        Index("idx_magic_link_email", "email"),
        Index("idx_magic_link_tenant", "tenant_id"),
        Index("idx_magic_link_purpose", "purpose"),
        Index("idx_magic_link_expires", "expires_at"),
        Index("idx_magic_link_revoked", "is_revoked"),
    )

# =============================================
# SAP-STYLE TENANT AUTH CONFIGURATION
# =============================================

class TenantAuthConfig(Base):
    """SAP-style tenant-specific authentication configuration"""
    __tablename__ = "tenant_auth_configs"
    
    config_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    
    # Vertical and compliance
    vertical = Column(String(50), nullable=True)  # "ecommerce", "automotive", "fintech", etc.
    compliance_level = Column(SQLEnum(ComplianceLevel), default=ComplianceLevel.BASIC)
    
    # Authentication methods configuration
    enabled_auth_methods = Column(JSON, nullable=False, default=list)  # List of enabled methods
    default_auth_method = Column(SQLEnum(AuthMethodType), default=AuthMethodType.PASSWORD)
    
    # Password policy
    password_policy = Column(JSON, nullable=True, default=dict)
    # Example: {"min_length": 8, "require_uppercase": true, "require_numbers": true}
    
    # Session configuration
    session_timeout_minutes = Column(Integer, default=480)  # 8 hours default
    max_concurrent_sessions = Column(Integer, default=5)
    idle_timeout_minutes = Column(Integer, default=60)
    
    # Security settings
    max_login_attempts = Column(Integer, default=5)
    lockout_duration_minutes = Column(Integer, default=15)
    require_email_verification = Column(Boolean, default=True)
    require_phone_verification = Column(Boolean, default=False)
    
    # Two-factor authentication
    require_2fa = Column(Boolean, default=False)
    require_2fa_for_admin = Column(Boolean, default=True)
    allowed_2fa_methods = Column(JSON, default=list)  # ["totp", "sms", "email"]
    
    # Compliance requirements
    require_terms_acceptance = Column(Boolean, default=True)
    require_privacy_acceptance = Column(Boolean, default=True)
    data_retention_days = Column(Integer, default=2555)  # 7 years default
    
    # SSO configuration
    sso_enabled = Column(Boolean, default=False)
    sso_providers = Column(JSON, nullable=True)
    sso_required = Column(Boolean, default=False)
    
    # Industry-specific requirements
    industry_requirements = Column(JSON, nullable=True)
    # Example: {"kyc_required": true, "document_verification": true, "risk_assessment": true}
    
    # Audit and monitoring
    audit_level = Column(String(20), default="standard")  # "basic", "standard", "detailed", "comprehensive"
    log_retention_days = Column(Integer, default=2555)
    
    # Custom fields for vertical-specific needs
    custom_config = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Constraints and indexes
    __table_args__ = (
        Index("idx_tenant_auth_vertical", "vertical"),
        Index("idx_tenant_auth_compliance", "compliance_level"),
    )

# =============================================
# DYNAMIC PERMISSION SYSTEM
# =============================================

class PermissionDefinition(Base):
    """SAP-style dynamic permission definitions"""
    __tablename__ = "permission_definitions"
    
    permission_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # NULL for global permissions
    
    # Permission identification
    permission_name = Column(String(100), nullable=False)
    permission_code = Column(String(100), nullable=False)  # e.g., "customer.create", "invoice.approve"
    description = Column(Text, nullable=True)
    
    # Permission scope
    entity_name = Column(String(100), nullable=True)  # Entity this permission applies to
    action = Column(String(50), nullable=False)      # "create", "read", "update", "delete", "approve", etc.
    
    # Conditional permissions
    conditions = Column(JSON, nullable=True)  # When this permission applies
    # Example: {"user_role": "manager", "record_owner": "self", "amount": {"<": 10000}}
    
    # Vertical and compliance context
    vertical = Column(String(50), nullable=True)
    compliance_level = Column(SQLEnum(ComplianceLevel), default=ComplianceLevel.BASIC)
    
    # Permission metadata
    is_system_permission = Column(Boolean, default=False)
    is_delegatable = Column(Boolean, default=False)
    requires_approval = Column(Boolean, default=False)
    requires_2fa = Column(Boolean, default=False)
    
    # Audit requirements
    audit_level = Column(String(20), default="standard")
    log_access = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("tenant_id", "permission_code", name="uq_permission_tenant_code"),
        Index("idx_permission_entity", "entity_name"),
        Index("idx_permission_action", "action"),
        Index("idx_permission_vertical", "vertical"),
        Index("idx_permission_system", "is_system_permission"),
    )

# =============================================
# ROLE MANAGEMENT
# =============================================

class Role(Base):
    """Dynamic role management with inheritance"""
    __tablename__ = "roles"
    
    role_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # NULL for global roles
    
    # Role identification
    role_name = Column(String(100), nullable=False)
    role_code = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Role hierarchy
    parent_role_id = Column(UUID(as_uuid=True), ForeignKey("roles.role_id"), nullable=True)
    level = Column(Integer, default=0)  # Hierarchy level
    
    # Role properties
    is_system_role = Column(Boolean, default=False)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Vertical context
    vertical = Column(String(50), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    parent_role = relationship("Role", remote_side=[role_id])
    child_roles = relationship("Role")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("tenant_id", "role_code", name="uq_role_tenant_code"),
        Index("idx_role_system", "is_system_role"),
        Index("idx_role_active", "is_active"),
        Index("idx_role_vertical", "vertical"),
    )

# =============================================
# AUDIT LOGGING
# =============================================

class AuditLog(Base):
    """Comprehensive audit logging for compliance"""
    __tablename__ = "audit_logs"
    
    log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("auth_sessions.session_id"), nullable=True)
    
    # Event information
    event_type = Column(String(50), nullable=False)  # "login", "logout", "permission_check", etc.
    event_category = Column(String(50), nullable=False)  # "authentication", "authorization", "data_access"
    event_result = Column(String(20), nullable=False)  # "success", "failure", "error"
    
    # Event details
    resource_type = Column(String(100), nullable=True)  # "user", "customer", "invoice", etc.
    resource_id = Column(String(100), nullable=True)    # ID of the resource accessed
    action = Column(String(50), nullable=True)          # "create", "read", "update", "delete"
    
    # Context information
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    request_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Audit details
    details = Column(JSON, nullable=True)  # Additional context
    risk_score = Column(DECIMAL(3, 2), nullable=True)  # Risk assessment
    
    # Compliance
    compliance_level = Column(SQLEnum(ComplianceLevel), nullable=True)
    retention_until = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    event_timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    # Constraints and indexes
    __table_args__ = (
        Index("idx_audit_tenant", "tenant_id"),
        Index("idx_audit_user", "user_id"),
        Index("idx_audit_event_type", "event_type"),
        Index("idx_audit_event_category", "event_category"),
        Index("idx_audit_timestamp", "event_timestamp"),
        Index("idx_audit_resource", "resource_type", "resource_id"),
        Index("idx_audit_compliance", "compliance_level"),
    ) 