"""Database configuration and session management."""

from typing import AsyncGenerator, Optional
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.models.base import Base

settings = get_settings()

# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    future=True,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=10,
    max_overflow=20,
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_tables():
    """Create all database tables."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        # Log the error but don't fail startup if tables already exist
        if "already exists" in str(e):
            print(f"Tables/indexes already exist: {e}")
        else:
            raise e


async def drop_tables():
    """Drop all database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def check_db_connection() -> bool:
    """Check if database connection is working."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def init_database():
    """Initialize database - create tables if needed."""
    try:
        # Check connection first
        if not await check_db_connection():
            raise Exception("Database connection failed")
        
        # Create tables
        await create_tables()
        return True
    except Exception as e:
        print(f"Database initialization failed: {e}")
        raise


def get_async_session() -> AsyncSession:
    """Get a new async session instance."""
    return AsyncSessionLocal() 