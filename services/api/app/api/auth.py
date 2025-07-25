"""Authentication API endpoints."""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import (
    AuthenticationException,
    ValidationException,
    BusinessRuleException,
    MetadataERPException,
)
from app.core.logging import get_logger
from app.services.auth import AuthService, TokenManager

logger = get_logger("auth_api")
security = HTTPBearer()

router = APIRouter(prefix="/auth", tags=["authentication"])


# Request/Response Models

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False
    tenant_domain: Optional[str] = None


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    tenant_domain: str = Field(..., min_length=1)


class MagicLinkRequest(BaseModel):
    email: EmailStr
    tenant_domain: Optional[str] = None


class Verify2FARequest(BaseModel):
    user_id: str
    totp_code: str = Field(..., min_length=6, max_length=6)


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]
    requires_2fa: bool = False


class MessageResponse(BaseModel):
    message: str
    success: bool = True


# Helper Functions

async def get_tenant_by_domain(db: AsyncSession, domain: str):
    """Get tenant by domain."""
    from app.models import Tenant
    from sqlalchemy import select
    
    result = await db.execute(
        select(Tenant).where(Tenant.domain == domain)
    )
    return result.scalar_one_or_none()


def get_client_info(request: Request) -> tuple[Optional[str], Optional[str]]:
    """Extract client IP and user agent from request."""
    # Try to get real IP from proxy headers
    ip_address = (
        request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or
        request.headers.get("X-Real-IP") or
        request.client.host if request.client else None
    )
    user_agent = request.headers.get("User-Agent")
    return ip_address, user_agent


def format_user_response(user) -> Dict[str, Any]:
    """Format user object for API response."""
    return {
        "user_id": str(user.user_id),
        "email": user.email,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": user.full_name,
        "is_verified": user.is_verified,
        "is_2fa_enabled": user.is_2fa_enabled,
        "tenant_id": str(user.tenant_id),
        "preferences": user.preferences,
        "timezone": user.timezone,
        "locale": user.locale,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
    }


# Authentication Endpoints

@router.post("/register", response_model=MessageResponse)
async def register(
    request: RegisterRequest,
    req: Request,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user."""
    logger.info("User registration request", email=request.email, tenant_domain=request.tenant_domain)
    
    try:
        # Get tenant by domain
        tenant = await get_tenant_by_domain(db, request.tenant_domain)
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        # Get client information
        ip_address, user_agent = get_client_info(req)
        
        # Create auth service instance
        auth_service = AuthService(db)
        
        # Register user
        user = await auth_service.register_user(
            email=request.email,
            password=request.password,
            first_name=request.first_name,
            last_name=request.last_name,
            tenant_id=str(tenant.tenant_id),
            username=request.username,
        )
        
        logger.info("User registered successfully", user_id=str(user.user_id))
        
        return MessageResponse(
            message="Registration successful. Please check your email for verification instructions."
        )
        
    except MetadataERPException as exc:
        logger.warning("Registration failed", error=exc.message)
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception as exc:
        logger.exception("Registration error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    req: Request,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate user with email and password."""
    logger.info("Login request", email=request.email)
    
    try:
        # Get tenant by domain if provided
        tenant = None
        if request.tenant_domain:
            tenant = await get_tenant_by_domain(db, request.tenant_domain)
            if not tenant:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tenant not found"
                )
        
        # Get client information
        ip_address, user_agent = get_client_info(req)
        
        # Create auth service instance
        auth_service = AuthService(db)
        
        # Authenticate user
        user, access_token, refresh_token = await auth_service.authenticate_user(
            email=request.email,
            password=request.password,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        # Check if 2FA is required (empty tokens indicate 2FA required)
        if not access_token and not refresh_token:
            return AuthResponse(
                access_token="",
                refresh_token="",
                user=format_user_response(user),
                requires_2fa=True,
            )
        
        logger.info("Login successful", user_id=str(user.user_id))
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=format_user_response(user),
        )
        
    except MetadataERPException as exc:
        logger.warning("Login failed", error=exc.message)
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception as exc:
        logger.exception("Login error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/verify-2fa", response_model=AuthResponse)
async def verify_2fa(
    request: Verify2FARequest,
    req: Request,
    db: AsyncSession = Depends(get_db),
):
    """Verify 2FA code and complete login."""
    logger.info("2FA verification request", user_id=request.user_id)
    
    try:
        # Get client information
        ip_address, user_agent = get_client_info(req)
        
        # Create auth service instance
        auth_service = AuthService(db)
        
        # Verify 2FA and get tokens
        access_token, refresh_token = await auth_service.verify_2fa_and_complete_login(
            user_id=request.user_id,
            totp_code=request.totp_code,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        # Get user for response
        user = await auth_service.get_user_by_id(request.user_id)
        
        logger.info("2FA verification successful", user_id=request.user_id)
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=format_user_response(user),
        )
        
    except MetadataERPException as exc:
        logger.warning("2FA verification failed", error=exc.message)
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception as exc:
        logger.exception("2FA verification error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="2FA verification failed"
        )


@router.post("/magic-link", response_model=MessageResponse)
async def request_magic_link(
    request: MagicLinkRequest,
    req: Request,
    db: AsyncSession = Depends(get_db),
):
    """Request a magic link for passwordless authentication."""
    logger.info("Magic link request", email=request.email)
    
    try:
        # Get client information
        ip_address, user_agent = get_client_info(req)
        
        # Create auth service instance
        auth_service = AuthService(db)
        
        # Create magic link
        magic_link = await auth_service.create_magic_link(
            email=request.email,
            purpose="login",
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        logger.info("Magic link created successfully")
        
        return MessageResponse(
            message="If the email exists, a magic link has been sent."
        )
        
    except MetadataERPException as exc:
        logger.warning("Magic link creation failed", error=exc.message)
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception as exc:
        logger.exception("Magic link creation error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Magic link creation failed"
        )


@router.get("/magic-link/{token}", response_model=AuthResponse)
async def authenticate_magic_link(
    token: str,
    req: Request,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate with magic link token."""
    logger.info("Magic link authentication", token=token[:10] + "...")
    
    try:
        # Get client information
        ip_address, user_agent = get_client_info(req)
        
        # Create auth service instance
        auth_service = AuthService(db)
        
        # Authenticate with magic link
        user, access_token, refresh_token = await auth_service.authenticate_with_magic_link(
            token=token,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        logger.info("Magic link authentication successful", user_id=str(user.user_id))
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=format_user_response(user),
        )
        
    except MetadataERPException as exc:
        logger.warning("Magic link authentication failed", error=exc.message)
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception as exc:
        logger.exception("Magic link authentication error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Magic link authentication failed"
        )


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(
    req: Request,
    refresh_token: str,
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token using refresh token."""
    logger.info("Token refresh request")
    
    try:
        # Verify refresh token
        payload = TokenManager.verify_token(refresh_token, "refresh")
        user_id = payload["sub"]
        tenant_id = payload["tenant_id"]
        
        # Create auth service instance
        auth_service = AuthService(db)
        
        # Get user to ensure they're still active
        user = await auth_service.get_user_by_id(user_id)
        if not user or not user.is_active:
            raise AuthenticationException("User account is inactive")
        
        # Create new access token
        access_token = TokenManager.create_access_token(user_id, tenant_id)
        
        logger.info("Token refreshed successfully", user_id=user_id)
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,  # Keep the same refresh token
            user=format_user_response(user),
        )
        
    except MetadataERPException as exc:
        logger.warning("Token refresh failed", error=exc.message)
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception as exc:
        logger.exception("Token refresh error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    req: Request,
    token: str = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """Logout user and invalidate session."""
    logger.info("Logout request")
    
    try:
        # Verify token
        payload = TokenManager.verify_token(token.credentials, "access")
        user_id = payload["sub"]
        
        # Create auth service instance
        auth_service = AuthService(db)
        
        # Invalidate session (implementation depends on session management)
        # For now, just log the logout
        await auth_service.log_audit_event(
            action="logout",
            user_id=user_id,
            tenant_id=payload["tenant_id"],
        )
        
        logger.info("Logout successful", user_id=user_id)
        
        return MessageResponse(message="Logout successful")
        
    except MetadataERPException as exc:
        logger.warning("Logout failed", error=exc.message)
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception as exc:
        logger.exception("Logout error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )


@router.get("/me", response_model=Dict[str, Any])
async def get_current_user(
    token: str = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """Get current user information."""
    try:
        # Verify token
        payload = TokenManager.verify_token(token.credentials, "access")
        user_id = payload["sub"]
        
        # Create auth service instance
        auth_service = AuthService(db)
        
        # Get user
        user = await auth_service.get_user_by_id(user_id)
        if not user:
            raise AuthenticationException("User not found")
        
        return format_user_response(user)
        
    except MetadataERPException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception as exc:
        logger.exception("Get current user error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user information"
        ) 