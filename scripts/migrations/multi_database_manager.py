#!/usr/bin/env python3
"""
Multi-Database Connection Manager
Manages connections to Master database and multiple Tenant databases

Key Features:
- Master database connection for platform metadata and SAP customizing
- Dynamic tenant database connection management
- Connection pooling and lifecycle management
- Tenant discovery and registration
- Cross-database transaction support
- Connection health monitoring

Architecture Pattern:
- Master DB: Global metadata, SAP customizing, industry packages
- Tenant DBs: Business data, tenant-specific customizing overrides
"""
import os

import asyncio
import logging
from typing import Dict, List, Optional, AsyncContextManager
from uuid import UUID
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy.ext.asyncio import (
    create_async_engine, 
    async_sessionmaker,
    AsyncEngine,
    AsyncSession
)
from sqlalchemy import text, select
from sqlalchemy.pool import QueuePool

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TenantInfo:
    """Information about a tenant database"""
    tenant_id: UUID
    tenant_name: str
    database_name: str
    industry_vertical: str
    status: str
    connection_url: str

@dataclass
class DatabaseHealth:
    """Database health status"""
    is_healthy: bool
    response_time_ms: float
    last_check: datetime
    error_message: Optional[str] = None

class MultiDatabaseManager:
    """
    Manages connections to Master + Tenant databases
    
    Usage:
        manager = MultiDatabaseManager()
        await manager.initialize("postgresql+asyncpg://...")
        
        # Master database operations
        async with manager.get_master_session() as session:
            result = await session.execute(text("SELECT 1"))
        
        # Tenant database operations
        async with manager.get_tenant_session(tenant_id) as session:
            result = await session.execute(text("SELECT * FROM users"))
    """
    
    def __init__(self):
        self.master_engine: Optional[AsyncEngine] = None
        self.master_sessionmaker: Optional[async_sessionmaker] = None
        self.tenant_engines: Dict[UUID, AsyncEngine] = {}
        self.tenant_sessionmakers: Dict[UUID, async_sessionmaker] = {}
        self.tenant_info: Dict[UUID, TenantInfo] = {}
        self.health_status: Dict[str, DatabaseHealth] = {}
        self._initialized = False
    
    async def initialize(self, master_db_url: str, max_connections: int = 10) -> None:
        """Initialize the multi-database manager"""
        
        logger.info("🔧 Initializing Multi-Database Manager...")
        
        try:
            # Initialize Master database connection
            await self._initialize_master_database(master_db_url, max_connections)
            
            # Discover and initialize tenant databases
            await self._discover_tenant_databases(max_connections)
            
            # Perform health checks
            await self._check_all_database_health()
            
            self._initialized = True
            
            logger.info(f"✅ Multi-Database Manager initialized successfully")
            logger.info(f"   📊 Master database: Connected")
            logger.info(f"   🏢 Tenant databases: {len(self.tenant_engines)} discovered")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Multi-Database Manager: {str(e)}")
            raise
    
    async def _initialize_master_database(self, master_db_url: str, max_connections: int) -> None:
        """Initialize Master database connection"""
        
        logger.info("📊 Initializing Master database connection...")
        
        # Create async engine with connection pooling
        self.master_engine = create_async_engine(
            master_db_url,
            echo=False,  # Set to True for SQL debugging
            poolclass=QueuePool,
            pool_size=max_connections // 2,  # Reserve half for master
            max_overflow=max_connections // 4,
            pool_pre_ping=True,  # Validate connections before use
            pool_recycle=3600,   # Recycle connections every hour
        )
        
        # Create session factory
        self.master_sessionmaker = async_sessionmaker(
            bind=self.master_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        # Test connection
        async with self.master_sessionmaker() as session:
            result = await session.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            if test_value != 1:
                raise Exception("Master database connection test failed")
        
        logger.info("✅ Master database connection established")
    
    async def _discover_tenant_databases(self, max_connections_per_tenant: int = 5) -> None:
        """Discover tenant databases from master registry"""
        
        logger.info("🔍 Discovering tenant databases...")
        
        if not self.master_sessionmaker:
            raise Exception("Master database not initialized")
        
        try:
            async with self.master_sessionmaker() as session:
                # Query tenant registry from master database
                result = await session.execute(text("""
                    SELECT 
                        tenant_id,
                        tenant_name,
                        database_name,
                        industry_vertical,
                        status,
                        database_url
                    FROM tenant_registry 
                    WHERE status = 'active'
                    AND database_url IS NOT NULL
                """))
                
                tenant_records = result.fetchall()
                
                for record in tenant_records:
                    tenant_info = TenantInfo(
                        tenant_id=UUID(str(record.tenant_id)),
                        tenant_name=record.tenant_name,
                        database_name=record.database_name,
                        industry_vertical=record.industry_vertical,
                        status=record.status,
                        connection_url=record.database_url
                    )
                    
                    await self._initialize_tenant_database(tenant_info, max_connections_per_tenant)
                    
        except Exception as e:
            logger.warning(f"⚠️  No tenant databases found or error discovering: {str(e)}")
            # This is OK for initial setup - we'll add tenants later
    
    async def _initialize_tenant_database(self, tenant_info: TenantInfo, max_connections: int) -> None:
        """Initialize connection to a specific tenant database"""
        
        logger.info(f"   🏢 Connecting to tenant: {tenant_info.tenant_name} ({tenant_info.industry_vertical})")
        
        try:
            # Create async engine for tenant
            tenant_engine = create_async_engine(
                tenant_info.connection_url,
                echo=False,
                poolclass=QueuePool,
                pool_size=max_connections,
                max_overflow=max_connections // 2,
                pool_pre_ping=True,
                pool_recycle=3600,
            )
            
            # Create session factory for tenant
            tenant_sessionmaker = async_sessionmaker(
                bind=tenant_engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
            # Test connection
            async with tenant_sessionmaker() as session:
                result = await session.execute(text("SELECT 1 as test"))
                test_value = result.scalar()
                if test_value != 1:
                    raise Exception(f"Tenant database connection test failed for {tenant_info.tenant_name}")
            
            # Store connections
            self.tenant_engines[tenant_info.tenant_id] = tenant_engine
            self.tenant_sessionmakers[tenant_info.tenant_id] = tenant_sessionmaker
            self.tenant_info[tenant_info.tenant_id] = tenant_info
            
            logger.info(f"      ✅ Connected to {tenant_info.tenant_name}")
            
        except Exception as e:
            logger.error(f"      ❌ Failed to connect to {tenant_info.tenant_name}: {str(e)}")
            # Continue with other tenants even if one fails
    
    @asynccontextmanager
    async def get_master_session(self) -> AsyncContextManager[AsyncSession]:
        """Get a session for the Master database"""
        
        if not self._initialized or not self.master_sessionmaker:
            raise Exception("Multi-Database Manager not initialized")
        
        async with self.master_sessionmaker() as session:
            try:
                yield session
            except Exception as e:
                await session.rollback()
                raise
    
    @asynccontextmanager
    async def get_tenant_session(self, tenant_id: UUID) -> AsyncContextManager[AsyncSession]:
        """Get a session for a specific Tenant database"""
        
        if not self._initialized:
            raise Exception("Multi-Database Manager not initialized")
        
        if tenant_id not in self.tenant_sessionmakers:
            raise Exception(f"Tenant {tenant_id} not found or not connected")
        
        sessionmaker = self.tenant_sessionmakers[tenant_id]
        
        async with sessionmaker() as session:
            try:
                # Set tenant context for RLS policies
                await session.execute(text(f"SET app.current_tenant_id = '{tenant_id}'"))
                yield session
            except Exception as e:
                await session.rollback()
                raise
    
    async def create_tenant_database(self, 
                                   tenant_id: UUID, 
                                   tenant_name: str,
                                   industry_vertical: str,
                                   database_name: str,
                                   connection_url: str) -> bool:
        """Create and register a new tenant database"""
        
        logger.info(f"🏗️ Creating new tenant database: {tenant_name}")
        
        try:
            # 1. Register tenant in master database
            async with self.get_master_session() as session:
                await session.execute(text("""
                    INSERT INTO tenant_registry (
                        tenant_id, tenant_name, tenant_slug, database_name,
                        industry_vertical, status, database_url
                    ) VALUES (
                        :tenant_id, :tenant_name, :tenant_slug, :database_name,
                        :industry_vertical, 'active', :database_url
                    )
                """), {
                    'tenant_id': tenant_id,
                    'tenant_name': tenant_name,
                    'tenant_slug': tenant_name.lower().replace(' ', '-'),
                    'database_name': database_name,
                    'industry_vertical': industry_vertical,
                    'database_url': connection_url
                })
                await session.commit()
            
            # 2. Create tenant database connection
            tenant_info = TenantInfo(
                tenant_id=tenant_id,
                tenant_name=tenant_name,
                database_name=database_name,
                industry_vertical=industry_vertical,
                status='active',
                connection_url=connection_url
            )
            
            await self._initialize_tenant_database(tenant_info, max_connections=5)
            
            logger.info(f"✅ Tenant database created successfully: {tenant_name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create tenant database {tenant_name}: {str(e)}")
            return False
    
    async def remove_tenant_database(self, tenant_id: UUID) -> bool:
        """Remove and unregister a tenant database"""
        
        logger.info(f"🗑️ Removing tenant database: {tenant_id}")
        
        try:
            # 1. Close tenant database connections
            if tenant_id in self.tenant_engines:
                await self.tenant_engines[tenant_id].dispose()
                del self.tenant_engines[tenant_id]
                del self.tenant_sessionmakers[tenant_id]
                del self.tenant_info[tenant_id]
            
            # 2. Update tenant registry in master database
            async with self.get_master_session() as session:
                await session.execute(text("""
                    UPDATE tenant_registry 
                    SET status = 'terminated', database_url = NULL
                    WHERE tenant_id = :tenant_id
                """), {'tenant_id': tenant_id})
                await session.commit()
            
            logger.info(f"✅ Tenant database removed successfully: {tenant_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to remove tenant database {tenant_id}: {str(e)}")
            return False
    
    async def get_tenant_list(self) -> List[TenantInfo]:
        """Get list of all connected tenant databases"""
        return list(self.tenant_info.values())
    
    async def get_tenant_by_id(self, tenant_id: UUID) -> Optional[TenantInfo]:
        """Get tenant information by ID"""
        return self.tenant_info.get(tenant_id)
    
    async def _check_all_database_health(self) -> None:
        """Check health of all database connections"""
        
        logger.info("🏥 Checking database health...")
        
        # Check master database health
        await self._check_database_health("master", self.master_sessionmaker)
        
        # Check tenant database health
        for tenant_id, sessionmaker in self.tenant_sessionmakers.items():
            tenant_name = self.tenant_info[tenant_id].tenant_name
            await self._check_database_health(f"tenant_{tenant_name}", sessionmaker)
    
    async def _check_database_health(self, db_name: str, sessionmaker: async_sessionmaker) -> None:
        """Check health of a specific database"""
        
        start_time = asyncio.get_event_loop().time()
        
        try:
            async with sessionmaker() as session:
                await session.execute(text("SELECT 1"))
                
            end_time = asyncio.get_event_loop().time()
            response_time = (end_time - start_time) * 1000  # Convert to milliseconds
            
            self.health_status[db_name] = DatabaseHealth(
                is_healthy=True,
                response_time_ms=response_time,
                last_check=datetime.now()
            )
            
            logger.info(f"   ✅ {db_name}: {response_time:.1f}ms")
            
        except Exception as e:
            self.health_status[db_name] = DatabaseHealth(
                is_healthy=False,
                response_time_ms=0,
                last_check=datetime.now(),
                error_message=str(e)
            )
            
            logger.error(f"   ❌ {db_name}: {str(e)}")
    
    async def get_health_status(self) -> Dict[str, DatabaseHealth]:
        """Get health status of all databases"""
        return self.health_status.copy()
    
    async def cleanup(self) -> None:
        """Clean up all database connections"""
        
        logger.info("🧹 Cleaning up database connections...")
        
        # Close tenant database connections
        for tenant_id, engine in self.tenant_engines.items():
            try:
                await engine.dispose()
                logger.info(f"   ✅ Closed connection to tenant: {self.tenant_info[tenant_id].tenant_name}")
            except Exception as e:
                logger.error(f"   ❌ Error closing tenant connection: {str(e)}")
        
        # Close master database connection
        if self.master_engine:
            try:
                await self.master_engine.dispose()
                logger.info("   ✅ Closed master database connection")
            except Exception as e:
                logger.error(f"   ❌ Error closing master connection: {str(e)}")
        
        # Clear all references
        self.master_engine = None
        self.master_sessionmaker = None
        self.tenant_engines.clear()
        self.tenant_sessionmakers.clear()
        self.tenant_info.clear()
        self.health_status.clear()
        self._initialized = False
        
        logger.info("✅ Database connections cleaned up")

# Example usage and testing
async def main():
    """Example usage of MultiDatabaseManager"""
    
    manager = MultiDatabaseManager()
    
    try:
        # Initialize with master database
        master_url = os.environ["DATABASE_URL"]
        await manager.initialize(master_url)
        
        # Get tenant list
        tenants = await manager.get_tenant_list()
        print(f"Found {len(tenants)} tenant databases:")
        for tenant in tenants:
            print(f"  - {tenant.tenant_name} ({tenant.industry_vertical})")
        
        # Example master database operation
        async with manager.get_master_session() as session:
            result = await session.execute(text("SELECT COUNT(*) FROM tenant_registry"))
            tenant_count = result.scalar()
            print(f"Total tenants in registry: {tenant_count}")
        
        # Example tenant database operation (if any tenants exist)
        if tenants:
            tenant_id = tenants[0].tenant_id
            async with manager.get_tenant_session(tenant_id) as session:
                result = await session.execute(text("SELECT COUNT(*) FROM users WHERE is_active = true"))
                user_count = result.scalar() or 0
                print(f"Active users in {tenants[0].tenant_name}: {user_count}")
        
        # Check health status
        health = await manager.get_health_status()
        for db_name, status in health.items():
            status_icon = "✅" if status.is_healthy else "❌"
            print(f"{status_icon} {db_name}: {status.response_time_ms:.1f}ms")
        
    except Exception as e:
        print(f"Error: {str(e)}")
    
    finally:
        await manager.cleanup()

if __name__ == "__main__":
    asyncio.run(main()) 