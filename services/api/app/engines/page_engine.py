"""
Page Engine - Metadata-Driven Platform

Handles PageDefinitions and serves page structure metadata to frontend.
Supports tenant-specific overrides and global defaults.
"""

from typing import Dict, List, Optional, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.core.logging import get_logger
from app.core.exceptions import ValidationException, TenantNotFoundException
from app.models.platform import PageDefinition
from app.models.metadata import Tenant

logger = get_logger("page_engine")


class PageEngine:
    """
    Core engine for managing and serving page metadata.
    
    Features:
    - Tenant-specific page overrides
    - Global page defaults  
    - Page access control
    - Component composition
    - Runtime page generation
    """

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.metadata_logger = get_logger("page_engine")

    async def get_page_definition(
        self, 
        route: str, 
        tenant_id: Optional[UUID] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get page definition by route with tenant-specific overrides.
        
        Priority:
        1. Tenant-specific page definition
        2. Global page definition (tenant_id = NULL)
        """
        
        try:
            logger.info(
                "Starting get_page_definition",
                route=route,
                tenant_id=str(tenant_id) if tenant_id else None,
                operation="get_page_definition"
            )
            
            # Log metadata operation
            self.metadata_logger.log_metadata_operation(
                operation="get_page_definition",
                entity_type="PageDefinition", 
                tenant_id=str(tenant_id) if tenant_id else None,
                metadata={"route": route}
            )

            # Query with tenant priority
            logger.info(
                "Building database query",
                route=route,
                tenant_id=str(tenant_id) if tenant_id else None
            )
            
            query = select(PageDefinition).where(
                and_(
                    PageDefinition.route == route,
                    or_(
                        PageDefinition.tenant_id == tenant_id,
                        PageDefinition.tenant_id.is_(None)
                    )
                )
            ).order_by(
                # Tenant-specific first, then global
                PageDefinition.tenant_id.desc().nulls_last()
            )
            
            logger.info(
                "Executing database query",
                route=route,
                tenant_id=str(tenant_id) if tenant_id else None
            )
            
            result = await self.db.execute(query)
            page_def = result.scalars().first()
            
            logger.info(
                "Database query completed",
                route=route,
                tenant_id=str(tenant_id) if tenant_id else None,
                page_found=page_def is not None,
                page_id=str(page_def.page_id) if page_def else None
            )
            
            if not page_def:
                logger.warning(
                    "Page definition not found",
                    route=route,
                    tenant_id=str(tenant_id) if tenant_id else None
                )
                return None

            # Convert to response format
            logger.info(
                "Converting page definition to response format",
                page_id=str(page_def.page_id),
                route=route
            )
            
            try:
                page_data = {
                    "page_id": str(page_def.page_id),
                    "page_name": page_def.page_name,
                    "route": page_def.route,
                    "title": page_def.title,
                    "description": page_def.description,
                    "page_type": page_def.page_type,
                    "layout_id": str(page_def.layout_id) if page_def.layout_id else None,  # ✅ FIXED: Added missing field
                    "sections_data_json": page_def.sections_data_json,  # ✅ FIXED: Added missing field
                    "components": page_def.components,
                    "access_roles": page_def.access_roles,
                    "is_public": page_def.is_public,
                    "metadata_json": page_def.metadata_json,
                    "tenant_id": str(page_def.tenant_id) if page_def.tenant_id else None,
                    "created_at": page_def.created_at.isoformat() if page_def.created_at else None,
                    "updated_at": page_def.updated_at.isoformat() if page_def.updated_at else None,
                    # ✅ ADDED: New metadata-driven fields (database columns now exist)
                    "initial_state": page_def.initial_state,
                    "state_bindings": page_def.state_bindings,
                    "api_endpoints": page_def.api_endpoints,
                    "callbacks": page_def.callbacks,
                }
                
                logger.info(
                    "Page data conversion successful",
                    page_id=str(page_def.page_id),
                    data_keys=list(page_data.keys())
                )
                
            except Exception as conversion_error:
                logger.error(
                    "Error converting page definition to response format",
                    page_id=str(page_def.page_id),
                    error=str(conversion_error),
                    error_type=type(conversion_error).__name__
                )
                raise

            logger.info(
                "Page definition retrieved successfully",
                page_id=str(page_def.page_id),
                route=route,
                tenant_id=str(tenant_id) if tenant_id else None
            )

            return page_data

        except Exception as e:
            logger.error(
                "Failed to get page definition",
                route=route,
                tenant_id=str(tenant_id) if tenant_id else None,
                error=str(e)
            )
            raise

    async def list_pages_for_tenant(
        self, 
        tenant_id: Optional[UUID] = None,
        page_type: Optional[str] = None,
        is_public: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """
        List all available pages for a tenant (including global defaults).
        """
        
        try:
            self.metadata_logger.log_metadata_operation(
                operation="list_pages_for_tenant",
                entity_type="PageDefinition",
                tenant_id=str(tenant_id) if tenant_id else None,
                metadata={"page_type": page_type, "is_public": is_public}
            )

            # Build query conditions
            conditions = [
                or_(
                    PageDefinition.tenant_id == tenant_id,
                    PageDefinition.tenant_id.is_(None)
                )
            ]
            
            if page_type:
                conditions.append(PageDefinition.page_type == page_type)
            
            if is_public is not None:
                conditions.append(PageDefinition.is_public == is_public)

            query = select(PageDefinition).where(and_(*conditions))
            result = await self.db.execute(query)
            pages = result.scalars().all()

            # Group by route to handle tenant overrides
            page_map = {}
            for page in pages:
                route = page.route
                
                # Tenant-specific overrides global
                if route not in page_map or page.tenant_id is not None:
                    page_map[route] = {
                        "page_id": str(page.page_id),
                        "page_name": page.page_name,
                        "route": page.route,
                        "title": page.title,
                        "description": page.description,
                        "page_type": page.page_type,
                        "is_public": page.is_public,
                        "tenant_id": str(page.tenant_id) if page.tenant_id else None,
                        "created_at": page.created_at.isoformat() if page.created_at else None,
                        "updated_at": page.updated_at.isoformat() if page.updated_at else None
                    }

            pages_list = list(page_map.values())
            
            logger.info(
                "Pages listed successfully",
                tenant_id=str(tenant_id) if tenant_id else None,
                page_count=len(pages_list),
                page_type=page_type,
                is_public=is_public
            )

            return pages_list

        except Exception as e:
            logger.error(
                "Failed to list pages for tenant",
                tenant_id=str(tenant_id) if tenant_id else None,
                error=str(e)
            )
            raise

    async def validate_page_access(
        self,
        route: str,
        user_roles: List[str],
        tenant_id: Optional[UUID] = None
    ) -> bool:
        """
        Check if user has access to a specific page based on roles.
        """
        
        try:
            page_data = await self.get_page_definition(route, tenant_id)
            
            if not page_data:
                return False
            
            # Public pages are accessible to everyone
            if page_data.get("is_public", False):
                return True
            
            # Check role-based access
            required_roles = page_data.get("access_roles", [])
            if not required_roles:
                # No specific roles required
                return True
            
            # Check if user has any of the required roles
            has_access = any(role in user_roles for role in required_roles)
            
            logger.info(
                "Page access validation completed",
                route=route,
                user_roles=user_roles,
                required_roles=required_roles,
                has_access=has_access,
                tenant_id=str(tenant_id) if tenant_id else None
            )
            
            return has_access

        except Exception as e:
            logger.error(
                "Failed to validate page access",
                route=route,
                user_roles=user_roles,
                tenant_id=str(tenant_id) if tenant_id else None,
                error=str(e)
            )
            return False

    async def get_page_components(
        self,
        route: str,
        tenant_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """
        Get the component definitions for a specific page.
        """
        
        try:
            page_data = await self.get_page_definition(route, tenant_id)
            
            if not page_data:
                return []
            
            components = page_data.get("components", [])
            
            logger.info(
                "Page components retrieved",
                route=route,
                component_count=len(components),
                tenant_id=str(tenant_id) if tenant_id else None
            )
            
            return components

        except Exception as e:
            logger.error(
                "Failed to get page components",
                route=route,
                tenant_id=str(tenant_id) if tenant_id else None,
                error=str(e)
            )
            return [] 