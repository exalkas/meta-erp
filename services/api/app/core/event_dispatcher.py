"""
Event Dispatcher - Business Event Capture and Routing

Captures business events from API operations and routes them to workflow triggers.
Provides a clean interface for emitting events throughout the application.
"""

import asyncio
from typing import Dict, List, Optional, Any, Union
from uuid import UUID
from datetime import datetime
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.engines.workflow_trigger_engine import (
    WorkflowTriggerEngine, 
    BusinessEvent, 
    BusinessContext,
    EventType
)

logger = get_logger("event_dispatcher")


class EventDispatcher:
    """
    Global event dispatcher for business events.
    
    Features:
    - Centralized event emission
    - Asynchronous event processing
    - Integration with workflow trigger engine
    - Event buffering and batching
    - Error handling and retry logic
    """

    def __init__(self):
        self._trigger_engines: Dict[str, WorkflowTriggerEngine] = {}
        self._event_queue: List[BusinessEvent] = []
        self._processing = False

    def register_trigger_engine(
        self,
        session_id: str,
        trigger_engine: WorkflowTriggerEngine
    ):
        """Register a workflow trigger engine for event processing."""
        self._trigger_engines[session_id] = trigger_engine

    def unregister_trigger_engine(self, session_id: str):
        """Unregister a workflow trigger engine."""
        if session_id in self._trigger_engines:
            del self._trigger_engines[session_id]

    async def emit_event(
        self,
        event_type: str,
        entity_type: str,
        entity_id: UUID,
        entity_data: Dict[str, Any],
        context: BusinessContext,
        metadata: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None
    ) -> bool:
        """
        Emit a business event for processing.
        
        Args:
            event_type: Type of event (created, updated, etc.)
            entity_type: Type of entity (Client, Matter, etc.)
            entity_id: ID of the entity
            entity_data: Current entity data
            context: Business context
            metadata: Additional event metadata
            session_id: Specific session to use for processing
            
        Returns:
            True if event was successfully emitted
        """
        
        try:
            event = BusinessEvent(
                event_type=event_type,
                entity_type=entity_type,
                entity_id=entity_id,
                entity_data=entity_data,
                context=context,
                metadata=metadata
            )

            # Process immediately if we have a specific session
            if session_id and session_id in self._trigger_engines:
                trigger_engine = self._trigger_engines[session_id]
                result = await trigger_engine.emit_event(event)
                return result.success

            # Process with all registered engines
            success = True
            for trigger_engine in self._trigger_engines.values():
                try:
                    result = await trigger_engine.emit_event(event)
                    if not result.success:
                        success = False
                        logger.error(f"Trigger engine failed to process event: {result.errors}")
                except Exception as e:
                    success = False
                    logger.error(f"Trigger engine error: {str(e)}")

            return success

        except Exception as e:
            logger.error(f"Failed to emit event: {str(e)}")
            return False

    async def emit_entity_created(
        self,
        entity_type: str,
        entity_id: UUID,
        entity_data: Dict[str, Any],
        context: BusinessContext,
        session_id: Optional[str] = None
    ) -> bool:
        """Emit entity created event."""
        return await self.emit_event(
            event_type=EventType.ENTITY_CREATED.value,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_data=entity_data,
            context=context,
            session_id=session_id
        )

    async def emit_entity_updated(
        self,
        entity_type: str,
        entity_id: UUID,
        entity_data: Dict[str, Any],
        context: BusinessContext,
        old_data: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None
    ) -> bool:
        """Emit entity updated event."""
        metadata = {"old_data": old_data} if old_data else None
        return await self.emit_event(
            event_type=EventType.ENTITY_UPDATED.value,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_data=entity_data,
            context=context,
            metadata=metadata,
            session_id=session_id
        )

    async def emit_entity_deleted(
        self,
        entity_type: str,
        entity_id: UUID,
        entity_data: Dict[str, Any],
        context: BusinessContext,
        session_id: Optional[str] = None
    ) -> bool:
        """Emit entity deleted event."""
        return await self.emit_event(
            event_type=EventType.ENTITY_DELETED.value,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_data=entity_data,
            context=context,
            session_id=session_id
        )

    # Legal-specific event helpers
    async def emit_time_entry_created(
        self,
        time_entry_id: UUID,
        time_entry_data: Dict[str, Any],
        context: BusinessContext,
        session_id: Optional[str] = None
    ) -> bool:
        """Emit time entry created event for budget tracking."""
        return await self.emit_event(
            event_type=EventType.TIME_ENTRY_CREATED.value,
            entity_type="TimeEntry",
            entity_id=time_entry_id,
            entity_data=time_entry_data,
            context=context,
            session_id=session_id
        )

    async def emit_expense_added(
        self,
        expense_id: UUID,
        expense_data: Dict[str, Any],
        context: BusinessContext,
        session_id: Optional[str] = None
    ) -> bool:
        """Emit expense added event for budget tracking."""
        return await self.emit_event(
            event_type=EventType.EXPENSE_ADDED.value,
            entity_type="Expense",
            entity_id=expense_id,
            entity_data=expense_data,
            context=context,
            session_id=session_id
        )

    async def emit_client_created(
        self,
        client_id: UUID,
        client_data: Dict[str, Any],
        context: BusinessContext,
        session_id: Optional[str] = None
    ) -> bool:
        """Emit client created event for conflict checking."""
        return await self.emit_event(
            event_type=EventType.CLIENT_CREATED.value,
            entity_type="Client",
            entity_id=client_id,
            entity_data=client_data,
            context=context,
            session_id=session_id
        )

    async def emit_matter_created(
        self,
        matter_id: UUID,
        matter_data: Dict[str, Any],
        context: BusinessContext,
        session_id: Optional[str] = None
    ) -> bool:
        """Emit matter created event for conflict checking."""
        return await self.emit_event(
            event_type=EventType.MATTER_CREATED.value,
            entity_type="Matter",
            entity_id=matter_id,
            entity_data=matter_data,
            context=context,
            session_id=session_id
        )

    async def emit_matter_status_changed(
        self,
        matter_id: UUID,
        matter_data: Dict[str, Any],
        context: BusinessContext,
        old_status: Optional[str] = None,
        new_status: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> bool:
        """Emit matter status changed event."""
        metadata = {
            "old_status": old_status,
            "new_status": new_status
        }
        return await self.emit_event(
            event_type=EventType.MATTER_STATUS_CHANGED.value,
            entity_type="Matter",
            entity_id=matter_id,
            entity_data=matter_data,
            context=context,
            metadata=metadata,
            session_id=session_id
        )

    async def emit_document_uploaded(
        self,
        document_id: UUID,
        document_data: Dict[str, Any],
        context: BusinessContext,
        session_id: Optional[str] = None
    ) -> bool:
        """Emit document uploaded event."""
        return await self.emit_event(
            event_type=EventType.DOCUMENT_UPLOADED.value,
            entity_type="Document",
            entity_id=document_id,
            entity_data=document_data,
            context=context,
            session_id=session_id
        )

    # Generic event helpers
    async def emit_threshold_exceeded(
        self,
        entity_type: str,
        entity_id: UUID,
        entity_data: Dict[str, Any],
        context: BusinessContext,
        threshold_name: str,
        threshold_value: Any,
        current_value: Any,
        session_id: Optional[str] = None
    ) -> bool:
        """Emit threshold exceeded event."""
        metadata = {
            "threshold_name": threshold_name,
            "threshold_value": threshold_value,
            "current_value": current_value
        }
        return await self.emit_event(
            event_type=EventType.THRESHOLD_EXCEEDED.value,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_data=entity_data,
            context=context,
            metadata=metadata,
            session_id=session_id
        )

    async def emit_status_changed(
        self,
        entity_type: str,
        entity_id: UUID,
        entity_data: Dict[str, Any],
        context: BusinessContext,
        old_status: str,
        new_status: str,
        session_id: Optional[str] = None
    ) -> bool:
        """Emit generic status changed event."""
        metadata = {
            "old_status": old_status,
            "new_status": new_status
        }
        return await self.emit_event(
            event_type=EventType.STATUS_CHANGED.value,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_data=entity_data,
            context=context,
            metadata=metadata,
            session_id=session_id
        )

    async def emit_approval_required(
        self,
        entity_type: str,
        entity_id: UUID,
        entity_data: Dict[str, Any],
        context: BusinessContext,
        approval_type: str,
        reason: str,
        session_id: Optional[str] = None
    ) -> bool:
        """Emit approval required event."""
        metadata = {
            "approval_type": approval_type,
            "reason": reason
        }
        return await self.emit_event(
            event_type=EventType.APPROVAL_REQUIRED.value,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_data=entity_data,
            context=context,
            metadata=metadata,
            session_id=session_id
        )


# Global event dispatcher instance
_event_dispatcher = EventDispatcher()


def get_event_dispatcher() -> EventDispatcher:
    """Get the global event dispatcher instance."""
    return _event_dispatcher


@asynccontextmanager
async def event_session(db_session: AsyncSession):
    """
    Context manager for event processing with database session.
    
    Usage:
        async with event_session(db) as (dispatcher, session_id):
            # Emit events that will be processed with this DB session
            await dispatcher.emit_client_created(...)
    """
    
    from app.engines.workflow_trigger_engine import WorkflowTriggerEngine
    
    # Create trigger engine for this session
    trigger_engine = WorkflowTriggerEngine(db_session)
    session_id = f"session_{id(db_session)}"
    
    # Register with dispatcher
    dispatcher = get_event_dispatcher()
    dispatcher.register_trigger_engine(session_id, trigger_engine)
    
    try:
        yield dispatcher, session_id
    finally:
        # Clean up
        dispatcher.unregister_trigger_engine(session_id)


# Convenience functions for direct usage
async def emit_entity_event(
    event_type: str,
    entity_type: str,
    entity_id: UUID,
    entity_data: Dict[str, Any],
    context: BusinessContext,
    db_session: AsyncSession,
    metadata: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Convenience function to emit an entity event with a database session.
    
    This creates a temporary event session and emits the event.
    """
    
    async with event_session(db_session) as (dispatcher, session_id):
        return await dispatcher.emit_event(
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_data=entity_data,
            context=context,
            metadata=metadata,
            session_id=session_id
        )


# Event type constants for easy importing
class Events:
    """Constants for common event types."""
    
    # Entity lifecycle
    ENTITY_CREATED = EventType.ENTITY_CREATED.value
    ENTITY_UPDATED = EventType.ENTITY_UPDATED.value
    ENTITY_DELETED = EventType.ENTITY_DELETED.value
    
    # Legal events
    TIME_ENTRY_CREATED = EventType.TIME_ENTRY_CREATED.value
    EXPENSE_ADDED = EventType.EXPENSE_ADDED.value
    CLIENT_CREATED = EventType.CLIENT_CREATED.value
    MATTER_CREATED = EventType.MATTER_CREATED.value
    MATTER_STATUS_CHANGED = EventType.MATTER_STATUS_CHANGED.value
    DOCUMENT_UPLOADED = EventType.DOCUMENT_UPLOADED.value
    
    # Generic events
    STATUS_CHANGED = EventType.STATUS_CHANGED.value
    THRESHOLD_EXCEEDED = EventType.THRESHOLD_EXCEEDED.value
    APPROVAL_REQUIRED = EventType.APPROVAL_REQUIRED.value
    NOTIFICATION_TRIGGERED = EventType.NOTIFICATION_TRIGGERED.value
