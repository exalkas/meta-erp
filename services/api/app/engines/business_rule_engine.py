"""
Business Rule Engine - SAP-Style Configuration Platform

Handles business rule execution, configuration management, and country/industry adaptation.
Supports configurable business logic without code deployment.
"""

import json
import asyncio
from datetime import datetime, date
from typing import Dict, List, Optional, Any, Union
from uuid import UUID
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, text
from sqlalchemy.orm import selectinload

from app.core.logging import get_logger, MetadataLogger
from app.core.exceptions import ValidationException, BusinessRuleException
from app.models.business_config import (
    BusinessConfigMaster,
    BusinessConfigEntry,
    BusinessRuleDefinition,
    BusinessRuleExecution,
    FieldLocalizationConfig,
    ProcessConfigMaster,
)
from app.models.metadata import Tenant

logger = get_logger("business_rule_engine")


@dataclass
class BusinessContext:
    """Context for business rule execution."""
    tenant_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    country_code: Optional[str] = None
    state_province: Optional[str] = None
    industry_code: Optional[str] = None
    vertical_code: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[UUID] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()


@dataclass
class RuleExecutionResult:
    """Result of business rule execution."""
    success: bool
    result_data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    execution_time_ms: Optional[int] = None
    rule_id: Optional[UUID] = None
    alerts: List[str] = None
    
    def __post_init__(self):
        if self.alerts is None:
            self.alerts = []


@dataclass
class ValidationResult:
    """Result of rule validation."""
    is_valid: bool
    errors: List[str] = None
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []
        if self.warnings is None:
            self.warnings = []


class BusinessRuleEngine:
    """
    SAP-style configurable business rule execution engine.
    
    Features:
    - Business rule configuration without code deployment
    - Country/industry-specific rule adaptation
    - Tenant-specific rule overrides
    - Rule execution tracking and performance monitoring
    - Dynamic rule validation and testing
    """

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.metadata_logger = MetadataLogger(logger)

    async def execute_rule(
        self,
        rule_id: UUID,
        input_data: Dict[str, Any],
        context: BusinessContext
    ) -> RuleExecutionResult:
        """
        Execute a business rule with given input data and context.
        
        Args:
            rule_id: ID of the rule to execute
            input_data: Input data for the rule
            context: Business context (tenant, country, etc.)
            
        Returns:
            RuleExecutionResult with success status and result data
        """
        start_time = datetime.utcnow()
        
        try:
            self.metadata_logger.log_metadata_operation(
                operation="execute_business_rule",
                entity_type="BusinessRuleDefinition",
                tenant_id=str(context.tenant_id) if context.tenant_id else None,
                metadata={
                    "rule_id": str(rule_id),
                    "input_keys": list(input_data.keys()),
                    "context": context.__dict__
                }
            )

            # Get rule definition
            rule_def = await self._get_rule_definition(rule_id, context)
            if not rule_def:
                            return RuleExecutionResult(
                success=False,
                message=f"Rule definition not found: {rule_id}",
                rule_id=rule_id
            )

            # Validate input parameters
            validation_result = await self._validate_rule_input(rule_def, input_data)
            if not validation_result.is_valid:
                return RuleExecutionResult(
                    success=False,
                    message=f"Input validation failed: {', '.join(validation_result.errors)}",
                    rule_id=rule_id,
                    alerts=validation_result.warnings
                )

            # Execute rule logic
            result_data = await self._execute_rule_logic(rule_def, input_data, context)
            
            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            # Log execution
            await self._log_rule_execution(
                rule_id=rule_id,
                context=context,
                input_data=input_data,
                output_data=result_data,
                execution_status="SUCCESS",
                execution_time_ms=execution_time
            )

            return RuleExecutionResult(
                success=True,
                result_data=result_data,
                execution_time_ms=execution_time,
                rule_id=rule_id,
                alerts=validation_result.warnings
            )

        except Exception as e:
            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            logger.error(
                "Business rule execution failed",
                rule_id=str(rule_id),
                tenant_id=str(context.tenant_id) if context.tenant_id else None,
                error=str(e),
                exc_info=True
            )
            
            # Log failed execution
            await self._log_rule_execution(
                rule_id=rule_id,
                context=context,
                input_data=input_data,
                execution_status="FAILURE",
                execution_time_ms=execution_time,
                error_message=str(e)
            )

            return RuleExecutionResult(
                success=False,
                message=str(e),
                execution_time_ms=execution_time,
                rule_id=rule_id
            )

    async def get_applicable_rules(
        self,
        category: str,
        context: BusinessContext,
        entity_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all applicable rules for given criteria with context prioritization.
        
        Priority order:
        1. Tenant-specific rules
        2. Country + State/Province specific rules
        3. Country-specific rules
        4. Industry + Vertical specific rules
        5. Industry-specific rules
        6. Global rules
        """
        
        try:
            self.metadata_logger.log_metadata_operation(
                operation="get_applicable_rules",
                entity_type="BusinessRuleDefinition",
                tenant_id=str(context.tenant_id) if context.tenant_id else None,
                metadata={
                    "category": category,
                    "entity_type": entity_type,
                    "context": context.__dict__
                }
            )

            # Build query with context-based prioritization
            query = select(BusinessRuleDefinition).where(
                and_(
                    BusinessRuleDefinition.rule_category == category,
                    BusinessRuleDefinition.is_active == True,
                    or_(
                        BusinessRuleDefinition.tenant_id == context.tenant_id,
                        BusinessRuleDefinition.tenant_id.is_(None)
                    ),
                    or_(
                        BusinessRuleDefinition.country_code == context.country_code,
                        BusinessRuleDefinition.country_code.is_(None)
                    ),
                    or_(
                        BusinessRuleDefinition.industry_code == context.industry_code,
                        BusinessRuleDefinition.industry_code.is_(None)
                    ),
                    or_(
                        BusinessRuleDefinition.vertical_code == context.vertical_code,
                        BusinessRuleDefinition.vertical_code.is_(None)
                    )
                )
            ).order_by(
                # Priority order
                BusinessRuleDefinition.tenant_id.desc().nulls_last(),
                BusinessRuleDefinition.country_code.desc().nulls_last(),
                BusinessRuleDefinition.industry_code.desc().nulls_last(),
                BusinessRuleDefinition.vertical_code.desc().nulls_last(),
                BusinessRuleDefinition.execution_order.asc()
            )

            result = await self.db.execute(query)
            rules = result.scalars().all()

            # Convert to dictionaries with additional metadata
            rule_list = []
            for rule in rules:
                rule_dict = {
                    "rule_id": rule.rule_id,
                    "rule_name": rule.rule_name,
                    "rule_category": rule.rule_category,
                    "rule_type": rule.rule_type,
                    "trigger_conditions": rule.trigger_conditions,
                    "rule_logic": rule.rule_logic,
                    "input_parameters": rule.input_parameters,
                    "output_format": rule.output_format,
                    "execution_order": rule.execution_order,
                    "is_mandatory": rule.is_mandatory,
                    "error_handling": rule.error_handling,
                    "version": rule.version,
                    "context_match_score": self._calculate_context_match_score(rule, context)
                }
                rule_list.append(rule_dict)

            logger.info(
                "Retrieved applicable rules",
                category=category,
                rule_count=len(rule_list),
                tenant_id=str(context.tenant_id) if context.tenant_id else None
            )

            return rule_list

        except Exception as e:
            logger.error(
                "Failed to get applicable rules",
                category=category,
                tenant_id=str(context.tenant_id) if context.tenant_id else None,
                error=str(e),
                exc_info=True
            )
            raise BusinessRuleException(f"Failed to get applicable rules: {str(e)}")

    async def execute_rule_by_name(
        self,
        rule_name: str,
        input_data: Dict[str, Any],
        context: BusinessContext
    ) -> RuleExecutionResult:
        """
        Execute a business rule by name instead of ID.
        
        Args:
            rule_name: Name of the rule to execute
            input_data: Input data for the rule
            context: Business context (tenant, country, etc.)
            
        Returns:
            RuleExecutionResult with success status and result data
        """
        try:
            # Look up rule by name with context prioritization
            query = select(BusinessRuleDefinition).where(
                and_(
                    BusinessRuleDefinition.rule_name == rule_name,
                    BusinessRuleDefinition.is_active == True
                )
            )
            
            # Add context filters for best match
            context_conditions = []
            
            # Tenant-specific rules have highest priority
            if context.tenant_id:
                context_conditions.append(
                    BusinessRuleDefinition.tenant_id == context.tenant_id
                )
            
            # Then country-specific rules
            if context.country_code:
                context_conditions.append(
                    BusinessRuleDefinition.country_code == context.country_code
                )
            
            # Then industry-specific rules
            if context.industry_code:
                context_conditions.append(
                    BusinessRuleDefinition.industry_code == context.industry_code
                )
            
            # Then vertical-specific rules
            if context.vertical_code:
                context_conditions.append(
                    BusinessRuleDefinition.vertical_code == context.vertical_code
                )
            
            # Add priority ordering: most specific first, then global rules
            if context_conditions:
                # First try specific context matches
                context_query = query.where(and_(*context_conditions)).order_by(
                    BusinessRuleDefinition.execution_order.asc()
                )
                
                result = await self.db.execute(context_query)
                rule = result.scalars().first()
                
                # If no specific match, try global rules (where context fields are NULL)
                if not rule:
                    global_query = query.where(
                        and_(
                            BusinessRuleDefinition.tenant_id.is_(None),
                            BusinessRuleDefinition.country_code.is_(None),
                            BusinessRuleDefinition.industry_code.is_(None),
                            BusinessRuleDefinition.vertical_code.is_(None)
                        )
                    ).order_by(BusinessRuleDefinition.execution_order.asc())
                    
                    result = await self.db.execute(global_query)
                    rule = result.scalars().first()
            else:
                # No context filters - get any rule with this name
                result = await self.db.execute(
                    query.order_by(BusinessRuleDefinition.execution_order.asc())
                )
                rule = result.scalars().first()
            
            if not rule:
                return RuleExecutionResult(
                    success=False,
                    message=f"Rule not found: {rule_name}"
                )
            
            # Execute the found rule by ID
            return await self.execute_rule(
                rule_id=rule.rule_id,
                input_data=input_data,
                context=context
            )
            
        except Exception as e:
            logger.error(f"Failed to execute rule by name {rule_name}: {str(e)}")
            return RuleExecutionResult(
                success=False,
                message=f"Failed to execute rule {rule_name}: {str(e)}"
            )

    async def validate_business_rules(
        self,
        entity_name: str,
        data: Dict[str, Any],
        operation: str = "create",
        context: Optional[BusinessContext] = None
    ) -> ValidationResult:
        """
        Validate data against applicable business rules for an entity.
        
        Args:
            entity_name: Name of the entity being validated
            data: Data to validate
            operation: Operation type (create, update, delete)
            context: Business context for rule selection
            
        Returns:
            ValidationResult with validation status and errors
        """
        
        errors = []
        warnings = []
        
        try:
            # Use provided context or create minimal context
            if context is None:
                context = BusinessContext(
                    entity_type=entity_name,
                    timestamp=datetime.utcnow()
                )
            
            # Get applicable validation rules for this entity
            applicable_rules = await self.get_applicable_rules(
                category="VALIDATION",
                context=context,
                entity_type=entity_name
            )
            
            # Execute each validation rule
            for rule in applicable_rules:
                rule_id = rule.get("rule_id")
                if not rule_id:
                    continue
                    
                try:
                    result = await self.execute_rule(
                        rule_id=rule_id,
                        input_data={
                            "entity_name": entity_name,
                            "operation": operation,
                            **data
                        },
                        context=context
                    )
                    
                    if not result.success:
                        errors.append(result.message or f"Validation rule {rule.get('rule_name', rule_id)} failed")
                    
                    if result.alerts:
                        warnings.extend(result.alerts)
                        
                except Exception as e:
                    logger.error(f"Failed to execute validation rule {rule_id}: {str(e)}")
                    errors.append(f"Validation rule execution failed: {str(e)}")
            
            return ValidationResult(
                is_valid=len(errors) == 0,
                errors=errors,
                warnings=warnings
            )
            
        except Exception as e:
            logger.error(f"Business rule validation failed: {str(e)}")
            return ValidationResult(
                is_valid=False,
                errors=[f"Business rule validation failed: {str(e)}"]
            )

    async def validate_rule_logic(
        self,
        rule_definition: Dict[str, Any]
    ) -> ValidationResult:
        """
        Validate rule logic before saving.
        
        Args:
            rule_definition: Rule definition to validate
            
        Returns:
            ValidationResult with validation status and errors
        """
        
        errors = []
        warnings = []

        try:
            # Validate required fields
            required_fields = ["rule_name", "rule_category", "rule_type", "trigger_conditions", "rule_logic"]
            for field in required_fields:
                if not rule_definition.get(field):
                    errors.append(f"Missing required field: {field}")

            # Validate rule category
            valid_categories = ["VALIDATION", "CALCULATION", "WORKFLOW", "NOTIFICATION", "APPROVAL"]
            if rule_definition.get("rule_category") not in valid_categories:
                errors.append(f"Invalid rule category. Must be one of: {', '.join(valid_categories)}")

            # Validate rule type
            valid_types = ["CONDITIONAL", "LOOKUP", "FORMULA", "SCRIPT", "API_CALL"]
            if rule_definition.get("rule_type") not in valid_types:
                errors.append(f"Invalid rule type. Must be one of: {', '.join(valid_types)}")

            # Validate trigger conditions structure
            trigger_conditions = rule_definition.get("trigger_conditions")
            if trigger_conditions:
                if not isinstance(trigger_conditions, dict):
                    errors.append("Trigger conditions must be a JSON object")
                elif not trigger_conditions.get("events") and not trigger_conditions.get("conditions"):
                    errors.append("Trigger conditions must specify either 'events' or 'conditions'")

            # Validate rule logic structure
            rule_logic = rule_definition.get("rule_logic")
            if rule_logic:
                if not isinstance(rule_logic, dict):
                    errors.append("Rule logic must be a JSON object")
                else:
                    # Validate based on rule type
                    rule_type = rule_definition.get("rule_type")
                    if rule_type == "CONDITIONAL" and not rule_logic.get("conditions"):
                        errors.append("Conditional rules must specify 'conditions' in rule logic")
                    elif rule_type == "FORMULA" and not rule_logic.get("formula"):
                        errors.append("Formula rules must specify 'formula' in rule logic")
                    elif rule_type == "LOOKUP" and not rule_logic.get("lookup_table"):
                        errors.append("Lookup rules must specify 'lookup_table' in rule logic")

            # Validate input parameters
            input_parameters = rule_definition.get("input_parameters")
            if input_parameters and not isinstance(input_parameters, dict):
                errors.append("Input parameters must be a JSON object")

            # Validate output format
            output_format = rule_definition.get("output_format")
            if output_format and not isinstance(output_format, dict):
                errors.append("Output format must be a JSON object")

            # Performance validation warnings
            execution_order = rule_definition.get("execution_order", 100)
            if execution_order > 1000:
                warnings.append("Execution order > 1000 may impact performance")

            max_execution_time = rule_definition.get("max_execution_time_ms", 5000)
            if max_execution_time > 30000:
                warnings.append("Execution time > 30 seconds may cause timeouts")

            # Business logic validation
            await self._validate_business_logic_syntax(rule_definition, errors, warnings)

            return ValidationResult(
                is_valid=len(errors) == 0,
                errors=errors,
                warnings=warnings
            )

        except Exception as e:
            logger.error("Rule validation failed", error=str(e), exc_info=True)
            return ValidationResult(
                is_valid=False,
                errors=[f"Validation process failed: {str(e)}"]
            )

    async def _get_rule_definition(
        self,
        rule_id: UUID,
        context: BusinessContext
    ) -> Optional[BusinessRuleDefinition]:
        """Get rule definition with context prioritization."""
        
        query = select(BusinessRuleDefinition).where(
            BusinessRuleDefinition.rule_id == rule_id
        )
        
        result = await self.db.execute(query)
        return result.scalars().first()

    async def _validate_rule_input(
        self,
        rule_def: BusinessRuleDefinition,
        input_data: Dict[str, Any]
    ) -> ValidationResult:
        """Validate input data against rule's input parameters schema."""
        
        errors = []
        warnings = []

        if rule_def.input_parameters:
            required_params = rule_def.input_parameters.get("required", [])
            for param in required_params:
                if param not in input_data:
                    errors.append(f"Missing required parameter: {param}")

            # Type validation if schema is provided
            param_types = rule_def.input_parameters.get("types", {})
            for param, expected_type in param_types.items():
                if param in input_data:
                    actual_value = input_data[param]
                    if not self._validate_parameter_type(actual_value, expected_type):
                        errors.append(f"Parameter '{param}' type mismatch. Expected {expected_type}")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )

    async def _execute_rule_logic(
        self,
        rule_def: BusinessRuleDefinition,
        input_data: Dict[str, Any],
        context: BusinessContext
    ) -> Dict[str, Any]:
        """Execute the actual rule logic based on rule type."""
        
        rule_type = rule_def.rule_type
        rule_logic = rule_def.rule_logic

        if rule_type == "CONDITIONAL":
            return await self._execute_conditional_rule(rule_logic, input_data, context)
        elif rule_type == "FORMULA":
            return await self._execute_formula_rule(rule_logic, input_data, context)
        elif rule_type == "LOOKUP":
            return await self._execute_lookup_rule(rule_logic, input_data, context)
        elif rule_type == "SCRIPT":
            return await self._execute_script_rule(rule_logic, input_data, context)
        elif rule_type == "API_CALL":
            return await self._execute_api_call_rule(rule_logic, input_data, context)
        else:
            raise BusinessRuleException(f"Unsupported rule type: {rule_type}")

    async def _execute_conditional_rule(
        self,
        rule_logic: Dict[str, Any],
        input_data: Dict[str, Any],
        context: BusinessContext
    ) -> Dict[str, Any]:
        """Execute conditional (if-then-else) rule logic."""
        
        conditions = rule_logic.get("conditions", [])
        default_result = rule_logic.get("default_result", {"result": False})

        for condition in conditions:
            if await self._evaluate_condition(condition.get("if"), input_data, context):
                return condition.get("then", {"result": True})

        return default_result

    async def _execute_formula_rule(
        self,
        rule_logic: Dict[str, Any],
        input_data: Dict[str, Any],
        context: BusinessContext
    ) -> Dict[str, Any]:
        """Execute formula-based rule logic."""
        
        formula = rule_logic.get("formula", "")
        variables = rule_logic.get("variables", {})

        # Simple formula evaluation (extend as needed)
        try:
            # Replace variables in formula
            for var_name, var_path in variables.items():
                value = self._get_nested_value(input_data, var_path)
                formula = formula.replace(f"{{{var_name}}}", str(value))

            # Safe arithmetic evaluation (replaces unsafe eval)
            result = self._safe_eval_formula(formula)
            
            return {"result": result, "formula": formula}

        except Exception as e:
            raise BusinessRuleException(f"Formula evaluation failed: {str(e)}")

    async def _execute_lookup_rule(
        self,
        rule_logic: Dict[str, Any],
        input_data: Dict[str, Any],
        context: BusinessContext
    ) -> Dict[str, Any]:
        """Execute lookup-based rule logic."""
        
        lookup_table = rule_logic.get("lookup_table", "")
        lookup_key = rule_logic.get("lookup_key", "")
        lookup_value = self._get_nested_value(input_data, lookup_key)

        # Implement lookup logic (could be database lookup, static table, etc.)
        # This is a simplified implementation
        lookup_data = rule_logic.get("lookup_data", {})
        result = lookup_data.get(str(lookup_value), rule_logic.get("default_value"))

        return {"result": result, "lookup_key": lookup_key, "lookup_value": lookup_value}

    async def _execute_script_rule(
        self,
        rule_logic: Dict[str, Any],
        input_data: Dict[str, Any],
        context: BusinessContext
    ) -> Dict[str, Any]:
        """Execute script-based rule logic (sandboxed)."""
        
        # Placeholder for script execution
        # In production, implement proper sandboxing
        script = rule_logic.get("script", "")
        
        # This would need a proper sandboxed execution environment
        return {"result": "Script execution not implemented", "script": script}

    async def _execute_api_call_rule(
        self,
        rule_logic: Dict[str, Any],
        input_data: Dict[str, Any],
        context: BusinessContext
    ) -> Dict[str, Any]:
        """Execute API call-based rule logic."""
        
        # Placeholder for API call execution
        api_endpoint = rule_logic.get("endpoint", "")
        
        # This would implement actual HTTP calls with proper error handling
        return {"result": "API call execution not implemented", "endpoint": api_endpoint}

    async def _evaluate_condition(
        self,
        condition: Dict[str, Any],
        input_data: Dict[str, Any],
        context: BusinessContext
    ) -> bool:
        """Evaluate a single condition."""
        
        if not condition:
            return False

        operator = condition.get("operator", "")
        field = condition.get("field", "")
        value = condition.get("value")

        field_value = self._get_nested_value(input_data, field)

        if operator == "equals":
            return field_value == value
        elif operator == "not_equals":
            return field_value != value
        elif operator == "greater_than":
            return field_value > value
        elif operator == "less_than":
            return field_value < value
        elif operator == "contains":
            return value in str(field_value)
        elif operator == "starts_with":
            return str(field_value).startswith(str(value))
        elif operator == "is_empty":
            return not field_value
        elif operator == "is_not_empty":
            return bool(field_value)
        else:
            return False

    def _get_nested_value(self, data: Dict[str, Any], path: str) -> Any:
        """Get nested value from data using dot notation."""
        
        keys = path.split(".")
        value = data
        
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return None
                
        return value

    def _safe_eval_formula(self, formula: str) -> float:
        """
        Safely evaluate mathematical formulas without using eval().
        
        Args:
            formula: Mathematical formula string
            
        Returns:
            Evaluated result
            
        Raises:
            BusinessRuleException: If formula is invalid or unsafe
        """
        import re
        
        # Remove whitespace
        formula = formula.strip()
        
        # Only allow numbers, basic operators, parentheses, and decimal points
        allowed_chars = r'^[0-9+\-*/().\s]+$'
        if not re.match(allowed_chars, formula):
            raise BusinessRuleException(f"Invalid characters in formula: {formula}")
        
        # Very simple formula evaluation - just basic arithmetic
        # In production, use a proper safe expression evaluator like `simpleeval`
        try:
            # Replace common patterns safely
            formula = formula.replace(" ", "")
            
            # Basic validation - no function calls, imports, etc.
            dangerous_patterns = ['import', 'exec', 'eval', '__', 'lambda', 'def', 'class']
            for pattern in dangerous_patterns:
                if pattern in formula.lower():
                    raise BusinessRuleException(f"Forbidden pattern in formula: {pattern}")
            
            # For now, return a simple calculation
            # This is a simplified implementation - use a proper parser in production
            if '+' in formula:
                parts = formula.split('+')
                return sum(float(part.strip()) for part in parts)
            elif '-' in formula and formula.count('-') == 1 and not formula.startswith('-'):
                parts = formula.split('-')
                return float(parts[0].strip()) - float(parts[1].strip())
            elif '*' in formula:
                parts = formula.split('*')
                result = 1.0
                for part in parts:
                    result *= float(part.strip())
                return result
            elif '/' in formula:
                parts = formula.split('/')
                result = float(parts[0].strip())
                for part in parts[1:]:
                    divisor = float(part.strip())
                    if divisor == 0:
                        raise BusinessRuleException("Division by zero")
                    result /= divisor
                return result
            else:
                # Simple number
                return float(formula)
                
        except ValueError as e:
            raise BusinessRuleException(f"Invalid number in formula: {str(e)}")
        except Exception as e:
            raise BusinessRuleException(f"Formula evaluation failed: {str(e)}")

    def _validate_parameter_type(self, value: Any, expected_type: str) -> bool:
        """Validate parameter type."""
        
        type_mapping = {
            "string": str,
            "integer": int,
            "number": (int, float),
            "boolean": bool,
            "array": list,
            "object": dict
        }
        
        expected_python_type = type_mapping.get(expected_type)
        if expected_python_type:
            return isinstance(value, expected_python_type)
        
        return True  # Unknown type, allow it

    async def _validate_business_logic_syntax(
        self,
        rule_definition: Dict[str, Any],
        errors: List[str],
        warnings: List[str]
    ):
        """Validate business logic syntax and structure."""
        
        rule_logic = rule_definition.get("rule_logic", {})
        rule_type = rule_definition.get("rule_type", "")

        if rule_type == "CONDITIONAL":
            conditions = rule_logic.get("conditions", [])
            if not isinstance(conditions, list):
                errors.append("Conditional rule logic 'conditions' must be an array")
            else:
                for i, condition in enumerate(conditions):
                    if not isinstance(condition, dict):
                        errors.append(f"Condition {i} must be an object")
                    elif not condition.get("if") or not condition.get("then"):
                        errors.append(f"Condition {i} must have 'if' and 'then' properties")

        elif rule_type == "FORMULA":
            formula = rule_logic.get("formula", "")
            if not formula:
                errors.append("Formula rule must specify a formula")
            elif not isinstance(formula, str):
                errors.append("Formula must be a string")

    def _calculate_context_match_score(
        self,
        rule: BusinessRuleDefinition,
        context: BusinessContext
    ) -> int:
        """Calculate how well a rule matches the given context."""
        
        score = 0
        
        if rule.tenant_id == context.tenant_id:
            score += 1000  # Highest priority
        
        if rule.country_code == context.country_code:
            score += 100
            
        if rule.industry_code == context.industry_code:
            score += 50
            
        if rule.vertical_code == context.vertical_code:
            score += 25

        return score

    async def _log_rule_execution(
        self,
        rule_id: UUID,
        context: BusinessContext,
        input_data: Dict[str, Any],
        execution_status: str,
        execution_time_ms: int,
        output_data: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None
    ):
        """Log rule execution for audit and performance monitoring."""
        
        try:
            execution_log = BusinessRuleExecution(
                rule_id=rule_id,
                tenant_id=context.tenant_id,
                user_id=context.user_id,
                entity_type=context.entity_type,
                entity_id=context.entity_id,
                input_data=input_data,
                output_data=output_data,
                execution_status=execution_status,
                error_message=error_message,
                execution_time_ms=execution_time_ms,
                executed_at=context.timestamp
            )
            
            self.db.add(execution_log)
            await self.db.flush()  # Don't commit - let caller manage transaction boundaries

        except Exception as e:
            logger.error(
                "Failed to log rule execution",
                rule_id=str(rule_id),
                error=str(e),
                exc_info=True
            )
            # Don't re-raise - logging failure shouldn't fail the rule execution


class ConfigurationEngine:
    """
    Manage SAP-style business configuration entries.
    
    Features:
    - Configuration value management with context
    - Country/industry/tenant-specific overrides
    - Configuration change tracking
    - Configuration validation and deployment
    """

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.metadata_logger = MetadataLogger(logger)

    async def get_config_value(
        self,
        domain: str,
        key: str,
        context: BusinessContext,
        fallback: Any = None
    ) -> Any:
        """
        Get configuration value with context-based prioritization.
        
        Priority order:
        1. Tenant-specific configuration
        2. Country + State/Province specific
        3. Country-specific
        4. Industry + Vertical specific
        5. Industry-specific
        6. Global configuration
        7. Fallback value
        """
        
        try:
            self.metadata_logger.log_metadata_operation(
                operation="get_config_value",
                entity_type="BusinessConfigEntry",
                tenant_id=str(context.tenant_id) if context.tenant_id else None,
                metadata={
                    "domain": domain,
                    "key": key,
                    "context": context.__dict__
                }
            )

            # Query with context-based prioritization
            query = select(BusinessConfigEntry).where(
                and_(
                    BusinessConfigEntry.config_domain == domain,
                    BusinessConfigEntry.config_key == key,
                    BusinessConfigEntry.is_active == True,
                    or_(
                        BusinessConfigEntry.effective_from.is_(None),
                        BusinessConfigEntry.effective_from <= date.today()
                    ),
                    or_(
                        BusinessConfigEntry.effective_to.is_(None),
                        BusinessConfigEntry.effective_to >= date.today()
                    ),
                    or_(
                        BusinessConfigEntry.tenant_id == context.tenant_id,
                        BusinessConfigEntry.tenant_id.is_(None)
                    ),
                    or_(
                        BusinessConfigEntry.country_code == context.country_code,
                        BusinessConfigEntry.country_code.is_(None)
                    ),
                    or_(
                        and_(
                            BusinessConfigEntry.country_code == context.country_code,
                            BusinessConfigEntry.state_province == context.state_province
                        ),
                        BusinessConfigEntry.state_province.is_(None)
                    ),
                    or_(
                        BusinessConfigEntry.industry_code == context.industry_code,
                        BusinessConfigEntry.industry_code.is_(None)
                    ),
                    or_(
                        BusinessConfigEntry.vertical_code == context.vertical_code,
                        BusinessConfigEntry.vertical_code.is_(None)
                    )
                )
            ).order_by(
                # Priority order
                BusinessConfigEntry.tenant_id.desc().nulls_last(),
                BusinessConfigEntry.state_province.desc().nulls_last(),
                BusinessConfigEntry.country_code.desc().nulls_last(),
                BusinessConfigEntry.vertical_code.desc().nulls_last(),
                BusinessConfigEntry.industry_code.desc().nulls_last()
            )

            result = await self.db.execute(query)
            config_entry = result.scalars().first()

            if config_entry:
                logger.debug(
                    "Configuration value found",
                    domain=domain,
                    key=key,
                    tenant_id=str(context.tenant_id) if context.tenant_id else None,
                    config_context={
                        "tenant_id": str(config_entry.tenant_id) if config_entry.tenant_id else None,
                        "country_code": config_entry.country_code,
                        "industry_code": config_entry.industry_code,
                        "vertical_code": config_entry.vertical_code
                    }
                )
                return config_entry.config_values

            logger.debug(
                "Configuration value not found, using fallback",
                domain=domain,
                key=key,
                fallback=fallback
            )
            return fallback

        except Exception as e:
            logger.error(
                "Failed to get configuration value",
                domain=domain,
                key=key,
                error=str(e),
                exc_info=True
            )
            return fallback

    async def update_config(
        self,
        domain: str,
        key: str,
        value: Any,
        user_id: UUID,
        context: BusinessContext,
        effective_from: Optional[date] = None,
        effective_to: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Update configuration with change tracking.
        
        Args:
            domain: Configuration domain
            key: Configuration key
            value: Configuration value
            user_id: User making the change
            context: Business context for the configuration
            effective_from: When the configuration becomes effective
            effective_to: When the configuration expires
            
        Returns:
            Dictionary with update result and change tracking info
        """
        
        try:
            self.metadata_logger.log_metadata_operation(
                operation="update_config",
                entity_type="BusinessConfigEntry",
                tenant_id=str(context.tenant_id) if context.tenant_id else None,
                metadata={
                    "domain": domain,
                    "key": key,
                    "context": context.__dict__
                }
            )

            # Check if configuration entry exists
            existing_query = select(BusinessConfigEntry).where(
                and_(
                    BusinessConfigEntry.config_domain == domain,
                    BusinessConfigEntry.config_key == key,
                    BusinessConfigEntry.tenant_id == context.tenant_id,
                    BusinessConfigEntry.country_code == context.country_code,
                    BusinessConfigEntry.state_province == context.state_province,
                    BusinessConfigEntry.industry_code == context.industry_code,
                    BusinessConfigEntry.vertical_code == context.vertical_code
                )
            )
            
            result = await self.db.execute(existing_query)
            existing_entry = result.scalars().first()

            if existing_entry:
                # Update existing entry
                existing_entry.config_values = value
                existing_entry.effective_from = effective_from
                existing_entry.effective_to = effective_to
                existing_entry.change_user_id = user_id
                existing_entry.change_timestamp = datetime.utcnow()
                existing_entry.updated_at = datetime.utcnow()
                
                operation = "updated"
                entry_id = existing_entry.entry_id
            else:
                # Create new entry
                new_entry = BusinessConfigEntry(
                    config_domain=domain,
                    config_key=key,
                    config_values=value,
                    country_code=context.country_code,
                    state_province=context.state_province,
                    industry_code=context.industry_code,
                    vertical_code=context.vertical_code,
                    tenant_id=context.tenant_id,
                    effective_from=effective_from,
                    effective_to=effective_to,
                    change_user_id=user_id,
                    change_timestamp=datetime.utcnow()
                )
                
                self.db.add(new_entry)
                operation = "created"
                entry_id = new_entry.entry_id

            await self.db.flush()  # Don't commit - let caller manage transaction boundaries

            logger.info(
                f"Configuration {operation}",
                domain=domain,
                key=key,
                entry_id=str(entry_id),
                user_id=str(user_id),
                tenant_id=str(context.tenant_id) if context.tenant_id else None
            )

            return {
                "success": True,
                "operation": operation,
                "entry_id": str(entry_id),
                "effective_from": effective_from.isoformat() if effective_from else None,
                "effective_to": effective_to.isoformat() if effective_to else None,
                "change_timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            await self.db.rollback()
            logger.error(
                "Failed to update configuration",
                domain=domain,
                key=key,
                error=str(e),
                exc_info=True
            )
            raise BusinessRuleException(f"Failed to update configuration: {str(e)}")


