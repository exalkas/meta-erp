"""
Legal Vertical Dynamic API Generator

Generates complete REST APIs for Legal entities from metadata configuration.
This demonstrates our SAP-style platform by creating CRUD endpoints without hardcoding.
"""

from typing import Dict, List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, text
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime, date
import json

from app.core.database import get_async_session
from app.core.exceptions import ValidationException, BusinessRuleException
from app.models.metadata import EntityDefinition, FieldDefinition
from app.engines.data_engine import DataEngine
from app.engines.business_rule_engine import BusinessRuleEngine, BusinessContext
from app.api.dependencies import get_current_user
from app.models.auth import User
from app.core.logging import get_logger
from app.core.event_dispatcher import emit_entity_event, Events

logger = get_logger("legal_dynamic_api")

# Create router for Legal vertical APIs
legal_router = APIRouter(prefix="/api/v1/legal", tags=["Legal Vertical"])


# Dynamic request/response models
class DynamicCreateRequest(BaseModel):
    """Dynamic request model for entity creation."""
    data: Dict[str, Any] = Field(..., description="Entity field data")


class DynamicUpdateRequest(BaseModel):
    """Dynamic request model for entity updates."""
    data: Dict[str, Any] = Field(..., description="Entity field data to update")


class DynamicResponse(BaseModel):
    """Dynamic response model for entity operations."""
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    errors: Optional[List[str]] = None


class DynamicListResponse(BaseModel):
    """Dynamic response model for entity lists."""
    success: bool
    data: List[Dict[str, Any]]
    pagination: Optional[Dict[str, Any]] = None
    filters_applied: Optional[Dict[str, Any]] = None
    total_count: Optional[int] = None


class LegalDynamicAPIGenerator:
    """
    Generates dynamic CRUD APIs for Legal entities.
    
    Features:
    - Metadata-driven endpoint generation
    - Automatic validation from field definitions
    - Business rule integration
    - Dynamic filtering and sorting
    - Relationship resolution
    - Permission checking
    """

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.data_engine = DataEngine(db_session)
        self.business_rule_engine = BusinessRuleEngine(db_session)

    async def get_entity_definition(self, entity_name: str) -> Optional[EntityDefinition]:
        """Get entity definition with field metadata."""
        
        query = select(EntityDefinition).where(
            and_(
                EntityDefinition.entity_name == entity_name,
                EntityDefinition.vertical == "LEGAL"
            )
        ).options(
            selectinload(EntityDefinition.fields)
        )
        
        result = await self.db.execute(query)
        return result.scalars().first()

    async def check_entity_permission(
        self,
        entity_name: str,
        action: str,
        current_user: Any,
        entity_id: Optional[UUID] = None
    ) -> bool:
        """Check if user has permission for entity action using RBAC system."""
        
        try:
            # Build permission name using the standard format
            permission_name = f"legal.{entity_name.lower()}.{action}"
            
            # Check if user has the specific permission through RBAC
            user_permissions = getattr(current_user, 'permissions', set())
            
            # Direct permission check
            if permission_name in user_permissions:
                return True
                
            # Check for wildcard permissions
            wildcard_permissions = [
                f"legal.{entity_name.lower()}.*",  # Entity-level wildcard
                f"legal.*.{action}",               # Action-level wildcard
                "legal.*.*",                       # Legal module wildcard
                "*.*.*"                           # System admin wildcard
            ]
            
            for wildcard in wildcard_permissions:
                if wildcard in user_permissions:
                    return True
            
            # Check role-based permissions as fallback
            user_roles = getattr(current_user, 'roles', [])
            role_names = [role.lower() if isinstance(role, str) else role.name.lower() for role in user_roles]
            
            # System admin override
            if 'system_admin' in role_names or 'admin' in role_names:
                return True
                
            # Legal vertical admin
            if 'legal_admin' in role_names:
                return True
                
            # Entity-specific role checks (as emergency fallback)
            if 'managing_partner' in role_names:
                return True  # Managing partners have full access
                
            if action == 'read' and any(role in role_names for role in ['attorney', 'paralegal', 'staff']):
                return True  # Most roles can read
                
            # Log permission denial for audit
            logger.warning(
                f"Permission denied for user {getattr(current_user, 'user_id', 'unknown')}",
                permission=permission_name,
                user_roles=role_names,
                user_permissions=list(user_permissions)
            )
            
            return False
            
        except Exception as e:
            logger.error(f"Permission check failed: {str(e)}")
            return False  # Fail secure

    async def validate_entity_data(
        self,
        entity_def: EntityDefinition,
        data: Dict[str, Any],
        is_update: bool = False
    ) -> List[str]:
        """Validate entity data against field definitions and business rules."""
        
        errors = []
        
        # Field-level validation
        for field in entity_def.fields:
            field_value = data.get(field.field_name)
            
            # Required field validation
            if field.is_required and not is_update and (field_value is None or field_value == ""):
                errors.append(f"{field.field_name} is required")
                continue
            
            if field_value is not None:
                # Data type validation
                validation_error = await self._validate_field_type(field, field_value)
                if validation_error:
                    errors.append(validation_error)
                
                # Custom validation rules
                for rule in field.validation_rules or []:
                    rule_error = await self._validate_field_rule(field, field_value, rule)
                    if rule_error:
                        errors.append(rule_error)

        # Business rule validation
        if entity_def.business_rules:
            try:
                business_validation = await self.business_rule_engine.validate_business_rules(
                    entity_name=entity_def.entity_name,
                    data=data,
                    operation="create" if not is_update else "update"
                )
                if not business_validation.is_valid:
                    errors.extend(business_validation.errors)
            except Exception as e:
                logger.error(f"Business rule validation failed: {str(e)}")
                errors.append("Business rule validation failed")

        return errors

    async def _validate_field_type(self, field: FieldDefinition, value: Any) -> Optional[str]:
        """Validate field value against data type."""
        
        try:
            if field.data_type == "string" and not isinstance(value, str):
                return f"{field.field_name} must be a string"
            elif field.data_type == "integer" and not isinstance(value, int):
                return f"{field.field_name} must be an integer"
            elif field.data_type == "decimal" and not isinstance(value, (int, float)):
                return f"{field.field_name} must be a number"
            elif field.data_type == "boolean" and not isinstance(value, bool):
                return f"{field.field_name} must be a boolean"
            elif field.data_type == "date":
                if isinstance(value, str):
                    datetime.fromisoformat(value.replace('Z', '+00:00'))
                elif not isinstance(value, (date, datetime)):
                    return f"{field.field_name} must be a valid date"
            elif field.data_type == "email" and not self._is_valid_email(value):
                return f"{field.field_name} must be a valid email address"
                
        except (ValueError, TypeError):
            return f"{field.field_name} has invalid format for type {field.data_type}"
        
        return None

    async def _validate_field_rule(self, field: FieldDefinition, value: Any, rule: str) -> Optional[str]:
        """Validate field value against custom validation rule."""
        
        if rule == "required" and (value is None or value == ""):
            return f"{field.field_name} is required"
        elif rule.startswith("max_length:"):
            max_len = int(rule.split(":")[1])
            if isinstance(value, str) and len(value) > max_len:
                return f"{field.field_name} must be at most {max_len} characters"
        elif rule.startswith("min_length:"):
            min_len = int(rule.split(":")[1])
            if isinstance(value, str) and len(value) < min_len:
                return f"{field.field_name} must be at least {min_len} characters"
        elif rule.startswith("min:"):
            min_val = float(rule.split(":")[1])
            if isinstance(value, (int, float)) and value < min_val:
                return f"{field.field_name} must be at least {min_val}"
        elif rule.startswith("max:"):
            max_val = float(rule.split(":")[1])
            if isinstance(value, (int, float)) and value > max_val:
                return f"{field.field_name} must be at most {max_val}"
        elif rule == "unique":
            # TODO: Implement unique validation with database check
            pass
        
        return None

    def _is_valid_email(self, email: str) -> bool:
        """Basic email validation."""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None

    async def build_dynamic_query(
        self,
        entity_def: EntityDefinition,
        filters: Optional[Dict[str, Any]] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "asc",
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        page: Optional[int] = None
    ):
        """Build dynamic query from entity metadata and parameters."""
        
        # Build query config that matches DataEngine expectations
        query_config = {
            "filters": filters or {},
            "sort_by": sort_by or "created_at",
            "sort_order": (sort_order or "asc").upper(),
            "limit": limit or 25
        }
        
        # Add page if provided, otherwise calculate from offset
        if page is not None:
            query_config["page"] = page
        elif offset is not None and limit is not None:
            query_config["page"] = (offset // limit) + 1
        else:
            query_config["page"] = 1
        
        return query_config

    async def execute_workflow_triggers(
        self,
        entity_def: EntityDefinition,
        entity_data: Dict[str, Any],
        trigger_event: str
    ):
        """Execute workflow triggers for entity events."""
        
        workflow_triggers = getattr(entity_def, 'workflow_triggers', None)
        if not workflow_triggers:
            return
        
        for trigger in workflow_triggers:
            if trigger == trigger_event:
                try:
                    # This would integrate with the workflow engine
                    logger.info(f"Triggering workflow for {entity_def.entity_name}: {trigger}")
                    # await self.workflow_engine.trigger_workflow(trigger, entity_data)
                except Exception as e:
                    logger.error(f"Workflow trigger failed: {str(e)}")


async def get_api_generator(db: AsyncSession = Depends(get_async_session)) -> LegalDynamicAPIGenerator:
    """Get API generator instance (creates new instance per request)."""
    return LegalDynamicAPIGenerator(db)


# Dynamic CRUD Endpoints

@legal_router.post("/{entity_name}")
async def create_legal_entity(
    request: DynamicCreateRequest,
    entity_name: str = Path(..., description="Legal entity name"),
    current_user: User = Depends(get_current_user),
    api_gen: LegalDynamicAPIGenerator = Depends(get_api_generator)
) -> DynamicResponse:
    """
    Create a new legal entity instance.
    
    Dynamically handles any Legal vertical entity (Client, Matter, TimeEntry, etc.)
    with automatic validation and business rule enforcement.
    """
    
    try:
        # Get entity definition
        entity_def = await api_gen.get_entity_definition(entity_name)
        if not entity_def:
            raise HTTPException(status_code=404, detail=f"Entity '{entity_name}' not found in Legal vertical")

        # Check permissions
        if not await api_gen.check_entity_permission(entity_name, "create", current_user):
            raise HTTPException(status_code=403, detail=f"Insufficient permissions to create {entity_name}")

        # Validate input data
        validation_errors = await api_gen.validate_entity_data(entity_def, request.data, is_update=False)
        if validation_errors:
            return DynamicResponse(
                success=False,
                errors=validation_errors,
                message="Validation failed"
            )

        # Execute business rules (pre-create)
        await api_gen.execute_workflow_triggers(entity_def, request.data, "before_create")

        # Create entity using data engine
        created_entity = await api_gen.data_engine.create_entity(
            entity_name=entity_name,
            data=request.data,
            user_id=current_user.id
        )

        # Execute workflow triggers (post-create)
        await api_gen.execute_workflow_triggers(entity_def, request.data, "after_create")

        # Emit business event for workflow automation
        try:
            business_context = BusinessContext(
                tenant_id=current_user.tenant_id,
                user_id=current_user.id,
                entity_type=entity_name,
                entity_id=UUID(str(created_entity.get("id")))
            )
            
            # Emit entity created event
            await emit_entity_event(
                event_type=Events.ENTITY_CREATED,
                entity_type=entity_name,
                entity_id=UUID(str(created_entity.get("id"))),
                entity_data=created_entity,
                context=business_context,
                db_session=api_gen.db
            )
            
            # Emit specific event based on entity type
            if entity_name.lower() == "client":
                await emit_entity_event(
                    event_type=Events.CLIENT_CREATED,
                    entity_type=entity_name,
                    entity_id=UUID(str(created_entity.get("id"))),
                    entity_data=created_entity,
                    context=business_context,
                    db_session=api_gen.db
                )
            elif entity_name.lower() == "matter":
                await emit_entity_event(
                    event_type=Events.MATTER_CREATED,
                    entity_type=entity_name,
                    entity_id=UUID(str(created_entity.get("id"))),
                    entity_data=created_entity,
                    context=business_context,
                    db_session=api_gen.db
                )
            elif entity_name.lower() == "timeentry":
                await emit_entity_event(
                    event_type=Events.TIME_ENTRY_CREATED,
                    entity_type=entity_name,
                    entity_id=UUID(str(created_entity.get("id"))),
                    entity_data=created_entity,
                    context=business_context,
                    db_session=api_gen.db
                )
                
        except Exception as e:
            # Don't fail the creation if event emission fails
            logger.error(f"Failed to emit creation event for {entity_name}: {str(e)}")

        logger.info(f"Created {entity_name} entity", entity_id=created_entity.get("id"), user_id=current_user.id)

        return DynamicResponse(
            success=True,
            data=created_entity,
            message=f"{entity_name} created successfully"
        )

    except ValidationException as e:
        return DynamicResponse(
            success=False,
            errors=[str(e)],
            message="Validation error"
        )
    except BusinessRuleException as e:
        return DynamicResponse(
            success=False,
            errors=[str(e)],
            message="Business rule violation"
        )
    except Exception as e:
        logger.error(f"Failed to create {entity_name}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@legal_router.get("/{entity_name}")
async def list_legal_entities(
    entity_name: str = Path(..., description="Legal entity name"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(25, ge=1, le=100, description="Items per page"),
    sort_by: Optional[str] = Query(None, description="Field to sort by"),
    sort_order: Optional[str] = Query("asc", regex="^(asc|desc)$", description="Sort order"),
    filters: Optional[str] = Query(None, description="JSON filters"),
    current_user: User = Depends(get_current_user),
    api_gen: LegalDynamicAPIGenerator = Depends(get_api_generator),
    db: AsyncSession = Depends(get_async_session)
) -> DynamicListResponse:
    """
    List legal entity instances with filtering, sorting, and pagination.
    
    Dynamically handles any Legal vertical entity with metadata-driven queries.
    """
    
    try:
        # Get entity definition
        entity_def = await api_gen.get_entity_definition(entity_name)
        if not entity_def:
            raise HTTPException(status_code=404, detail=f"Entity '{entity_name}' not found in Legal vertical")

        # Parse filters
        parsed_filters = {}
        if filters:
            try:
                parsed_filters = json.loads(filters)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid filters JSON")

        # Build query
        query_config = await api_gen.build_dynamic_query(
            entity_def=entity_def,
            filters=parsed_filters,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            page=page
        )

        # Execute query using data engine
        entities = await api_gen.data_engine.list_entities(
            entity_name=entity_name,
            query_config=query_config
        )

        # Get total count for pagination
        total_count = await api_gen.data_engine.count_entities(
            entity_name=entity_name,
            filters=parsed_filters
        )

        pagination = {
            "page": page,
            "limit": limit,
            "total": total_count,
            "pages": (total_count + limit - 1) // limit
        }

        return DynamicListResponse(
            success=True,
            data=entities,
            pagination=pagination,
            filters_applied=parsed_filters,
            total_count=total_count
        )

    except Exception as e:
        logger.error(f"Failed to list {entity_name}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@legal_router.get("/{entity_name}/{entity_id}")
async def get_legal_entity(
    entity_name: str = Path(..., description="Legal entity name"),
    entity_id: UUID = Path(..., description="Entity ID"),
    include_related: Optional[bool] = Query(False, description="Include related entities"),
    current_user: User = Depends(get_current_user),
    api_gen: LegalDynamicAPIGenerator = Depends(get_api_generator)
) -> DynamicResponse:
    """
    Get a specific legal entity instance by ID.
    
    Dynamically handles any Legal vertical entity with optional related data.
    """
    
    try:
        # Get entity definition
        entity_def = await api_gen.get_entity_definition(entity_name)
        if not entity_def:
            raise HTTPException(status_code=404, detail=f"Entity '{entity_name}' not found in Legal vertical")

        # Check permissions
        if not await api_gen.check_entity_permission(entity_name, "read", current_user, entity_id):
            raise HTTPException(status_code=403, detail=f"Insufficient permissions to read {entity_name}")

        # Get entity using data engine
        entity = await api_gen.data_engine.get_entity(
            entity_name=entity_name,
            entity_id=entity_id,
            tenant_id=current_user.tenant_id
        )

        if not entity:
            raise HTTPException(status_code=404, detail=f"{entity_name} not found")

        return DynamicResponse(
            success=True,
            data=entity,
            message=f"{entity_name} retrieved successfully"
        )

    except Exception as e:
        logger.error(f"Failed to get {entity_name} {entity_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@legal_router.put("/{entity_name}/{entity_id}")
async def update_legal_entity(
    request: DynamicUpdateRequest,
    entity_name: str = Path(..., description="Legal entity name"),
    entity_id: UUID = Path(..., description="Entity ID"),
    current_user: User = Depends(get_current_user),
    api_gen: LegalDynamicAPIGenerator = Depends(get_api_generator)
) -> DynamicResponse:
    """
    Update a legal entity instance.
    
    Dynamically handles any Legal vertical entity with validation and business rules.
    """
    
    try:
        # Get entity definition
        entity_def = await api_gen.get_entity_definition(entity_name)
        if not entity_def:
            raise HTTPException(status_code=404, detail=f"Entity '{entity_name}' not found in Legal vertical")

        # Check permissions
        if not await api_gen.check_entity_permission(entity_name, "update", current_user, entity_id):
            raise HTTPException(status_code=403, detail=f"Insufficient permissions to update {entity_name}")

        # Validate input data
        validation_errors = await api_gen.validate_entity_data(entity_def, request.data, is_update=True)
        if validation_errors:
            return DynamicResponse(
                success=False,
                errors=validation_errors,
                message="Validation failed"
            )

        # Execute business rules (pre-update)
        await api_gen.execute_workflow_triggers(entity_def, request.data, "before_update")

        # Update entity using data engine
        updated_entity = await api_gen.data_engine.update_entity(
            entity_name=entity_name,
            entity_id=entity_id,
            data=request.data,
            user_id=current_user.id
        )

        if not updated_entity:
            raise HTTPException(status_code=404, detail=f"{entity_name} not found")

        # Execute workflow triggers (post-update)
        await api_gen.execute_workflow_triggers(entity_def, request.data, "after_update")

        logger.info(f"Updated {entity_name} entity", entity_id=entity_id, user_id=current_user.id)

        return DynamicResponse(
            success=True,
            data=updated_entity,
            message=f"{entity_name} updated successfully"
        )

    except ValidationException as e:
        return DynamicResponse(
            success=False,
            errors=[str(e)],
            message="Validation error"
        )
    except BusinessRuleException as e:
        return DynamicResponse(
            success=False,
            errors=[str(e)],
            message="Business rule violation"
        )
    except Exception as e:
        logger.error(f"Failed to update {entity_name} {entity_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@legal_router.delete("/{entity_name}/{entity_id}")
async def delete_legal_entity(
    entity_name: str = Path(..., description="Legal entity name"),
    entity_id: UUID = Path(..., description="Entity ID"),
    soft_delete: Optional[bool] = Query(True, description="Use soft delete"),
    current_user: User = Depends(get_current_user),
    api_gen: LegalDynamicAPIGenerator = Depends(get_api_generator)
) -> DynamicResponse:
    """
    Delete a legal entity instance.
    
    Dynamically handles any Legal vertical entity with soft delete support.
    """
    
    try:
        # Get entity definition
        entity_def = await api_gen.get_entity_definition(entity_name)
        if not entity_def:
            raise HTTPException(status_code=404, detail=f"Entity '{entity_name}' not found in Legal vertical")

        # Check permissions
        if not await api_gen.check_entity_permission(entity_name, "delete", current_user, entity_id):
            raise HTTPException(status_code=403, detail=f"Insufficient permissions to delete {entity_name}")

        # Check if entity supports soft delete
        supports_soft_delete = getattr(entity_def, 'soft_delete', True)  # Default to True for safety
        use_soft_delete = soft_delete and supports_soft_delete

        # Execute business rules (pre-delete)
        await api_gen.execute_workflow_triggers(entity_def, {"id": entity_id}, "before_delete")

        # Delete entity using data engine
        deleted = await api_gen.data_engine.delete_entity(
            entity_name=entity_name,
            entity_id=entity_id,
            soft_delete=use_soft_delete,
            user_id=current_user.id
        )

        if not deleted:
            raise HTTPException(status_code=404, detail=f"{entity_name} not found")

        # Execute workflow triggers (post-delete)
        await api_gen.execute_workflow_triggers(entity_def, {"id": entity_id}, "after_delete")

        delete_type = "soft deleted" if use_soft_delete else "permanently deleted"
        logger.info(f"{delete_type.title()} {entity_name} entity", entity_id=entity_id, user_id=current_user.id)

        return DynamicResponse(
            success=True,
            message=f"{entity_name} {delete_type} successfully"
        )

    except Exception as e:
        logger.error(f"Failed to delete {entity_name} {entity_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Specialized Legal endpoints

@legal_router.post("/clients/{client_id}/conflict-check")
async def check_client_conflicts(
    client_id: UUID = Path(..., description="Client ID"),
    current_user: User = Depends(get_current_user),
    api_gen: LegalDynamicAPIGenerator = Depends(get_api_generator),
    db: AsyncSession = Depends(get_async_session)
) -> DynamicResponse:
    """
    Run conflict of interest check for a client.
    
    Demonstrates Legal-specific business rule execution.
    """
    
    try:
        # Execute conflict checking business rule
        business_context = BusinessContext(
            tenant_id=current_user.tenant_id,
            user_id=current_user.id,
            entity_type="Client",
            entity_id=client_id
        )
        
        conflict_result = await api_gen.business_rule_engine.execute_rule_by_name(
            rule_name="client_conflict_check",
            input_data={"client_id": str(client_id)},
            context=business_context
        )

        return DynamicResponse(
            success=True,
            data={
                "client_id": client_id,
                "conflict_detected": not conflict_result.success,
                "details": conflict_result.result_data,
                "message": conflict_result.message
            },
            message="Conflict check completed"
        )

    except Exception as e:
        logger.error(f"Conflict check failed for client {client_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Conflict check failed")


@legal_router.get("/matters/{matter_id}/budget-status")
async def get_matter_budget_status(
    matter_id: UUID = Path(..., description="Matter ID"),
    current_user: User = Depends(get_current_user),
    api_gen: LegalDynamicAPIGenerator = Depends(get_api_generator),
    db: AsyncSession = Depends(get_async_session)
) -> DynamicResponse:
    """
    Get budget status for a matter.
    
    Demonstrates Legal-specific business rule execution for budget tracking.
    """
    
    try:
        # Execute budget tracking business rule
        business_context = BusinessContext(
            tenant_id=current_user.tenant_id,
            user_id=current_user.id,
            entity_type="Matter",
            entity_id=matter_id
        )
        
        budget_result = await api_gen.business_rule_engine.execute_rule_by_name(
            rule_name="matter_budget_tracking",
            input_data={"matter_id": str(matter_id)},
            context=business_context
        )

        return DynamicResponse(
            success=True,
            data={
                "matter_id": matter_id,
                "budget_status": budget_result.result_data,
                "alerts": budget_result.alerts if hasattr(budget_result, 'alerts') else [],
                "message": budget_result.message
            },
            message="Budget status retrieved"
        )

    except Exception as e:
        logger.error(f"Budget status check failed for matter {matter_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Budget status check failed")


@legal_router.get("/reports/billing-summary")
async def get_billing_summary(
    start_date: Optional[date] = Query(None, description="Start date"),
    end_date: Optional[date] = Query(None, description="End date"),
    attorney_id: Optional[UUID] = Query(None, description="Filter by attorney"),
    current_user: User = Depends(get_current_user),
    api_gen: LegalDynamicAPIGenerator = Depends(get_api_generator),
    db: AsyncSession = Depends(get_async_session)
) -> DynamicResponse:
    """
    Get billing summary report.
    
    Demonstrates cross-entity reporting using dynamic queries.
    """
    
    try:
        # This would use the data engine to build complex reports
        # across multiple entities (TimeEntry, Matter, Client, Invoice)
        
        filters = {}
        if start_date:
            filters["start_date"] = start_date.isoformat()
        if end_date:
            filters["end_date"] = end_date.isoformat()
        if attorney_id:
            filters["attorney_id"] = str(attorney_id)

        # Build report using data engine
        report_data = await api_gen.data_engine.generate_report(
            report_type="billing_summary",
            filters=filters,
            tenant_id=current_user.tenant_id
        )

        return DynamicResponse(
            success=True,
            data=report_data,
            message="Billing summary generated"
        )

    except Exception as e:
        logger.error(f"Billing summary generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Report generation failed")