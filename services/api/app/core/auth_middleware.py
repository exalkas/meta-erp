"""
Authentication and Authorization Middleware
Handles JWT validation and permission enforcement for API endpoints.
"""

import json
import httpx
from typing import Optional, List, Dict, Any, Set
from uuid import UUID
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.database import get_db
from app.models.auth import User, Role, Permission, role_permissions
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

logger = get_logger("auth_middleware")
security = HTTPBearer()
settings = get_settings()


class AuthUser:
    """User object with role and permission data."""
    
    def __init__(self, user_data: Dict[str, Any], roles: List[str], permissions: Set[str]):
        self.user_id = user_data.get("user_id")
        self.email = user_data.get("email")
        self.tenant_id = user_data.get("tenant_id")
        self.roles = roles
        self.permissions = permissions
        self.is_active = user_data.get("is_active", True)
        self.is_verified = user_data.get("is_verified", False)


class PermissionEnforcementMiddleware(BaseHTTPMiddleware):
    """
    Middleware that validates JWT tokens and enforces permissions.
    Communicates with the auth service for token validation.
    """
    
    def __init__(self, app, auth_service_url: str = "http://localhost:8001"):
        super().__init__(app)
        self.auth_service_url = auth_service_url.rstrip("/")
        self.client = httpx.AsyncClient(timeout=5.0)
        
        # Endpoints that don't require authentication
        self.public_endpoints = {
            "/health",
            "/",
            "/docs",
            "/openapi.json",
            "/redoc",
        }
        
        # Endpoints that require only authentication (no specific permissions)
        self.auth_only_endpoints = {
            "/metadata/pages/dashboard",
            "/metadata/pages/login",
        }
    
    async def dispatch(self, request: Request, call_next):
        """Process request and enforce authentication/authorization."""
        
        # Skip public endpoints
        if self._is_public_endpoint(request.url.path):
            return await call_next(request)
        
        try:
            # Extract and validate JWT token
            auth_user = await self._validate_token(request)
            if not auth_user:
                return self._unauthorized_response("Invalid or missing token")
            
            # Add user to request state
            request.state.user = auth_user
            
            # Check if endpoint requires specific permissions
            if not self._is_auth_only_endpoint(request.url.path):
                required_permission = self._get_required_permission(request)
                if required_permission and not self._has_permission(auth_user, required_permission):
                    return self._forbidden_response(f"Missing permission: {required_permission}")
            
            # Process request
            response = await call_next(request)
            return response
            
        except HTTPException as exc:
            return self._error_response(exc.status_code, exc.detail)
        except Exception as exc:
            logger.exception("Authentication middleware error")
            return self._error_response(500, "Authentication service error")
    
    def _is_public_endpoint(self, path: str) -> bool:
        """Check if endpoint is public (no auth required)."""
        return any(path.startswith(endpoint) for endpoint in self.public_endpoints)
    
    def _is_auth_only_endpoint(self, path: str) -> bool:
        """Check if endpoint requires only authentication (no specific permissions)."""
        return any(path.startswith(endpoint) for endpoint in self.auth_only_endpoints)
    
    async def _validate_token(self, request: Request) -> Optional[AuthUser]:
        """Validate JWT token with auth service and load user permissions."""
        
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.split(" ")[1]
        
        try:
            # Validate token with auth service
            response = await self.client.post(
                f"{self.auth_service_url}/auth/validate-token",
                json={"token": token},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                logger.warning("Token validation failed", status_code=response.status_code)
                return None
            
            token_data = response.json()
            user_data = token_data.get("user", {})
            
            # Load user roles and permissions from database
            user_id = user_data.get("user_id")
            if not user_id:
                return None
            
            roles, permissions = await self._load_user_permissions(user_id)
            
            return AuthUser(user_data, roles, permissions)
            
        except httpx.RequestError as exc:
            logger.error("Auth service connection error", error=str(exc))
            return None
        except Exception as exc:
            logger.exception("Token validation error")
            return None
    
    async def _load_user_permissions(self, user_id: str) -> tuple[List[str], Set[str]]:
        """Load user roles and permissions from database."""
        
        try:
            async with get_db() as db:
                # Get user roles
                user_roles_query = select(Role.name).select_from(
                    Role.__table__.join(
                        User.__table__.join(
                            role_permissions,
                            User.user_id == user_id
                        ),
                        Role.role_id == role_permissions.c.role_id
                    )
                )
                
                roles_result = await db.execute(user_roles_query)
                roles = [row[0] for row in roles_result.fetchall()]
                
                # Get permissions through roles
                permissions_query = select(Permission.name).select_from(
                    Permission.__table__.join(
                        role_permissions,
                        Permission.permission_id == role_permissions.c.permission_id
                    ).join(
                        User.__table__.join(
                            user_roles,
                            User.user_id == user_id
                        ),
                        role_permissions.c.role_id == user_roles.c.role_id
                    )
                )
                
                permissions_result = await db.execute(permissions_query)
                permissions = {row[0] for row in permissions_result.fetchall()}
                
                return roles, permissions
                
        except Exception as exc:
            logger.exception("Failed to load user permissions")
            return [], set()
    
    def _get_required_permission(self, request: Request) -> Optional[str]:
        """Determine required permission based on request path and method."""
        
        path = request.url.path
        method = request.method.upper()
        
        # Role management endpoints
        if path.startswith("/roles"):
            if method == "GET":
                return "ROLE_VIEW"
            elif method in ["POST", "PUT", "PATCH"]:
                return "ROLE_CREATE"
            elif method == "DELETE":
                return "ROLE_DELETE"
        
        # Metadata endpoints
        elif path.startswith("/metadata"):
            if method == "GET":
                return "METADATA_VIEW"
            elif method in ["POST", "PUT", "PATCH"]:
                return "METADATA_EDIT"
            elif method == "DELETE":
                return "METADATA_DELETE"
        
        # User management endpoints
        elif path.startswith("/users"):
            if method == "GET":
                return "USER_VIEW"
            elif method in ["POST", "PUT", "PATCH"]:
                return "USER_MANAGE"
            elif method == "DELETE":
                return "USER_DELETE"
        
        # Default: require basic access
        return "BASIC_ACCESS"
    
    def _has_permission(self, user: AuthUser, permission: str) -> bool:
        """Check if user has required permission."""
        
        # Super admin bypass
        if "SUPER_ADMIN" in user.roles:
            return True
        
        # Check specific permission
        return permission in user.permissions
    
    def _unauthorized_response(self, message: str) -> Response:
        """Return 401 Unauthorized response."""
        return Response(
            content=json.dumps({"detail": message}),
            status_code=status.HTTP_401_UNAUTHORIZED,
            headers={"Content-Type": "application/json"}
        )
    
    def _forbidden_response(self, message: str) -> Response:
        """Return 403 Forbidden response."""
        return Response(
            content=json.dumps({"detail": message}),
            status_code=status.HTTP_403_FORBIDDEN,
            headers={"Content-Type": "application/json"}
        )
    
    def _error_response(self, status_code: int, message: str) -> Response:
        """Return error response."""
        return Response(
            content=json.dumps({"detail": message}),
            status_code=status_code,
            headers={"Content-Type": "application/json"}
        )


# Dependency to get current user from request state
def get_current_user(request: Request) -> AuthUser:
    """Get current authenticated user from request state."""
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return user


# Permission decorator for endpoint functions
def require_permission(permission: str):
    """Decorator to require specific permission for endpoint."""
    def decorator(func):
        func._required_permission = permission
        return func
    return decorator


# Convenience decorators for common permissions
def require_admin(func):
    """Require admin role."""
    return require_permission("ADMIN")(func)


def require_role_management(func):
    """Require role management permission."""
    return require_permission("ROLE_MANAGE")(func)


def require_user_management(func):
    """Require user management permission."""
    return require_permission("USER_MANAGE")(func)