"""
Permission Resolution Engine

Handles hierarchical permission resolution with wildcard support.
Resolves permissions like TENANT.APPLICATIONS.BUILDER.* into specific permissions.
"""

import asyncio
from typing import Dict, List, Set, Any, Optional, Tuple
from uuid import UUID
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from ..core.logging import get_logger

logger = get_logger("permission_resolver")

@dataclass
class ResolvedPermission:
    """A resolved permission with full context"""
    permission_name: str
    scope: str
    module: str
    feature: str
    action: str
    is_granted: bool
    source: str  # "direct", "wildcard", "inherited"
    billing_tier: str
    metadata: Dict[str, Any]

class PermissionResolver:
    """
    SAP-style permission resolution engine
    
    Handles:
    - Wildcard resolution (TENANT.* → all tenant permissions)
    - Inheritance (PLATFORM.* includes TENANT.* and APP.*)
    - Scope-based filtering
    - Performance optimization with caching
    """
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self._permission_cache = {}
        self._resolution_cache = {}
    
    async def resolve_user_permissions(
        self, 
        user_id: UUID, 
        tenant_id: Optional[UUID] = None,
        scope_filter: Optional[List[str]] = None
    ) -> List[ResolvedPermission]:
        """
        Resolve all permissions for a user, including wildcards and inheritance
        """
        logger.info("Resolving permissions for user", user_id=str(user_id), tenant_id=str(tenant_id))
        
        # Get user's direct role assignments
        user_roles = await self._get_user_roles(user_id, tenant_id)
        logger.info("User roles found", user_id=str(user_id), role_count=len(user_roles))
        
        # Get all permissions for these roles
        role_permissions = await self._get_role_permissions(user_roles)
        logger.info("Role permissions found", permission_count=len(role_permissions))
        
        # Resolve wildcards and inheritance
        resolved_permissions = await self._resolve_wildcards(role_permissions, scope_filter)
        logger.info("Permissions resolved", resolved_count=len(resolved_permissions))
        
        return resolved_permissions
    
    async def check_permission(
        self,
        user_id: UUID,
        permission_name: str,
        tenant_id: Optional[UUID] = None
    ) -> bool:
        """
        Check if user has a specific permission (optimized for single permission checks)
        """
        cache_key = f"{user_id}:{permission_name}:{tenant_id}"
        if cache_key in self._resolution_cache:
            return self._resolution_cache[cache_key]
        
        # Parse permission components
        scope, module, feature, action = self._parse_permission_name(permission_name)
        
        # Get user permissions (will use cache if available)
        user_permissions = await self.resolve_user_permissions(user_id, tenant_id, [scope])
        
        # Check for exact match or wildcard match
        has_permission = self._check_permission_match(permission_name, user_permissions)
        
        # Cache result
        self._resolution_cache[cache_key] = has_permission
        return has_permission
    
    async def get_user_permissions_by_scope(
        self,
        user_id: UUID,
        scope: str,
        tenant_id: Optional[UUID] = None
    ) -> Dict[str, List[ResolvedPermission]]:
        """
        Get user permissions organized by module for a specific scope
        """
        user_permissions = await self.resolve_user_permissions(user_id, tenant_id, [scope])
        
        # Group by module
        permissions_by_module = {}
        for perm in user_permissions:
            if perm.scope == scope:
                if perm.module not in permissions_by_module:
                    permissions_by_module[perm.module] = []
                permissions_by_module[perm.module].append(perm)
        
        return permissions_by_module
    
    def _parse_permission_name(self, permission_name: str) -> Tuple[str, str, str, str]:
        """Parse permission name into scope.module.feature.action"""
        parts = permission_name.split('.')
        if len(parts) != 4:
            raise ValueError(f"Invalid permission format: {permission_name}. Expected SCOPE.MODULE.FEATURE.ACTION")
        
        return parts[0], parts[1], parts[2], parts[3]
    
    def _check_permission_match(self, required_permission: str, user_permissions: List[ResolvedPermission]) -> bool:
        """Check if required permission matches any user permission (including wildcards)"""
        
        required_scope, required_module, required_feature, required_action = self._parse_permission_name(required_permission)
        
        for perm in user_permissions:
            # Exact match
            if perm.permission_name == required_permission:
                return True
            
            # Wildcard matching
            if self._matches_wildcard(required_scope, required_module, required_feature, required_action, perm):
                return True
        
        return False
    
    def _matches_wildcard(
        self, 
        req_scope: str, req_module: str, req_feature: str, req_action: str,
        perm: ResolvedPermission
    ) -> bool:
        """Check if permission matches wildcard pattern"""
        
        # Scope must match exactly (no cross-scope wildcards)
        if perm.scope != req_scope:
            return False
        
        # Check module wildcard
        if perm.module == "*":
            return True
        elif perm.module != req_module:
            return False
        
        # Check feature wildcard
        if perm.feature == "*":
            return True
        elif perm.feature != req_feature:
            return False
        
        # Check action wildcard
        if perm.action == "*":
            return True
        elif perm.action != req_action:
            return False
        
        return True
    
    async def _get_user_roles(self, user_id: UUID, tenant_id: Optional[UUID]) -> List[UUID]:
        """Get role IDs assigned to user"""
        # This would query the user_roles table
        # For now, return mock data based on demo user
        if str(user_id) == "01111111-1111-1111-1111-111111111111":
            return [
                UUID("11111111-1111-1111-1111-111111111111"),  # SAP_SYSTEM_ADMIN
                UUID("22222222-2222-2222-2222-222222222222")   # SAP_TENANT_ADMIN
            ]
        return []
    
    async def _get_role_permissions(self, role_ids: List[UUID]) -> List[Dict[str, Any]]:
        """Get all permissions assigned to these roles"""
        # This would query role_permissions and permissions tables
        # For now, return mock permissions for system admin
        if UUID("11111111-1111-1111-1111-111111111111") in role_ids:
            return [
                {
                    "permission_name": "PLATFORM.*.*.*",
                    "scope": "PLATFORM",
                    "module": "*", 
                    "feature": "*",
                    "action": "*",
                    "is_wildcard": True,
                    "billing_tier": "internal_only",
                    "metadata_json": {"platform_admin": True}
                },
                {
                    "permission_name": "TENANT.*.*.*", 
                    "scope": "TENANT",
                    "module": "*",
                    "feature": "*", 
                    "action": "*",
                    "is_wildcard": True,
                    "billing_tier": "enterprise",
                    "metadata_json": {"tenant_admin": True}
                }
            ]
        return []
    
    async def _resolve_wildcards(
        self, 
        role_permissions: List[Dict[str, Any]],
        scope_filter: Optional[List[str]] = None
    ) -> List[ResolvedPermission]:
        """Resolve wildcard permissions into specific permissions"""
        
        resolved = []
        
        for role_perm in role_permissions:
            perm_name = role_perm["permission_name"]
            
            # Apply scope filter
            if scope_filter and role_perm["scope"] not in scope_filter:
                continue
            
            if role_perm.get("is_wildcard", False):
                # Expand wildcard permission
                expanded = await self._expand_wildcard_permission(role_perm)
                resolved.extend(expanded)
            else:
                # Direct permission
                resolved.append(ResolvedPermission(
                    permission_name=perm_name,
                    scope=role_perm["scope"],
                    module=role_perm["module"],
                    feature=role_perm["feature"], 
                    action=role_perm["action"],
                    is_granted=True,
                    source="direct",
                    billing_tier=role_perm.get("billing_tier", "basic"),
                    metadata=role_perm.get("metadata_json", {})
                ))
        
        return resolved
    
    async def _expand_wildcard_permission(self, wildcard_perm: Dict[str, Any]) -> List[ResolvedPermission]:
        """Expand a wildcard permission into all matching specific permissions"""
        
        # Get all permissions that match this wildcard pattern
        # This would query the permissions table with pattern matching
        # For now, return some mock expansions
        
        expanded = []
        scope = wildcard_perm["scope"]
        
        if scope == "PLATFORM" and wildcard_perm["module"] == "*":
            # Platform admin gets everything
            platform_permissions = [
                "PLATFORM.TENANTS.MANAGEMENT.CREATE",
                "PLATFORM.BILLING.SUBSCRIPTIONS.MANAGE", 
                "PLATFORM.MARKETPLACE.COMPONENTS.MODERATE",
                "PLATFORM.VERTICALS.DEPLOYMENT.EXECUTE"
            ]
            
            for perm_name in platform_permissions:
                scope, module, feature, action = self._parse_permission_name(perm_name)
                expanded.append(ResolvedPermission(
                    permission_name=perm_name,
                    scope=scope,
                    module=module,
                    feature=feature,
                    action=action,
                    is_granted=True,
                    source="wildcard",
                    billing_tier=wildcard_perm.get("billing_tier", "internal_only"),
                    metadata=wildcard_perm.get("metadata_json", {})
                ))
        
        elif scope == "TENANT" and wildcard_perm["module"] == "*":
            # Tenant admin gets tenant permissions
            tenant_permissions = [
                "TENANT.APPLICATIONS.BUILDER.ACCESS",
                "TENANT.APPLICATIONS.BUILDER.CREATE",
                "TENANT.APPLICATIONS.BUILDER.DEPLOY",
                "TENANT.USERS.MANAGEMENT.CREATE",
                "TENANT.USERS.PERMISSIONS.ASSIGN",
                "TENANT.INTEGRATIONS.EXTERNAL.CONFIGURE",
                "TENANT.BRANDING.CUSTOMIZATION.MODIFY"
            ]
            
            for perm_name in tenant_permissions:
                scope, module, feature, action = self._parse_permission_name(perm_name)
                expanded.append(ResolvedPermission(
                    permission_name=perm_name,
                    scope=scope,
                    module=module,
                    feature=feature,
                    action=action,
                    is_granted=True,
                    source="wildcard",
                    billing_tier=wildcard_perm.get("billing_tier", "professional"),
                    metadata=wildcard_perm.get("metadata_json", {})
                ))
        
        return expanded
    
    async def clear_cache(self, user_id: Optional[UUID] = None):
        """Clear permission cache (call when roles/permissions change)"""
        if user_id:
            # Clear cache for specific user
            keys_to_remove = [k for k in self._resolution_cache.keys() if k.startswith(str(user_id))]
            for key in keys_to_remove:
                del self._resolution_cache[key]
        else:
            # Clear all caches
            self._permission_cache.clear()
            self._resolution_cache.clear()
        
        logger.info("Permission cache cleared", user_id=str(user_id) if user_id else "all")
