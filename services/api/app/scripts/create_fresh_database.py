#!/usr/bin/env python3
"""
Fresh Database Setup - Metadata-Driven Platform

Creates a clean database from scratch with:
1. All tables created from SQLAlchemy models
2. Development tenant and users
3. Core metadata (components, entities, translations)
4. Login page definition with language/theme selectors

Run this to set up a completely fresh database.
"""

import asyncio
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db_engine
from app.core.logging import get_logger
from app.models import Base
from app.scripts.dev_data_setup import setup_development_data

logger = get_logger("fresh_database")


class FreshDatabaseSetup:
    """Set up a completely fresh database from scratch."""
    
    def __init__(self, engine):
        self.engine = engine
        
    async def create_fresh_database(self) -> None:
        """Create everything from scratch."""
        try:
            logger.info("🚀 Creating fresh database from scratch...")
            
            # Drop all existing tables (clean slate)
            await self._drop_all_tables()
            
            # Create all tables from models
            await self._create_all_tables()
            
            # Set up development data
            await self._setup_development_data()
            
            logger.info("✅ Fresh database setup completed successfully!")
            
        except Exception as e:
            logger.error("❌ Fresh database setup failed", error=str(e))
            raise
    
    async def _drop_all_tables(self) -> None:
        """Drop all existing tables for a clean start."""
        logger.info("🧹 Dropping all existing tables...")
        
        async with self.engine.begin() as conn:
            # Drop all tables defined in metadata
            await conn.run_sync(Base.metadata.drop_all)
            
        logger.info("✅ All existing tables dropped")
    
    async def _create_all_tables(self) -> None:
        """Create all tables from SQLAlchemy models."""
        logger.info("🏗️ Creating all tables from models...")
        
        async with self.engine.begin() as conn:
            # Create all tables from metadata
            await conn.run_sync(Base.metadata.create_all)
            
        logger.info("✅ All tables created successfully")
    
    async def _setup_development_data(self) -> None:
        """Set up development data using existing script."""
        logger.info("📊 Setting up development data...")
        
        # Use the existing dev data setup
        await setup_development_data()
        
        logger.info("✅ Development data setup completed")


async def main():
    """Run the fresh database setup."""
    settings = get_settings()
    
    logger.info("🚀 Starting fresh database setup for metadata platform...")
    logger.info(f"Database URL: {settings.database_url[:50]}...")
    
    try:
        # Get database engine
        engine = get_db_engine()
        
        # Create fresh database
        setup = FreshDatabaseSetup(engine)
        await setup.create_fresh_database()
        
        logger.info("🎉 Fresh database setup completed successfully!")
        logger.info("🔐 Default accounts created:")
        logger.info("   Admin: admin@dev.local / ")
        logger.info("   Demo:  demo@dev.local / demo123!")
        logger.info("🌐 Test the metadata API:")
        logger.info("   http://localhost:8000/api/metadata/pages/login")
        
        return 0
        
    except Exception as e:
        logger.error("💥 Fresh database setup failed", error=str(e))
        return 1
    finally:
        if 'engine' in locals():
            await engine.dispose()


if __name__ == "__main__":
    exit_code = asyncio.run(main()) 