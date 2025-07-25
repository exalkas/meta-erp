"""
Authentication API Endpoints

Provides JWT-based authentication endpoints for the metadata-driven platform.
Implements one-user-one-session policy and secure session management.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

from app.core.database import get_db
from app.core.logging import get_logger, get_auth_logger
from app.core.jwt_manager import get_jwt_manager
from app.core.session_manager import SessionManager
from app.core.exceptions import (
    InvalidCredentialsException,
    AccountLockedException,
    InvalidTokenException,
    SessionExpiredException,
    UserNotFoundException,
    EmailAlreadyExistsException,
    PasswordValidationException,
)

logger = get_logger("auth_api")
auth_logger = get_auth_logger("auth_api")
security = HTTPBearer(auto_error=False)

router = APIRouter()


# Request/Response Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)
    remember_me: bool = Field(default=False)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    tenant_id: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str
    logout_all_devices: bool = Field(default=False)


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    user: Dict[str, Any]


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class UserResponse(BaseModel):
    user: Dict[str, Any]


# Helper Functions
def get_client_info(request: Request) -> tuple[str, str]:
    """Extract client IP and user agent from request."""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    return client_ip, user_agent


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[Dict[str, Any]]:
    """Get user data by email from the database."""
    from services.api.app.models.auth import User
    from services.api.app.models.metadata import Tenant
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    try:
        # Get user with roles and tenant information
        query = select(User).options(
            selectinload(User.roles),
            selectinload(User.tenant)
        ).where(User.email == email)
        
        result = await db.execute(query)
        user = result.scalars().first()
        
        if not user:
            return None
        
        # Get user permissions through roles
        permissions = []
        roles = []
        for role in user.roles:
            roles.append(role.name)
            for permission in role.permissions:
                permissions.append(permission.name)
        
        # Remove duplicates
        permissions = list(set(permissions))
        
        user_data = {
            "id": str(user.user_id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": f"{user.first_name} {user.last_name}",
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "tenant_id": str(user.tenant_id) if user.tenant_id else None,
            "company_id": str(user.tenant_id) if user.tenant_id else None,  # For compatibility
            "role": roles[0] if roles else "user",  # Primary role
            "roles": roles,
            "permissions": permissions,
            "custom_permissions": [],  # For compatibility
            "can_be_deleted": not user.is_system_user,
            "can_change_password": True,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        }
        
        return user_data
        
    except Exception as e:
        logger.error("Failed to get user by email", email=email, error=str(e))
        return None


async def validate_password(user: Dict[str, Any], password: str) -> bool:
    """Validate user password."""
    from services.api.app.services.auth import AuthService
    import bcrypt
    
    try:
        # Get the hashed password from database
        from services.api.app.models.auth import User
        from sqlalchemy import select
        from app.core.database import get_db
        
        # Use a new database session for this operation
        async with get_db().__anext__() as db:
            query = select(User.password_hash).where(User.user_id == user["id"])
            result = await db.execute(query)
            hashed_password = result.scalar_one_or_none()
            
            if not hashed_password:
                return False
            
            # Verify password
            return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
            
    except Exception as e:
        logger.error("Password validation failed", user_id=user["id"], error=str(e))
        return False


# Authentication Endpoints
@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user with email and password.
    Implements one-user-one-session policy.
    """
    client_ip, user_agent = get_client_info(http_request)
    
    try:
        # Log authentication attempt
        auth_logger.log_auth_attempt(
            email=request.email,
            success=False,  # Will update if successful
            ip_address=client_ip,
            user_agent=user_agent
        )
        
        # Get user by email
        user = await get_user_by_email(db, request.email)
        if not user:
            logger.warning("Login attempt with non-existent email", email=request.email)
            raise InvalidCredentialsException()
        
        # Check if user is active
        if not user["is_active"]:
            logger.warning("Login attempt with inactive user", email=request.email, user_id=user["id"])
            raise InvalidCredentialsException("Account is disabled")
        
        # Validate password
        if not await validate_password(user, request.password):
            logger.warning("Login attempt with invalid password", email=request.email, user_id=user["id"])
            raise InvalidCredentialsException()
        
        # Create session
        session_manager = SessionManager(db)
        session_id = await session_manager.create_session(
            user_id=user["id"],
            ip_address=client_ip,
            user_agent=user_agent,
            tenant_id=user["tenant_id"]
        )
        
        # Create JWT tokens
        jwt_manager = get_jwt_manager()
        token_data = jwt_manager.create_token_pair(
            user_id=user["id"],
            email=user["email"],
            session_id=session_id,
            tenant_id=user["tenant_id"],
            roles=user["roles"],
            permissions=user["permissions"]
        )
        
        # Update last login time
        from services.api.app.models.auth import User
        from sqlalchemy import update
        
        update_query = update(User).where(User.user_id == user["id"]).values(
            last_login=datetime.now()
        )
        await db.execute(update_query)
        await db.commit()
        
        # Log successful authentication
        auth_logger.log_auth_attempt(
            email=request.email,
            success=True,
            ip_address=client_ip,
            user_agent=user_agent
        )
        
        logger.info(
            "User logged in successfully",
            user_id=user["id"],
            email=user["email"],
            session_id=str(session_id),
            client_ip=client_ip
        )
        
        return AuthResponse(
            access_token=token_data["access_token"],
            refresh_token=token_data["refresh_token"],
            token_type=token_data["token_type"],
            expires_in=token_data["expires_in"],
            user=user
        )
        
    except (InvalidCredentialsException, AccountLockedException) as e:
        # Log failed authentication
        auth_logger.log_auth_attempt(
            email=request.email,
            success=False,
            ip_address=client_ip,
            user_agent=user_agent
        )
        raise
    except Exception as e:
        logger.error("Login failed with unexpected error", email=request.email, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed due to server error"
        )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: LogoutRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Logout user and invalidate session.
    """
    client_ip, user_agent = get_client_info(http_request)
    
    try:
        # Validate refresh token
        jwt_manager = get_jwt_manager()
        token_payload = jwt_manager.validate_refresh_token(request.refresh_token)
        
        user_id = token_payload.get("sub")
        session_id = token_payload.get("session_id")
        
        if not user_id or not session_id:
            raise InvalidTokenException("Invalid token payload")
        
        # Invalidate session(s)
        session_manager = SessionManager(db)
        
        if request.logout_all_devices:
            # Logout from all devices
            invalidated_count = await session_manager.invalidate_user_sessions(
                user_id=user_id,
                reason="logout_all_devices"
            )
            logger.info(
                "User logged out from all devices",
                user_id=user_id,
                invalidated_sessions=invalidated_count
            )
            message = "Logged out from all devices successfully"
        else:
            # Logout from current session only
            success = await session_manager.invalidate_session(
                session_id=session_id,
                reason="logout"
            )
            if success:
                logger.info("User logged out successfully", user_id=user_id, session_id=session_id)
                message = "Logged out successfully"
            else:
                message = "Session was already invalid"
        
        return MessageResponse(message=message)
        
    except InvalidTokenException as e:
        logger.warning("Logout attempt with invalid token", client_ip=client_ip)
        raise
    except Exception as e:
        logger.error("Logout failed with unexpected error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed due to server error"
        )


@router.post("/refresh", response_model=Dict[str, Any])
async def refresh_token(
    request: RefreshTokenRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    """
    try:
        # Validate refresh token
        jwt_manager = get_jwt_manager()
        token_payload = jwt_manager.validate_refresh_token(request.refresh_token)
        
        user_id = token_payload.get("sub")
        session_id = token_payload.get("session_id")
        tenant_id = token_payload.get("tenant_id")
        
        if not user_id or not session_id:
            raise InvalidTokenException("Invalid token payload")
        
        # Validate session
        session_manager = SessionManager(db)
        session_valid = await session_manager.validate_session(
            session_id=session_id,
            user_id=user_id
        )
        
        if not session_valid:
            raise SessionExpiredException()
        
        # Get fresh user data
        user = await get_user_by_email(db, token_payload.get("email", ""))
        if not user or not user["is_active"]:
            raise InvalidTokenException("User not found or inactive")
        
        # Create new access token
        new_access_token = jwt_manager.create_access_token(
            user_id=user["id"],
            email=user["email"],
            tenant_id=user["tenant_id"],
            roles=user["roles"],
            permissions=user["permissions"],
            session_id=session_id
        )
        
        auth_logger.log_token_refresh(
            user_id=user["id"],
            session_id=session_id
        )
        
        logger.debug(
            "Token refreshed successfully",
            user_id=user["id"],
            session_id=session_id
        )
        
        return {
            "access_token": new_access_token,
            "token_type": "Bearer",
            "expires_in": jwt_manager.settings.access_token_expire_minutes * 60
        }
        
    except (InvalidTokenException, SessionExpiredException) as e:
        logger.warning("Token refresh failed", error=str(e))
        raise
    except Exception as e:
        logger.error("Token refresh failed with unexpected error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed due to server error"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    http_request: Request,
    token: str = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current authenticated user information.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token required"
        )
    
    try:
        # Extract token from Bearer format
        if hasattr(token, 'credentials'):
            access_token = token.credentials
        else:
            access_token = token
        
        # Validate access token
        jwt_manager = get_jwt_manager()
        user_info = jwt_manager.extract_user_info(access_token)
        
        # Validate session
        if user_info.get("session_id"):
            session_manager = SessionManager(db)
            session_valid = await session_manager.validate_session(
                session_id=user_info["session_id"],
                user_id=user_info["user_id"]
            )
            
            if not session_valid:
                raise SessionExpiredException()
        
        # Get fresh user data
        user = await get_user_by_email(db, user_info["email"])
        if not user or not user["is_active"]:
            raise InvalidTokenException("User not found or inactive")
        
        logger.debug("User info retrieved successfully", user_id=user["id"])
        
        return UserResponse(user=user)
        
    except (InvalidTokenException, SessionExpiredException) as e:
        logger.warning("Get current user failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Get current user failed with unexpected error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user information"
        )


@router.post("/validate", response_model=Dict[str, Any])
async def validate_token(
    token: str = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """
    Validate an access token and return user info.
    Used by other services to validate tokens.
    """
    if not token:
        return {"valid": False}
    
    try:
        # Extract token from Bearer format
        if hasattr(token, 'credentials'):
            access_token = token.credentials
        else:
            access_token = token
        
        # Validate access token
        jwt_manager = get_jwt_manager()
        user_info = jwt_manager.extract_user_info(access_token)
        
        # Validate session
        if user_info.get("session_id"):
            session_manager = SessionManager(db)
            session_valid = await session_manager.validate_session(
                session_id=user_info["session_id"],
                user_id=user_info["user_id"]
            )
            
            if not session_valid:
                return {"valid": False}
        
        # Get user data
        user = await get_user_by_email(db, user_info["email"])
        if not user or not user["is_active"]:
            return {"valid": False}
        
        return {
            "valid": True,
            "user": user,
            "permissions": user["permissions"]
        }
        
    except Exception:
        return {"valid": False} 