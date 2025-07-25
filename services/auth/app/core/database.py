"""
Authentication Service Database Configuration

Database setup and connection management for auth service.
Uses the same database as the API service but focused on auth operations.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, AsyncEngine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

from app.core.config import get_auth_settings
from app.core.logging import get_logger

logger = get_logger("auth_database")

# Global engine instance
_engine: AsyncEngine = None


def get_engine() -> AsyncEngine:
    """Get database engine (singleton)."""
    global _engine
    if _engine is None:
        settings = get_auth_settings()
        _engine = create_async_engine(
            settings.database_url,
            echo=settings.debug,
            pool_pre_ping=True,
            pool_recycle=3600,
        )
        logger.info("Database engine created")
    return _engine


# Session factory
AsyncSessionLocal = sessionmaker(
    bind=get_engine(),
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error("Database session error", error=str(e))
            raise
        finally:
            await session.close()


async def check_db_connection() -> bool:
    """Check if database connection is working."""
    try:
        engine = get_engine()
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.debug("Database connection check successful")
        return True
    except Exception as e:
        logger.error("Database connection check failed", error=str(e))
        return False


async def create_tables():
    """Create database tables if they don't exist."""
    try:
        # Import all models to ensure they're registered
        from services.api.app.models.auth import User, Role, Permission, AuthSession, MagicLink, AuditLog, SecuritySettings
        from services.api.app.models.metadata import Base
        
        engine = get_engine()
        async with engine.begin() as conn:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Database tables created/verified successfully")
    except Exception as e:
        logger.error("Failed to create database tables", error=str(e))
        raise 