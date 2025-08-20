"""
API Dependencies

Common dependencies for API endpoints including authentication,
tenant context, and service initialization.
"""

from typing import Dict, Any, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.auth_middleware import get_current_user as get_auth_user
from app.services.auth import AuthService


async def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    """Create AuthService instance with database session."""
    return AuthService(db)


async def get_current_user(
    request: Request,
    auth_service: AuthService = Depends(get_auth_service)
) -> Dict[str, Any]:
    """
    Get current authenticated user from request.
    
    Returns:
        Dictionary with user information including user_id, tenant_id, roles, etc.
    """
    try:
        # Get user from auth middleware
        auth_user = get_auth_user(request)
        
        if not auth_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        # Convert AuthUser to dictionary format
        return {
            "user_id": auth_user.user_id,
            "tenant_id": auth_user.tenant_id,
            "email": auth_user.email,
            "roles": auth_user.roles,
            "permissions": auth_user.permissions,
            "is_active": auth_user.is_active,
            "is_verified": auth_user.is_verified
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


async def get_tenant_context(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get tenant context from current user.
    
    Returns:
        Dictionary with tenant information and context.
    """
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required"
        )
    
    return {
        "tenant_id": tenant_id,
        "user_id": current_user.get("user_id"),
        "roles": current_user.get("roles", []),
        "permissions": current_user.get("permissions", [])
    }


async def require_permission(
    permission: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> bool:
    """
    Require specific permission for endpoint access.
    
    Args:
        permission: Required permission string
        current_user: Current authenticated user
        
    Returns:
        True if user has permission
        
    Raises:
        HTTPException: If user lacks required permission
    """
    
    user_permissions = current_user.get("permissions", [])
    
    if permission not in user_permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission required: {permission}"
        )
    
    return True


async def require_admin_access(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> bool:
    """
    Require admin role for endpoint access.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        True if user is admin
        
    Raises:
        HTTPException: If user is not admin
    """
    
    user_roles = current_user.get("roles", [])
    
    if "admin" not in user_roles and "super_admin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return True


def create_permission_dependency(permission: str):
    """
    Create a permission dependency for specific permission.
    
    Args:
        permission: Required permission string
        
    Returns:
        FastAPI dependency function
    """
    
    async def permission_dependency(
        current_user: Dict[str, Any] = Depends(get_current_user)
    ) -> bool:
        return await require_permission(permission, current_user)
    
    return permission_dependency


# Common permission dependencies
require_config_read = create_permission_dependency("config:read")
require_config_write = create_permission_dependency("config:write")
require_business_rules_read = create_permission_dependency("business_rules:read")
require_business_rules_write = create_permission_dependency("business_rules:write")
require_metadata_read = create_permission_dependency("metadata:read")
require_metadata_write = create_permission_dependency("metadata:write")