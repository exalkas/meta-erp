"""Authentication and authorization models."""

import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    Index,
    Table,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .metadata import Base


# Association table for user-role many-to-many relationship
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.user_id"), primary_key=True),
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.role_id"), primary_key=True),
    Column("assigned_at", DateTime(timezone=True), server_default=func.now()),
    Column("assigned_by", UUID(as_uuid=True), nullable=True),
)

# Association table for role-permission many-to-many relationship
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.role_id"), primary_key=True),
    Column("permission_id", UUID(as_uuid=True), ForeignKey("permissions.permission_id"), primary_key=True),
    Column("granted_at", DateTime(timezone=True), server_default=func.now()),
    Column("granted_by", UUID(as_uuid=True), nullable=True),
)


class User(Base):
    """User model for authentication and authorization."""
    
    __tablename__ = "users"
    
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    
    # Basic user information
    email = Column(String(255), nullable=False, unique=True)
    username = Column(String(100), nullable=True, unique=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    display_name = Column(String(200), nullable=True)
    
    # Authentication
    password_hash = Column(String(255), nullable=True)  # Nullable for social login users
    password_salt = Column(String(100), nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime(timezone=True), nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)
    is_tenant_admin = Column(Boolean, default=False)
    
    # Email verification
    email_verification_token = Column(String(255), nullable=True)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Two-Factor Authentication
    is_2fa_enabled = Column(Boolean, default=False)
    totp_secret = Column(String(255), nullable=True)  # Encrypted TOTP secret
    backup_codes = Column(JSON, nullable=True)  # Encrypted backup codes
    
    # Profile information
    profile_picture_url = Column(String(500), nullable=True)
    phone = Column(String(20), nullable=True)
    timezone = Column(String(50), default="Europe/Athens")
    locale = Column(String(10), default="el_GR")
    
    # Login tracking
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    last_login_ip = Column(String(45), nullable=True)  # IPv6 compatible
    login_count = Column(Integer, default=0)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    
    # Preferences
    preferences = Column(JSON, default=lambda: {
        "theme": "light",
        "language": "el_GR",
        "notifications": {
            "email": True,
            "browser": True,
            "mobile": False,
        },
        "dashboard_layout": "default",
    })
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    tenant = relationship("Tenant")
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    auth_sessions = relationship("AuthSession", back_populates="user", cascade="all, delete-orphan")
    magic_links = relationship("MagicLink", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index("idx_user_email", "email"),
        Index("idx_user_tenant_id", "tenant_id"),
        Index("idx_user_username", "username"),
        Index("idx_user_active", "is_active"),
        Index("idx_user_verified", "is_verified"),
        Index("idx_user_last_login", "last_login_at"),
    )
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_locked(self) -> bool:
        """Check if user account is locked."""
        if self.locked_until:
            return datetime.utcnow() < self.locked_until
        return False
    
    def __repr__(self):
        return f"<User(email='{self.email}', tenant_id='{self.tenant_id}')>"


class Role(Base):
    """Role model for role-based access control."""
    
    __tablename__ = "roles"
    
    role_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=True)  # NULL = system role
    
    # Role information
    name = Column(String(100), nullable=False)
    display_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Role configuration
    is_system_role = Column(Boolean, default=False)  # System roles cannot be deleted
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)  # Default role for new users
    
    # Role hierarchy
    parent_role_id = Column(UUID(as_uuid=True), ForeignKey("roles.role_id"), nullable=True)
    level = Column(Integer, default=0)  # Hierarchy level
    
    # Access control
    max_users = Column(Integer, nullable=True)  # Max users for this role
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    tenant = relationship("Tenant")
    parent_role = relationship("Role", remote_side=[role_id])
    users = relationship("User", secondary=user_roles, back_populates="roles")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("tenant_id", "name", name="uq_role_tenant_name"),
        Index("idx_role_tenant_id", "tenant_id"),
        Index("idx_role_active", "is_active"),
        Index("idx_role_system", "is_system_role"),
    )
    
    def __repr__(self):
        return f"<Role(name='{self.name}', tenant_id='{self.tenant_id}')>"


class Permission(Base):
    """Permission model for granular access control."""
    
    __tablename__ = "permissions"
    
    permission_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Permission identification
    name = Column(String(100), nullable=False, unique=True)  # e.g., "accounts.create"
    display_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Permission categorization
    module = Column(String(50), nullable=False)  # e.g., "accounts", "crm", "system"
    action = Column(String(50), nullable=False)  # e.g., "create", "read", "update", "delete"
    resource = Column(String(100), nullable=True)  # e.g., "account", "contact", "report"
    
    # Permission configuration
    is_system_permission = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    requires_2fa = Column(Boolean, default=False)  # Requires 2FA for this permission
    
    # Resource-level permissions
    scope = Column(String(20), default="tenant")  # system, tenant, user, record
    conditions = Column(JSON, nullable=True)  # Additional conditions for permission
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")
    
    # Indexes
    __table_args__ = (
        Index("idx_permission_module", "module"),
        Index("idx_permission_action", "action"),
        Index("idx_permission_active", "is_active"),
        Index("idx_permission_scope", "scope"),
    )
    
    def __repr__(self):
        return f"<Permission(name='{self.name}', module='{self.module}')>"


class AuthSession(Base):
    """User authentication sessions."""
    
    __tablename__ = "auth_sessions"
    
    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    
    # Session information
    token_hash = Column(String(255), nullable=False, unique=True)
    refresh_token_hash = Column(String(255), nullable=True, unique=True)
    
    # Session metadata
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    device_fingerprint = Column(String(255), nullable=True)
    location = Column(JSON, nullable=True)  # Geolocation data
    
    # Session status
    is_active = Column(Boolean, default=True)
    is_mobile = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="auth_sessions")
    
    # Indexes
    __table_args__ = (
        Index("idx_session_user_id", "user_id"),
        Index("idx_session_token_hash", "token_hash"),
        Index("idx_session_active", "is_active"),
        Index("idx_session_expires_at", "expires_at"),
    )
    
    @property
    def is_expired(self) -> bool:
        """Check if session is expired."""
        return datetime.utcnow() > self.expires_at
    
    def __repr__(self):
        return f"<AuthSession(user_id='{self.user_id}', active={self.is_active})>"


class MagicLink(Base):
    """Magic link authentication tokens."""
    
    __tablename__ = "magic_links"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    
    # Token information
    token = Column(String(255), nullable=False, unique=True)
    email = Column(String(255), nullable=False)
    
    # Magic link metadata
    purpose = Column(String(50), nullable=False)  # login, verification, password_reset
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Status and timestamps
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="magic_links")
    
    # Indexes
    __table_args__ = (
        Index("idx_magic_link_token", "token"),
        Index("idx_magic_link_user_id", "user_id"),
        Index("idx_magic_link_email", "email"),
        Index("idx_magic_link_expires_at", "expires_at"),
    )
    
    @property
    def is_expired(self) -> bool:
        """Check if magic link is expired."""
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        """Check if magic link is valid (not used and not expired)."""
        return not self.is_used and not self.is_expired
    
    def __repr__(self):
        return f"<MagicLink(email='{self.email}', purpose='{self.purpose}')>"


class AuditLog(Base):
    """Audit log for tracking user actions."""
    
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    
    # Action information
    action = Column(String(100), nullable=False)  # e.g., "login", "create_account", "update_profile"
    resource_type = Column(String(100), nullable=True)  # e.g., "account", "contact", "user"
    resource_id = Column(String(255), nullable=True)  # ID of the affected resource
    
    # Action details
    details = Column(JSON, nullable=True)  # Additional action details
    changes = Column(JSON, nullable=True)  # Before/after values for updates
    
    # Request metadata
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    request_id = Column(String(255), nullable=True)
    
    # Status
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    tenant = relationship("Tenant")
    user = relationship("User", back_populates="audit_logs")
    
    # Indexes
    __table_args__ = (
        Index("idx_audit_tenant_id", "tenant_id"),
        Index("idx_audit_user_id", "user_id"),
        Index("idx_audit_action", "action"),
        Index("idx_audit_resource_type", "resource_type"),
        Index("idx_audit_created_at", "created_at"),
        Index("idx_audit_success", "success"),
    )
    
    def __repr__(self):
        return f"<AuditLog(action='{self.action}', user_id='{self.user_id}')>"


class SecuritySettings(Base):
    """Security settings per tenant."""
    
    __tablename__ = "security_settings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False, unique=True)
    
    # Password policy
    min_password_length = Column(Integer, default=8)
    require_uppercase = Column(Boolean, default=True)
    require_lowercase = Column(Boolean, default=True)
    require_numbers = Column(Boolean, default=True)
    require_special_chars = Column(Boolean, default=True)
    password_expiry_days = Column(Integer, nullable=True)  # NULL = no expiry
    
    # Account lockout policy
    max_failed_attempts = Column(Integer, default=5)
    lockout_duration_minutes = Column(Integer, default=30)
    
    # Session policy
    session_timeout_minutes = Column(Integer, default=480)  # 8 hours
    max_concurrent_sessions = Column(Integer, default=3)
    require_fresh_auth_minutes = Column(Integer, default=60)  # Re-auth for sensitive actions
    
    # Two-factor authentication
    require_2fa = Column(Boolean, default=False)
    require_2fa_for_admins = Column(Boolean, default=True)
    allow_remember_device = Column(Boolean, default=True)
    
    # Login security
    allow_magic_links = Column(Boolean, default=True)
    magic_link_expiry_minutes = Column(Integer, default=15)
    require_email_verification = Column(Boolean, default=True)
    
    # IP restrictions
    allowed_ip_ranges = Column(JSON, nullable=True)  # CIDR ranges
    blocked_ip_ranges = Column(JSON, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    tenant = relationship("Tenant")
    
    # Indexes
    __table_args__ = (
        Index("idx_security_settings_tenant_id", "tenant_id"),
    )
    
    def __repr__(self):
        return f"<SecuritySettings(tenant_id='{self.tenant_id}')>" 