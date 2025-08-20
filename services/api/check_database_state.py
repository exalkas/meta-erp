#!/usr/bin/env python3
"""
Database State Inspector
Check what tables actually exist in the database
"""

import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal
from app.core.config import get_settings

async def check_database_state():
    """Check current database state."""
    print("🔍 CHECKING DATABASE STATE")
    print("=" * 50)
    
    settings = get_settings()
    print(f"📊 Database URL: {settings.database_url[:50]}...")
    
    session = AsyncSessionLocal()
    
    try:
        # Get list of tables
        result = await session.execute(
            text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
        )
        tables = [row[0] for row in result.fetchall()]
        
        print(f"\n📋 ACTUAL TABLES IN DATABASE ({len(tables)} total):")
        for table in tables:
            print(f"  ✅ {table}")
        
        # Check if tenants table exists specifically
        if 'tenants' in tables:
            print(f"\n🏢 TENANTS TABLE: ✅ EXISTS")
            # Count records
            result = await session.execute(text("SELECT COUNT(*) FROM tenants"))
            count = result.scalar()
            print(f"   📊 Records in tenants: {count}")
        else:
            print(f"\n🏢 TENANTS TABLE: ❌ MISSING")
        
        # Check if page_definitions exists
        if 'page_definitions' in tables:
            print(f"\n📄 PAGE_DEFINITIONS TABLE: ✅ EXISTS")
            result = await session.execute(text("SELECT COUNT(*) FROM page_definitions"))
            count = result.scalar()
            print(f"   📊 Records in page_definitions: {count}")
        else:
            print(f"\n📄 PAGE_DEFINITIONS TABLE: ❌ MISSING")
            
        # Check database schema
        result = await session.execute(text("SELECT current_schema()"))
        schema = result.scalar()
        print(f"\n🗂️ Current schema: {schema}")
        
        # Check database name
        result = await session.execute(text("SELECT current_database()"))
        db_name = result.scalar()
        print(f"🗄️ Current database: {db_name}")
        
    except Exception as e:
        print(f"❌ Database check failed: {e}")
        
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(check_database_state())
