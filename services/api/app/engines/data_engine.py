"""
Data Engine - Metadata-Driven Platform

Handles EntityDefinitions and FieldDefinitions to serve form and entity metadata.
Supports tenant-specific overrides and global defaults.
"""

from typing import Dict, List, Optional, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.core.logging import get_logger, MetadataLogger
from app.core.exceptions import ValidationException, TenantNotFoundException
from app.models.metadata import EntityDefinition, FieldDefinition, PicklistValue, LayoutDefinition
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