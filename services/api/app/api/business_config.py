"""
Business Configuration API Endpoints

SAP-style business configuration management endpoints for:
- Business configuration entries
- Business rule definitions
- Field localization
- Process configuration
- Configuration validation and testing
"""

from datetime import date, datetime
from typing import Dict, List, Optional, Any
from uuid import UUID
from fnmatch import fnmatch

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.logging import get_logger
from app.core.exceptions import (
    ValidationException,
    BusinessRuleException
)
from app.engines.business_rule_engine import (
    BusinessRuleEngine,
    ConfigurationEngine,
    BusinessContext
)
from app.models.business_config import (
    BusinessConfigEntry,
    BusinessRuleDefinition,
    FieldLocalizationConfig
)
from app.api.dependencies import get_current_user, get_tenant_context


router = APIRouter()
logger = get_logger("business_config_api")


def check_user_permissions(user_permissions: set, required_permissions: List[str]) -> bool:
    """
    Check if user has any of the required permissions using wildcard matching.
    
    Args:
        user_permissions: Set of user's permissions
        required_permissions: List of required permission patterns
        
    Returns:
        True if user has any required permission
    """
    for user_perm in user_permissions:
        for required_perm in required_permissions:
            if fnmatch(user_perm, required_perm) or fnmatch(required_perm, user_perm):
                return True
    return False


# Pydantic models for request/response
class BusinessConfigRequest(BaseModel):
    """Request model for business configuration."""
    config_domain: str = Field(..., description="Configuration domain")
    config_key: str = Field(..., description="Configuration key")
    config_values: Dict[str, Any] = Field(..., description="Configuration values")
    country_code: Optional[str] = Field(None, description="Country code")
    state_province: Optional[str] = Field(None, description="State/Province code")
    industry_code: Optional[str] = Field(None, description="Industry code")
    vertical_code: Optional[str] = Field(None, description="Vertical code")
    effective_from: Optional[date] = Field(None, description="Effective from date")
    effective_to: Optional[date] = Field(None, description="Effective to date")


class BusinessRuleRequest(BaseModel):
    """Request model for business rule definition."""
    rule_name: str = Field(..., description="Rule name")
    rule_category: str = Field(..., description="Rule category")
    rule_type: str = Field(..., description="Rule type")
    description: Optional[str] = Field(None, description="Rule description")
    trigger_conditions: Dict[str, Any] = Field(..., description="Trigger conditions")
    rule_logic: Dict[str, Any] = Field(..., description="Rule logic")
    input_parameters: Optional[Dict[str, Any]] = Field(None, description="Input parameters")
    output_format: Optional[Dict[str, Any]] = Field(None, description="Output format")
    country_code: Optional[str] = Field(None, description="Country code")
    industry_code: Optional[str] = Field(None, description="Industry code")
    vertical_code: Optional[str] = Field(None, description="Vertical code")
    execution_order: int = Field(100, description="Execution order")
    is_mandatory: bool = Field(False, description="Is mandatory rule")
    error_handling: Optional[Dict[str, Any]] = Field(None, description="Error handling")

    @validator('rule_category')
    def validate_rule_category(cls, v):
        valid_categories = ['VALIDATION', 'CALCULATION', 'WORKFLOW', 'NOTIFICATION', 'APPROVAL']
        if v not in valid_categories:
            raise ValueError(f"Rule category must be one of: {', '.join(valid_categories)}")
        return v

    @validator('rule_type')
    def validate_rule_type(cls, v):
        valid_types = ['CONDITIONAL', 'LOOKUP', 'FORMULA', 'SCRIPT', 'API_CALL']
        if v not in valid_types:
            raise ValueError(f"Rule type must be one of: {', '.join(valid_types)}")
        return v


class RuleExecutionRequest(BaseModel):
    """Request model for rule execution."""
    input_data: Dict[str, Any] = Field(..., description="Input data for rule")
    context: Optional[Dict[str, Any]] = Field(None, description="Execution context")





class BusinessConfigResponse(BaseModel):
    """Response model for business configuration."""
    entry_id: UUID
    config_domain: str
    config_key: str
    config_values: Dict[str, Any]
    country_code: Optional[str]
    state_province: Optional[str]
    industry_code: Optional[str]
    vertical_code: Optional[str]
    tenant_id: Optional[UUID]
    effective_from: Optional[date]
    effective_to: Optional[date]
    is_active: bool
    created_at: datetime
    updated_at: datetime


class BusinessRuleResponse(BaseModel):
    """Response model for business rule definition."""
    rule_id: UUID
    rule_name: str
    rule_category: str
    rule_type: str
    description: Optional[str]
    trigger_conditions: Dict[str, Any]
    rule_logic: Dict[str, Any]
    input_parameters: Optional[Dict[str, Any]]
    output_format: Optional[Dict[str, Any]]
    country_code: Optional[str]
    industry_code: Optional[str]
    vertical_code: Optional[str]
    tenant_id: Optional[UUID]
    execution_order: int
    is_mandatory: bool
    error_handling: Optional[Dict[str, Any]]
    version: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


# Business Configuration Management Endpoints

@router.get("/business-config/{domain}", response_model=List[BusinessConfigResponse])
async def get_business_config(
    domain: str,
    country_code: Optional[str] = Query(None),
    industry_code: Optional[str] = Query(None),
    vertical_code: Optional[str] = Query(None),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(50, ge=1, le=1000, description="Items per page (max 1000)"),
    order_by: str = Query("created_at", description="Order by field (created_at, config_key, effective_from)"),
    order_dir: str = Query("desc", regex="^(asc|desc)$", description="Order direction"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get business configuration entries for a domain."""
    
    try:
        context = BusinessContext(
            tenant_id=tenant_context.get("tenant_id"),
            user_id=current_user.get("user_id"),
            country_code=country_code,
            industry_code=industry_code,
            vertical_code=vertical_code
        )

        # Get all config entries for the domain with optional filters
        from sqlalchemy import select, and_, or_
        
        conditions = [
            BusinessConfigEntry.config_domain == domain,
            BusinessConfigEntry.is_active == True,
            or_(
                BusinessConfigEntry.tenant_id == context.tenant_id,
                BusinessConfigEntry.tenant_id.is_(None)
            )
        ]
        
        # Add optional filters
        if country_code is not None:
            conditions.append(BusinessConfigEntry.country_code == country_code)
        if industry_code is not None:
            conditions.append(BusinessConfigEntry.industry_code == industry_code)
        if vertical_code is not None:
            conditions.append(BusinessConfigEntry.vertical_code == vertical_code)
        
        # Add ordering and pagination
        order_column = getattr(BusinessConfigEntry, order_by, BusinessConfigEntry.created_at)
        if order_dir == "desc":
            query = select(BusinessConfigEntry).where(and_(*conditions)).order_by(order_column.desc())
        else:
            query = select(BusinessConfigEntry).where(and_(*conditions)).order_by(order_column.asc())
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        result = await db.execute(query)
        config_entries = result.scalars().all()

        return [
            BusinessConfigResponse(
                entry_id=entry.entry_id,
                config_domain=entry.config_domain,
                config_key=entry.config_key,
                config_values=entry.config_values,
                country_code=entry.country_code,
                state_province=entry.state_province,
                industry_code=entry.industry_code,
                vertical_code=entry.vertical_code,
                tenant_id=entry.tenant_id,
                effective_from=entry.effective_from,
                effective_to=entry.effective_to,
                is_active=entry.is_active,
                created_at=entry.created_at,
                updated_at=entry.updated_at
            )
            for entry in config_entries
        ]

    except Exception as e:
        logger.error(f"Failed to get business config for domain {domain}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get business configuration: {str(e)}"
        )


@router.post("/business-config/{domain}", response_model=Dict[str, Any])
async def create_business_config(
    domain: str,
    config_request: BusinessConfigRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Create new business configuration entry."""
    
    # Check permissions
    user_permissions = set(current_user.get("permissions", []))
    if not check_user_permissions(user_permissions, [
        "system.business_config.create"
    ]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create business configuration"
        )
    
    try:
        config_engine = ConfigurationEngine(db)
        context = BusinessContext(
            tenant_id=tenant_context.get("tenant_id"),
            user_id=current_user.get("user_id"),
            country_code=config_request.country_code,
            state_province=config_request.state_province,
            industry_code=config_request.industry_code,
            vertical_code=config_request.vertical_code
        )

        # Ensure domain matches
        if config_request.config_domain != domain:
            raise ValidationException("Domain in URL must match domain in request body")

        result = await config_engine.update_config(
            domain=config_request.config_domain,
            key=config_request.config_key,
            value=config_request.config_values,
            user_id=current_user.get("user_id"),
            context=context,
            effective_from=config_request.effective_from,
            effective_to=config_request.effective_to
        )

        logger.info(
            f"Business configuration created",
            domain=domain,
            key=config_request.config_key,
            user_id=current_user.get("user_id"),
            tenant_id=tenant_context.get("tenant_id")
        )

        return result

    except ValidationException:
        raise
    except Exception as e:
        logger.error(f"Failed to create business config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create business configuration: {str(e)}"
        )


@router.put("/business-config/{domain}/{key}", response_model=Dict[str, Any])
async def update_business_config(
    domain: str,
    key: str,
    config_request: BusinessConfigRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Update existing business configuration entry."""
    
    # Check permissions
    user_permissions = set(current_user.get("permissions", []))
    if not check_user_permissions(user_permissions, [
        "system.business_config.update"
    ]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update business configuration"
        )
    
    try:
        config_engine = ConfigurationEngine(db)
        context = BusinessContext(
            tenant_id=tenant_context.get("tenant_id"),
            user_id=current_user.get("user_id"),
            country_code=config_request.country_code,
            state_province=config_request.state_province,
            industry_code=config_request.industry_code,
            vertical_code=config_request.vertical_code
        )

        # Ensure domain and key match
        if config_request.config_domain != domain or config_request.config_key != key:
            raise ValidationException("Domain and key in URL must match request body")

        result = await config_engine.update_config(
            domain=domain,
            key=key,
            value=config_request.config_values,
            user_id=current_user.get("user_id"),
            context=context,
            effective_from=config_request.effective_from,
            effective_to=config_request.effective_to
        )

        logger.info(
            f"Business configuration updated",
            domain=domain,
            key=key,
            user_id=current_user.get("user_id"),
            tenant_id=tenant_context.get("tenant_id")
        )

        return result

    except ValidationException:
        raise
    except Exception as e:
        logger.error(f"Failed to update business config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update business configuration: {str(e)}"
        )


@router.delete("/business-config/{domain}/{key}")
async def deactivate_business_config(
    domain: str,
    key: str,
    country_code: Optional[str] = Query(None),
    state_province: Optional[str] = Query(None),
    industry_code: Optional[str] = Query(None),
    vertical_code: Optional[str] = Query(None),
    effective_from: Optional[date] = Query(None, description="Effective from date for targeting specific config"),
    effective_to: Optional[date] = Query(None, description="Effective to date for targeting specific config"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Deactivate business configuration entry."""
    
    # Check permissions
    user_permissions = set(current_user.get("permissions", []))
    if not check_user_permissions(user_permissions, [
        "system.business_config.delete"
    ]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete business configuration"
        )
    
    try:
        from sqlalchemy import select, and_
        
        # Build query filters (only filter when values are explicitly provided)
        filters = [
            BusinessConfigEntry.config_domain == domain,
            BusinessConfigEntry.config_key == key,
            BusinessConfigEntry.tenant_id == tenant_context.get("tenant_id")
        ]
        
        # Add optional filters only when provided (avoid forcing IS NULL)
        if country_code is not None:
            filters.append(BusinessConfigEntry.country_code == country_code)
        if state_province is not None:
            filters.append(BusinessConfigEntry.state_province == state_province)
        if industry_code is not None:
            filters.append(BusinessConfigEntry.industry_code == industry_code)
        if vertical_code is not None:
            filters.append(BusinessConfigEntry.vertical_code == vertical_code)
        
        # Add effective date filters if provided for precision targeting
        if effective_from is not None:
            filters.append(BusinessConfigEntry.effective_from == effective_from)
        if effective_to is not None:
            filters.append(BusinessConfigEntry.effective_to == effective_to)
        
        # Find the configuration entry
        query = select(BusinessConfigEntry).where(and_(*filters))

        result = await db.execute(query)
        config_entries = result.scalars().all()

        if not config_entries:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuration entry not found"
            )
        
        # If multiple entries found and no effective dates specified, show candidates
        if len(config_entries) > 1 and effective_from is None and effective_to is None:
            candidate_info = [
                {
                    "entry_id": str(entry.entry_id),
                    "effective_from": entry.effective_from.isoformat() if entry.effective_from else None,
                    "effective_to": entry.effective_to.isoformat() if entry.effective_to else None,
                    "state_province": entry.state_province
                }
                for entry in config_entries
            ]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Multiple configuration entries found. Please specify effective dates to target specific entry. Candidates: {candidate_info}"
            )
        
        config_entry = config_entries[0]

        # Deactivate instead of delete
        config_entry.is_active = False
        config_entry.change_user_id = current_user.get("user_id")
        config_entry.change_timestamp = datetime.utcnow()
        config_entry.updated_at = datetime.utcnow()

        await db.commit()

        logger.info(
            f"Business configuration deactivated",
            domain=domain,
            key=key,
            user_id=current_user.get("user_id"),
            tenant_id=tenant_context.get("tenant_id")
        )

        return {"success": True, "message": "Configuration entry deactivated"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to deactivate business config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deactivate business configuration: {str(e)}"
        )


# Business Rules Management Endpoints

@router.get("/business-rules", response_model=List[BusinessRuleResponse])
async def get_business_rules(
    category: Optional[str] = Query(None),
    country_code: Optional[str] = Query(None),
    industry_code: Optional[str] = Query(None),
    vertical_code: Optional[str] = Query(None),
    is_active: bool = Query(True),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(50, ge=1, le=1000, description="Items per page (max 1000)"),
    order_by: str = Query("execution_order", description="Order by field (execution_order, rule_name, created_at)"),
    order_dir: str = Query("asc", regex="^(asc|desc)$", description="Order direction"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get business rule definitions."""
    
    try:
        rule_engine = BusinessRuleEngine(db)
        context = BusinessContext(
            tenant_id=tenant_context.get("tenant_id"),
            user_id=current_user.get("user_id"),
            country_code=country_code,
            industry_code=industry_code,
            vertical_code=vertical_code
        )

        if category:
            # Get rule IDs from applicable rules first
            applicable_rules = await rule_engine.get_applicable_rules(category, context)
            rule_ids = [rule["rule_id"] for rule in applicable_rules]
            
            if not rule_ids:
                return []
            
            # Fetch actual database records for these rules
            from sqlalchemy import select, and_, or_
            query = select(BusinessRuleDefinition).where(
                and_(
                    BusinessRuleDefinition.rule_id.in_(rule_ids),
                    BusinessRuleDefinition.is_active == is_active,
                    or_(
                        BusinessRuleDefinition.tenant_id == context.tenant_id,
                        BusinessRuleDefinition.tenant_id.is_(None)
                    )
                )
            ).order_by(BusinessRuleDefinition.execution_order.asc())
            
            # Apply pagination to category-based results
            offset = (page - 1) * limit
            query = query.offset(offset).limit(limit)
            
            result = await db.execute(query)
            rules = result.scalars().all()
            
            return [
                BusinessRuleResponse(
                    rule_id=rule.rule_id,
                    rule_name=rule.rule_name,
                    rule_category=rule.rule_category,
                    rule_type=rule.rule_type,
                    description=rule.description,
                    trigger_conditions=rule.trigger_conditions,
                    rule_logic=rule.rule_logic,
                    input_parameters=rule.input_parameters,
                    output_format=rule.output_format,
                    country_code=rule.country_code,
                    industry_code=rule.industry_code,
                    vertical_code=rule.vertical_code,
                    tenant_id=rule.tenant_id,
                    execution_order=rule.execution_order,
                    is_mandatory=rule.is_mandatory,
                    error_handling=rule.error_handling,
                    version=rule.version,
                    is_active=rule.is_active,
                    created_at=rule.created_at,
                    updated_at=rule.updated_at
                )
                for rule in rules
            ]
        else:
            # Get all rules for tenant
            from sqlalchemy import select, and_, or_
            query = select(BusinessRuleDefinition).where(
                and_(
                    BusinessRuleDefinition.is_active == is_active,
                    or_(
                        BusinessRuleDefinition.tenant_id == context.tenant_id,
                        BusinessRuleDefinition.tenant_id.is_(None)
                    )
                )
            )
            
            # Add custom ordering and pagination
            order_column = getattr(BusinessRuleDefinition, order_by, BusinessRuleDefinition.execution_order)
            if order_dir == "desc":
                query = query.order_by(order_column.desc())
            else:
                query = query.order_by(order_column.asc())
            
            # Apply pagination
            offset = (page - 1) * limit
            query = query.offset(offset).limit(limit)

            result = await db.execute(query)
            rules = result.scalars().all()

            return [
                BusinessRuleResponse(
                    rule_id=rule.rule_id,
                    rule_name=rule.rule_name,
                    rule_category=rule.rule_category,
                    rule_type=rule.rule_type,
                    description=rule.description,
                    trigger_conditions=rule.trigger_conditions,
                    rule_logic=rule.rule_logic,
                    input_parameters=rule.input_parameters,
                    output_format=rule.output_format,
                    country_code=rule.country_code,
                    industry_code=rule.industry_code,
                    vertical_code=rule.vertical_code,
                    tenant_id=rule.tenant_id,
                    execution_order=rule.execution_order,
                    is_mandatory=rule.is_mandatory,
                    error_handling=rule.error_handling,
                    version=rule.version,
                    is_active=rule.is_active,
                    created_at=rule.created_at,
                    updated_at=rule.updated_at
                )
                for rule in rules
            ]

    except Exception as e:
        logger.error(f"Failed to get business rules: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get business rules: {str(e)}"
        )


@router.post("/business-rules", response_model=BusinessRuleResponse)
async def create_business_rule(
    rule_request: BusinessRuleRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Create new business rule definition."""
    
    # Check permissions
    user_permissions = set(current_user.get("permissions", []))
    if not check_user_permissions(user_permissions, [
        "system.business_rules.create"
    ]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create business rules"
        )
    
    try:
        rule_engine = BusinessRuleEngine(db)

        # Validate rule logic
        rule_dict = rule_request.dict()
        validation_result = await rule_engine.validate_rule_logic(rule_dict)
        
        if not validation_result.is_valid:
            raise ValidationException(
                message="Rule validation failed",
                field_errors=[{"field": "rule_logic", "message": error} for error in validation_result.errors]
            )

        # Create new rule
        new_rule = BusinessRuleDefinition(
            rule_name=rule_request.rule_name,
            rule_category=rule_request.rule_category,
            rule_type=rule_request.rule_type,
            description=rule_request.description,
            trigger_conditions=rule_request.trigger_conditions,
            rule_logic=rule_request.rule_logic,
            input_parameters=rule_request.input_parameters,
            output_format=rule_request.output_format,
            country_code=rule_request.country_code,
            industry_code=rule_request.industry_code,
            vertical_code=rule_request.vertical_code,
            tenant_id=tenant_context.get("tenant_id"),
            execution_order=rule_request.execution_order,
            is_mandatory=rule_request.is_mandatory,
            error_handling=rule_request.error_handling,
            created_by=current_user.get("user_id")
        )

        db.add(new_rule)
        await db.commit()
        await db.refresh(new_rule)

        logger.info(
            f"Business rule created",
            rule_id=str(new_rule.rule_id),
            rule_name=new_rule.rule_name,
            user_id=current_user.get("user_id"),
            tenant_id=tenant_context.get("tenant_id")
        )

        return BusinessRuleResponse(
            rule_id=new_rule.rule_id,
            rule_name=new_rule.rule_name,
            rule_category=new_rule.rule_category,
            rule_type=new_rule.rule_type,
            description=new_rule.description,
            trigger_conditions=new_rule.trigger_conditions,
            rule_logic=new_rule.rule_logic,
            input_parameters=new_rule.input_parameters,
            output_format=new_rule.output_format,
            country_code=new_rule.country_code,
            industry_code=new_rule.industry_code,
            vertical_code=new_rule.vertical_code,
            tenant_id=new_rule.tenant_id,
            execution_order=new_rule.execution_order,
            is_mandatory=new_rule.is_mandatory,
            error_handling=new_rule.error_handling,
            version=new_rule.version,
            is_active=new_rule.is_active,
            created_at=new_rule.created_at,
            updated_at=new_rule.updated_at
        )

    except ValidationException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to create business rule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create business rule: {str(e)}"
        )


@router.put("/business-rules/{rule_id}", response_model=BusinessRuleResponse)
async def update_business_rule(
    rule_id: UUID,
    rule_request: BusinessRuleRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Update existing business rule definition."""
    
    # Check permissions
    user_permissions = set(current_user.get("permissions", []))
    if not check_user_permissions(user_permissions, [
        "system.business_rules.update"
    ]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update business rules"
        )
    
    try:
        from sqlalchemy import select, and_, or_
        
        # Find the existing rule
        query = select(BusinessRuleDefinition).where(
            and_(
                BusinessRuleDefinition.rule_id == rule_id,
                or_(
                    BusinessRuleDefinition.tenant_id == tenant_context.get("tenant_id"),
                    BusinessRuleDefinition.tenant_id.is_(None)
                )
            )
        )
        
        result = await db.execute(query)
        rule = result.scalars().first()
        
        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business rule not found"
            )
        
        # Security check: prevent tenants from modifying global rules
        if rule.tenant_id is None:
            # Check if user has system admin permissions
            user_roles = current_user.get("roles", [])
            is_system_admin = any(role.lower() in ["system_admin", "super_admin"] for role in user_roles)
            if not is_system_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot modify global business rules. System admin access required."
                )
        
        # Validate rule logic
        rule_engine = BusinessRuleEngine(db)
        rule_dict = rule_request.dict()
        validation_result = await rule_engine.validate_rule_logic(rule_dict)
        
        if not validation_result.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Rule validation failed: {', '.join(validation_result.errors)}"
            )
        
        # Update the rule
        for field, value in rule_request.dict(exclude_unset=True).items():
            setattr(rule, field, value)
        
        rule.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(rule)
        
        return BusinessRuleResponse(
            rule_id=rule.rule_id,
            rule_name=rule.rule_name,
            rule_category=rule.rule_category,
            rule_type=rule.rule_type,
            description=rule.description,
            trigger_conditions=rule.trigger_conditions,
            rule_logic=rule.rule_logic,
            input_parameters=rule.input_parameters,
            output_format=rule.output_format,
            country_code=rule.country_code,
            industry_code=rule.industry_code,
            vertical_code=rule.vertical_code,
            tenant_id=rule.tenant_id,
            execution_order=rule.execution_order,
            is_mandatory=rule.is_mandatory,
            error_handling=rule.error_handling,
            version=rule.version,
            is_active=rule.is_active,
            created_at=rule.created_at,
            updated_at=rule.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update business rule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update business rule: {str(e)}"
        )


@router.delete("/business-rules/{rule_id}")
async def delete_business_rule(
    rule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Delete (deactivate) business rule definition."""
    
    # Check permissions
    user_permissions = set(current_user.get("permissions", []))
    if not check_user_permissions(user_permissions, [
        "system.business_rules.delete"
    ]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete business rules"
        )
    
    try:
        from sqlalchemy import select, and_, or_
        
        # Find the rule
        query = select(BusinessRuleDefinition).where(
            and_(
                BusinessRuleDefinition.rule_id == rule_id,
                or_(
                    BusinessRuleDefinition.tenant_id == tenant_context.get("tenant_id"),
                    BusinessRuleDefinition.tenant_id.is_(None)
                )
            )
        )
        
        result = await db.execute(query)
        rule = result.scalars().first()
        
        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business rule not found"
            )
        
        # Security check: prevent tenants from deleting global rules
        if rule.tenant_id is None:
            # Check if user has system admin permissions
            user_roles = current_user.get("roles", [])
            is_system_admin = any(role.lower() in ["system_admin", "super_admin"] for role in user_roles)
            if not is_system_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot delete global business rules. System admin access required."
                )
        
        # Soft delete (deactivate)
        rule.is_active = False
        rule.updated_at = datetime.utcnow()
        
        await db.commit()
        
        return {"message": "Business rule deactivated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to delete business rule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete business rule: {str(e)}"
        )


@router.post("/business-rules/{rule_id}/test", response_model=Dict[str, Any])
async def test_business_rule(
    rule_id: UUID,
    test_request: RuleExecutionRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Test business rule execution."""
    
    # Check permissions
    user_permissions = set(current_user.get("permissions", []))
    if not check_user_permissions(user_permissions, [
        "system.business_rules.test",
        "system.business_rules.read"
    ]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to test business rules"
        )
    
    try:
        rule_engine = BusinessRuleEngine(db)
        # Safely merge context to avoid kwargs collision
        extra_context = dict(test_request.context or {})
        extra_context.pop("tenant_id", None)  # Remove conflicting keys
        extra_context.pop("user_id", None)
        
        context = BusinessContext(
            tenant_id=tenant_context.get("tenant_id"),
            user_id=current_user.get("user_id"),
            **extra_context
        )

        result = await rule_engine.execute_rule(
            rule_id=rule_id,
            input_data=test_request.input_data,
            context=context
        )

        return {
            "success": result.success,
            "result_data": result.result_data,
            "message": result.message,
            "execution_time_ms": result.execution_time_ms,
            "alerts": result.alerts
        }

    except Exception as e:
        logger.error(f"Failed to test business rule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test business rule: {str(e)}"
        )


# Runtime Configuration Endpoints (for applications)

@router.get("/config/business-rules/{category}", response_model=List[Dict[str, Any]])
async def get_runtime_business_rules(
    category: str,
    country_code: Optional[str] = Query(None),
    industry_code: Optional[str] = Query(None),
    vertical_code: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get active business rules for runtime execution."""
    
    try:
        rule_engine = BusinessRuleEngine(db)
        context = BusinessContext(
            tenant_id=tenant_context.get("tenant_id"),
            user_id=current_user.get("user_id"),
            country_code=country_code,
            industry_code=industry_code,
            vertical_code=vertical_code,
            entity_type=entity_type
        )

        rules = await rule_engine.get_applicable_rules(category, context, entity_type)
        return rules

    except Exception as e:
        logger.error(f"Failed to get runtime business rules: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get runtime business rules: {str(e)}"
        )


@router.post("/config/execute-rule/{rule_id}", response_model=Dict[str, Any])
async def execute_business_rule(
    rule_id: UUID,
    execution_request: RuleExecutionRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Execute business rule at runtime."""
    
    # Check permissions
    user_permissions = set(current_user.get("permissions", []))
    if not check_user_permissions(user_permissions, [
        "system.business_rules.execute"
    ]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to execute business rules"
        )
    
    try:
        rule_engine = BusinessRuleEngine(db)
        # Safely merge context to avoid kwargs collision
        extra_context = dict(execution_request.context or {})
        extra_context.pop("tenant_id", None)  # Remove conflicting keys
        extra_context.pop("user_id", None)
        
        context = BusinessContext(
            tenant_id=tenant_context.get("tenant_id"),
            user_id=current_user.get("user_id"),
            **extra_context
        )

        result = await rule_engine.execute_rule(
            rule_id=rule_id,
            input_data=execution_request.input_data,
            context=context
        )

        return {
            "success": result.success,
            "result_data": result.result_data,
            "message": result.message,
            "execution_time_ms": result.execution_time_ms,
            "alerts": result.alerts,
            "rule_id": str(result.rule_id) if result.rule_id else None
        }

    except Exception as e:
        logger.error(f"Failed to execute business rule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute business rule: {str(e)}"
        )


@router.get("/config/field-config/{entity}/{country}", response_model=List[Dict[str, Any]])
async def get_field_configuration(
    entity: str,
    country: str,
    state_province: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get field configuration for country/region."""
    
    try:
        from sqlalchemy import select, and_
        
        query = select(FieldLocalizationConfig).where(
            and_(
                FieldLocalizationConfig.entity_name == entity,
                FieldLocalizationConfig.country_code == country,
                FieldLocalizationConfig.is_active == True
            )
        )

        if state_province:
            from sqlalchemy import or_
            query = query.where(
                or_(
                    FieldLocalizationConfig.state_province == state_province,
                    FieldLocalizationConfig.state_province.is_(None)
                )
            ).order_by(FieldLocalizationConfig.state_province.desc().nulls_last())

        result = await db.execute(query)
        field_configs = result.scalars().all()

        return [
            {
                "localization_id": str(config.localization_id),
                "entity_name": config.entity_name,
                "field_name": config.field_name,
                "country_code": config.country_code,
                "state_province": config.state_province,
                "display_name": config.display_name,
                "validation_pattern": config.validation_pattern,
                "formatting_rules": config.formatting_rules,
                "field_type": config.field_type,
                "is_required": config.is_required,
                "help_text": config.help_text,
                "placeholder": config.placeholder,
                "business_rules": config.business_rules
            }
            for config in field_configs
        ]

    except Exception as e:
        logger.error(f"Failed to get field configuration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get field configuration: {str(e)}"
        )


# Field Localization CRUD Endpoints

class FieldLocalizationRequest(BaseModel):
    """Request model for field localization."""
    entity_name: str = Field(..., description="Entity name")
    field_name: str = Field(..., description="Field name")
    country_code: str = Field(..., description="Country code")
    state_province: Optional[str] = Field(None, description="State/Province code")
    display_name: str = Field(..., description="Localized display name")
    validation_pattern: Optional[str] = Field(None, description="Validation pattern")
    formatting_rules: Optional[Dict[str, Any]] = Field(None, description="Formatting rules")
    field_type: Optional[str] = Field(None, description="Field type override")
    is_required: Optional[bool] = Field(None, description="Required field override")
    help_text: Optional[str] = Field(None, description="Localized help text")
    placeholder: Optional[str] = Field(None, description="Localized placeholder")
    business_rules: Optional[Dict[str, Any]] = Field(None, description="Business rules")


@router.post("/field-localization", response_model=Dict[str, Any])
async def create_field_localization(
    localization_request: FieldLocalizationRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Create new field localization configuration."""
    
    # Check permissions
    user_permissions = set(current_user.get("permissions", []))
    if not check_user_permissions(user_permissions, [
        "system.field_localization.create"
    ]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create field localization"
        )
    
    try:
        # Create new localization config
        field_config = FieldLocalizationConfig(
            entity_name=localization_request.entity_name,
            field_name=localization_request.field_name,
            country_code=localization_request.country_code,
            state_province=localization_request.state_province,
            display_name=localization_request.display_name,
            validation_pattern=localization_request.validation_pattern,
            formatting_rules=localization_request.formatting_rules,
            field_type=localization_request.field_type,
            is_required=localization_request.is_required,
            help_text=localization_request.help_text,
            placeholder=localization_request.placeholder,
            business_rules=localization_request.business_rules,
            tenant_id=tenant_context.get("tenant_id"),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(field_config)
        await db.commit()
        await db.refresh(field_config)
        
        return {
            "localization_id": str(field_config.localization_id),
            "message": "Field localization created successfully"
        }
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to create field localization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create field localization: {str(e)}"
        )


@router.put("/field-localization/{localization_id}", response_model=Dict[str, Any])
async def update_field_localization(
    localization_id: UUID,
    localization_request: FieldLocalizationRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Update existing field localization configuration."""
    
    # Check permissions
    user_permissions = set(current_user.get("permissions", []))
    if not check_user_permissions(user_permissions, [
        "system.field_localization.update"
    ]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update field localization"
        )
    
    try:
        from sqlalchemy import select, and_, or_
        
        # Find the existing config
        query = select(FieldLocalizationConfig).where(
            and_(
                FieldLocalizationConfig.localization_id == localization_id,
                or_(
                    FieldLocalizationConfig.tenant_id == tenant_context.get("tenant_id"),
                    FieldLocalizationConfig.tenant_id.is_(None)
                )
            )
        )
        
        result = await db.execute(query)
        field_config = result.scalars().first()
        
        if not field_config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Field localization configuration not found"
            )
        
        # Update the config
        for field, value in localization_request.dict(exclude_unset=True).items():
            setattr(field_config, field, value)
        
        field_config.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(field_config)
        
        return {
            "localization_id": str(field_config.localization_id),
            "message": "Field localization updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update field localization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update field localization: {str(e)}"
        )