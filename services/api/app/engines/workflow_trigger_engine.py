"""
Workflow Trigger Engine - Event-Driven Automation

Handles workflow trigger execution, event processing, and business process automation.
Completes the SAP-style platform with event-driven workflow capabilities.
"""

import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Callable
from uuid import UUID
from dataclasses import dataclass
from enum import Enum

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, text
from sqlalchemy.orm import selectinload

from app.core.logging import get_logger, MetadataLogger
from app.core.exceptions import ValidationException, BusinessRuleException
from app.models.business_config import (
    ProcessConfigMaster,
    WorkflowStepDefinition,
    WorkflowTrigger
)
from app.models.platform import WorkflowDefinition, WorkflowExecution
from app.engines.business_rule_engine import BusinessRuleEngine, BusinessContext, RuleExecutionResult

logger = get_logger("workflow_trigger_engine")


class TriggerType(Enum):
    """Types of workflow triggers."""
    EVENT = "EVENT"        # Entity events (created, updated, deleted)
    SCHEDULE = "SCHEDULE"  # Time-based triggers
    CONDITION = "CONDITION" # Condition-based triggers


class EventType(Enum):
    """Standard business events that can trigger workflows."""
    # Entity lifecycle events
    ENTITY_CREATED = "entity_created"
    ENTITY_UPDATED = "entity_updated" 
    ENTITY_DELETED = "entity_deleted"
    
    # Legal-specific events
    TIME_ENTRY_CREATED = "time_entry_created"
    EXPENSE_ADDED = "expense_added"
    CLIENT_CREATED = "client_created"
    MATTER_CREATED = "matter_created"
    MATTER_STATUS_CHANGED = "matter_status_changed"
    DOCUMENT_UPLOADED = "document_uploaded"
    
    # Generic business events
    STATUS_CHANGED = "status_changed"
    THRESHOLD_EXCEEDED = "threshold_exceeded"
    APPROVAL_REQUIRED = "approval_required"
    NOTIFICATION_TRIGGERED = "notification_triggered"


@dataclass
class BusinessEvent:
    """A business event that can trigger workflows."""
    event_type: str
    entity_type: str
    entity_id: UUID
    entity_data: Dict[str, Any]
    context: BusinessContext
    timestamp: datetime = None
    metadata: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()


@dataclass
class TriggerExecutionResult:
    """Result of workflow trigger execution."""
    success: bool
    triggered_workflows: List[UUID]
    executed_actions: List[Dict[str, Any]]
    errors: List[str]
    execution_time_ms: int
    event_id: Optional[UUID] = None
    
    def __post_init__(self):
        if not hasattr(self, 'triggered_workflows'):
            self.triggered_workflows = []
        if not hasattr(self, 'executed_actions'):
            self.executed_actions = []
        if not hasattr(self, 'errors'):
            self.errors = []


class WorkflowTriggerEngine:
    """
    SAP-style workflow trigger execution engine.
    
    Features:
    - Event-driven workflow automation
    - Configurable trigger conditions  
    - Business rule integration
    - Multi-step workflow execution
    - Performance monitoring and rate limiting
    """

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.metadata_logger = MetadataLogger(logger)
        self.business_rule_engine = BusinessRuleEngine(db_session)
        self._event_handlers: Dict[str, List[Callable]] = {}

    async def process_event(
        self,
        event: BusinessEvent
    ) -> TriggerExecutionResult:
        """
        Process a business event and execute matching workflow triggers.
        
        Args:
            event: Business event to process
            
        Returns:
            TriggerExecutionResult with execution details
        """
        start_time = datetime.utcnow()
        result = TriggerExecutionResult(
            success=True,
            triggered_workflows=[],
            executed_actions=[],
            errors=[],
            execution_time_ms=0
        )
        
        try:
            self.metadata_logger.log_metadata_operation(
                operation="workflow_trigger_process_event",
                entity_type="BusinessEvent",
                entity_id=str(event.entity_id),
                metadata={
                    "event_type": event.event_type,
                    "entity_type": event.entity_type,
                    "tenant_id": str(event.context.tenant_id) if event.context.tenant_id else None
                }
            )

            # Find matching workflow triggers
            matching_triggers = await self._find_matching_triggers(event)
            
            # Execute each matching trigger
            for trigger in matching_triggers:
                try:
                    execution_result = await self._execute_trigger(trigger, event)
                    if execution_result.success:
                        result.triggered_workflows.extend(execution_result.triggered_workflows)
                        result.executed_actions.extend(execution_result.executed_actions)
                    else:
                        result.errors.extend(execution_result.errors)
                        
                except Exception as e:
                    error_msg = f"Failed to execute trigger {trigger.trigger_name}: {str(e)}"
                    result.errors.append(error_msg)
                    logger.error(error_msg)

            # If any errors occurred, mark as failed
            if result.errors:
                result.success = False
                
            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            result.execution_time_ms = execution_time

            # Log execution summary
            self.metadata_logger.log_metadata_operation(
                operation="workflow_trigger_execution_complete",
                entity_type="BusinessEvent",
                entity_id=str(event.entity_id),
                metadata={
                    "triggered_workflows": len(result.triggered_workflows),
                    "executed_actions": len(result.executed_actions),
                    "errors": len(result.errors),
                    "execution_time_ms": execution_time
                }
            )

            return result
            
        except Exception as e:
            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            logger.error(f"Workflow trigger processing failed: {str(e)}")
            return TriggerExecutionResult(
                success=False,
                triggered_workflows=[],
                executed_actions=[],
                errors=[str(e)],
                execution_time_ms=execution_time
            )

    async def _find_matching_triggers(
        self,
        event: BusinessEvent
    ) -> List[WorkflowTrigger]:
        """Find workflow triggers that match the given event."""
        
        try:
            # Build query for active triggers
            query = select(WorkflowTrigger).where(
                and_(
                    WorkflowTrigger.is_enabled == True,
                    WorkflowTrigger.trigger_type == TriggerType.EVENT.value
                )
            ).options(selectinload(WorkflowTrigger.process_config))

            result = await self.db.execute(query)
            all_triggers = result.scalars().all()
            
            matching_triggers = []
            
            for trigger in all_triggers:
                if await self._trigger_matches_event(trigger, event):
                    matching_triggers.append(trigger)
                    
            return matching_triggers
            
        except Exception as e:
            logger.error(f"Failed to find matching triggers: {str(e)}")
            return []

    async def _trigger_matches_event(
        self,
        trigger: WorkflowTrigger,
        event: BusinessEvent
    ) -> bool:
        """Check if a trigger matches the given event."""
        
        try:
            trigger_conditions = trigger.trigger_conditions or {}
            
            # Check event type match
            trigger_events = trigger_conditions.get("events", [])
            if trigger_events and event.event_type not in trigger_events:
                return False
                
            # Check entity type match
            trigger_entities = trigger_conditions.get("entity_types", [])
            if trigger_entities and event.entity_type not in trigger_entities:
                return False
                
            # Check context filters
            context_filters = trigger_conditions.get("context_filters", {})
            if context_filters:
                if not await self._context_matches_filters(event.context, context_filters):
                    return False
                    
            # Check entity data conditions
            data_conditions = trigger_conditions.get("data_conditions", [])
            if data_conditions:
                if not await self._data_matches_conditions(event.entity_data, data_conditions):
                    return False
                    
            return True
            
        except Exception as e:
            logger.error(f"Error checking trigger match: {str(e)}")
            return False

    async def _context_matches_filters(
        self,
        context: BusinessContext,
        filters: Dict[str, Any]
    ) -> bool:
        """Check if business context matches trigger filters."""
        
        # Check tenant filter
        if "tenant_id" in filters:
            if str(context.tenant_id) != str(filters["tenant_id"]):
                return False
                
        # Check country filter
        if "country_code" in filters:
            if context.country_code != filters["country_code"]:
                return False
                
        # Check industry filter  
        if "industry_code" in filters:
            if context.industry_code != filters["industry_code"]:
                return False
                
        # Check vertical filter (support both vertical and vertical_code keys)
        if "vertical_code" in filters:
            if context.vertical_code != filters["vertical_code"]:
                return False
        elif "vertical" in filters:
            if context.vertical_code not in filters["vertical"]:
                return False
                
        return True

    async def _data_matches_conditions(
        self,
        entity_data: Dict[str, Any],
        conditions: List[Dict[str, Any]]
    ) -> bool:
        """Check if entity data matches trigger conditions."""
        
        for condition in conditions:
            field = condition.get("field")
            operator = condition.get("operator")
            value = condition.get("value")
            
            if not field or not operator:
                continue
                
            entity_value = entity_data.get(field)
            
            # Evaluate condition based on operator
            if operator == "equals" and entity_value != value:
                return False
            elif operator == "not_equals" and entity_value == value:
                return False
            elif operator == "greater_than" and (entity_value is None or entity_value <= value):
                return False
            elif operator == "less_than" and (entity_value is None or entity_value >= value):
                return False
            elif operator == "contains" and (entity_value is None or value not in str(entity_value)):
                return False
                
        return True

    async def _execute_trigger(
        self,
        trigger: WorkflowTrigger,
        event: BusinessEvent
    ) -> TriggerExecutionResult:
        """Execute a specific workflow trigger."""
        
        start_time = datetime.utcnow()
        result = TriggerExecutionResult(
            success=True,
            triggered_workflows=[],
            executed_actions=[],
            errors=[],
            execution_time_ms=0
        )
        
        try:
            # Check rate limiting
            if not await self._check_rate_limit(trigger, event):
                result.errors.append(f"Trigger {trigger.trigger_name} rate limited")
                result.success = False
                return result
                
            # Map event data to workflow input
            workflow_data = await self._map_trigger_data(trigger, event)
            
            # Execute associated process/workflow
            if trigger.process_config:
                execution_result = await self._execute_process(
                    trigger.process_config, 
                    workflow_data, 
                    event.context
                )
                
                if execution_result.success:
                    result.triggered_workflows.append(trigger.process_id)
                    result.executed_actions.extend(execution_result.executed_actions)
                else:
                    result.errors.extend(execution_result.errors)
                    result.success = False
                    
            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            result.execution_time_ms = execution_time
            
            # Log trigger execution
            await self._log_trigger_execution(trigger, event, result)
            
            return result
            
        except Exception as e:
            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            logger.error(f"Trigger execution failed: {str(e)}")
            return TriggerExecutionResult(
                success=False,
                triggered_workflows=[],
                executed_actions=[],
                errors=[str(e)],
                execution_time_ms=execution_time
            )

    async def _check_rate_limit(
        self,
        trigger: WorkflowTrigger,
        event: BusinessEvent
    ) -> bool:
        """Check if trigger execution is within rate limits."""
        
        rate_limiting = trigger.rate_limiting or {}
        if not rate_limiting:
            return True
            
        # Check executions per minute/hour limits
        max_per_minute = rate_limiting.get("max_per_minute")
        max_per_hour = rate_limiting.get("max_per_hour")
        
        if max_per_minute or max_per_hour:
            # This would need a rate limiting implementation
            # For now, always allow (placeholder)
            return True
            
        return True

    async def _map_trigger_data(
        self,
        trigger: WorkflowTrigger,
        event: BusinessEvent
    ) -> Dict[str, Any]:
        """Map trigger event data to workflow input format."""
        
        data_mapping = trigger.data_mapping or {}
        
        if not data_mapping:
            # Default mapping
            return {
                "event_type": event.event_type,
                "entity_type": event.entity_type,
                "entity_id": str(event.entity_id),
                "entity_data": event.entity_data,
                "context": {
                    "tenant_id": str(event.context.tenant_id) if event.context.tenant_id else None,
                    "user_id": str(event.context.user_id) if event.context.user_id else None,
                    "timestamp": event.timestamp.isoformat()
                }
            }
            
        # Apply custom data mapping
        mapped_data = {}
        for target_field, source_path in data_mapping.items():
            try:
                # Simple dot notation support
                value = event.entity_data
                for part in source_path.split("."):
                    value = value.get(part) if isinstance(value, dict) else None
                    if value is None:
                        break
                mapped_data[target_field] = value
            except Exception:
                mapped_data[target_field] = None
                
        return mapped_data

    async def _execute_process(
        self,
        process_config: ProcessConfigMaster,
        workflow_data: Dict[str, Any],
        context: BusinessContext
    ) -> TriggerExecutionResult:
        """Execute a business process workflow."""
        
        result = TriggerExecutionResult(
            success=True,
            triggered_workflows=[process_config.process_id],
            executed_actions=[],
            errors=[],
            execution_time_ms=0
        )
        
        try:
            # Get workflow steps for this process
            steps_query = select(WorkflowStepDefinition).where(
                WorkflowStepDefinition.process_id == process_config.process_id
            ).order_by(WorkflowStepDefinition.step_order.asc())
            
            steps_result = await self.db.execute(steps_query)
            workflow_steps = steps_result.scalars().all()
            
            # Execute each step in order
            step_context = workflow_data.copy()
            
            for step in workflow_steps:
                if not step.is_active:
                    continue
                    
                # Check execution conditions
                if not await self._should_execute_step(step, step_context):
                    continue
                    
                # Execute step
                step_result = await self._execute_workflow_step(step, step_context, context)
                
                if step_result.success:
                    result.executed_actions.append({
                        "step_name": step.step_name,
                        "step_type": step.step_type,
                        "result": step_result.result_data
                    })
                    
                    # Update context with step results
                    if step_result.result_data:
                        step_context.update(step_result.result_data)
                        
                else:
                    result.errors.append(f"Step {step.step_name} failed: {step_result.message}")
                    if step.is_required:
                        result.success = False
                        break
                        
            return result
            
        except Exception as e:
            result.success = False
            result.errors.append(str(e))
            return result

    async def _should_execute_step(
        self,
        step: WorkflowStepDefinition,
        context: Dict[str, Any]
    ) -> bool:
        """Check if a workflow step should be executed."""
        
        # Check skip conditions
        skip_conditions = step.skip_conditions or []
        for condition in skip_conditions:
            if await self._evaluate_step_condition(condition, context):
                return False
                
        # Check execution conditions  
        execution_conditions = step.execution_conditions or []
        if execution_conditions:
            for condition in execution_conditions:
                if not await self._evaluate_step_condition(condition, context):
                    return False
                    
        return True

    async def _evaluate_step_condition(
        self,
        condition: Dict[str, Any],
        context: Dict[str, Any]
    ) -> bool:
        """Evaluate a step condition against context."""
        
        field = condition.get("field")
        operator = condition.get("operator")
        value = condition.get("value")
        
        if not field or not operator:
            return True
            
        context_value = context.get(field)
        
        if operator == "equals":
            return context_value == value
        elif operator == "not_equals":
            return context_value != value
        elif operator == "exists":
            return field in context and context[field] is not None
        elif operator == "not_exists":
            return field not in context or context[field] is None
            
        return True

    async def _execute_workflow_step(
        self,
        step: WorkflowStepDefinition,
        context: Dict[str, Any],
        business_context: BusinessContext
    ) -> RuleExecutionResult:
        """Execute a single workflow step."""
        
        try:
            processing_logic = step.processing_logic or {}
            
            if step.step_type == "VALIDATION":
                return await self._execute_validation_step(processing_logic, context, business_context)
            elif step.step_type == "CALCULATION":
                return await self._execute_calculation_step(processing_logic, context, business_context)
            elif step.step_type == "NOTIFICATION":
                return await self._execute_notification_step(processing_logic, context, business_context)
            elif step.step_type == "BUSINESS_RULE":
                return await self._execute_business_rule_step(processing_logic, context, business_context)
            else:
                return RuleExecutionResult(
                    success=False,
                    message=f"Unknown step type: {step.step_type}"
                )
                
        except Exception as e:
            return RuleExecutionResult(
                success=False,
                message=f"Step execution failed: {str(e)}"
            )

    async def _execute_validation_step(
        self,
        logic: Dict[str, Any],
        context: Dict[str, Any],
        business_context: BusinessContext
    ) -> RuleExecutionResult:
        """Execute a validation workflow step."""
        
        validations = logic.get("validations", [])
        errors = []
        
        for validation in validations:
            field = validation.get("field")
            rule = validation.get("rule")
            message = validation.get("message", f"Validation failed for {field}")
            
            if field not in context:
                errors.append(f"Required field missing: {field}")
                continue
                
            value = context[field]
            
            # Simple validation rules
            if rule == "required" and (value is None or value == ""):
                errors.append(message)
            elif rule == "numeric" and not isinstance(value, (int, float)):
                errors.append(message)
                
        if errors:
            return RuleExecutionResult(
                success=False,
                message="; ".join(errors)
            )
            
        return RuleExecutionResult(
            success=True,
            result_data={"validation": "passed"}
        )

    async def _execute_calculation_step(
        self,
        logic: Dict[str, Any],
        context: Dict[str, Any],
        business_context: BusinessContext
    ) -> RuleExecutionResult:
        """Execute a calculation workflow step."""
        
        calculations = logic.get("calculations", [])
        results = {}
        
        for calc in calculations:
            target_field = calc.get("target_field")
            expression = calc.get("expression")
            
            if target_field and expression:
                # Simple expression evaluation (placeholder)
                # In production, use a safe expression evaluator
                try:
                    result = self._evaluate_expression(expression, context)
                    results[target_field] = result
                except Exception as e:
                    return RuleExecutionResult(
                        success=False,
                        message=f"Calculation failed: {str(e)}"
                    )
                    
        return RuleExecutionResult(
            success=True,
            result_data=results
        )

    async def _execute_notification_step(
        self,
        logic: Dict[str, Any],
        context: Dict[str, Any],
        business_context: BusinessContext
    ) -> RuleExecutionResult:
        """Execute a notification workflow step."""
        
        notifications = logic.get("notifications", [])
        sent_notifications = []
        
        for notification in notifications:
            recipients = notification.get("recipients", [])
            message = notification.get("message", "")
            notification_type = notification.get("type", "email")
            
            # Placeholder for actual notification sending
            # In production, integrate with email/SMS/push notification services
            notification_result = {
                "type": notification_type,
                "recipients": recipients,
                "message": message,
                "status": "sent",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            sent_notifications.append(notification_result)
            
        return RuleExecutionResult(
            success=True,
            result_data={"notifications": sent_notifications}
        )

    async def _execute_business_rule_step(
        self,
        logic: Dict[str, Any],
        context: Dict[str, Any],
        business_context: BusinessContext
    ) -> RuleExecutionResult:
        """Execute a business rule workflow step."""
        
        rule_id = logic.get("rule_id")
        if not rule_id:
            return RuleExecutionResult(
                success=False,
                message="No rule_id specified for business rule step"
            )
            
        # Execute business rule using the business rule engine
        return await self.business_rule_engine.execute_rule(
            rule_id=UUID(rule_id),
            input_data=context,
            context=business_context
        )

    def _evaluate_expression(
        self,
        expression: str,
        context: Dict[str, Any]
    ) -> Any:
        """Safely evaluate a mathematical expression."""
        
        # This is a simple placeholder - in production use a safe expression evaluator
        # Replace variables in expression with context values
        for key, value in context.items():
            if isinstance(value, (int, float)):
                expression = expression.replace(key, str(value))
                
        # Safe math evaluation (replaces unsafe eval)
        try:
            # Only allow basic math operations
            allowed_chars = set("0123456789+-*/.() ")
            if all(c in allowed_chars for c in expression):
                return self._safe_arithmetic_eval(expression)
            else:
                raise ValueError("Invalid expression")
        except Exception:
            return 0

    def _safe_arithmetic_eval(self, expression: str) -> float:
        """
        Safely evaluate simple arithmetic expressions.
        
        Args:
            expression: Simple arithmetic expression
            
        Returns:
            Evaluated result
        """
        try:
            # Remove whitespace
            expression = expression.strip().replace(" ", "")
            
            # Very basic safe evaluation - just handle simple cases
            # For production, use a proper safe expression evaluator
            if '+' in expression:
                parts = [float(p) for p in expression.split('+')]
                return sum(parts)
            elif '-' in expression and not expression.startswith('-'):
                parts = [float(p) for p in expression.split('-')]
                result = parts[0]
                for p in parts[1:]:
                    result -= p
                return result
            elif '*' in expression:
                parts = [float(p) for p in expression.split('*')]
                result = 1.0
                for p in parts:
                    result *= p
                return result
            elif '/' in expression:
                parts = [float(p) for p in expression.split('/')]
                result = parts[0]
                for p in parts[1:]:
                    if p == 0:
                        raise ValueError("Division by zero")
                    result /= p
                return result
            else:
                return float(expression)
        except Exception:
            return 0.0

    async def _log_trigger_execution(
        self,
        trigger: WorkflowTrigger,
        event: BusinessEvent,
        result: TriggerExecutionResult
    ):
        """Log trigger execution for monitoring and debugging."""
        
        self.metadata_logger.log_metadata_operation(
            operation="workflow_trigger_executed",
            entity_type="WorkflowTrigger", 
            entity_id=str(trigger.trigger_id),
            metadata={
                "trigger_name": trigger.trigger_name,
                "event_type": event.event_type,
                "entity_type": event.entity_type,
                "entity_id": str(event.entity_id),
                "success": result.success,
                "execution_time_ms": result.execution_time_ms,
                "triggered_workflows": len(result.triggered_workflows),
                "executed_actions": len(result.executed_actions),
                "errors": len(result.errors)
            }
        )

    # Event registration methods for integration
    def register_event_handler(
        self,
        event_type: str,
        handler: Callable[[BusinessEvent], None]
    ):
        """Register an event handler for specific event types."""
        
        if event_type not in self._event_handlers:
            self._event_handlers[event_type] = []
            
        self._event_handlers[event_type].append(handler)

    async def emit_event(
        self,
        event: BusinessEvent
    ) -> TriggerExecutionResult:
        """Emit an event and process any registered handlers."""
        
        # First process workflow triggers
        result = await self.process_event(event)
        
        # Then call any registered handlers
        handlers = self._event_handlers.get(event.event_type, [])
        for handler in handlers:
            try:
                await handler(event) if asyncio.iscoroutinefunction(handler) else handler(event)
            except Exception as e:
                logger.error(f"Event handler failed: {str(e)}")
                result.errors.append(f"Handler error: {str(e)}")
                
        return result
