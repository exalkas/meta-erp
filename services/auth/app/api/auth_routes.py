"""
SAP-Style Authentication API Routes

FastAPI endpoints for enterprise authentication with:
- Multi-method authentication (password, magic links, 2FA)
- Session management
- Tenant configuration
- Compliance and audit
"""

import asyncio
from datetime import datetime, timedelta
from typing import Optional, List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db_session
from ..core.logging import get_logger, set_context, LogContext
from ..engines.sap_auth_engine import SAPStyleAuthEngine
from ..models.auth_models import (
    User, AuthSession, TenantAuthConfig,
    AuthMethodType, MagicLinkPurpose, SessionStatus
)
from ..schemas.auth_schemas import (
    # Request schemas
    PasswordAuthRequest, MagicLinkRequest, MagicLinkVerifyRequest,
    UserRegistrationRequest, SessionRevokeRequest, TenantConfigUpdateRequest,
    
    # Response schemas
    AuthSuccessResponse, MagicLinkResponse, UserProfileResponse,
    SessionResponse, SessionListResponse, TenantConfigResponse,
    ErrorResponse, TwoFactorRequiredResponse, ComplianceRequiredResponse,
    HealthCheckResponse, AuditLogResponse
)
from ..core.exceptions import (
    BaseAuthException, AuthenticationException, TwoFactorRequiredException,
    MagicLinkExpiredException, ComplianceException, AccountLockedException
)

# Initialize router and dependencies
router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)
logger = get_logger("auth_routes")

# =============================================
# UTILITY FUNCTIONS
# =============================================

def get_client_ip(request: Request) -> str:
    """Extract client IP address from request"""
    # Check for forwarded headers first (load balancer/proxy)
    if x_forwarded_for := request.headers.get("X-Forwarded-For"):
        return x_forwarded_for.split(",")[0].strip()
    if x_real_ip := request.headers.get("X-Real-IP"):
        return x_real_ip
    # Fall back to direct connection
    return request.client.host if request.client else "unknown"

def get_user_agent(request: Request) -> str:
    """Extract user agent from request"""
    return request.headers.get("User-Agent", "unknown")

def get_request_id(request: Request) -> str:
    """Get or generate request ID for tracing"""
    return getattr(request.state, 'request_id', str(uuid4()))

async def get_current_user_from_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db_session)
) -> Optional[tuple[User, AuthSession]]:
    """Get current user from Authorization header (optional)"""
    if not credentials:
        return None
    
    try:
        # TODO: Implement JWT token verification
        # For now, treat token as session access_token
        auth_engine = AuthEngine(db)
        
        # Look up session by access token
        from sqlalchemy import select, and_
        stmt = select(AuthSession).where(
            and_(
                AuthSession.access_token == credentials.credentials,
                AuthSession.status == SessionStatus.ACTIVE,
                AuthSession.expires_at > datetime.utcnow()
            )
        )
        result = await db.execute(stmt)
        session = result.scalar_one_or_none()
        
        if not session:
            return None
        
        # Get user
        user = await auth_engine.get_user_by_id(session.user_id)
        if not user:
            return None
        
        # Update last activity
        session.last_activity = datetime.utcnow()
        await db.commit()
        
        return user, session
        
    except Exception as e:
        logger.warning("Token validation failed", error=str(e))
        return None

async def require_current_user(
    user_session: Optional[tuple[User, AuthSession]] = Depends(get_current_user_from_token)
) -> tuple[User, AuthSession]:
    """Require authenticated user"""
    if not user_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return user_session

def create_auth_response(user: User, session: AuthSession) -> AuthSuccessResponse:
    """Create standardized authentication success response"""
    
    # Calculate token expiry
    expires_in = int((session.expires_at - datetime.utcnow()).total_seconds())
    
    return AuthSuccessResponse(
        user=UserProfileResponse(
            user_id=user.user_id,
            tenant_id=user.tenant_id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            display_name=user.display_name,
            status=user.status,
            is_verified=user.is_verified,
            phone=user.phone,
            phone_verified=user.phone_verified,
            avatar_url=user.avatar_url,
            timezone=user.timezone,
            locale=user.locale,
            two_factor_enabled=user.two_factor_enabled,
            passkey_enabled=user.passkey_enabled,
            compliance_level=user.compliance_level,
            last_login=user.last_login,
            created_at=user.created_at
        ),
        session=SessionResponse(
            session_id=session.session_id,
            status=session.status,
            device_name=session.device_name,
            device_type=session.device_type,
            ip_address=session.ip_address,
            location_country=session.location_country,
            location_city=session.location_city,
            created_at=session.created_at,
            expires_at=session.expires_at,
            last_activity=session.last_activity,
            is_current=True
        ),
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_in=expires_in
    )

# =============================================
# AUTHENTICATION ENDPOINTS
# =============================================

@router.post("/login/password", response_model=AuthSuccessResponse)
async def login_with_password(
    request_data: PasswordAuthRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    """Authenticate user with email and password"""
    
    # Set up logging context
    request_id = get_request_id(request)
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    with LogContext(request_id=request_id, tenant_id=str(request_data.tenant_id)):
        logger.info(
            "Password authentication attempt",
            email=request_data.email,
            ip_address=ip_address,
            device_name=request_data.device_name
        )
        
        try:
            auth_engine = SAPStyleAuthEngine(db)
            
            # TODO: Implement SAP-style authentication
            # For now, return a placeholder response
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="SAP-style authentication not yet implemented"
            )
            
            # Update session with device name if provided
            if request_data.device_name:
                session.device_name = request_data.device_name
                await db.commit()
            
            logger.info(
                "Password authentication successful",
                user_id=str(user.user_id),
                session_id=str(session.session_id)
            )
            
            return create_auth_response(user, session)
            
        except TwoFactorRequiredException as e:
            logger.warning("2FA required", details=e.details)
            raise HTTPException(
                status_code=status.HTTP_206_PARTIAL_CONTENT,
                detail=TwoFactorRequiredResponse(
                    available_methods=e.details.get("available_methods", ["totp"]),
                    user_id=e.user_id
                ).dict()
            )
            
        except BaseAuthException as e:
            logger.warning("Authentication failed", error_code=e.error_code.value, details=e.details)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=e.to_dict()
            )

@router.post("/magic-link/send", response_model=MagicLinkResponse)
async def send_magic_link(
    request_data: MagicLinkRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    """Send magic link for authentication"""
    
    request_id = get_request_id(request)
    ip_address = get_client_ip(request)
    
    with LogContext(request_id=request_id, tenant_id=str(request_data.tenant_id)):
        logger.info(
            "Magic link request",
            email=request_data.email,
            purpose=request_data.purpose.value,
            ip_address=ip_address
        )
        
        try:
            auth_engine = AuthEngine(db)
            
            # Send magic link
            token = await auth_engine.send_magic_link(
                tenant_id=request_data.tenant_id,
                email=request_data.email,
                purpose=request_data.purpose,
                registration_data=request_data.registration_data
            )
            
            logger.info("Magic link sent successfully", email=request_data.email)
            
            return MagicLinkResponse(
                email=request_data.email,
                expires_in=900  # 15 minutes
            )
            
        except BaseAuthException as e:
            logger.warning("Magic link sending failed", error_code=e.error_code.value)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=e.to_dict()
            )

@router.post("/magic-link/verify", response_model=AuthSuccessResponse)
async def verify_magic_link(
    request_data: MagicLinkVerifyRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    """Verify magic link and authenticate user"""
    
    request_id = get_request_id(request)
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    with LogContext(request_id=request_id):
        logger.info("Magic link verification attempt", ip_address=ip_address)
        
        try:
            auth_engine = AuthEngine(db)
            
            # Verify magic link
            user, session = await auth_engine.verify_magic_link(
                token=request_data.token,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            # Update session with device name if provided
            if request_data.device_name:
                session.device_name = request_data.device_name
                await db.commit()
            
            logger.info(
                "Magic link verification successful",
                user_id=str(user.user_id),
                session_id=str(session.session_id)
            )
            
            return create_auth_response(user, session)
            
        except BaseAuthException as e:
            logger.warning("Magic link verification failed", error_code=e.error_code.value)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=e.to_dict()
            )

@router.post("/register", response_model=AuthSuccessResponse)
async def register_user(
    request_data: UserRegistrationRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    """Register new user"""
    
    request_id = get_request_id(request)
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    with LogContext(request_id=request_id, tenant_id=str(request_data.tenant_id)):
        logger.info(
            "User registration attempt",
            email=request_data.email,
            ip_address=ip_address
        )
        
        try:
            auth_engine = AuthEngine(db)
            
            # Get tenant config for validation
            auth_config = await auth_engine.get_tenant_auth_config(request_data.tenant_id)
            
            # Validate compliance requirements
            if auth_config.require_terms_acceptance and not request_data.terms_accepted:
                raise ComplianceException(
                    "Terms of service acceptance required",
                    "terms_acceptance",
                    tenant_id=str(request_data.tenant_id)
                )
            
            if auth_config.require_privacy_acceptance and not request_data.privacy_accepted:
                raise ComplianceException(
                    "Privacy policy acceptance required",
                    "privacy_acceptance",
                    tenant_id=str(request_data.tenant_id)
                )
            
            # Create user
            user = await auth_engine.create_user(
                tenant_id=request_data.tenant_id,
                email=request_data.email,
                password=request_data.password,
                first_name=request_data.first_name,
                last_name=request_data.last_name,
                phone=request_data.phone,
                timezone=request_data.timezone,
                locale=request_data.locale,
                terms_accepted_at=datetime.utcnow() if request_data.terms_accepted else None,
                privacy_accepted_at=datetime.utcnow() if request_data.privacy_accepted else None
            )
            
            # If email verification not required, create session immediately
            if not auth_config.require_email_verification:
                session = await auth_engine._create_session(
                    user=user,
                    auth_config=auth_config,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
                await db.commit()
                
                logger.info(
                    "User registration and login successful",
                    user_id=str(user.user_id),
                    session_id=str(session.session_id)
                )
                
                return create_auth_response(user, session)
            
            else:
                # Send verification email (magic link)
                await auth_engine.send_magic_link(
                    tenant_id=request_data.tenant_id,
                    email=request_data.email,
                    purpose=MagicLinkPurpose.EMAIL_VERIFICATION
                )
                
                logger.info(
                    "User registration successful, verification required",
                    user_id=str(user.user_id)
                )
                
                raise HTTPException(
                    status_code=status.HTTP_202_ACCEPTED,
                    detail={
                        "success": False,
                        "message": "Registration successful. Please check your email for verification.",
                        "verification_required": True,
                        "user_id": str(user.user_id)
                    }
                )
            
        except BaseAuthException as e:
            logger.warning("User registration failed", error_code=e.error_code.value)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=e.to_dict()
            )

@router.post("/logout")
async def logout(
    request_data: SessionRevokeRequest,
    current_user: tuple[User, AuthSession] = Depends(require_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Logout user (revoke session)"""
    
    user, current_session = current_user
    
    with LogContext(
        tenant_id=str(user.tenant_id),
        user_id=str(user.user_id),
        session_id=str(current_session.session_id)
    ):
        logger.info("User logout request")
        
        try:
            auth_engine = AuthEngine(db)
            
            # Determine which sessions to revoke
            if request_data.session_id:
                # Revoke specific session
                success = await auth_engine.revoke_session(
                    session_id=request_data.session_id,
                    reason=request_data.reason
                )
                
                if not success:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Session not found"
                    )
            
            else:
                # Revoke all user sessions
                await auth_engine._revoke_all_user_sessions(
                    user_id=user.user_id,
                    reason=request_data.reason
                )
            
            logger.info("Logout successful")
            
            return {
                "success": True,
                "message": "Logout successful"
            }
            
        except Exception as e:
            logger.error("Logout failed", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Logout failed"
            )

# =============================================
# SESSION MANAGEMENT ENDPOINTS
# =============================================

@router.get("/sessions", response_model=SessionListResponse)
async def get_user_sessions(
    current_user: tuple[User, AuthSession] = Depends(require_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get all user sessions"""
    
    user, current_session = current_user
    
    with LogContext(
        tenant_id=str(user.tenant_id),
        user_id=str(user.user_id)
    ):
        try:
            auth_engine = AuthEngine(db)
            
            # Get all sessions
            all_sessions = await auth_engine.get_user_sessions(user.user_id, active_only=False)
            active_sessions = [s for s in all_sessions if s.status == SessionStatus.ACTIVE and s.expires_at > datetime.utcnow()]
            
            # Convert to response format
            session_responses = []
            for session in all_sessions:
                session_responses.append(SessionResponse(
                    session_id=session.session_id,
                    status=session.status,
                    device_name=session.device_name,
                    device_type=session.device_type,
                    ip_address=session.ip_address,
                    location_country=session.location_country,
                    location_city=session.location_city,
                    created_at=session.created_at,
                    expires_at=session.expires_at,
                    last_activity=session.last_activity,
                    is_current=(session.session_id == current_session.session_id)
                ))
            
            return SessionListResponse(
                sessions=session_responses,
                total_sessions=len(all_sessions),
                active_sessions=len(active_sessions),
                current_session_id=current_session.session_id
            )
            
        except Exception as e:
            logger.error("Failed to get sessions", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve sessions"
            )

@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: UUID,
    reason: str = "user_requested",
    current_user: tuple[User, AuthSession] = Depends(require_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Revoke a specific session"""
    
    user, current_session = current_user
    
    with LogContext(
        tenant_id=str(user.tenant_id),
        user_id=str(user.user_id)
    ):
        try:
            auth_engine = AuthEngine(db)
            
            success = await auth_engine.revoke_session(session_id, reason)
            
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Session not found"
                )
            
            logger.info("Session revoked", revoked_session_id=str(session_id))
            
            return {
                "success": True,
                "message": "Session revoked successfully"
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Failed to revoke session", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to revoke session"
            )

# =============================================
# TENANT CONFIGURATION ENDPOINTS
# =============================================

@router.get("/config/{tenant_id}", response_model=TenantConfigResponse)
async def get_tenant_config(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db_session)
):
    """Get tenant authentication configuration (public endpoint)"""
    
    try:
        auth_engine = AuthEngine(db)
        config = await auth_engine.get_tenant_auth_config(tenant_id)
        
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        return TenantConfigResponse(
            tenant_id=config.tenant_id,
            vertical=config.vertical,
            compliance_level=config.compliance_level,
            enabled_auth_methods=config.enabled_auth_methods,
            default_auth_method=config.default_auth_method,
            session_timeout_minutes=config.session_timeout_minutes,
            max_concurrent_sessions=config.max_concurrent_sessions,
            idle_timeout_minutes=config.idle_timeout_minutes,
            require_2fa=config.require_2fa,
            require_2fa_for_admin=config.require_2fa_for_admin,
            require_email_verification=config.require_email_verification,
            require_phone_verification=config.require_phone_verification,
            password_policy=config.password_policy,
            industry_requirements=config.industry_requirements
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get tenant config", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve tenant configuration"
        )

# =============================================
# UTILITY ENDPOINTS
# =============================================

@router.get("/health", response_model=HealthCheckResponse)
async def health_check(db: AsyncSession = Depends(get_db_session)):
    """Health check endpoint"""
    
    try:
        # Test database connection
        await db.execute("SELECT 1")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    
    try:
        # Test Redis connection (if available)
        # TODO: Implement Redis health check
        redis_status = "not_configured"
    except Exception:
        redis_status = "disconnected"
    
    return HealthCheckResponse(
        timestamp=datetime.utcnow(),
        version="1.5.0",
        database_status=db_status,
        redis_status=redis_status
    ) 