"""
SAP-Style Authentication Database Configuration

Async SQLAlchemy setup with:
- Connection pooling
- Multi-tenant support
- Performance optimization
- Health checking
"""

import asyncio
from typing import AsyncGenerator, Optional
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncSession, AsyncEngine, create_async_engine, async_sessionmaker
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool, QueuePool
from sqlalchemy import text, event
from sqlalchemy.engine import Engine

from .config import get_settings
from .logging import get_logger

logger = get_logger("database")
settings = get_settings()

# Database engines (will be initialized on startup)
_auth_engine: Optional[AsyncEngine] = None
_session_factory: Optional[async_sessionmaker] = None

# Base model for SQLAlchemy
Base = declarative_base()

# =============================================
# DATABASE ENGINE CONFIGURATION
# =============================================

def create_database_engine() -> AsyncEngine:
    """Create async database engine with optimized settings"""
    
    # Database URL from settings
    database_url = settings.DATABASE_URL
    
    # Engine configuration
    engine_kwargs = {
        "url": database_url,
        "echo": settings.DATABASE_ECHO,  # Log SQL queries in development
        "future": True,  # Use SQLAlchemy 2.0 style
    }
    
    # Connection pool configuration for async engine
    if settings.ENVIRONMENT == "production":
        # Production: Use NullPool for async (recommended)
        engine_kwargs.update({
            "poolclass": NullPool,
            "pool_pre_ping": True,     # Validate connections before use
        })
    else:
        # Development: Use NullPool for async (recommended)
        engine_kwargs.update({
            "poolclass": NullPool,
            "pool_pre_ping": True,
        })
    
    # Create engine
    engine = create_async_engine(**engine_kwargs)
    
    # Set up connection event listeners
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        """Set database-specific pragmas (for SQLite)"""
        if "sqlite" in str(engine.url):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
    
    @event.listens_for(engine.sync_engine, "connect")
    def set_postgresql_settings(dbapi_connection, connection_record):
        """Set PostgreSQL-specific settings"""
        if "postgresql" in str(engine.url):
            cursor = dbapi_connection.cursor()
            cursor.execute("SET timezone TO 'UTC'")
            cursor.close()
    
    logger.info(
        "Database engine created",
        database_type=engine.url.drivername,
        pool_size=getattr(engine.pool, 'size', None),
        max_overflow=getattr(engine.pool, '_max_overflow', None)
    )
    
    return engine

def create_session_factory(engine: AsyncEngine) -> async_sessionmaker:
    """Create async session factory"""
    
    return async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,  # Don't expire objects after commit
        autoflush=True,          # Auto-flush before queries
        autocommit=False         # Explicit transaction control
    )

# =============================================
# DATABASE INITIALIZATION
# =============================================

async def init_database():
    """Initialize database connection and create tables"""
    global _auth_engine, _session_factory
    
    try:
        logger.info("Initializing database connection")
        
        # Create engine
        _auth_engine = create_database_engine()
        
        # Create session factory
        _session_factory = create_session_factory(_auth_engine)
        
        # Test connection
        async with _auth_engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            logger.info("Database connection test successful")
        
        # Create tables if they don't exist
        if settings.CREATE_TABLES_ON_STARTUP:
            await create_tables()
        
        logger.info("Database initialization complete")
        
    except Exception as e:
        logger.critical("Database initialization failed", error=str(e))
        raise

async def create_tables():
    """Create database tables"""
    
    try:
        # Import models to register them with Base
        from ..models.auth_models import (
            User, AuthSession, AuthMethod, MagicLink, TenantAuthConfig,
            PermissionDefinition, Role, AuditLog
        )
        
        logger.info("Creating database tables")
        
        async with _auth_engine.begin() as conn:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Database tables created successfully")
        
    except Exception as e:
        logger.error("Failed to create database tables", error=str(e))
        raise

async def drop_tables():
    """Drop all database tables (use with caution!)"""
    
    try:
        logger.warning("Dropping all database tables")
        
        async with _auth_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        
        logger.warning("All database tables dropped")
        
    except Exception as e:
        logger.error("Failed to drop database tables", error=str(e))
        raise

# =============================================
# SESSION MANAGEMENT
# =============================================

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting database session
    
    Usage in FastAPI:
        async def endpoint(db: AsyncSession = Depends(get_db_session)):
            pass
    """
    
    if not _session_factory:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    
    async with _session_factory() as session:
        try:
            yield session
            # Session is automatically committed/rolled back by context manager
        except Exception as e:
            logger.error("Database session error", error=str(e))
            await session.rollback()
            raise
        finally:
            await session.close()

@asynccontextmanager
async def get_db_session_context() -> AsyncGenerator[AsyncSession, None]:
    """
    Context manager for getting database session
    
    Usage:
        async with get_db_session_context() as db:
            user = await db.get(User, user_id)
    """
    
    if not _session_factory:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    
    async with _session_factory() as session:
        try:
            yield session
        except Exception as e:
            logger.error("Database session error", error=str(e))
            await session.rollback()
            raise
        finally:
            await session.close()

# =============================================
# DATABASE UTILITIES
# =============================================

async def check_database_health() -> dict:
    """Check database health and return status"""
    
    try:
        if not _auth_engine:
            return {
                "status": "disconnected",
                "error": "Database engine not initialized"
            }
        
        # Test basic connection
        async with _auth_engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            row = result.fetchone()
        
        # Test session factory
        if _session_factory:
            async with _session_factory() as session:
                await session.execute(text("SELECT 1"))
        
        # Get connection pool stats
        pool_status = {}
        if hasattr(_auth_engine.pool, 'size'):
            pool_status = {
                "pool_size": _auth_engine.pool.size(),
                "checked_out": _auth_engine.pool.checkedout(),
                "overflow": _auth_engine.pool.overflow(),
                "checked_in": _auth_engine.pool.checkedin()
            }
        
        return {
            "status": "connected",
            "database_type": _auth_engine.url.drivername,
            "pool_status": pool_status
        }
        
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
        return {
            "status": "error",
            "error": str(e)
        }

async def get_database_stats() -> dict:
    """Get database statistics"""
    
    try:
        async with get_db_session_context() as db:
            # Get table sizes and row counts
            from ..models.auth_models import User, AuthSession, AuditLog
            
            # Count users
            user_result = await db.execute(text("SELECT COUNT(*) FROM users"))
            user_count = user_result.scalar()
            
            # Count active sessions
            session_result = await db.execute(text(
                "SELECT COUNT(*) FROM auth_sessions WHERE status = 'active' AND expires_at > NOW()"
            ))
            active_sessions = session_result.scalar()
            
            # Count audit logs (last 24 hours)
            audit_result = await db.execute(text(
                "SELECT COUNT(*) FROM audit_logs WHERE event_timestamp > NOW() - INTERVAL '24 hours'"
            ))
            recent_audit_logs = audit_result.scalar()
            
            return {
                "users": user_count,
                "active_sessions": active_sessions,
                "recent_audit_logs": recent_audit_logs
            }
            
    except Exception as e:
        logger.error("Failed to get database stats", error=str(e))
        return {"error": str(e)}

async def cleanup_expired_sessions():
    """Clean up expired sessions (background task)"""
    
    try:
        async with get_db_session_context() as db:
            from ..models.auth_models import AuthSession, SessionStatus
            from sqlalchemy import update
            
            # Update expired sessions
            stmt = update(AuthSession).where(
                AuthSession.status == SessionStatus.ACTIVE,
                AuthSession.expires_at <= text("NOW()")
            ).values(
                status=SessionStatus.EXPIRED,
                revoked_at=text("NOW()"),
                revoked_reason="session_expired"
            )
            
            result = await db.execute(stmt)
            await db.commit()
            
            expired_count = result.rowcount
            
            if expired_count > 0:
                logger.info("Cleaned up expired sessions", count=expired_count)
            
            return expired_count
            
    except Exception as e:
        logger.error("Failed to cleanup expired sessions", error=str(e))
        return 0

# =============================================
# DATABASE MIGRATION UTILITIES
# =============================================

async def run_migrations():
    """Run database migrations (placeholder for Alembic)"""
    
    # TODO: Integrate with Alembic for proper database migrations
    logger.info("Database migrations not implemented yet")
    pass

async def backup_database():
    """Create database backup (placeholder)"""
    
    # TODO: Implement database backup logic
    logger.info("Database backup not implemented yet")
    pass

# =============================================
# DEVELOPMENT UTILITIES
# =============================================

async def reset_database():
    """Reset database (development only)"""
    
    if settings.ENVIRONMENT == "production":
        raise RuntimeError("Cannot reset database in production environment")
    
    logger.warning("Resetting database (development only)")
    
    # Drop and recreate tables
    await drop_tables()
    await create_tables()
    
    logger.warning("Database reset complete")

async def seed_test_data():
    """Seed database with test data (development only)"""
    
    if settings.ENVIRONMENT == "production":
        raise RuntimeError("Cannot seed test data in production environment")
    
    try:
        from uuid import uuid4
        from ..models.auth_models import TenantAuthConfig, ComplianceLevel, AuthMethodType
        
        async with get_db_session_context() as db:
            # Create test tenant config
            test_tenant_id = uuid4()
            
            test_config = TenantAuthConfig(
                tenant_id=test_tenant_id,
                vertical="ecommerce",
                compliance_level=ComplianceLevel.BASIC,
                enabled_auth_methods=["password", "magic_link"],
                default_auth_method=AuthMethodType.PASSWORD,
                session_timeout_minutes=1440,
                max_concurrent_sessions=5,
                require_email_verification=False  # For easier testing
            )
            
            db.add(test_config)
            await db.commit()
            
            logger.info("Test data seeded successfully", tenant_id=str(test_tenant_id))
            
            return {"tenant_id": str(test_tenant_id)}
            
    except Exception as e:
        logger.error("Failed to seed test data", error=str(e))
        raise 