"""
Metadata API - Metadata-Driven Platform

API endpoints for serving page, entity, and component metadata.
Supports tenant context and multi-tenant isolation.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from datetime import datetime

from app.core.database import get_db
from app.core.logging import get_logger
from app.core.exceptions import MetadataERPException, ValidationException, TenantNotFoundException
from app.engines import PageEngine, DataEngine, ComponentEngine
from app.services import AuthService

logger = get_logger("metadata_api")
router = APIRouter(prefix="/metadata", tags=["metadata"])


# Dependency to create AuthService with database session
async def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    """Create AuthService instance with database session."""
    return AuthService(db)


# Dependency to get current user (requires AuthService)
async def get_current_user(auth_service: AuthService = Depends(get_auth_service)):
    """Get current authenticated user."""
    return await auth_service.get_current_user()


# Response Models
class PageDefinitionResponse(BaseModel):
    page_id: str
    page_name: str
    route: str
    title: str
    description: Optional[str] = None
    page_type: str
    layout_id: Optional[str] = None  # FIXED: Added missing field for Layout + Sections
    sections_data_json: Optional[Dict[str, Any]] = None  # FIXED: Added missing field for Layout + Sections
    components: List[Dict[str, Any]]
    initial_state: Optional[Dict[str, Any]] = None  # FIXED: Added for metadata-driven state
    state_bindings: Optional[Dict[str, str]] = None  # FIXED: Added for state binding
    api_endpoints: Optional[Dict[str, str]] = None  # FIXED: Added for API configuration
    callbacks: Optional[Dict[str, Any]] = None  # FIXED: Added for metadata-driven callbacks
    access_roles: List[str]
    is_public: bool
    metadata_json: Optional[Dict[str, Any]] = None
    tenant_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class EntityDefinitionResponse(BaseModel):
    id: str
    entity_name: str
    display_label: str
    plural_label: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_system_entity: bool
    supports_attachments: bool
    supports_comments: bool
    supports_workflows: bool
    api_name: str
    enable_api: bool
    tenant_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class FieldDefinitionResponse(BaseModel):
    id: str
    entity_id: str
    field_name: str
    label_key: str
    data_type: str
    is_required: bool
    is_system_field: bool
    default_value: Optional[str] = None
    sort_order: int
    picklist_name: Optional[str] = None
    api_name: str
    validation_rules: Optional[Dict[str, Any]] = None
    help_text: Optional[str] = None
    placeholder: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class ComponentDefinitionResponse(BaseModel):
    component_id: str
    name: str
    type: str
    props_schema: Dict[str, Any]
    module: str
    icon: Optional[str] = None
    category: str
    description: Optional[str] = None
    version: str
    is_system_component: bool
    supports_children: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CompleteEntityResponse(BaseModel):
    entity: EntityDefinitionResponse
    fields: List[FieldDefinitionResponse]
    picklists: Dict[str, List[Dict[str, Any]]]


class ListViewDefinitionResponse(BaseModel):
    """Response model for list view definitions."""
    id: str
    view_name: str
    display_label: str
    description: Optional[str] = None
    entity_id: str
    
    # Column configuration
    columns: List[Dict[str, Any]]
    
    # Default behavior
    default_sort_field: Optional[str] = None
    default_sort_order: str = "ASC"
    default_page_size: int = 25
    
    # Filter configuration
    quick_filters: Optional[List[Dict[str, Any]]] = None
    advanced_filters: Optional[Dict[str, Any]] = None
    
    # Search configuration
    search_enabled: bool = True
    search_fields: Optional[List[str]] = None
    global_search: bool = True
    
    # Pagination configuration
    pagination_enabled: bool = True
    page_size_options: List[int] = [10, 25, 50, 100]
    show_total_count: bool = True
    
    # Export and bulk actions
    export_enabled: bool = False
    export_formats: List[str] = ["csv", "excel"]
    bulk_actions: Optional[List[Dict[str, Any]]] = None
    
    # UI configuration
    row_actions: Optional[List[Dict[str, Any]]] = None
    toolbar_actions: Optional[List[Dict[str, Any]]] = None
    show_row_numbers: bool = False
    striped_rows: bool = True
    
    # Access control
    access_roles: List[str] = []
    is_public: bool = False
    
    # Metadata
    created_at: datetime
    updated_at: Optional[datetime] = None


class LayoutDefinitionResponse(BaseModel):
    layout_id: str
    name: str
    display_name: str
    description: Optional[str] = None
    category: Optional[str] = None
    sections_json: Dict[str, Any]
    css_classes_json: Optional[Dict[str, Any]] = None
    container_classes: Optional[str] = None
    is_responsive: bool = True
    supports_theming: bool = True
    is_system_layout: bool = False
    tenant_id: Optional[str] = None


class TranslationResponse(BaseModel):
    locale: str
    key: str
    text: str
    namespace: Optional[str] = None
    context: Optional[str] = None


# Theme Variant Response Models
class ThemeVariantResponse(BaseModel):
    variant_id: str
    base_theme_id: str
    variant_name: str  # light, dark
    display_name: str
    description: Optional[str] = None
    is_default: bool = False
    is_active: bool = True
    supports_auto_switch: bool = True
    css_class_prefix: Optional[str] = None
    media_query: Optional[str] = None
    properties: Dict[str, str]  # Flattened variant properties

class BaseThemeResponse(BaseModel):
    base_theme_id: str
    name: str  # maritime, default
    display_name: str
    description: Optional[str] = None
    category: Optional[str] = None
    is_system_theme: bool = False
    is_active: bool = True
    is_featured: bool = False
    version: Optional[str] = None
    variants: List[ThemeVariantResponse]
    tenant_id: Optional[str] = None



class ThemePropertyResponse(BaseModel):
    property_key: str
    property_value: str
    property_type: Optional[str] = None
    category: Optional[str] = None


# Dependency Functions
def get_tenant_id(request: Request) -> Optional[UUID]:
    """Extract tenant ID from request headers or state."""
    tenant_id_str = getattr(request.state, 'tenant_id', None)
    if not tenant_id_str:
        tenant_id_str = request.headers.get('X-Tenant-ID')
    
    if tenant_id_str:
        try:
            return UUID(tenant_id_str)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid tenant ID format: {tenant_id_str}"
            )
    return None


# Page Metadata Endpoints
@router.get("/pages/{route:path}", response_model=PageDefinitionResponse)
async def get_page_definition(
    route: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Get page definition by route with tenant-specific overrides.
    """
    try:
        logger.info(
            "API: Starting get_page_definition endpoint",
            route=route,
            method=request.method,
            url=str(request.url)
        )
        
        tenant_id = get_tenant_id(request)
        logger.info(
            "API: Extracted tenant ID",
            tenant_id=str(tenant_id) if tenant_id else None,
            route=route
        )
        
        # Ensure route starts with /
        if not route.startswith('/'):
            route = f"/{route}"
            logger.info("API: Route normalized", route=route)
        
        logger.info(
            "API: Creating PageEngine",
            route=route,
            tenant_id=str(tenant_id) if tenant_id else None
        )
        
        page_engine = PageEngine(db)
        
        logger.info(
            "API: Calling page_engine.get_page_definition",
            route=route,
            tenant_id=str(tenant_id) if tenant_id else None
        )
        
        page_data = await page_engine.get_page_definition(route, tenant_id)
        
        logger.info(
            "API: PageEngine call completed",
            route=route,
            page_data_received=page_data is not None
        )
        
        if not page_data:
            logger.warning(
                "API: Page not found, returning 404",
                route=route,
                tenant_id=str(tenant_id) if tenant_id else None
            )
            raise HTTPException(
                status_code=404,
                detail=f"Page definition not found for route: {route}"
            )
        
        logger.info(
            "Page definition served successfully",
            route=route,
            tenant_id=str(tenant_id) if tenant_id else None,
            page_id=page_data["page_id"]
        )
        
        return PageDefinitionResponse(**page_data)
        
    except HTTPException:
        logger.warning(
            "API: HTTPException occurred",
            route=route,
            tenant_id=str(tenant_id) if tenant_id else None
        )
        raise
    except Exception as e:
        logger.error(
            "API: Exception occurred in get_page_definition",
            route=route,
            tenant_id=str(tenant_id) if tenant_id else None,
            error=str(e),
            error_type=type(e).__name__,
            exc_info=True
        )
        logger.exception(
            "API: Full exception traceback",
            route=route,
            tenant_id=str(tenant_id) if tenant_id else None
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error while retrieving page definition"
        )


@router.get("/pages", response_model=List[PageDefinitionResponse])
async def list_pages(
    request: Request,
    page_type: Optional[str] = Query(None, description="Filter by page type"),
    is_public: Optional[bool] = Query(None, description="Filter by public/private pages"),
    db: AsyncSession = Depends(get_db)
):
    """
    List all available pages for a tenant.
    """
    try:
        tenant_id = get_tenant_id(request)
        
        page_engine = PageEngine(db)
        pages = await page_engine.list_pages_for_tenant(
            tenant_id=tenant_id,
            page_type=page_type,
            is_public=is_public
        )
        
        logger.info(
            "Pages listed successfully",
            tenant_id=str(tenant_id) if tenant_id else None,
            page_count=len(pages),
            page_type=page_type,
            is_public=is_public
        )
        
        return [PageDefinitionResponse(**page) for page in pages]
        
    except Exception as e:
        logger.error(
            "Failed to list pages",
            tenant_id=str(tenant_id) if tenant_id else None,
            error=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error while listing pages"
        )


# Entity Metadata Endpoints
@router.get("/entities/{entity_name}", response_model=CompleteEntityResponse)
async def get_entity_with_fields(
    entity_name: str,
    request: Request,
    include_picklists: bool = Query(True, description="Include picklist values"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get complete entity definition with fields and picklist values.
    """
    try:
        tenant_id = get_tenant_id(request)
        
        data_engine = DataEngine(db)
        entity_data = await data_engine.get_entity_with_fields(
            entity_name=entity_name,
            tenant_id=tenant_id,
            include_picklists=include_picklists
        )
        
        if not entity_data:
            raise HTTPException(
                status_code=404,
                detail=f"Entity definition not found: {entity_name}"
            )
        
        # Restructure response
        response_data = {
            "entity": EntityDefinitionResponse(**{
                k: v for k, v in entity_data.items() 
                if k not in ["fields", "picklists"]
            }),
            "fields": [FieldDefinitionResponse(**field) for field in entity_data["fields"]],
            "picklists": entity_data["picklists"]
        }
        
        logger.info(
            "Entity with fields served successfully",
            entity_name=entity_name,
            tenant_id=str(tenant_id) if tenant_id else None,
            field_count=len(entity_data["fields"]),
            picklist_count=len(entity_data["picklists"])
        )
        
        return CompleteEntityResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Failed to get entity with fields",
            entity_name=entity_name,
            tenant_id=str(tenant_id) if tenant_id else None,
            error=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error while retrieving entity definition"
        )


@router.get("/entities", response_model=List[EntityDefinitionResponse])
async def list_entities(
    request: Request,
    include_system_entities: bool = Query(True, description="Include system entities"),
    db: AsyncSession = Depends(get_db)
):
    """
    List all available entities for a tenant.
    """
    try:
        tenant_id = get_tenant_id(request)
        
        data_engine = DataEngine(db)
        entities = await data_engine.list_entities_for_tenant(
            tenant_id=tenant_id,
            include_system_entities=include_system_entities
        )
        
        logger.info(
            "Entities listed successfully",
            tenant_id=str(tenant_id) if tenant_id else None,
            entity_count=len(entities),
            include_system_entities=include_system_entities
        )
        
        return [EntityDefinitionResponse(**entity) for entity in entities]
        
    except Exception as e:
        logger.error(
            "Failed to list entities",
            tenant_id=str(tenant_id) if tenant_id else None,
            error=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error while listing entities"
        )


@router.get("/picklists/{picklist_name}")
async def get_picklist_values(
    picklist_name: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Get picklist values with tenant-specific overrides.
    """
    try:
        tenant_id = get_tenant_id(request)
        
        data_engine = DataEngine(db)
        values = await data_engine.get_picklist_values(
            picklist_name=picklist_name,
            tenant_id=tenant_id
        )
        
        logger.info(
            "Picklist values served successfully",
            picklist_name=picklist_name,
            tenant_id=str(tenant_id) if tenant_id else None,
            value_count=len(values)
        )
        
        return values
        
    except Exception as e:
        logger.error(
            "Failed to get picklist values",
            picklist_name=picklist_name,
            tenant_id=str(tenant_id) if tenant_id else None,
            error=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error while retrieving picklist values"
        )


# Component Metadata Endpoints
@router.get("/components/{component_name}", response_model=ComponentDefinitionResponse)
async def get_component_definition(
    component_name: str,
    module: Optional[str] = Query(None, description="Component module"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get component definition by name and optional module.
    """
    try:
        component_engine = ComponentEngine(db)
        component_data = await component_engine.get_component_definition(
            component_name=component_name,
            module=module
        )
        
        if not component_data:
            raise HTTPException(
                status_code=404,
                detail=f"Component definition not found: {component_name}"
            )
        
        logger.info(
            "Component definition served successfully",
            component_name=component_name,
            module=module,
            component_id=component_data["component_id"]
        )
        
        return ComponentDefinitionResponse(**component_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Failed to get component definition",
            component_name=component_name,
            module=module,
            error=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error while retrieving component definition"
        )


@router.get("/components", response_model=List[ComponentDefinitionResponse])
async def list_components(
    category: Optional[str] = Query(None, description="Filter by category"),
    type: Optional[str] = Query(None, description="Filter by component type"),
    module: Optional[str] = Query(None, description="Filter by module"),
    db: AsyncSession = Depends(get_db)
):
    """
    List components filtered by category, type, or module.
    """
    try:
        component_engine = ComponentEngine(db)
        components = await component_engine.list_components_by_category(
            category=category,
            type=type,
            module=module
        )
        
        logger.info(
            "Components listed successfully",
            category=category,
            type=type,
            module=module,
            component_count=len(components)
        )
        
        return [ComponentDefinitionResponse(**comp) for comp in components]
        
    except Exception as e:
        logger.error(
            "Failed to list components",
            category=category,
            type=type,
            module=module,
            error=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error while listing components"
        )


@router.get("/field-mappings/{data_type}", response_model=ComponentDefinitionResponse)
async def get_field_component_mapping(
    data_type: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get the recommended component for a specific field data type.
    """
    try:
        component_engine = ComponentEngine(db)
        component_data = await component_engine.get_field_component_mapping(data_type)
        
        if not component_data:
            raise HTTPException(
                status_code=404,
                detail=f"No component mapping found for data type: {data_type}"
            )
        
        logger.info(
            "Field component mapping served successfully",
            data_type=data_type,
            component_name=component_data["name"]
        )
        
        return ComponentDefinitionResponse(**component_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Failed to get field component mapping",
            data_type=data_type,
            error=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error while retrieving field component mapping"
        )


@router.get("/modules/{module_id}")
async def get_module_manifest(
    module_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get module manifest with all its components.
    """
    try:
        component_engine = ComponentEngine(db)
        manifest_data = await component_engine.get_module_manifest(module_id)
        
        if not manifest_data:
            raise HTTPException(
                status_code=404,
                detail=f"Module manifest not found: {module_id}"
            )
        
        logger.info(
            "Module manifest served successfully",
            module_id=module_id,
            component_count=len(manifest_data["components"])
        )
        
        return manifest_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Failed to get module manifest",
            module_id=module_id,
            error=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error while retrieving module manifest"
        )


@router.get("/modules")
async def list_modules(
    include_system_modules: bool = Query(True, description="Include system modules"),
    db: AsyncSession = Depends(get_db)
):
    """
    List all available modules in the platform.
    """
    try:
        component_engine = ComponentEngine(db)
        modules = await component_engine.list_available_modules(
            include_system_modules=include_system_modules
        )
        
        logger.info(
            "Modules listed successfully",
            module_count=len(modules),
            include_system_modules=include_system_modules
        )
        
        return modules
        
    except Exception as e:
        logger.error(
            "Failed to list modules",
            include_system_modules=include_system_modules,
            error=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error while listing modules"
        ) 


@router.get("/list-views/{entity_name}", response_model=List[ListViewDefinitionResponse])
async def get_entity_list_views(
    entity_name: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: Optional[str] = None,
    current_user=Depends(get_current_user)
):
    """Get all list view definitions for an entity."""
    
    try:
        # Get data engine
        data_engine = DataEngine(db)
        
        # Get entity first to verify it exists
        entity_data = await data_engine.get_entity_definition(
            entity_name=entity_name,
            tenant_id=tenant_id
        )
        
        if not entity_data:
            raise HTTPException(
                status_code=404,
                detail=f"Entity '{entity_name}' not found"
            )
        
        # Get list view definitions for the entity
        list_views = await data_engine.get_entity_list_views(
            entity_name=entity_name,
            tenant_id=tenant_id
        )
        
        return [ListViewDefinitionResponse(**view) for view in list_views]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting list views for entity {entity_name}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting list views: {str(e)}"
        )


@router.get("/list-views/{entity_name}/{view_name}", response_model=ListViewDefinitionResponse)
async def get_list_view_definition(
    entity_name: str,
    view_name: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: Optional[str] = None,
    current_user=Depends(get_current_user)
):
    """Get a specific list view definition."""
    
    try:
        # Get data engine
        data_engine = DataEngine(db)
        
        # Get list view definition
        list_view = await data_engine.get_list_view_definition(
            entity_name=entity_name,
            view_name=view_name,
            tenant_id=tenant_id
        )
        
        if not list_view:
            raise HTTPException(
                status_code=404,
                detail=f"List view '{view_name}' not found for entity '{entity_name}'"
            )
        
        return ListViewDefinitionResponse(**list_view)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting list view {view_name} for entity {entity_name}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting list view: {str(e)}"
        )


@router.get("/data/{entity_name}", response_model=Dict[str, Any])
async def get_entity_data(
    entity_name: str,
    db: AsyncSession = Depends(get_db),
    view_name: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=1000),
    sort_field: Optional[str] = None,
    sort_order: Optional[str] = Query("ASC", regex="^(ASC|DESC)$"),
    search: Optional[str] = None,
    search_fields: Optional[str] = None,
    filters: Optional[str] = None,
    tenant_id: Optional[str] = None,
    current_user=Depends(get_current_user)
):
    """Get paginated entity data with filtering and sorting."""
    
    try:
        # Parse search fields and filters from query params
        search_fields_list = search_fields.split(",") if search_fields else None
        filters_dict = {}
        if filters:
            try:
                import json
                filters_dict = json.loads(filters)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid filters JSON format"
                )
        
        # Get data engine
        data_engine = DataEngine(db)
        
        # Get entity data with pagination and filtering
        result = await data_engine.get_entity_data(
            entity_name=entity_name,
            view_name=view_name,
            tenant_id=tenant_id,
            page=page,
            page_size=page_size,
            sort_field=sort_field,
            sort_order=sort_order,
            search=search,
            search_fields=search_fields_list,
            filters=filters_dict
        )
        
        return {
            "data": result.get("data", []),
            "total_count": result.get("total_count", 0),
            "page": page,
            "page_size": page_size,
            "total_pages": result.get("total_pages", 0),
            "has_next": result.get("has_next", False),
            "has_previous": result.get("has_previous", False),
            "filters_applied": filters_dict,
            "sort_field": sort_field,
            "sort_order": sort_order,
            "search_query": search,
            "search_fields": search_fields_list
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting data for entity {entity_name}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting entity data: {str(e)}"
        ) 

# ================================
# LAYOUT ENDPOINTS
# ================================

@router.get("/layouts", response_model=List[LayoutDefinitionResponse])
async def get_layouts(
    tenant_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get layout definitions for a tenant."""
    try:
        logger.info(f"Getting layouts for tenant: {tenant_id}, category: {category}")
        
        from app.models.platform import LayoutDefinition
        from sqlalchemy import select
        
        query = select(LayoutDefinition).where(LayoutDefinition.is_active == True)
        
        if tenant_id:
            query = query.where(
                (LayoutDefinition.tenant_id == tenant_id) |
                (LayoutDefinition.tenant_id.is_(None))  # Include global layouts
            )
        else:
            query = query.where(LayoutDefinition.tenant_id.is_(None))
            
        if category:
            query = query.where(LayoutDefinition.category == category)
            
        result = await db.execute(query)
        layouts = result.scalars().all()
        
        return [
            LayoutDefinitionResponse(
                layout_id=str(layout.layout_id),
                name=layout.name,
                display_name=layout.display_name,
                description=layout.description,
                category=layout.category,
                sections_json=layout.sections_json,
                css_classes_json=layout.css_classes_json,
                container_classes=layout.container_classes,
                is_responsive=layout.is_responsive,
                supports_theming=layout.supports_theming,
                is_system_layout=layout.is_system_layout,
                tenant_id=str(layout.tenant_id) if layout.tenant_id else None
            )
            for layout in layouts
        ]
    except Exception as e:
        logger.error(f"Error getting layouts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting layouts: {str(e)}")


@router.get("/layouts/{layout_id}", response_model=LayoutDefinitionResponse)
async def get_layout(
    layout_id: str,
    tenant_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific layout definition."""
    try:
        logger.info(f"Getting layout: {layout_id} for tenant: {tenant_id}")
        
        from app.models.platform import LayoutDefinition
        from sqlalchemy import select
        
        query = select(LayoutDefinition).where(
            LayoutDefinition.layout_id == layout_id,
            LayoutDefinition.is_active == True
        )
        
        if tenant_id:
            query = query.where(
                (LayoutDefinition.tenant_id == tenant_id) |
                (LayoutDefinition.tenant_id.is_(None))
            )
        else:
            query = query.where(LayoutDefinition.tenant_id.is_(None))
            
        result = await db.execute(query)
        layout = result.scalar_one_or_none()
        
        if not layout:
            raise HTTPException(status_code=404, detail=f"Layout not found: {layout_id}")
            
        return LayoutDefinitionResponse(
            layout_id=str(layout.layout_id),
            name=layout.name,
            display_name=layout.display_name,
            description=layout.description,
            category=layout.category,
            sections_json=layout.sections_json,
            css_classes_json=layout.css_classes_json,
            container_classes=layout.container_classes,
            is_responsive=layout.is_responsive,
            supports_theming=layout.supports_theming,
            is_system_layout=layout.is_system_layout,
            tenant_id=str(layout.tenant_id) if layout.tenant_id else None
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting layout {layout_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting layout: {str(e)}")


# ================================
# TRANSLATION ENDPOINTS
# ================================

@router.get("/translations/{locale}", response_model=Dict[str, str])
async def get_translations(
    locale: str,
    tenant_id: Optional[str] = Query(None),
    namespace: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get translations for a locale."""
    try:
        logger.info(f"Getting translations for locale: {locale}, tenant: {tenant_id}, namespace: {namespace}")
        
        from app.models.metadata import Translation
        from sqlalchemy import select
        
        query = select(Translation).where(Translation.locale == locale)
        
        if tenant_id:
            query = query.where(
                (Translation.tenant_id == tenant_id) |
                (Translation.tenant_id.is_(None))  # Include global translations
            )
        else:
            query = query.where(Translation.tenant_id.is_(None))
            
        if namespace:
            query = query.where(Translation.namespace == namespace)
            
        result = await db.execute(query)
        translations = result.scalars().all()
        
        # Return flattened key-value pairs for easy consumption
        return {translation.key: translation.text for translation in translations}
        
    except Exception as e:
        logger.error(f"Error getting translations for {locale}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting translations: {str(e)}")


# ================================
# USER THEME PREFERENCE ENDPOINTS  
# ================================

@router.get("/themes/user-preferences", response_model=ThemeVariantResponse)
async def get_user_theme_preferences(
    user_id: Optional[str] = Query(None),
    tenant_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get user's theme preferences with intelligent fallback."""
    try:
        logger.info(f"Getting theme preferences for user: {user_id}, tenant: {tenant_id}")
        
        from app.models.platform import BaseTheme, ThemeVariant, ThemeVariantProperty
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        
        # TODO: Implement user preferences table
        # For now, use tenant default with light variant
        
        # 1. Try user preference (when user preferences table exists)
        # 2. Fall back to tenant default theme
        # 3. Fall back to system default
        
        # Get tenant's default base theme (for now, use maritime)
        preferred_base_theme = "maritime"  # TODO: Get from tenant settings
        preferred_variant = "light"       # TODO: Get from user preferences
        
        # Query for the theme variant
        query = select(ThemeVariant).options(
            selectinload(ThemeVariant.properties),
            selectinload(ThemeVariant.base_theme)
        ).join(BaseTheme).where(
            BaseTheme.name == preferred_base_theme,
            ThemeVariant.variant_name == preferred_variant,
            BaseTheme.is_active == True,
            ThemeVariant.is_active == True
        )
        
        if tenant_id:
            query = query.where(
                (BaseTheme.tenant_id == tenant_id) |
                (BaseTheme.tenant_id.is_(None))
            )
        else:
            query = query.where(BaseTheme.tenant_id.is_(None))
            
        result = await db.execute(query)
        variant = result.scalar_one_or_none()
        
        if not variant:
            # Fallback to default/light
            query = select(ThemeVariant).options(
                selectinload(ThemeVariant.properties),
                selectinload(ThemeVariant.base_theme)
            ).join(BaseTheme).where(
                BaseTheme.name == "default",
                ThemeVariant.variant_name == "light",
                BaseTheme.is_active == True,
                ThemeVariant.is_active == True,
                BaseTheme.tenant_id.is_(None)
            )
            
            result = await db.execute(query)
            variant = result.scalar_one_or_none()
            
        if not variant:
            raise HTTPException(
                status_code=404, 
                detail="No theme preferences available"
            )
            
        return ThemeVariantResponse(
            variant_id=str(variant.variant_id),
            base_theme_id=str(variant.base_theme_id),
            variant_name=variant.variant_name,
            display_name=variant.display_name,
            description=variant.description,
            is_default=variant.is_default,
            is_active=variant.is_active,
            supports_auto_switch=variant.supports_auto_switch,
            css_class_prefix=variant.css_class_prefix,
            media_query=variant.media_query,
            properties={prop.property_key: prop.property_value for prop in variant.properties}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting theme preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting theme preferences: {str(e)}")


# ================================
# THEME CATALOG ENDPOINTS  
# ================================

@router.get("/themes", response_model=List[BaseThemeResponse])
async def get_base_themes(
    tenant_id: Optional[str] = Query(None),
    active_only: bool = Query(True),
    db: AsyncSession = Depends(get_db)
):
    """Get all base themes with their variants."""
    try:
        logger.info(f"Getting base themes for tenant: {tenant_id}, active_only: {active_only}")
        
        from app.models.platform import BaseTheme, ThemeVariant, ThemeVariantProperty
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        
        query = select(BaseTheme).options(
            selectinload(BaseTheme.variants).selectinload(ThemeVariant.properties)
        )
        
        if active_only:
            query = query.where(BaseTheme.is_active == True)
            
        if tenant_id:
            query = query.where(
                (BaseTheme.tenant_id == tenant_id) |
                (BaseTheme.tenant_id.is_(None))  # Include global themes
            )
        else:
            query = query.where(BaseTheme.tenant_id.is_(None))
            
        result = await db.execute(query)
        base_themes = result.scalars().all()
        
        return [
            BaseThemeResponse(
                base_theme_id=str(base_theme.base_theme_id),
                name=base_theme.name,
                display_name=base_theme.display_name,
                description=base_theme.description,
                category=base_theme.category,
                is_system_theme=base_theme.is_system_theme,
                is_active=base_theme.is_active,
                is_featured=base_theme.is_featured,
                version=base_theme.version,
                tenant_id=str(base_theme.tenant_id) if base_theme.tenant_id else None,
                variants=[
                    ThemeVariantResponse(
                        variant_id=str(variant.variant_id),
                        base_theme_id=str(variant.base_theme_id),
                        variant_name=variant.variant_name,
                        display_name=variant.display_name,
                        description=variant.description,
                        is_default=variant.is_default,
                        is_active=variant.is_active,
                        supports_auto_switch=variant.supports_auto_switch,
                        css_class_prefix=variant.css_class_prefix,
                        media_query=variant.media_query,
                        properties={prop.property_key: prop.property_value for prop in variant.properties}
                    )
                    for variant in base_theme.variants
                    if not active_only or variant.is_active
                ]
            )
            for base_theme in base_themes
        ]
    except Exception as e:
        logger.error(f"Error getting base themes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting base themes: {str(e)}")


@router.get("/themes/{theme_name}/{variant_name}", response_model=ThemeVariantResponse)
async def get_theme_variant(
    theme_name: str,
    variant_name: str,
    tenant_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific theme variant by base theme name and variant name."""
    try:
        logger.info(f"Getting theme variant: {theme_name}/{variant_name} for tenant: {tenant_id}")
        
        from app.models.platform import BaseTheme, ThemeVariant, ThemeVariantProperty
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        
        # Query for the theme variant
        query = select(ThemeVariant).options(
            selectinload(ThemeVariant.properties),
            selectinload(ThemeVariant.base_theme)
        ).join(BaseTheme).where(
            BaseTheme.name == theme_name,
            ThemeVariant.variant_name == variant_name,
            BaseTheme.is_active == True,
            ThemeVariant.is_active == True
        )
        
        if tenant_id:
            query = query.where(
                (BaseTheme.tenant_id == tenant_id) |
                (BaseTheme.tenant_id.is_(None))
            )
        else:
            query = query.where(BaseTheme.tenant_id.is_(None))
            
        result = await db.execute(query)
        variant = result.scalar_one_or_none()
        
        if not variant:
            raise HTTPException(
                status_code=404, 
                detail=f"Theme variant not found: {theme_name}/{variant_name}"
            )
            
        return ThemeVariantResponse(
            variant_id=str(variant.variant_id),
            base_theme_id=str(variant.base_theme_id),
            variant_name=variant.variant_name,
            display_name=variant.display_name,
            description=variant.description,
            is_default=variant.is_default,
            is_active=variant.is_active,
            supports_auto_switch=variant.supports_auto_switch,
            css_class_prefix=variant.css_class_prefix,
            media_query=variant.media_query,
            properties={prop.property_key: prop.property_value for prop in variant.properties}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting theme variant {theme_name}/{variant_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting theme variant: {str(e)}")


@router.get("/themes/{theme_name}/{variant_name}/css", response_model=str)
async def get_theme_variant_css(
    theme_name: str,
    variant_name: str,
    tenant_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Generate CSS for a specific theme variant."""
    try:
        variant_response = await get_theme_variant(theme_name, variant_name, tenant_id, db)
        
        # Generate CSS custom properties
        css_properties = []
        css_properties.append(":root {")
        
        for key, value in variant_response.properties.items():
            css_properties.append(f"  {key}: {value};")
            
        css_properties.append("}")
        
        return "\n".join(css_properties)
        
    except Exception as e:
        logger.error(f"Error generating CSS for theme variant {theme_name}/{variant_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating CSS: {str(e)}")


 