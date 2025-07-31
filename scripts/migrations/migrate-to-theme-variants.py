#!/usr/bin/env python3
"""
Migration Script: Add Theme Variant System
Migrates from old Theme/ThemeProperty model to new BaseTheme/ThemeVariant/ThemeVariantProperty model.

MIGRATION STRATEGY:
1. Create new theme variant tables (base_themes, theme_variants, theme_variant_properties)
2. Migrate existing themes to new structure:
   - 'light' → 'default-light' variant of 'default' base theme
   - 'dark' → 'default-dark' variant of 'default' base theme
   - 'maritime' → 'maritime-light' + 'maritime-dark' variants

IMPORTANT: This migration preserves all existing theme data while transitioning to the new variant system.
"""

import asyncio
import logging
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from services.api.app.core.config import settings
from services.api.app.core.database import get_async_db, get_master_db, get_tenant_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ThemeVariantMigration:
    """Handles migration from old theme system to new theme variant system."""
    
    def __init__(self):
        self.master_engine = None
        self.tenant_engines = {}
        
    async def setup_connections(self):
        """Setup database connections."""
        # Master database connection
        master_url = settings.DATABASE_URL.replace("localhost/", "localhost/metadata_platform_master_development")
        self.master_engine = create_async_engine(master_url, echo=True)
        
        # Tenant database connections (get from registry)
        async with AsyncSession(self.master_engine) as session:
            result = await session.execute(text("SELECT tenant_id, database_name FROM tenant_registry WHERE status = 'active'"))
            tenants = result.fetchall()
            
            for tenant_id, db_name in tenants:
                tenant_url = settings.DATABASE_URL.replace("localhost/", f"localhost/{db_name}")
                self.tenant_engines[tenant_id] = create_async_engine(tenant_url, echo=True)
                logger.info(f"Connected to tenant database: {db_name}")
    
    async def create_new_tables(self):
        """Create new theme variant tables in all databases."""
        logger.info("Creating new theme variant tables...")
        
        # SQL for creating new tables
        create_base_themes_sql = """
        CREATE TABLE IF NOT EXISTS base_themes (
            base_theme_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID REFERENCES tenants(tenant_id),
            name VARCHAR(100) NOT NULL,
            display_name VARCHAR(200) NOT NULL,
            description TEXT,
            creator_id UUID,
            marketplace_url VARCHAR(500),
            price DECIMAL(10,2),
            download_count INTEGER DEFAULT 0,
            rating DECIMAL(3,2),
            category VARCHAR(100),
            tags JSONB DEFAULT '[]'::jsonb,
            preview_image VARCHAR(500),
            demo_url VARCHAR(500),
            is_system_theme BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            is_featured BOOLEAN DEFAULT false,
            is_premium BOOLEAN DEFAULT false,
            version VARCHAR(20) DEFAULT '1.0.0',
            min_platform_version VARCHAR(20),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            published_at TIMESTAMPTZ,
            
            CONSTRAINT uq_base_theme_tenant_name UNIQUE(tenant_id, name)
        );
        
        CREATE INDEX IF NOT EXISTS idx_base_theme_tenant_id ON base_themes(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_base_theme_active ON base_themes(is_active);
        CREATE INDEX IF NOT EXISTS idx_base_theme_featured ON base_themes(is_featured);
        CREATE INDEX IF NOT EXISTS idx_base_theme_category ON base_themes(category);
        CREATE INDEX IF NOT EXISTS idx_base_theme_creator ON base_themes(creator_id);
        """
        
        create_theme_variants_sql = """
        CREATE TABLE IF NOT EXISTS theme_variants (
            variant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            base_theme_id UUID NOT NULL REFERENCES base_themes(base_theme_id),
            variant_name VARCHAR(50) NOT NULL,
            display_name VARCHAR(200) NOT NULL,
            description TEXT,
            is_default BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            supports_auto_switch BOOLEAN DEFAULT true,
            css_class_prefix VARCHAR(50),
            media_query VARCHAR(200),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            
            CONSTRAINT uq_theme_variant_name UNIQUE(base_theme_id, variant_name)
        );
        
        CREATE INDEX IF NOT EXISTS idx_theme_variant_base_theme ON theme_variants(base_theme_id);
        CREATE INDEX IF NOT EXISTS idx_theme_variant_active ON theme_variants(is_active);
        CREATE INDEX IF NOT EXISTS idx_theme_variant_default ON theme_variants(is_default);
        """
        
        create_theme_variant_properties_sql = """
        CREATE TABLE IF NOT EXISTS theme_variant_properties (
            property_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            variant_id UUID NOT NULL REFERENCES theme_variants(variant_id),
            property_key VARCHAR(100) NOT NULL,
            property_value VARCHAR(500) NOT NULL,
            property_type VARCHAR(50),
            category VARCHAR(100),
            subcategory VARCHAR(100),
            description TEXT,
            css_selector VARCHAR(200),
            important BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            
            CONSTRAINT uq_theme_variant_property_key UNIQUE(variant_id, property_key)
        );
        
        CREATE INDEX IF NOT EXISTS idx_theme_variant_property_variant ON theme_variant_properties(variant_id);
        CREATE INDEX IF NOT EXISTS idx_theme_variant_property_category ON theme_variant_properties(category);
        CREATE INDEX IF NOT EXISTS idx_theme_variant_property_type ON theme_variant_properties(property_type);
        """
        
        # Create tables in all tenant databases
        for tenant_id, engine in self.tenant_engines.items():
            logger.info(f"Creating theme variant tables in tenant database: {tenant_id}")
            async with AsyncSession(engine) as session:
                await session.execute(text(create_base_themes_sql))
                await session.execute(text(create_theme_variants_sql))
                await session.execute(text(create_theme_variant_properties_sql))
                await session.commit()
                
        logger.info("✅ New theme variant tables created successfully!")
    
    async def migrate_existing_themes(self):
        """Migrate existing themes to new theme variant structure."""
        logger.info("Migrating existing theme data...")
        
        for tenant_id, engine in self.tenant_engines.items():
            async with AsyncSession(engine) as session:
                logger.info(f"Migrating themes for tenant: {tenant_id}")
                
                # Get existing themes
                result = await session.execute(text("""
                    SELECT theme_id, tenant_id, name, description, is_system_theme, 
                           is_active, is_default, version, created_at, updated_at, created_by
                    FROM themes ORDER BY name
                """))
                existing_themes = result.fetchall()
                
                logger.info(f"Found {len(existing_themes)} existing themes to migrate")
                
                for theme in existing_themes:
                    await self._migrate_single_theme(session, theme)
                
                await session.commit()
                logger.info(f"✅ Migrated themes for tenant: {tenant_id}")
    
    async def _migrate_single_theme(self, session: AsyncSession, theme):
        """Migrate a single theme to the new variant structure."""
        theme_id, tenant_id, name, description, is_system_theme, is_active, is_default, version, created_at, updated_at, created_by = theme
        
        logger.info(f"Migrating theme: {name}")
        
        # Determine migration strategy based on theme name
        if name.lower() in ['light', 'dark']:
            base_theme_name = 'default'
            variant_name = name.lower()
            display_name = f"{name.title()} Mode"
        elif name.lower() == 'maritime':
            base_theme_name = 'maritime'
            variant_name = 'light'  # Default to light variant
            display_name = 'Light Mode'
        else:
            # Custom theme - create as light variant of base theme with same name
            base_theme_name = name.lower()
            variant_name = 'light'
            display_name = 'Light Mode'
        
        # 1. Create or get base theme
        base_theme_id = await self._ensure_base_theme(session, base_theme_name, name, description, tenant_id, is_system_theme, version, created_at, updated_at)
        
        # 2. Create theme variant
        variant_id = await self._create_theme_variant(session, base_theme_id, variant_name, display_name, is_default, is_active, created_at, updated_at)
        
        # 3. Migrate theme properties
        await self._migrate_theme_properties(session, theme_id, variant_id)
        
        # 4. For maritime theme, also create dark variant with default dark colors
        if base_theme_name == 'maritime' and variant_name == 'light':
            dark_variant_id = await self._create_theme_variant(
                session, base_theme_id, 'dark', 'Dark Mode', False, is_active, created_at, updated_at, 'dark'
            )
            await self._add_default_dark_properties(session, dark_variant_id)
    
    async def _ensure_base_theme(self, session: AsyncSession, base_theme_name: str, original_name: str, description: str, tenant_id: str, is_system_theme: bool, version: str, created_at, updated_at) -> str:
        """Create or get base theme."""
        
        # Check if base theme already exists
        result = await session.execute(text("""
            SELECT base_theme_id FROM base_themes 
            WHERE tenant_id = :tenant_id AND name = :name
        """), {"tenant_id": tenant_id, "name": base_theme_name})
        
        existing = result.fetchone()
        if existing:
            return str(existing[0])
        
        # Create new base theme
        base_theme_id = str(uuid.uuid4())
        
        display_name_map = {
            'default': 'Default Theme',
            'maritime': 'Maritime Professional Theme'
        }
        display_name = display_name_map.get(base_theme_name, f"{original_name.title()} Theme")
        
        await session.execute(text("""
            INSERT INTO base_themes (
                base_theme_id, tenant_id, name, display_name, description,
                is_system_theme, is_active, version, created_at, updated_at,
                category, is_featured
            ) VALUES (
                :base_theme_id, :tenant_id, :name, :display_name, :description,
                :is_system_theme, :is_active, :version, :created_at, :updated_at,
                :category, :is_featured
            )
        """), {
            "base_theme_id": base_theme_id,
            "tenant_id": tenant_id,
            "name": base_theme_name,
            "display_name": display_name,
            "description": description or f"Migrated {display_name}",
            "is_system_theme": is_system_theme,
            "is_active": True,
            "version": version,
            "created_at": created_at,
            "updated_at": updated_at,
            "category": "business" if base_theme_name == "maritime" else "basic",
            "is_featured": base_theme_name == "maritime"
        })
        
        logger.info(f"Created base theme: {display_name}")
        return base_theme_id
    
    async def _create_theme_variant(self, session: AsyncSession, base_theme_id: str, variant_name: str, display_name: str, is_default: bool, is_active: bool, created_at, updated_at, css_class_prefix: str = None) -> str:
        """Create theme variant."""
        
        variant_id = str(uuid.uuid4())
        
        # Set CSS class prefix for dark variant
        if variant_name == 'dark' and css_class_prefix is None:
            css_class_prefix = 'dark'
        
        # Set media query for auto-switching
        media_query = None
        if variant_name == 'dark':
            media_query = "(prefers-color-scheme: dark)"
        elif variant_name == 'light':
            media_query = "(prefers-color-scheme: light)"
        
        await session.execute(text("""
            INSERT INTO theme_variants (
                variant_id, base_theme_id, variant_name, display_name,
                is_default, is_active, supports_auto_switch,
                css_class_prefix, media_query, created_at, updated_at
            ) VALUES (
                :variant_id, :base_theme_id, :variant_name, :display_name,
                :is_default, :is_active, :supports_auto_switch,
                :css_class_prefix, :media_query, :created_at, :updated_at
            )
        """), {
            "variant_id": variant_id,
            "base_theme_id": base_theme_id,
            "variant_name": variant_name,
            "display_name": display_name,
            "is_default": is_default or (variant_name == 'light'),  # Light is default
            "is_active": is_active,
            "supports_auto_switch": True,
            "css_class_prefix": css_class_prefix,
            "media_query": media_query,
            "created_at": created_at,
            "updated_at": updated_at
        })
        
        logger.info(f"Created theme variant: {display_name} ({variant_name})")
        return variant_id
    
    async def _migrate_theme_properties(self, session: AsyncSession, old_theme_id: str, new_variant_id: str):
        """Migrate theme properties to new variant."""
        
        # Get existing properties
        result = await session.execute(text("""
            SELECT property_key, property_value, property_type, category, description
            FROM theme_properties WHERE theme_id = :theme_id
        """), {"theme_id": old_theme_id})
        
        properties = result.fetchall()
        
        for prop in properties:
            property_key, property_value, property_type, category, description = prop
            
            await session.execute(text("""
                INSERT INTO theme_variant_properties (
                    property_id, variant_id, property_key, property_value,
                    property_type, category, description
                ) VALUES (
                    :property_id, :variant_id, :property_key, :property_value,
                    :property_type, :category, :description
                )
            """), {
                "property_id": str(uuid.uuid4()),
                "variant_id": new_variant_id,
                "property_key": property_key,
                "property_value": property_value,
                "property_type": property_type,
                "category": category,
                "description": description
            })
        
        logger.info(f"Migrated {len(properties)} properties")
    
    async def _add_default_dark_properties(self, session: AsyncSession, dark_variant_id: str):
        """Add default dark mode properties for maritime theme."""
        
        default_dark_properties = [
            ("--primary-color", "#4A9EFF", "color", "colors", "Primary brand color for dark mode"),
            ("--secondary-color", "#7C3AED", "color", "colors", "Secondary brand color for dark mode"),
            ("--background-color", "#1A1A1A", "color", "colors", "Main background color for dark mode"),
            ("--surface-color", "#2D2D2D", "color", "colors", "Surface/card background for dark mode"),
            ("--text-color", "#FFFFFF", "color", "colors", "Primary text color for dark mode"),
            ("--text-secondary", "#B3B3B3", "color", "colors", "Secondary text color for dark mode"),
            ("--border-color", "#404040", "color", "colors", "Border color for dark mode"),
            ("--accent-color", "#10B981", "color", "colors", "Accent color for dark mode"),
            ("--warning-color", "#F59E0B", "color", "colors", "Warning color for dark mode"),
            ("--error-color", "#EF4444", "color", "colors", "Error color for dark mode"),
            ("--success-color", "#10B981", "color", "colors", "Success color for dark mode"),
        ]
        
        for property_key, property_value, property_type, category, description in default_dark_properties:
            await session.execute(text("""
                INSERT INTO theme_variant_properties (
                    property_id, variant_id, property_key, property_value,
                    property_type, category, description
                ) VALUES (
                    :property_id, :variant_id, :property_key, :property_value,
                    :property_type, :category, :description
                )
            """), {
                "property_id": str(uuid.uuid4()),
                "variant_id": dark_variant_id,
                "property_key": property_key,
                "property_value": property_value,
                "property_type": property_type,
                "category": category,
                "description": description
            })
        
        logger.info(f"Added {len(default_dark_properties)} default dark properties")
    
    async def verify_migration(self):
        """Verify migration completed successfully."""
        logger.info("Verifying migration...")
        
        for tenant_id, engine in self.tenant_engines.items():
            async with AsyncSession(engine) as session:
                # Count base themes
                result = await session.execute(text("SELECT COUNT(*) FROM base_themes"))
                base_theme_count = result.scalar()
                
                # Count theme variants
                result = await session.execute(text("SELECT COUNT(*) FROM theme_variants"))
                variant_count = result.scalar()
                
                # Count variant properties
                result = await session.execute(text("SELECT COUNT(*) FROM theme_variant_properties"))
                property_count = result.scalar()
                
                logger.info(f"Tenant {tenant_id}: {base_theme_count} base themes, {variant_count} variants, {property_count} properties")
        
        logger.info("✅ Migration verification completed!")
    
    async def run_migration(self):
        """Run the complete migration process."""
        try:
            logger.info("🚀 Starting theme variant migration...")
            
            # Setup database connections
            await self.setup_connections()
            
            # Step 1: Create new tables
            await self.create_new_tables()
            
            # Step 2: Migrate existing themes
            await self.migrate_existing_themes()
            
            # Step 3: Verify migration
            await self.verify_migration()
            
            logger.info("✅ Theme variant migration completed successfully!")
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            raise
        finally:
            # Close connections
            if self.master_engine:
                await self.master_engine.dispose()
            for engine in self.tenant_engines.values():
                await engine.dispose()

async def main():
    """Main migration entry point."""
    migration = ThemeVariantMigration()
    await migration.run_migration()

if __name__ == "__main__":
    asyncio.run(main())