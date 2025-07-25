"""
Authentication Service Logging Configuration

Structured logging setup for the authentication service.
"""

import logging
import structlog
from typing import Any, Dict

from app.core.config import get_auth_settings


def setup_logging():
    """Setup structured logging for the authentication service."""
    settings = get_auth_settings()
    
    # Configure standard library logging
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        format="%(message)s",
    )
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer(colors=True) if settings.debug else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


class AuthLogger:
    """Authentication-specific logging utilities."""
    
    def __init__(self, logger: structlog.BoundLogger):
        self.logger = logger
    
    def log_auth_attempt(self, email: str, success: bool, ip_address: str = None, user_agent: str = None):
        """Log authentication attempts."""
        self.logger.info(
            "Authentication attempt",
            email=email,
            success=success,
            ip_address=ip_address,
            user_agent=user_agent,
            event_type="auth_attempt"
        )
    
    def log_session_created(self, user_id: str, session_id: str, ip_address: str = None):
        """Log session creation."""
        self.logger.info(
            "Session created",
            user_id=user_id,
            session_id=session_id,
            ip_address=ip_address,
            event_type="session_created"
        )
    
    def log_session_invalidated(self, user_id: str, session_id: str, reason: str):
        """Log session invalidation."""
        self.logger.info(
            "Session invalidated",
            user_id=user_id,
            session_id=session_id,
            reason=reason,
            event_type="session_invalidated"
        )
    
    def log_token_refresh(self, user_id: str, session_id: str):
        """Log token refresh."""
        self.logger.debug(
            "Token refreshed",
            user_id=user_id,
            session_id=session_id,
            event_type="token_refresh"
        )
    
    def log_password_change(self, user_id: str, ip_address: str = None):
        """Log password changes."""
        self.logger.info(
            "Password changed",
            user_id=user_id,
            ip_address=ip_address,
            event_type="password_change"
        )
    
    def log_account_locked(self, email: str, attempts: int):
        """Log account lockouts."""
        self.logger.warning(
            "Account locked due to failed attempts",
            email=email,
            failed_attempts=attempts,
            event_type="account_locked"
        )
    
    def log_magic_link_sent(self, email: str, link_id: str):
        """Log magic link generation."""
        self.logger.info(
            "Magic link sent",
            email=email,
            link_id=link_id,
            event_type="magic_link_sent"
        )
    
    def log_magic_link_used(self, email: str, link_id: str, success: bool):
        """Log magic link usage."""
        self.logger.info(
            "Magic link used",
            email=email,
            link_id=link_id,
            success=success,
            event_type="magic_link_used"
        )


def get_auth_logger(name: str) -> AuthLogger:
    """Get an authentication logger instance."""
    base_logger = get_logger(name)
    return AuthLogger(base_logger) 