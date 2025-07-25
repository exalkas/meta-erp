"""
Data Engine - Metadata-Driven Platform

Handles EntityDefinitions and FieldDefinitions to serve form and entity metadata.
Supports tenant-specific overrides and global defaults.
"""

from typing import Dict, List, Optional, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, text
from app.core.logging import get_logger, MetadataLogger
from app.core.exceptions import ValidationException, TenantNotFoundException
from app.models.metadata import EntityDefinition, FieldDefinition, PicklistValue, LayoutDefinition, ListViewDefinition
from app.models.metadata import Tenant

logger = get_logger("data_engine")


class DataEngine:
    """
    Core engine for managing and serving entity and field metadata.
    
    Features:
    - Entity definitions with field schemas
    - Tenant-specific entity overrides
    - Field validation rules
    - Picklist value management
    - Dynamic form generation metadata
    """

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.metadata_logger = MetadataLogger(logger)

    async def get_entity_definition(
        self,
        entity_name: str,
        tenant_id: Optional[UUID] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get entity definition with tenant-specific overrides.
        
        Priority:
        1. Tenant-specific entity definition
        2. Global entity definition (tenant_id = NULL)
        """
        
        try:
            self.metadata_logger.log_metadata_operation(
                operation="get_entity_definition",
                entity_type="EntityDefinition",
                tenant_id=str(tenant_id) if tenant_id else None,
                metadata={"entity_name": entity_name}
            )

            # Query with tenant priority
            query = select(EntityDefinition).where(
                and_(
                    EntityDefinition.entity_name == entity_name,
                    or_(
                        EntityDefinition.tenant_id == tenant_id,
                        EntityDefinition.tenant_id.is_(None)
                    )
                )
            ).order_by(
                # Tenant-specific first, then global
                EntityDefinition.tenant_id.desc().nulls_last()
            )
            
            result = await self.db.execute(query)
            entity_def = result.scalars().first()
            
            if not entity_def:
                logger.warning(
                    "Entity definition not found",
                    entity_name=entity_name,
                    tenant_id=str(tenant_id) if tenant_id else None
                )
                return None

            # Convert to response format
            entity_data = {
                "id": str(entity_def.id),
                "entity_name": entity_def.entity_name,
                "display_label": entity_def.display_label,
                "plural_label": entity_def.plural_label,
                "description": entity_def.description,
                "icon": entity_def.icon,
                "color": entity_def.color,
                "is_system_entity": entity_def.is_system_entity,
                "supports_attachments": entity_def.supports_attachments,
                "supports_comments": entity_def.supports_comments,
                "supports_workflows": entity_def.supports_workflows,
                "auto_number_format": entity_def.auto_number_format,
                "default_sort_field": entity_def.default_sort_field,
                "default_sort_order": entity_def.default_sort_order,
                "api_name": entity_def.api_name,
                "enable_api": entity_def.enable_api,
                "tenant_id": str(entity_def.tenant_id) if entity_def.tenant_id else None,
                "created_at": entity_def.created_at.isoformat() if entity_def.created_at else None,
                "updated_at": entity_def.updated_at.isoformat() if entity_def.updated_at else None
            }

            logger.info(
                "Entity definition retrieved successfully",
                entity_id=str(entity_def.id),
                entity_name=entity_name,
                tenant_id=str(tenant_id) if tenant_id else None
            )

            return entity_data

        except Exception as e:
            logger.error(
                "Failed to get entity definition",
                entity_name=entity_name,
                tenant_id=str(tenant_id) if tenant_id else None,
                error=str(e)
            )
            raise

    async def get_entity_fields(
        self,
        entity_name: str,
        tenant_id: Optional[UUID] = None,
        include_system_fields: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get all field definitions for an entity with tenant overrides.
        """
        
        try:
            # First get the entity definition
            entity_def = await self.get_entity_definition(entity_name, tenant_id)
            if not entity_def:
                return []

            entity_id = UUID(entity_def["id"])

            self.metadata_logger.log_metadata_operation(
                operation="get_entity_fields",
                entity_type="FieldDefinition",
                tenant_id=str(tenant_id) if tenant_id else None,
                metadata={"entity_name": entity_name, "entity_id": str(entity_id)}
            )

            # Query fields for this entity
            query = select(FieldDefinition).where(
                FieldDefinition.entity_id == entity_id
            ).order_by(FieldDefinition.sort_order, FieldDefinition.field_name)
            
            result = await self.db.execute(query)
            fields = result.scalars().all()

            # Convert to response format
            field_list = []
            for field in fields:
                # Skip system fields if not requested
                if not include_system_fields and field.is_system_field:
                    continue

                field_data = {
                    "id": str(field.id),
                    "entity_id": str(field.entity_id),
                    "field_name": field.field_name,
                    "label_key": field.label_key,
                    "data_type": field.data_type,
                    "is_required": field.is_required,
                    "is_system_field": field.is_system_field,
                    "default_value": field.default_value,
                    "sort_order": field.sort_order,
                    "picklist_name": field.picklist_name,
                    "api_name": field.api_name,
                    "length": field.length,
                    "precision": field.precision,
                    "scale": field.scale,
                    "is_unique": field.is_unique,
                    "is_indexed": field.is_indexed,
                    "is_searchable": field.is_searchable,
                    "is_sortable": field.is_sortable,
                    "is_filterable": field.is_filterable,
                    "help_text": field.help_text,
                    "placeholder": field.placeholder,
                    "field_group": field.field_group,
                    "allowed_file_types": field.allowed_file_types,
                    "max_file_size": field.max_file_size,
                    "visibility_conditions": field.visibility_conditions,
                    "validation_rules": field.validation_rules,
                    "created_at": field.created_at.isoformat() if field.created_at else None,
                    "updated_at": field.updated_at.isoformat() if field.updated_at else None
                }
                field_list.append(field_data)

            logger.info(
                "Entity fields retrieved successfully",
                entity_name=entity_name,
                entity_id=str(entity_id),
                field_count=len(field_list),
                tenant_id=str(tenant_id) if tenant_id else None
            )

            return field_list

        except Exception as e:
            logger.error(
                "Failed to get entity fields",
                entity_name=entity_name,
                tenant_id=str(tenant_id) if tenant_id else None,
                error=str(e)
            )
            raise

    async def get_picklist_values(
        self,
        picklist_name: str,
        tenant_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """
        Get picklist values with tenant-specific overrides.
        """
        
        try:
            self.metadata_logger.log_metadata_operation(
                operation="get_picklist_values",
                entity_type="PicklistValue",
                tenant_id=str(tenant_id) if tenant_id else None,
                metadata={"picklist_name": picklist_name}
            )

            # Query with tenant priority
            query = select(PicklistValue).where(
                and_(
                    PicklistValue.picklist_name == picklist_name,
                    or_(
                        PicklistValue.tenant_id == tenant_id,
                        PicklistValue.tenant_id.is_(None)
                    )
                )
            ).order_by(PicklistValue.sort_order, PicklistValue.value)
            
            result = await self.db.execute(query)
            picklist_values = result.scalars().all()

            # Group by value to handle tenant overrides
            value_map = {}
            for pv in picklist_values:
                value = pv.value
                
                # Tenant-specific overrides global
                if value not in value_map or pv.tenant_id is not None:
                    value_map[value] = {
                        "id": str(pv.id),
                        "picklist_name": pv.picklist_name,
                        "value": pv.value,
                        "label": pv.label,
                        "description": pv.description,
                        "sort_order": pv.sort_order,
                        "is_active": pv.is_active,
                        "is_default": pv.is_default,
                        "color": pv.color,
                        "icon": pv.icon,
                        "parent_value": pv.parent_value,
                        "dependency_field": pv.dependency_field,
                        "tenant_id": str(pv.tenant_id) if pv.tenant_id else None
                    }

            values_list = list(value_map.values())
            
            logger.info(
                "Picklist values retrieved successfully",
                picklist_name=picklist_name,
                value_count=len(values_list),
                tenant_id=str(tenant_id) if tenant_id else None
            )

            return values_list

        except Exception as e:
            logger.error(
                "Failed to get picklist values",
                picklist_name=picklist_name,
                tenant_id=str(tenant_id) if tenant_id else None,
                error=str(e)
            )
            raise

    async def get_entity_with_fields(
        self,
        entity_name: str,
        tenant_id: Optional[UUID] = None,
        include_picklists: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Get complete entity definition with fields and picklist values.
        """
        
        try:
            # Get entity definition
            entity_def = await self.get_entity_definition(entity_name, tenant_id)
            if not entity_def:
                return None

            # Get fields
            fields = await self.get_entity_fields(entity_name, tenant_id)

            # Get picklist values if requested
            picklists = {}
            if include_picklists:
                for field in fields:
                    picklist_name = field.get("picklist_name")
                    if picklist_name and picklist_name not in picklists:
                        picklists[picklist_name] = await self.get_picklist_values(
                            picklist_name, tenant_id
                        )

            # Combine all data
            complete_entity = {
                **entity_def,
                "fields": fields,
                "picklists": picklists
            }

            logger.info(
                "Complete entity definition retrieved",
                entity_name=entity_name,
                field_count=len(fields),
                picklist_count=len(picklists),
                tenant_id=str(tenant_id) if tenant_id else None
            )

            return complete_entity

        except Exception as e:
            logger.error(
                "Failed to get entity with fields",
                entity_name=entity_name,
                tenant_id=str(tenant_id) if tenant_id else None,
                error=str(e)
            )
            raise

    async def list_entities_for_tenant(
        self,
        tenant_id: Optional[UUID] = None,
        include_system_entities: bool = True
    ) -> List[Dict[str, Any]]:
        """
        List all available entities for a tenant.
        """
        
        try:
            self.metadata_logger.log_metadata_operation(
                operation="list_entities_for_tenant",
                entity_type="EntityDefinition",
                tenant_id=str(tenant_id) if tenant_id else None,
                metadata={"include_system_entities": include_system_entities}
            )

            # Build query conditions
            conditions = [
                or_(
                    EntityDefinition.tenant_id == tenant_id,
                    EntityDefinition.tenant_id.is_(None)
                )
            ]
            
            if not include_system_entities:
                conditions.append(EntityDefinition.is_system_entity == False)

            query = select(EntityDefinition).where(and_(*conditions))
            result = await self.db.execute(query)
            entities = result.scalars().all()

            # Group by entity_name to handle tenant overrides
            entity_map = {}
            for entity in entities:
                entity_name = entity.entity_name
                
                # Tenant-specific overrides global
                if entity_name not in entity_map or entity.tenant_id is not None:
                    entity_map[entity_name] = {
                        "id": str(entity.id),
                        "entity_name": entity.entity_name,
                        "display_label": entity.display_label,
                        "plural_label": entity.plural_label,
                        "description": entity.description,
                        "icon": entity.icon,
                        "color": entity.color,
                        "is_system_entity": entity.is_system_entity,
                        "api_name": entity.api_name,
                        "enable_api": entity.enable_api,
                        "tenant_id": str(entity.tenant_id) if entity.tenant_id else None,
                        "created_at": entity.created_at.isoformat() if entity.created_at else None,
                        "updated_at": entity.updated_at.isoformat() if entity.updated_at else None
                    }

            entities_list = list(entity_map.values())
            
            logger.info(
                "Entities listed successfully",
                tenant_id=str(tenant_id) if tenant_id else None,
                entity_count=len(entities_list),
                include_system_entities=include_system_entities
            )

            return entities_list

        except Exception as e:
            logger.error(
                "Failed to list entities for tenant",
                tenant_id=str(tenant_id) if tenant_id else None,
                error=str(e)
            )
            raise 

    async def get_entity_list_views(
        self,
        entity_name: str,
        tenant_id: Optional[str] = None,
        is_public: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Get all list view definitions for an entity."""
        
        logger.info(f"Getting list views for entity: {entity_name}, tenant: {tenant_id}")
        
        try:
            # First, get the entity to verify it exists
            entity_data = await self.get_entity_definition(entity_name, tenant_id)
            if not entity_data:
                return []
            
            entity_id = UUID(entity_data["id"])
            
            # Build query conditions
            conditions = [ListViewDefinition.entity_id == entity_id]
            
            # Add tenant condition (tenant-specific or global)
            if tenant_id:
                conditions.append(
                    or_(
                        ListViewDefinition.tenant_id == tenant_id,
                        ListViewDefinition.tenant_id.is_(None)
                    )
                )
            else:
                conditions.append(ListViewDefinition.tenant_id.is_(None))
            
            # Add public filter if specified
            if is_public is not None:
                conditions.append(ListViewDefinition.is_public == is_public)
            
            # Execute query with tenant preference (tenant-specific first)
            query = select(ListViewDefinition).where(and_(*conditions))
            if tenant_id:
                query = query.order_by(
                    ListViewDefinition.tenant_id.desc().nulls_last(),
                    ListViewDefinition.view_name
                )
            else:
                query = query.order_by(ListViewDefinition.view_name)
            
            result = await self.db.execute(query)
            list_views = result.scalars().all()
            
            # Convert to dictionaries
            list_view_data = []
            for view in list_views:
                view_dict = {
                    "id": str(view.id),
                    "view_name": view.view_name,
                    "display_label": view.display_label,
                    "description": view.description,
                    "entity_id": str(view.entity_id),
                    "columns": view.columns,
                    "default_sort_field": view.default_sort_field,
                    "default_sort_order": view.default_sort_order,
                    "default_page_size": view.default_page_size,
                    "quick_filters": view.quick_filters,
                    "advanced_filters": view.advanced_filters,
                    "search_enabled": view.search_enabled,
                    "search_fields": view.search_fields,
                    "global_search": view.global_search,
                    "pagination_enabled": view.pagination_enabled,
                    "page_size_options": view.page_size_options,
                    "show_total_count": view.show_total_count,
                    "export_enabled": view.export_enabled,
                    "export_formats": view.export_formats,
                    "bulk_actions": view.bulk_actions,
                    "row_actions": view.row_actions,
                    "toolbar_actions": view.toolbar_actions,
                    "show_row_numbers": view.show_row_numbers,
                    "striped_rows": view.striped_rows,
                    "access_roles": view.access_roles,
                    "is_public": view.is_public,
                    "created_at": view.created_at,
                    "updated_at": view.updated_at
                }
                list_view_data.append(view_dict)
            
            await self._cache_metadata(
                entity_type="ListViewDefinitions",
                cache_key=f"entity_list_views:{entity_name}:{tenant_id}",
                data=list_view_data,
                tenant_id=tenant_id
            )
            
            logger.info(f"Found {len(list_view_data)} list views for entity {entity_name}")
            return list_view_data
            
        except Exception as e:
            logger.error(f"Error getting list views for entity {entity_name}: {str(e)}")
            raise


    async def get_list_view_definition(
        self,
        entity_name: str,
        view_name: str,
        tenant_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Get a specific list view definition."""
        
        logger.info(f"Getting list view: {view_name} for entity: {entity_name}, tenant: {tenant_id}")
        
        try:
            # First, get the entity to verify it exists
            entity_data = await self.get_entity_definition(entity_name, tenant_id)
            if not entity_data:
                return None
            
            entity_id = UUID(entity_data["id"])
            
            # Build query with tenant preference
            conditions = [
                ListViewDefinition.entity_id == entity_id,
                ListViewDefinition.view_name == view_name
            ]
            
            if tenant_id:
                conditions.append(
                    or_(
                        ListViewDefinition.tenant_id == tenant_id,
                        ListViewDefinition.tenant_id.is_(None)
                    )
                )
            else:
                conditions.append(ListViewDefinition.tenant_id.is_(None))
            
            # Execute query with tenant preference
            query = select(ListViewDefinition).where(and_(*conditions))
            if tenant_id:
                query = query.order_by(ListViewDefinition.tenant_id.desc().nulls_last())
            
            result = await self.db.execute(query)
            list_view = result.scalars().first()
            
            if not list_view:
                return None
            
            # Convert to dictionary
            view_data = {
                "id": str(list_view.id),
                "view_name": list_view.view_name,
                "display_label": list_view.display_label,
                "description": list_view.description,
                "entity_id": str(list_view.entity_id),
                "columns": list_view.columns,
                "default_sort_field": list_view.default_sort_field,
                "default_sort_order": list_view.default_sort_order,
                "default_page_size": list_view.default_page_size,
                "quick_filters": list_view.quick_filters,
                "advanced_filters": list_view.advanced_filters,
                "search_enabled": list_view.search_enabled,
                "search_fields": list_view.search_fields,
                "global_search": list_view.global_search,
                "pagination_enabled": list_view.pagination_enabled,
                "page_size_options": list_view.page_size_options,
                "show_total_count": list_view.show_total_count,
                "export_enabled": list_view.export_enabled,
                "export_formats": list_view.export_formats,
                "bulk_actions": list_view.bulk_actions,
                "row_actions": list_view.row_actions,
                "toolbar_actions": list_view.toolbar_actions,
                "show_row_numbers": list_view.show_row_numbers,
                "striped_rows": list_view.striped_rows,
                "access_roles": list_view.access_roles,
                "is_public": list_view.is_public,
                "created_at": list_view.created_at,
                "updated_at": list_view.updated_at
            }
            
            await self._cache_metadata(
                entity_type="ListViewDefinition",
                cache_key=f"list_view:{entity_name}:{view_name}:{tenant_id}",
                data=view_data,
                tenant_id=tenant_id
            )
            
            return view_data
            
        except Exception as e:
            logger.error(f"Error getting list view {view_name} for entity {entity_name}: {str(e)}")
            raise


    async def get_entity_data(
        self,
        entity_name: str,
        tenant_id: Optional[str] = None,
        view_name: Optional[str] = None,
        page: int = 1,
        page_size: int = 25,
        sort_field: Optional[str] = None,
        sort_order: str = "ASC",
        search: Optional[str] = None,
        search_fields: Optional[List[str]] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get paginated entity data with filtering and sorting."""
        
        logger.info(f"Getting data for entity: {entity_name}, tenant: {tenant_id}")
        
        try:
            # Get entity metadata to verify it exists and get table name
            entity_data = await self.get_entity_definition(entity_name, tenant_id)
            if not entity_data:
                raise Exception(f"Entity '{entity_name}' not found")
            
            # For now, we'll use a simplified approach assuming data is in a table
            # named after the entity (this would be extended for dynamic table creation)
            table_name = entity_name.lower() + "s"  # Simple pluralization
            
            # Build base query
            query_parts = [f"SELECT * FROM {table_name}"]
            query_params = {}
            where_conditions = []
            
            # Add tenant isolation if tenant_id is provided
            if tenant_id:
                where_conditions.append("tenant_id = :tenant_id")
                query_params["tenant_id"] = tenant_id
            
            # Add search conditions
            if search and search_fields:
                search_conditions = []
                for field in search_fields:
                    search_conditions.append(f"LOWER({field}::text) LIKE LOWER(:search)")
                if search_conditions:
                    where_conditions.append(f"({' OR '.join(search_conditions)})")
                    query_params["search"] = f"%{search}%"
            
            # Add filter conditions
            if filters:
                for field, value in filters.items():
                    if value is not None:
                        param_name = f"filter_{field}"
                        where_conditions.append(f"{field} = :{param_name}")
                        query_params[param_name] = value
            
            # Add WHERE clause if we have conditions
            if where_conditions:
                query_parts.append(f"WHERE {' AND '.join(where_conditions)}")
            
            # Add sorting
            if sort_field:
                order_clause = f"ORDER BY {sort_field} {sort_order}"
                query_parts.append(order_clause)
            
            # Build count query for pagination
            count_query = f"SELECT COUNT(*) as total FROM {table_name}"
            if where_conditions:
                count_query += f" WHERE {' AND '.join(where_conditions)}"
            
            # Execute count query
            count_result = await self.db.execute(text(count_query), query_params)
            total_count = count_result.scalar() or 0
            
            # Calculate pagination
            total_pages = (total_count + page_size - 1) // page_size
            offset = (page - 1) * page_size
            
            # Add pagination to main query
            query_parts.append(f"LIMIT :page_size OFFSET :offset")
            query_params["page_size"] = page_size
            query_params["offset"] = offset
            
            # Execute main query
            main_query = " ".join(query_parts)
            result = await self.db.execute(text(main_query), query_params)
            rows = result.fetchall()
            
            # Convert rows to dictionaries
            data = []
            if rows:
                columns = result.keys()
                for row in rows:
                    row_dict = {}
                    for i, column in enumerate(columns):
                        value = row[i]
                        # Convert UUID objects to strings
                        if hasattr(value, 'hex'):
                            value = str(value)
                        # Convert datetime objects to ISO strings
                        elif hasattr(value, 'isoformat'):
                            value = value.isoformat()
                        row_dict[column] = value
                    data.append(row_dict)
            
            return {
                "data": data,
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1
            }
            
        except Exception as e:
            logger.error(f"Error getting data for entity {entity_name}: {str(e)}")
            raise 