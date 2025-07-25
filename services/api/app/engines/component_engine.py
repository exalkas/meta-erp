"""
Component Engine - Metadata-Driven Platform

Handles ComponentDefinitions and serves component catalog metadata.
Supports module manifests and component discovery.
"""

from typing import Dict, List, Optional, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.core.logging import get_logger, MetadataLogger
from app.core.exceptions import ValidationException
from app.models.platform import ComponentDefinition, ModuleManifest, ComponentDependency

logger = get_logger("component_engine")


class ComponentEngine:
    """
    Core engine for managing and serving component metadata.
    
    Features:
    - Component catalog management
    - Module manifest processing
    - Component dependency resolution
    - Field-to-component mapping
    - Dynamic component discovery
    """

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.metadata_logger = MetadataLogger(logger)

    async def get_component_definition(
        self,
        component_name: str,
        module: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get component definition by name and optional module.
        """
        
        try:
            self.metadata_logger.log_metadata_operation(
                operation="get_component_definition",
                entity_type="ComponentDefinition",
                metadata={"component_name": component_name, "module": module}
            )

            # Build query conditions
            conditions = [ComponentDefinition.name == component_name]
            if module:
                conditions.append(ComponentDefinition.module == module)

            query = select(ComponentDefinition).where(and_(*conditions))
            result = await self.db.execute(query)
            component_def = result.scalars().first()
            
            if not component_def:
                logger.warning(
                    "Component definition not found",
                    component_name=component_name,
                    module=module
                )
                return None

            # Convert to response format
            component_data = {
                "component_id": str(component_def.component_id),
                "name": component_def.name,
                "type": component_def.type,
                "props_schema": component_def.props_schema,
                "module": component_def.module,
                "icon": component_def.icon,
                "category": component_def.category,
                "description": component_def.description,
                "version": component_def.version,
                "is_system_component": component_def.is_system_component,
                "supports_children": component_def.supports_children,
                "default_props": component_def.default_props,
                "style_schema": component_def.style_schema,
                "event_handlers": component_def.event_handlers,
                "documentation_url": component_def.documentation_url,
                "created_at": component_def.created_at.isoformat() if component_def.created_at else None,
                "updated_at": component_def.updated_at.isoformat() if component_def.updated_at else None
            }

            logger.info(
                "Component definition retrieved successfully",
                component_id=str(component_def.component_id),
                component_name=component_name,
                module=module
            )

            return component_data

        except Exception as e:
            logger.error(
                "Failed to get component definition",
                component_name=component_name,
                module=module,
                error=str(e)
            )
            raise

    async def list_components_by_category(
        self,
        category: Optional[str] = None,
        type: Optional[str] = None,
        module: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List components filtered by category, type, or module.
        """
        
        try:
            self.metadata_logger.log_metadata_operation(
                operation="list_components_by_category",
                entity_type="ComponentDefinition",
                metadata={"category": category, "type": type, "module": module}
            )

            # Build query conditions
            conditions = []
            if category:
                conditions.append(ComponentDefinition.category == category)
            if type:
                conditions.append(ComponentDefinition.type == type)
            if module:
                conditions.append(ComponentDefinition.module == module)

            if conditions:
                query = select(ComponentDefinition).where(and_(*conditions))
            else:
                query = select(ComponentDefinition)

            result = await self.db.execute(query)
            components = result.scalars().all()

            # Convert to response format
            component_list = []
            for comp in components:
                component_data = {
                    "component_id": str(comp.component_id),
                    "name": comp.name,
                    "type": comp.type,
                    "module": comp.module,
                    "icon": comp.icon,
                    "category": comp.category,
                    "description": comp.description,
                    "version": comp.version,
                    "is_system_component": comp.is_system_component,
                    "supports_children": comp.supports_children,
                    "created_at": comp.created_at.isoformat() if comp.created_at else None
                }
                component_list.append(component_data)

            logger.info(
                "Components listed successfully",
                category=category,
                type=type,
                module=module,
                component_count=len(component_list)
            )

            return component_list

        except Exception as e:
            logger.error(
                "Failed to list components",
                category=category,
                type=type,
                module=module,
                error=str(e)
            )
            raise

    async def get_field_component_mapping(
        self,
        data_type: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get the recommended component for a specific field data type.
        """
        
        try:
            self.metadata_logger.log_metadata_operation(
                operation="get_field_component_mapping",
                entity_type="ComponentDefinition",
                metadata={"data_type": data_type}
            )

            # Define field type to component mappings
            field_mappings = {
                "string": {"name": "Input", "type": "fieldControl", "module": "core"},
                "email": {"name": "Input", "type": "fieldControl", "module": "core"},
                "password": {"name": "SimplePasswordInput", "type": "fieldControl", "module": "core"},
                "integer": {"name": "Input", "type": "fieldControl", "module": "core"},
                "decimal": {"name": "Input", "type": "fieldControl", "module": "core"},
                "boolean": {"name": "Checkbox", "type": "fieldControl", "module": "core"},
                "date": {"name": "DatePicker", "type": "fieldControl", "module": "core"},
                "datetime": {"name": "DateTimePicker", "type": "fieldControl", "module": "core"},
                "time": {"name": "TimePicker", "type": "fieldControl", "module": "core"},
                "picklist": {"name": "Select", "type": "fieldControl", "module": "core"},
                "multiselect": {"name": "MultiSelect", "type": "fieldControl", "module": "core"},
                "textarea": {"name": "Textarea", "type": "fieldControl", "module": "core"},
                "file": {"name": "FileUpload", "type": "fieldControl", "module": "core"},
                "image": {"name": "ImageUpload", "type": "fieldControl", "module": "core"},
                "lookup": {"name": "Select", "type": "fieldControl", "module": "core"},
                "afm": {"name": "AFMInput", "type": "fieldControl", "module": "greek"},
                "doy": {"name": "DOYSelector", "type": "fieldControl", "module": "greek"},
                "greek_phone": {"name": "GreekPhoneInput", "type": "fieldControl", "module": "greek"},
                "greek_postal": {"name": "GreekPostalCodeInput", "type": "fieldControl", "module": "greek"},
                "greek_address": {"name": "GreekAddressInput", "type": "fieldControl", "module": "greek"}
            }

            mapping = field_mappings.get(data_type)
            if not mapping:
                logger.warning(
                    "No component mapping found for data type",
                    data_type=data_type
                )
                # Default to basic input
                mapping = {"name": "Input", "type": "fieldControl", "module": "core"}

            # Get the actual component definition
            component_def = await self.get_component_definition(
                mapping["name"], 
                mapping["module"]
            )

            if component_def:
                component_def["recommended_for"] = data_type

            logger.info(
                "Field component mapping retrieved",
                data_type=data_type,
                component_name=mapping["name"],
                module=mapping["module"]
            )

            return component_def

        except Exception as e:
            logger.error(
                "Failed to get field component mapping",
                data_type=data_type,
                error=str(e)
            )
            raise

    async def get_module_manifest(
        self,
        module_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get module manifest with all its components.
        """
        
        try:
            self.metadata_logger.log_metadata_operation(
                operation="get_module_manifest",
                entity_type="ModuleManifest",
                metadata={"module_id": module_id}
            )

            # Get module manifest
            query = select(ModuleManifest).where(ModuleManifest.module_id == module_id)
            result = await self.db.execute(query)
            manifest = result.scalars().first()
            
            if not manifest:
                logger.warning("Module manifest not found", module_id=module_id)
                return None

            # Get all components for this module
            components = await self.list_components_by_category(module=module_id)

            # Convert to response format
            manifest_data = {
                "manifest_id": str(manifest.manifest_id),
                "module_id": manifest.module_id,
                "name": manifest.name,
                "version": manifest.version,
                "description": manifest.description,
                "author": manifest.author,
                "license": manifest.license,
                "repository_url": manifest.repository_url,
                "documentation_url": manifest.documentation_url,
                "keywords": manifest.keywords,
                "dependencies": manifest.dependencies,
                "peer_dependencies": manifest.peer_dependencies,
                "install_script": manifest.install_script,
                "uninstall_script": manifest.uninstall_script,
                "configuration_schema": manifest.configuration_schema,
                "is_system_module": manifest.is_system_module,
                "is_published": manifest.is_published,
                "components": components,
                "created_at": manifest.created_at.isoformat() if manifest.created_at else None,
                "updated_at": manifest.updated_at.isoformat() if manifest.updated_at else None
            }

            logger.info(
                "Module manifest retrieved successfully",
                module_id=module_id,
                component_count=len(components)
            )

            return manifest_data

        except Exception as e:
            logger.error(
                "Failed to get module manifest",
                module_id=module_id,
                error=str(e)
            )
            raise

    async def list_available_modules(
        self,
        include_system_modules: bool = True
    ) -> List[Dict[str, Any]]:
        """
        List all available modules in the platform.
        """
        
        try:
            self.metadata_logger.log_metadata_operation(
                operation="list_available_modules",
                entity_type="ModuleManifest",
                metadata={"include_system_modules": include_system_modules}
            )

            # Build query conditions
            conditions = []
            if not include_system_modules:
                conditions.append(ModuleManifest.is_system_module == False)

            if conditions:
                query = select(ModuleManifest).where(and_(*conditions))
            else:
                query = select(ModuleManifest)

            result = await self.db.execute(query)
            modules = result.scalars().all()

            # Convert to response format
            module_list = []
            for module in modules:
                module_data = {
                    "manifest_id": str(module.manifest_id),
                    "module_id": module.module_id,
                    "name": module.name,
                    "version": module.version,
                    "description": module.description,
                    "author": module.author,
                    "license": module.license,
                    "keywords": module.keywords,
                    "is_system_module": module.is_system_module,
                    "is_published": module.is_published,
                    "created_at": module.created_at.isoformat() if module.created_at else None,
                    "updated_at": module.updated_at.isoformat() if module.updated_at else None
                }
                module_list.append(module_data)

            logger.info(
                "Modules listed successfully",
                module_count=len(module_list),
                include_system_modules=include_system_modules
            )

            return module_list

        except Exception as e:
            logger.error(
                "Failed to list available modules",
                include_system_modules=include_system_modules,
                error=str(e)
            )
            raise

    async def get_component_dependencies(
        self,
        component_id: UUID
    ) -> List[Dict[str, Any]]:
        """
        Get all dependencies for a specific component.
        """
        
        try:
            self.metadata_logger.log_metadata_operation(
                operation="get_component_dependencies",
                entity_type="ComponentDependency",
                metadata={"component_id": str(component_id)}
            )

            query = select(ComponentDependency).where(
                ComponentDependency.component_id == component_id
            )
            result = await self.db.execute(query)
            dependencies = result.scalars().all()

            # Convert to response format
            dependency_list = []
            for dep in dependencies:
                dependency_data = {
                    "dependency_id": str(dep.dependency_id),
                    "component_id": str(dep.component_id),
                    "depends_on_component_id": str(dep.depends_on_component_id),
                    "dependency_type": dep.dependency_type,
                    "version_constraint": dep.version_constraint,
                    "is_optional": dep.is_optional,
                    "created_at": dep.created_at.isoformat() if dep.created_at else None
                }
                dependency_list.append(dependency_data)

            logger.info(
                "Component dependencies retrieved",
                component_id=str(component_id),
                dependency_count=len(dependency_list)
            )

            return dependency_list

        except Exception as e:
            logger.error(
                "Failed to get component dependencies",
                component_id=str(component_id),
                error=str(e)
            )
            raise 