"""Authentication service for user management and security."""

import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import bcrypt
import jwt
import pyotp
from email_validator import validate_email, EmailNotValidError
from sqlalchemy import and_, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import (
    AuthenticationException,
    ValidationException,
    BusinessRuleException,
    RecordNotFoundException,
    TenantNotFoundException,
)
from app.core.logging import get_logger
from app.models import (
    User,
    Tenant,
    Role,
    AuthSession,
    MagicLink,
    AuditLog,
    SecuritySettings,
)

settings = get_settings()
logger = get_logger("auth_service")


class PasswordValidator:
    """Password validation based on security settings."""
    
    @staticmethod
    def validate_password(
        password: str,
        security_settings: Optional[SecuritySettings] = None,
    ) -> Tuple[bool, List[str]]:
        """Validate password against security policy."""
        errors = []
        
        # Use default settings if none provided
        if not security_settings:
            min_length = 8
            require_uppercase = True
            require_lowercase = True
            require_numbers = True
            require_special = True
        else:
            min_length = security_settings.min_password_length
            require_uppercase = security_settings.require_uppercase
            require_lowercase = security_settings.require_lowercase
            require_numbers = security_settings.require_numbers
            require_special = security_settings.require_special_chars
        
        # Length check
        if len(password) < min_length:
            errors.append(f"Password must be at least {min_length} characters long")
        
        # Character requirements
        if require_uppercase and not any(c.isupper() for c in password):
            errors.append("Password must contain at least one uppercase letter")
        
        if require_lowercase and not any(c.islower() for c in password):
            errors.append("Password must contain at least one lowercase letter")
        
        if require_numbers and not any(c.isdigit() for c in password):
            errors.append("Password must contain at least one number")
        
        if require_special and not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            errors.append("Password must contain at least one special character")
        
        return len(errors) == 0, errors


class TokenManager:
    """JWT token management."""
    
    @staticmethod
    def create_access_token(
        user_id: str,
        tenant_id: str,
        additional_claims: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Create JWT access token."""
        now = datetime.utcnow()
        claims = {
            "sub": user_id,
            "tenant_id": tenant_id,
            "iat": now,
            "exp": now + timedelta(minutes=15),  # Short-lived access token
            "type": "access",
        }
        
        if additional_claims:
            claims.update(additional_claims)
        
        return jwt.encode(claims, settings.jwt_secret_key, algorithm="HS256")
    
    @staticmethod
    def create_refresh_token(user_id: str, tenant_id: str) -> str:
        """Create JWT refresh token."""
        now = datetime.utcnow()
        claims = {
            "sub": user_id,
            "tenant_id": tenant_id,
            "iat": now,
            "exp": now + timedelta(days=7),  # Long-lived refresh token
            "type": "refresh",
            "jti": str(uuid.uuid4()),  # Unique token ID
        }
        
        return jwt.encode(claims, settings.jwt_secret_key, algorithm="HS256")
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Dict[str, Any]:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
            
            # Verify token type
            if payload.get("type") != token_type:
                raise AuthenticationException("Invalid token type")
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise AuthenticationException("Token has expired")
        except jwt.InvalidTokenError:
            raise AuthenticationException("Invalid token")


class AuthService:
    """Main authentication service."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.logger = logger.bind_operation_context("auth_service")
    
    async def get_security_settings(self, tenant_id: str) -> SecuritySettings:
        """Get security settings for tenant."""
        result = await self.db.execute(
            select(SecuritySettings).where(SecuritySettings.tenant_id == tenant_id)
        )
        settings = result.scalar_one_or_none()
        
        if not settings:
            # Create default security settings
            settings = SecuritySettings(tenant_id=tenant_id)
            self.db.add(settings)
            await self.db.commit()
            
        return settings
    
    async def register_user(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        tenant_id: str,
        username: Optional[str] = None,
        send_verification: bool = True,
    ) -> User:
        """Register a new user."""
        self.logger.info("User registration started", email=email, tenant_id=tenant_id)
        
        try:
            # Validate email
            try:
                validated_email = validate_email(email)
                email = validated_email.email
            except EmailNotValidError as e:
                raise ValidationException(f"Invalid email address: {str(e)}")
            
            # Check if user already exists
            existing_user = await self.get_user_by_email(email)
            if existing_user:
                raise BusinessRuleException(
                    "User with this email already exists",
                    rule_name="unique_email",
                )
            
            # Validate tenant exists
            tenant = await self.get_tenant(tenant_id)
            if not tenant:
                raise TenantNotFoundException(tenant_id)
            
            # Get security settings
            security_settings = await self.get_security_settings(tenant_id)
            
            # Validate password
            is_valid, errors = PasswordValidator.validate_password(password, security_settings)
            if not is_valid:
                raise ValidationException("Password validation failed", field_errors=[
                    {"field": "password", "message": error} for error in errors
                ])
            
            # Hash password
            password_salt = secrets.token_hex(16)
            password_hash = bcrypt.hashpw(
                (password + password_salt).encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')
            
            # Create user
            user = User(
                email=email,
                username=username,
                first_name=first_name,
                last_name=last_name,
                password_hash=password_hash,
                password_salt=password_salt,
                tenant_id=tenant_id,
                is_verified=not security_settings.require_email_verification,
            )
            
            # Generate email verification token if needed
            if security_settings.require_email_verification:
                user.email_verification_token = secrets.token_urlsafe(32)
            
            self.db.add(user)
            await self.db.flush()  # Get user ID
            
            # Assign default role
            await self.assign_default_role(user.user_id, tenant_id)
            
            # Send verification email if required
            if send_verification and security_settings.require_email_verification:
                await self.send_verification_email(user)
            
            await self.db.commit()
            
            # Log audit event
            await self.log_audit_event(
                action="user_registered",
                user_id=user.user_id,
                tenant_id=tenant_id,
                details={"email": email, "username": username},
            )
            
            self.logger.info("User registered successfully", user_id=str(user.user_id))
            return user
            
        except Exception as exc:
            await self.db.rollback()
            self.logger.exception("User registration failed", email=email)
            raise
    
    async def authenticate_user(
        self,
        email: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[User, str, str]:
        """Authenticate user with email/password."""
        self.logger.info("User authentication attempt", email=email)
        
        try:
            # Get user
            user = await self.get_user_by_email(email)
            if not user:
                await self.log_failed_login(email, "user_not_found", ip_address)
                raise AuthenticationException("Invalid email or password")
            
            # Check if account is locked
            if user.is_locked:
                await self.log_failed_login(email, "account_locked", ip_address)
                raise AuthenticationException("Account is temporarily locked")
            
            # Check if account is active
            if not user.is_active:
                await self.log_failed_login(email, "account_inactive", ip_address)
                raise AuthenticationException("Account is inactive")
            
            # Check if email is verified (if required)
            security_settings = await self.get_security_settings(user.tenant_id)
            if security_settings.require_email_verification and not user.is_verified:
                await self.log_failed_login(email, "email_not_verified", ip_address)
                raise AuthenticationException("Email not verified")
            
            # Verify password
            if not self.verify_password(password, user.password_hash, user.password_salt):
                await self.handle_failed_login(user, ip_address)
                raise AuthenticationException("Invalid email or password")
            
            # Reset failed login attempts on successful auth
            if user.failed_login_attempts > 0:
                await self.db.execute(
                    update(User)
                    .where(User.user_id == user.user_id)
                    .values(failed_login_attempts=0, locked_until=None)
                )
            
            # Check if 2FA is required
            if user.is_2fa_enabled:
                # Return special response indicating 2FA required
                # The actual tokens will be created after 2FA verification
                await self.log_audit_event(
                    action="login_2fa_required",
                    user_id=user.user_id,
                    tenant_id=user.tenant_id,
                    details={"ip_address": ip_address, "user_agent": user_agent},
                )
                return user, "", ""  # Empty tokens indicate 2FA required
            
            # Create session and tokens
            access_token, refresh_token = await self.create_user_session(
                user, ip_address, user_agent
            )
            
            # Update login tracking
            await self.update_login_tracking(user, ip_address)
            
            await self.db.commit()
            
            self.logger.info("User authenticated successfully", user_id=str(user.user_id))
            return user, access_token, refresh_token
            
        except Exception as exc:
            await self.db.rollback()
            self.logger.exception("Authentication failed", email=email)
            raise
    
    async def verify_2fa_and_complete_login(
        self,
        user_id: str,
        totp_code: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[str, str]:
        """Verify 2FA code and complete login."""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise AuthenticationException("User not found")
        
        # Verify TOTP code
        if not self.verify_totp(user.totp_secret, totp_code):
            await self.log_audit_event(
                action="login_2fa_failed",
                user_id=user.user_id,
                tenant_id=user.tenant_id,
                details={"ip_address": ip_address},
            )
            raise AuthenticationException("Invalid 2FA code")
        
        # Create session and tokens
        access_token, refresh_token = await self.create_user_session(
            user, ip_address, user_agent
        )
        
        # Update login tracking
        await self.update_login_tracking(user, ip_address)
        
        await self.db.commit()
        
        self.logger.info("2FA verification completed", user_id=str(user.user_id))
        return access_token, refresh_token
    
    async def create_magic_link(
        self,
        email: str,
        purpose: str = "login",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> MagicLink:
        """Create magic link for passwordless authentication."""
        self.logger.info("Creating magic link", email=email, purpose=purpose)
        
        user = await self.get_user_by_email(email)
        if not user:
            # Don't reveal if user exists or not
            raise AuthenticationException("If the email exists, a magic link has been sent")
        
        # Check if magic links are allowed
        security_settings = await self.get_security_settings(user.tenant_id)
        if not security_settings.allow_magic_links:
            raise BusinessRuleException(
                "Magic links are not allowed for this tenant",
                rule_name="magic_links_disabled",
            )
        
        # Revoke any existing unused magic links for this user and purpose
        await self.db.execute(
            update(MagicLink)
            .where(
                and_(
                    MagicLink.user_id == user.user_id,
                    MagicLink.purpose == purpose,
                    MagicLink.is_used == False,
                )
            )
            .values(is_used=True, used_at=datetime.utcnow())
        )
        
        # Create new magic link
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(
            minutes=security_settings.magic_link_expiry_minutes
        )
        
        magic_link = MagicLink(
            user_id=user.user_id,
            token=token,
            email=email,
            purpose=purpose,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=expires_at,
        )
        
        self.db.add(magic_link)
        await self.db.commit()
        
        # Send magic link email
        await self.send_magic_link_email(magic_link)
        
        await self.log_audit_event(
            action="magic_link_created",
            user_id=user.user_id,
            tenant_id=user.tenant_id,
            details={"purpose": purpose, "ip_address": ip_address},
        )
        
        self.logger.info("Magic link created", user_id=str(user.user_id))
        return magic_link
    
    async def authenticate_with_magic_link(
        self,
        token: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[User, str, str]:
        """Authenticate user with magic link."""
        self.logger.info("Magic link authentication attempt")
        
        # Find magic link
        result = await self.db.execute(
            select(MagicLink).where(MagicLink.token == token)
        )
        magic_link = result.scalar_one_or_none()
        
        if not magic_link or not magic_link.is_valid:
            raise AuthenticationException("Invalid or expired magic link")
        
        # Get user
        user = await self.get_user_by_id(magic_link.user_id)
        if not user or not user.is_active:
            raise AuthenticationException("User account is inactive")
        
        # Mark magic link as used
        magic_link.is_used = True
        magic_link.used_at = datetime.utcnow()
        
        # Create session and tokens
        access_token, refresh_token = await self.create_user_session(
            user, ip_address, user_agent
        )
        
        # Update login tracking
        await self.update_login_tracking(user, ip_address)
        
        await self.db.commit()
        
        await self.log_audit_event(
            action="magic_link_login",
            user_id=user.user_id,
            tenant_id=user.tenant_id,
            details={"ip_address": ip_address, "user_agent": user_agent},
        )
        
        self.logger.info("Magic link authentication successful", user_id=str(user.user_id))
        return user, access_token, refresh_token
    
    async def enable_2fa(self, user_id: str) -> str:
        """Enable 2FA for user and return QR code URL."""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise RecordNotFoundException("User", user_id)
        
        # Generate TOTP secret
        secret = pyotp.random_base32()
        
        # Store encrypted secret (in production, encrypt this)
        user.totp_secret = secret
        user.is_2fa_enabled = True
        
        # Generate backup codes
        backup_codes = [secrets.token_hex(4) for _ in range(8)]
        # In production, hash these codes
        user.backup_codes = backup_codes
        
        await self.db.commit()
        
        # Generate QR code URL
        totp = pyotp.TOTP(secret)
        qr_url = totp.provisioning_uri(
            name=user.email,
            issuer_name="Metadata ERP",
        )
        
        await self.log_audit_event(
            action="2fa_enabled",
            user_id=user.user_id,
            tenant_id=user.tenant_id,
        )
        
        return qr_url
    
    # Helper methods
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        result = await self.db.execute(
            select(User).where(User.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_tenant(self, tenant_id: str) -> Optional[Tenant]:
        """Get tenant by ID."""
        result = await self.db.execute(
            select(Tenant).where(Tenant.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()
    
    def verify_password(self, password: str, hash: str, salt: str) -> bool:
        """Verify password against hash."""
        return bcrypt.checkpw((password + salt).encode('utf-8'), hash.encode('utf-8'))
    
    def verify_totp(self, secret: str, code: str) -> bool:
        """Verify TOTP code."""
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=1)  # Allow 1 step tolerance
    
    async def create_user_session(
        self,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[str, str]:
        """Create user session and return tokens."""
        # Create tokens
        access_token = TokenManager.create_access_token(
            str(user.user_id),
            str(user.tenant_id),
        )
        refresh_token = TokenManager.create_refresh_token(
            str(user.user_id),
            str(user.tenant_id),
        )
        
        # Create session record
        session = AuthSession(
            user_id=user.user_id,
            token_hash=hashlib.sha256(access_token.encode()).hexdigest(),
            refresh_token_hash=hashlib.sha256(refresh_token.encode()).hexdigest(),
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=datetime.utcnow() + timedelta(hours=8),  # 8 hour session
        )
        
        self.db.add(session)
        return access_token, refresh_token
    
    async def update_login_tracking(self, user: User, ip_address: Optional[str]):
        """Update user login tracking."""
        await self.db.execute(
            update(User)
            .where(User.user_id == user.user_id)
            .values(
                last_login_at=datetime.utcnow(),
                last_login_ip=ip_address,
                login_count=User.login_count + 1,
            )
        )
    
    async def handle_failed_login(self, user: User, ip_address: Optional[str]):
        """Handle failed login attempt."""
        security_settings = await self.get_security_settings(user.tenant_id)
        
        new_failed_attempts = user.failed_login_attempts + 1
        locked_until = None
        
        if new_failed_attempts >= security_settings.max_failed_attempts:
            locked_until = datetime.utcnow() + timedelta(
                minutes=security_settings.lockout_duration_minutes
            )
        
        await self.db.execute(
            update(User)
            .where(User.user_id == user.user_id)
            .values(
                failed_login_attempts=new_failed_attempts,
                locked_until=locked_until,
            )
        )
        
        await self.log_audit_event(
            action="login_failed",
            user_id=user.user_id,
            tenant_id=user.tenant_id,
            details={
                "ip_address": ip_address,
                "failed_attempts": new_failed_attempts,
                "locked": locked_until is not None,
            },
        )
    
    async def log_failed_login(
        self,
        email: str,
        reason: str,
        ip_address: Optional[str],
    ):
        """Log failed login attempt."""
        await self.log_audit_event(
            action="login_failed",
            details={
                "email": email,
                "reason": reason,
                "ip_address": ip_address,
            },
        )
    
    async def assign_default_role(self, user_id: str, tenant_id: str):
        """Assign default role to user."""
        # Find default role for tenant
        result = await self.db.execute(
            select(Role).where(
                and_(
                    Role.tenant_id == tenant_id,
                    Role.is_default == True,
                    Role.is_active == True,
                )
            )
        )
        default_role = result.scalar_one_or_none()
        
        if default_role:
            # Assign role to user
            from app.models.auth import user_roles
            
            stmt = user_roles.insert().values(
                user_id=user_id,
                role_id=default_role.role_id,
            )
            await self.db.execute(stmt)
    
    async def log_audit_event(
        self,
        action: str,
        user_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        success: bool = True,
        error_message: Optional[str] = None,
    ):
        """Log audit event."""
        audit_log = AuditLog(
            action=action,
            user_id=user_id,
            tenant_id=tenant_id,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            success=success,
            error_message=error_message,
        )
        
        self.db.add(audit_log)
    
    async def send_verification_email(self, user: User):
        """Send email verification email."""
        # TODO: Implement email sending
        self.logger.info("Verification email sent", user_id=str(user.user_id))
        pass
    
    async def send_magic_link_email(self, magic_link: MagicLink):
        """Send magic link email."""
        # TODO: Implement email sending
        self.logger.info("Magic link email sent", user_id=str(magic_link.user_id))
        pass 