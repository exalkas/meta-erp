"""
Role Management API - Tenant Role Management

API endpoints for tenant role management:
- Get available role templates (generic and vertical-specific)
- Create tenant roles from templates
- Manage custom tenant roles
- Role permission management
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from app.core.database import get_db
from app.core.logging import get_logger
from app.core.exceptions import MetadataERPException, ValidationException, TenantNotFoundException
from app.models.auth import Role, Permission, User
from app.models.metadata import Tenant
from app.services.auth import AuthService

logger = get_logger("roles_api")
router = APIRouter(prefix="/roles", tags=["role_management"])


# Request/Response Models

class RoleTemplateResponse(BaseModel):
    """Response model for role templates."""
    role_id: str
    role_name: str
    display_name: str
    description: Optional[str]
    category: str
    vertical: Optional[str]
    hierarchy_level: int
    compliance_level: str
    metadata_json: Dict[str, Any]
    
    class Config:
        from_attributes = True


class CreateTenantRoleRequest(BaseModel):
    """Request to create a tenant role from template."""
    template_role_id: str
    custom_name: Optional[str] = None
    custom_display_name: Optional[str] = None
    custom_description: Optional[str] = None
    metadata_overrides: Optional[Dict[str, Any]] = None


class TenantRoleResponse(BaseModel):
    """Response model for tenant roles."""
    role_id: str
    tenant_id: str
    role_name: str
    display_name: str
    description: Optional[str]
    category: str
    vertical: Optional[str]
    is_template: bool
    is_active: bool
    hierarchy_level: int
    parent_role_id: Optional[str]
    compliance_level: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class VerticalRolesSummaryResponse(BaseModel):
    """Summary of available roles by vertical."""
    vertical: Optional[str]
    vertical_display_name: str
    role_count: int
    roles: List[RoleTemplateResponse]


class RolePermissionRequest(BaseModel):
    """Request to assign permissions to role."""
    permission_ids: List[str]


# Dependency to create AuthService with database session
async def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    """Create AuthService instance with database session."""
    return AuthService(db)


# Dependency to get tenant ID from request
def get_tenant_id(request: Request) -> Optional[UUID]:
    """Extract tenant ID from request headers or query params."""
    # Try to get from header first
    tenant_header = request.headers.get("X-Tenant-ID")
    if tenant_header:
        try:
            return UUID(tenant_header)
        except ValueError:
            logger.warning(f"Invalid tenant ID in header: {tenant_header}")
    
    # Try to get from query params
    tenant_param = request.query_params.get("tenant_id")
    if tenant_param:
        try:
            return UUID(tenant_param)
        except ValueError:
            logger.warning(f"Invalid tenant ID in query: {tenant_param}")
    
    return None


# API Endpoints

@router.get("/templates", response_model=List[RoleTemplateResponse])
async def get_role_templates(
    vertical: Optional[str] = Query(None, description="Filter by industry vertical"),
    include_generic: bool = Query(True, description="Include generic business roles"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get available role templates for tenant onboarding.
    
    Returns both generic business roles and vertical-specific roles.
    """
    try:
        logger.info(f"Getting role templates - vertical: {vertical}, include_generic: {include_generic}")
        
        # Build query for template roles
        query = select(Role).where(
            and_(
                Role.is_template == True,
                Role.is_active == True,
                Role.tenant_id.is_(None)  # Templates have NULL tenant_id
            )
        )
        
        # Apply vertical filter
        if vertical and not include_generic:
            # Only specific vertical
            query = query.where(Role.vertical == vertical)
        elif vertical and include_generic:
            # Specific vertical + generic roles
            query = query.where(
                or_(
                    Role.vertical == vertical,
                    Role.vertical.is_(None)  # Generic roles have NULL vertical
                )
            )
        elif not include_generic:
            # Only non-generic (exclude NULL vertical)
            query = query.where(Role.vertical.is_not(None))
        # If include_generic=True and no vertical, get all templates (no additional filter)
        
        # Order by hierarchy and name
        query = query.order_by(Role.level, Role.name)
        
        result = await db.execute(query)
        roles = result.scalars().all()
        
        logger.info(f"Found {len(roles)} role templates")
        
        # Convert to response format
        templates = []
        for role in roles:
            # Derive category from vertical or use default
            category = role.vertical if role.vertical else 'general'
            
            # Determine compliance level from hierarchy
            compliance_level = 'critical' if role.level <= 3 else ('enhanced' if role.level == 4 else 'basic')
            
            templates.append(RoleTemplateResponse(
                role_id=str(role.role_id),
                role_name=role.name,
                display_name=role.display_name,
                description=role.description,
                category=category,
                vertical=role.vertical,
                hierarchy_level=role.level,
                compliance_level=compliance_level,
                metadata_json={}  # Will be populated from JSON data in future enhancement
            ))
        
        return templates
        
    except Exception as e:
        logger.error(f"Error getting role templates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve role templates"
        )


@router.get("/templates/by-vertical", response_model=List[VerticalRolesSummaryResponse])
async def get_role_templates_by_vertical(
    include_generic: bool = Query(True, description="Include generic business roles"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get role templates grouped by industry vertical.
    
    Useful for onboarding UI to show vertical-specific options.
    """
    try:
        logger.info("Getting role templates grouped by vertical")
        
        # Get all template roles
        query = select(Role).where(
            and_(
                Role.is_template == True,
                Role.is_active == True,
                Role.tenant_id.is_(None)
            )
        ).order_by(Role.vertical, Role.level, Role.name)
        
        result = await db.execute(query)
        roles = result.scalars().all()
        
        # Group by vertical
        vertical_groups = {}
        
        for role in roles:
            vertical_key = role.vertical if role.vertical else "generic"
            
            # Skip generic if not requested
            if not include_generic and vertical_key == "generic":
                continue
            
            if vertical_key not in vertical_groups:
                vertical_groups[vertical_key] = []
            
            # Derive category from vertical or use default
            category = role.vertical if role.vertical else 'general'
            
            # Determine compliance level from hierarchy
            compliance_level = 'critical' if role.level <= 3 else ('enhanced' if role.level == 4 else 'basic')
            
            vertical_groups[vertical_key].append(RoleTemplateResponse(
                role_id=str(role.role_id),
                role_name=role.name,
                display_name=role.display_name,
                description=role.description,
                category=category,
                vertical=role.vertical,
                hierarchy_level=role.level,
                compliance_level=compliance_level,
                metadata_json={}
            ))
        
        # Convert to response format
        vertical_summaries = []
        vertical_display_names = {
            "generic": "Generic Business Roles",
            "ecommerce": "E-commerce & Retail",
            "automotive": "Automotive & Dealerships", 
            "oilgas": "Oil & Gas",
            "agtech": "Agriculture & Technology",
            "fintech": "Financial Technology",
            "insurance": "Insurance & Risk Management",
            "maritime": "Maritime & Shipping"
        }
        
        for vertical_key, roles_list in vertical_groups.items():
            vertical_summaries.append(VerticalRolesSummaryResponse(
                vertical=vertical_key if vertical_key != "generic" else None,
                vertical_display_name=vertical_display_names.get(vertical_key, vertical_key.title()),
                role_count=len(roles_list),
                roles=roles_list
            ))
        
        logger.info(f"Grouped {len(roles)} templates into {len(vertical_summaries)} verticals")
        return vertical_summaries
        
    except Exception as e:
        logger.error(f"Error getting role templates by vertical: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve role templates by vertical"
        )


@router.post("/tenant/{tenant_id}/create-from-template", response_model=TenantRoleResponse)
async def create_tenant_role_from_template(
    tenant_id: UUID,
    request_data: CreateTenantRoleRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a tenant-specific role from a template.
    
    This copies a template role and customizes it for the tenant.
    """
    try:
        logger.info(f"Creating tenant role from template - tenant: {tenant_id}, template: {request_data.template_role_id}")
        
        # Verify tenant exists
        tenant_query = select(Tenant).where(Tenant.tenant_id == tenant_id)
        tenant_result = await db.execute(tenant_query)
        tenant = tenant_result.scalar_one_or_none()
        
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        # Get template role
        template_query = select(Role).where(
            and_(
                Role.role_id == UUID(request_data.template_role_id),
                Role.is_template == True,
                Role.tenant_id.is_(None)
            )
        )
        template_result = await db.execute(template_query)
        template_role = template_result.scalar_one_or_none()
        
        if not template_role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template role not found"
            )
        
        # Create tenant role from template
        tenant_role = Role(
            role_id=uuid.uuid4(),
            tenant_id=tenant_id,
            name=request_data.custom_name or template_role.name,
            display_name=request_data.custom_display_name or template_role.display_name,
            description=request_data.custom_description or template_role.description,
            is_system_role=False,  # Tenant roles are not system roles
            is_active=True,
            is_default=False,
            is_template=False,  # This is NOT a template anymore
            vertical=template_role.vertical,  # Inherit vertical from template
            parent_role_id=template_role.parent_role_id,
            level=template_role.level,
            max_users=template_role.max_users,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(tenant_role)
        await db.commit()
        await db.refresh(tenant_role)
        
        logger.info(f"Created tenant role: {tenant_role.display_name} for tenant {tenant_id}")
        
        # Derive category and compliance level
        category = tenant_role.vertical if tenant_role.vertical else 'general'
        compliance_level = 'critical' if tenant_role.level <= 3 else ('enhanced' if tenant_role.level == 4 else 'basic')
        
        return TenantRoleResponse(
            role_id=str(tenant_role.role_id),
            tenant_id=str(tenant_role.tenant_id),
            role_name=tenant_role.name,
            display_name=tenant_role.display_name,
            description=tenant_role.description,
            category=category,
            vertical=tenant_role.vertical,
            is_template=tenant_role.is_template,
            is_active=tenant_role.is_active,
            hierarchy_level=tenant_role.level,
            parent_role_id=str(tenant_role.parent_role_id) if tenant_role.parent_role_id else None,
            compliance_level=compliance_level,
            created_at=tenant_role.created_at,
            updated_at=tenant_role.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating tenant role from template: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create tenant role from template"
        )


@router.get("/tenant/{tenant_id}", response_model=List[TenantRoleResponse])
async def get_tenant_roles(
    tenant_id: UUID,
    include_templates: bool = Query(False, description="Include template roles in response"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all roles for a specific tenant.
    
    By default returns only tenant-specific roles. Optionally includes template roles.
    """
    try:
        logger.info(f"Getting roles for tenant: {tenant_id}")
        
        # Verify tenant exists
        tenant_query = select(Tenant).where(Tenant.tenant_id == tenant_id)
        tenant_result = await db.execute(tenant_query)
        tenant = tenant_result.scalar_one_or_none()
        
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        # Build query for tenant roles
        if include_templates:
            # Include both tenant roles and template roles
            query = select(Role).where(
                or_(
                    Role.tenant_id == tenant_id,
                    and_(
                        Role.tenant_id.is_(None),
                        Role.is_template == True
                    )
                )
            ).where(Role.is_active == True)
        else:
            # Only tenant-specific roles
            query = select(Role).where(
                and_(
                    Role.tenant_id == tenant_id,
                    Role.is_active == True
                )
            )
        
        query = query.order_by(Role.level, Role.name)
        
        result = await db.execute(query)
        roles = result.scalars().all()
        
        logger.info(f"Found {len(roles)} roles for tenant {tenant_id}")
        
        # Convert to response format
        tenant_roles = []
        for role in roles:
            # Derive category and compliance level
            category = role.vertical if role.vertical else 'general'
            compliance_level = 'critical' if role.level <= 3 else ('enhanced' if role.level == 4 else 'basic')
            
            tenant_roles.append(TenantRoleResponse(
                role_id=str(role.role_id),
                tenant_id=str(role.tenant_id) if role.tenant_id else "template",
                role_name=role.name,
                display_name=role.display_name,
                description=role.description,
                category=category,
                vertical=role.vertical,
                is_template=role.is_template,
                is_active=role.is_active,
                hierarchy_level=role.level,
                parent_role_id=str(role.parent_role_id) if role.parent_role_id else None,
                compliance_level=compliance_level,
                created_at=role.created_at or datetime.utcnow(),
                updated_at=role.updated_at or datetime.utcnow()
            ))
        
        return tenant_roles
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tenant roles: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve tenant roles"
        )


@router.delete("/tenant/{tenant_id}/role/{role_id}")
async def delete_tenant_role(
    tenant_id: UUID,
    role_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a tenant-specific role.
    
    Cannot delete system roles or template roles.
    """
    try:
        logger.info(f"Deleting tenant role: {role_id} for tenant: {tenant_id}")
        
        # Get the role
        role_query = select(Role).where(
            and_(
                Role.role_id == role_id,
                Role.tenant_id == tenant_id,
                Role.is_system_role == False,
                Role.is_template == False
            )
        )
        role_result = await db.execute(role_query)
        role = role_result.scalar_one_or_none()
        
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant role not found or cannot be deleted"
            )
        
        # Check if any users are assigned to this role
        user_query = select(User).join(User.roles).where(Role.role_id == role_id)
        user_result = await db.execute(user_query)
        users_with_role = user_result.scalars().all()
        
        if users_with_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete role: {len(users_with_role)} users are assigned to this role"
            )
        
        # Delete the role
        await db.delete(role)
        await db.commit()
        
        logger.info(f"Deleted tenant role: {role.display_name}")
        
        return {"message": f"Role '{role.display_name}' deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting tenant role: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete tenant role"
        )


# Health check for the roles API
@router.get("/health")
async def roles_health_check():
    """Health check for role management API."""
    return {
        "service": "Role Management API",
        "status": "healthy",
        "endpoints": [
            "GET /roles/templates",
            "GET /roles/templates/by-vertical", 
            "POST /roles/tenant/{tenant_id}/create-from-template",
            "GET /roles/tenant/{tenant_id}",
            "DELETE /roles/tenant/{tenant_id}/role/{role_id}"
        ]
    }