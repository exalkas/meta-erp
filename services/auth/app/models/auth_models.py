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
    ForeignKey, Index, UniqueConstraint, Enum as SQLEnum, DECIMAL, func
)
from sqlalchemy.dialects.postgresql import INET
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
    """Simplified User model matching our actual database schema"""
    __tablename__ = "users"
    
    # Primary identification
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Basic information
    username = Column(String(100), nullable=True)
    email = Column(String(255), nullable=False, unique=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    display_name = Column(String(200), nullable=True)
    
    # Authentication methods (stored as JSONB for flexibility)
    auth_methods_json = Column(JSON, default={})
    
    # Security and compliance
    compliance_level = Column(String(50), default='BASIC')
    kyc_status = Column(String(50), default='PENDING')
    kyc_completed_at = Column(DateTime(timezone=True), nullable=True)
    kyc_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    
    # Business context
    role = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    employee_id = Column(String(50), nullable=True)
    manager_user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=True)
    
    # Preferences
    preferred_language = Column(String(5), default='en-US')
    timezone = Column(String(50), default='UTC')
    date_format = Column(String(20), default='YYYY-MM-DD')
    
    # Security tracking
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Terms and privacy
    terms_accepted_at = Column(DateTime(timezone=True), nullable=True)
    privacy_accepted_at = Column(DateTime(timezone=True), nullable=True)
    marketing_consent = Column(Boolean, default=False)
    
    # Audit fields
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.current_timestamp())
    updated_at = Column(DateTime(timezone=True), default=func.current_timestamp(), onupdate=func.current_timestamp())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    sessions = relationship("AuthSession", back_populates="user", foreign_keys="AuthSession.user_id")
    auth_methods = relationship("AuthMethod", backref="user")
    magic_links = relationship("MagicLink", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    
    # Table constraints
    __table_args__ = (
        UniqueConstraint('tenant_id', 'email', name='users_tenant_email_unique'),
        Index('idx_users_tenant_id', 'tenant_id'),
        Index('idx_users_email', 'email'),
        Index('idx_users_username', 'username'),
    )

# =============================================
# SESSION MANAGEMENT
# =============================================

class AuthSession(Base):
    """Enterprise session management matching actual database schema"""
    __tablename__ = "auth_sessions"
    
    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), nullable=False)
    
    # Session tokens (hashed in database)
    session_token_hash = Column(String(255), nullable=False, unique=True)
    refresh_token_hash = Column(String(255), nullable=True, unique=True)
    
    # Device and client information
    device_type = Column(String(50), nullable=True)  # mobile, tablet, desktop, api, unknown
    device_id = Column(String(255), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Network information
    ip_address = Column(INET, nullable=True)  # INET type for IP addresses
    country_code = Column(String(3), nullable=True)
    city = Column(String(100), nullable=True)
    
    # Session security
    risk_score = Column(DECIMAL(3, 2), default=0.00)
    is_suspicious = Column(Boolean, default=False)
    requires_verification = Column(Boolean, default=False)
    
    # Session lifecycle
    created_at = Column(DateTime(timezone=True), default=func.current_timestamp())
    last_activity_at = Column(DateTime(timezone=True), default=func.current_timestamp())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Session metadata
    login_method = Column(String(50), nullable=True)  # password, magic_link, totp, webauthn, sso
    mfa_verified = Column(Boolean, default=False)
    device_registered = Column(Boolean, default=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_by = Column(UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=True)
    revoked_reason = Column(String(200), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="sessions", foreign_keys=[user_id])
    
    # Table constraints
    __table_args__ = (
        Index("idx_auth_sessions_user", "user_id"),
        Index("idx_auth_sessions_tenant", "tenant_id"),
        Index("idx_auth_sessions_active", "is_active"),
    )

# =============================================
# MULTI-METHOD AUTHENTICATION
# =============================================

class AuthMethod(Base):
    """Authentication method matching actual database schema"""
    __tablename__ = "auth_methods"
    
    method_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), nullable=False)
    
    # Method information
    method_type = Column(String(50), nullable=False)  # PASSWORD, MAGIC_LINK, TOTP_2FA, WEBAUTHN, SSO
    is_primary = Column(Boolean, default=False)
    is_enabled = Column(Boolean, default=True)
    
    # Method-specific credentials (encrypted/hashed)
    credentials_json = Column(JSON, nullable=True)
    
    # Password method data
    password_hash = Column(String(255), nullable=True)
    password_salt = Column(String(255), nullable=True)
    
    # TOTP 2FA method data
    totp_secret = Column(String(255), nullable=True)
    totp_backup_codes_json = Column(JSON, nullable=True)
    totp_last_used_code = Column(String(10), nullable=True)
    
    # WebAuthn method data
    webauthn_credential_id = Column(String(500), nullable=True)
    webauthn_public_key = Column(Text, nullable=True)
    webauthn_counter = Column(Integer, default=0)
    
    # Magic Link method data
    magic_link_last_sent_at = Column(DateTime(timezone=True), nullable=True)
    magic_link_send_count = Column(Integer, default=0)
    
    # SSO method data
    sso_provider = Column(String(100), nullable=True)
    sso_external_id = Column(String(255), nullable=True)
    sso_last_token_refresh = Column(DateTime(timezone=True), nullable=True)
    
    # Security metadata
    setup_completed_at = Column(DateTime(timezone=True), nullable=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    last_success_at = Column(DateTime(timezone=True), nullable=True)
    failed_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    
    # Audit
    created_at = Column(DateTime(timezone=True), default=func.current_timestamp())
    updated_at = Column(DateTime(timezone=True), default=func.current_timestamp())
    
    # Table constraints
    __table_args__ = (
        Index("idx_auth_methods_user", "user_id"),
        Index("idx_auth_methods_tenant", "tenant_id"),
        Index("idx_auth_methods_type", "method_type"),
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