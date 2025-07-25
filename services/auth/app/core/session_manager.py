"""
Session Manager - Authentication Service

Implements one-user-one-session policy with database session tracking.
Automatically invalidates previous sessions when a new login occurs.
"""

import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_, or_
from sqlalchemy.exc import IntegrityError

from app.core.config import get_auth_settings
from app.core.logging import get_logger, get_auth_logger
from app.core.exceptions import SessionExpiredException, SingleSessionViolationException

logger = get_logger("session_manager")
auth_logger = get_auth_logger("session_manager")


class SessionManager:
    """Manages user sessions with one-user-one-session policy."""
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.settings = get_auth_settings()
    
    async def create_session(
        self,
        user_id: UUID,
        ip_address: str,
        user_agent: str,
        tenant_id: Optional[UUID] = None
    ) -> UUID:
        """
        Create a new session for a user.
        If one-user-one-session is enabled, invalidates any existing sessions.
        """
        
        # Import here to avoid circular imports
        from services.api.app.models.auth import AuthSession
        
        session_id = uuid4()
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=self.settings.refresh_token_expire_days)
        
        try:
            # If single session is enabled, invalidate existing sessions
            if self.settings.enable_single_session:
                await self._invalidate_user_sessions(
                    user_id=user_id,
                    reason="new_login",
                    exclude_session_id=None
                )
            
            # Create new session
            new_session = AuthSession(
                session_id=session_id,
                user_id=user_id,
                tenant_id=tenant_id,
                ip_address=ip_address,
                user_agent=user_agent,
                expires_at=expires_at,
                is_active=True,
                created_at=now,
                last_activity=now
            )
            
            self.db.add(new_session)
            await self.db.commit()
            
            auth_logger.log_session_created(
                user_id=str(user_id),
                session_id=str(session_id),
                ip_address=ip_address
            )
            
            logger.info(
                "Session created successfully",
                user_id=str(user_id),
                session_id=str(session_id),
                tenant_id=str(tenant_id) if tenant_id else None,
                ip_address=ip_address,
                expires_at=expires_at.isoformat()
            )
            
            return session_id
            
        except Exception as e:
            await self.db.rollback()
            logger.error(
                "Failed to create session",
                user_id=str(user_id),
                error=str(e)
            )
            raise
    
    async def validate_session(self, session_id: UUID, user_id: UUID) -> bool:
        """Validate that a session is active and belongs to the user."""
        
        from services.api.app.models.auth import AuthSession
        
        try:
            query = select(AuthSession).where(
                and_(
                    AuthSession.session_id == session_id,
                    AuthSession.user_id == user_id,
                    AuthSession.is_active == True
                )
            )
            
            result = await self.db.execute(query)
            session = result.scalars().first()
            
            if not session:
                logger.warning(
                    "Session validation failed - session not found or inactive",
                    session_id=str(session_id),
                    user_id=str(user_id)
                )
                return False
            
            # Check if session is expired
            now = datetime.now(timezone.utc)
            if session.expires_at and session.expires_at <= now:
                logger.warning(
                    "Session validation failed - session expired",
                    session_id=str(session_id),
                    user_id=str(user_id),
                    expired_at=session.expires_at.isoformat()
                )
                
                # Mark session as inactive
                await self._invalidate_session(session_id, "expired")
                return False
            
            # Update last activity
            session.last_activity = now
            await self.db.commit()
            
            logger.debug(
                "Session validated successfully",
                session_id=str(session_id),
                user_id=str(user_id)
            )
            
            return True
            
        except Exception as e:
            logger.error(
                "Session validation error",
                session_id=str(session_id),
                user_id=str(user_id),
                error=str(e)
            )
            return False
    
    async def invalidate_session(
        self,
        session_id: UUID,
        reason: str = "logout"
    ) -> bool:
        """Invalidate a specific session."""
        return await self._invalidate_session(session_id, reason)
    
    async def invalidate_user_sessions(
        self,
        user_id: UUID,
        reason: str = "logout_all",
        exclude_session_id: Optional[UUID] = None
    ) -> int:
        """Invalidate all sessions for a user."""
        return await self._invalidate_user_sessions(user_id, reason, exclude_session_id)
    
    async def _invalidate_session(self, session_id: UUID, reason: str) -> bool:
        """Internal method to invalidate a single session."""
        
        from services.api.app.models.auth import AuthSession
        
        try:
            # Get session info first for logging
            query = select(AuthSession).where(AuthSession.session_id == session_id)
            result = await self.db.execute(query)
            session = result.scalars().first()
            
            if not session:
                logger.warning("Session not found for invalidation", session_id=str(session_id))
                return False
            
            # Mark as inactive
            session.is_active = False
            session.invalidated_at = datetime.now(timezone.utc)
            session.invalidation_reason = reason
            
            await self.db.commit()
            
            auth_logger.log_session_invalidated(
                user_id=str(session.user_id),
                session_id=str(session_id),
                reason=reason
            )
            
            logger.info(
                "Session invalidated",
                session_id=str(session_id),
                user_id=str(session.user_id),
                reason=reason
            )
            
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(
                "Failed to invalidate session",
                session_id=str(session_id),
                reason=reason,
                error=str(e)
            )
            return False
    
    async def _invalidate_user_sessions(
        self,
        user_id: UUID,
        reason: str,
        exclude_session_id: Optional[UUID] = None
    ) -> int:
        """Internal method to invalidate all sessions for a user."""
        
        from services.api.app.models.auth import AuthSession
        
        try:
            # Build query conditions
            conditions = [
                AuthSession.user_id == user_id,
                AuthSession.is_active == True
            ]
            
            if exclude_session_id:
                conditions.append(AuthSession.session_id != exclude_session_id)
            
            # Get sessions to invalidate
            query = select(AuthSession).where(and_(*conditions))
            result = await self.db.execute(query)
            sessions = result.scalars().all()
            
            invalidated_count = 0
            now = datetime.now(timezone.utc)
            
            for session in sessions:
                session.is_active = False
                session.invalidated_at = now
                session.invalidation_reason = reason
                invalidated_count += 1
                
                auth_logger.log_session_invalidated(
                    user_id=str(user_id),
                    session_id=str(session.session_id),
                    reason=reason
                )
            
            await self.db.commit()
            
            logger.info(
                "User sessions invalidated",
                user_id=str(user_id),
                invalidated_count=invalidated_count,
                reason=reason,
                exclude_session_id=str(exclude_session_id) if exclude_session_id else None
            )
            
            return invalidated_count
            
        except Exception as e:
            await self.db.rollback()
            logger.error(
                "Failed to invalidate user sessions",
                user_id=str(user_id),
                reason=reason,
                error=str(e)
            )
            return 0
    
    async def get_user_sessions(
        self,
        user_id: UUID,
        active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """Get all sessions for a user."""
        
        from services.api.app.models.auth import AuthSession
        
        try:
            conditions = [AuthSession.user_id == user_id]
            if active_only:
                conditions.append(AuthSession.is_active == True)
            
            query = select(AuthSession).where(and_(*conditions)).order_by(
                AuthSession.created_at.desc()
            )
            
            result = await self.db.execute(query)
            sessions = result.scalars().all()
            
            session_list = []
            for session in sessions:
                session_data = {
                    "session_id": str(session.session_id),
                    "user_id": str(session.user_id),
                    "tenant_id": str(session.tenant_id) if session.tenant_id else None,
                    "ip_address": session.ip_address,
                    "user_agent": session.user_agent,
                    "is_active": session.is_active,
                    "created_at": session.created_at.isoformat() if session.created_at else None,
                    "last_activity": session.last_activity.isoformat() if session.last_activity else None,
                    "expires_at": session.expires_at.isoformat() if session.expires_at else None,
                    "invalidated_at": session.invalidated_at.isoformat() if session.invalidated_at else None,
                    "invalidation_reason": session.invalidation_reason
                }
                session_list.append(session_data)
            
            logger.debug(
                "User sessions retrieved",
                user_id=str(user_id),
                session_count=len(session_list),
                active_only=active_only
            )
            
            return session_list
            
        except Exception as e:
            logger.error(
                "Failed to get user sessions",
                user_id=str(user_id),
                error=str(e)
            )
            return []
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions (background task)."""
        
        from services.api.app.models.auth import AuthSession
        
        try:
            now = datetime.now(timezone.utc)
            
            # Find expired but still active sessions
            query = select(AuthSession).where(
                and_(
                    AuthSession.is_active == True,
                    AuthSession.expires_at <= now
                )
            )
            
            result = await self.db.execute(query)
            expired_sessions = result.scalars().all()
            
            cleanup_count = 0
            for session in expired_sessions:
                session.is_active = False
                session.invalidated_at = now
                session.invalidation_reason = "expired"
                cleanup_count += 1
            
            await self.db.commit()
            
            if cleanup_count > 0:
                logger.info(
                    "Expired sessions cleaned up",
                    cleanup_count=cleanup_count
                )
            
            return cleanup_count
            
        except Exception as e:
            await self.db.rollback()
            logger.error(
                "Failed to cleanup expired sessions",
                error=str(e)
            )
            return 0
    
    async def enforce_single_session_policy(self, user_id: UUID, new_session_id: UUID):
        """Enforce one-user-one-session policy for a specific user."""
        
        if not self.settings.enable_single_session:
            return
        
        # Get current active sessions for the user
        sessions = await self.get_user_sessions(user_id, active_only=True)
        
        # If there are other active sessions besides the new one
        other_sessions = [s for s in sessions if s["session_id"] != str(new_session_id)]
        
        if other_sessions:
            logger.warning(
                "Single session policy violation detected",
                user_id=str(user_id),
                new_session_id=str(new_session_id),
                existing_sessions=len(other_sessions)
            )
            
            # Invalidate all other sessions
            await self._invalidate_user_sessions(
                user_id=user_id,
                reason="single_session_policy",
                exclude_session_id=new_session_id
            ) 