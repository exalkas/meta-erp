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
from app.services import auth_service
from app.app import app

logger = get_logger("metadata_api")
router = APIRouter(prefix="/metadata", tags=["metadata"])


# Response Models
class PageDefinitionResponse(BaseModel):
    page_id: str
    page_name: str
    route: str
    title: str
    description: Optional[str] = None
    page_type: str
    components: List[Dict[str, Any]]
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
        tenant_id = get_tenant_id(request)
        
        # Ensure route starts with /
        if not route.startswith('/'):
            route = f"/{route}"
        
        page_engine = PageEngine(db)
        page_data = await page_engine.get_page_definition(route, tenant_id)
        
        if not page_data:
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
        raise
    except Exception as e:
        logger.error(
            "Failed to get page definition",
            route=route,
            tenant_id=str(tenant_id) if tenant_id else None,
            error=str(e)
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
    tenant_id: Optional[str] = None,
    current_user=Depends(auth_service.get_current_user)
):
    """Get all list view definitions for an entity."""
    
    try:
        # Get data engine
        data_engine = app.engines["data"]
        
        # Get entity first to verify it exists
        entity_data = await data_engine.get_entity_metadata(
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
    tenant_id: Optional[str] = None,
    current_user=Depends(auth_service.get_current_user)
):
    """Get a specific list view definition."""
    
    try:
        # Get data engine
        data_engine = app.engines["data"]
        
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
    view_name: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=1000),
    sort_field: Optional[str] = None,
    sort_order: Optional[str] = Query("ASC", regex="^(ASC|DESC)$"),
    search: Optional[str] = None,
    search_fields: Optional[str] = None,
    filters: Optional[str] = None,
    tenant_id: Optional[str] = None,
    current_user=Depends(auth_service.get_current_user)
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
        data_engine = app.engines["data"]
        
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