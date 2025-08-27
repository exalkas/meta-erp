#!/usr/bin/env python3
"""
Reset and Rebuild Database
Clean slate database initialization
"""

import asyncio
from sqlalchemy import text
from app.core.database import engine, AsyncSessionLocal
from app.models.base import Base
from app.core.config import get_settings

async def reset_and_rebuild_database():
    """Reset database to clean state and rebuild all tables."""
    print("🗄️ DATABASE RESET AND REBUILD")
    print("=" * 50)
    
    settings = get_settings()
    print(f"📊 Database: {settings.database_url.split('@')[1]}")  # Hide credentials
    
    try:
        # Step 1: Drop everything
        print("\n🧹 Step 1: Cleaning existing database...")
        async with engine.begin() as conn:
            # Drop all tables if they exist (this also drops indexes)
            await conn.run_sync(Base.metadata.drop_all)
            print("   ✅ All tables and indexes dropped")
        
        # Step 2: Verify clean state
        print("\n🔍 Step 2: Verify clean state...")
        session = AsyncSessionLocal()
        result = await session.execute(text("SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'"))
        table_count = result.scalar()
        print(f"   📊 Tables after cleanup: {table_count}")
        await session.close()
        
        # Step 3: Create all tables
        print("\n🏗️ Step 3: Creating all tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print("   ✅ All tables and indexes created")
        
        # Step 4: Verify final state
        print("\n✅ Step 4: Verify final state...")
        session = AsyncSessionLocal()
        result = await session.execute(text("SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'"))
        final_count = result.scalar()
        print(f"   📊 Final table count: {final_count}")
        
        if final_count > 0:
            # Show some key tables
            result = await session.execute(text("""
                SELECT tablename FROM pg_tables 
                WHERE schemaname = 'public' 
                AND tablename IN ('tenants', 'page_definitions', 'users', 'roles')
                ORDER BY tablename
            """))
            key_tables = [row[0] for row in result.fetchall()]
            print(f"   🔑 Key tables: {key_tables}")
        await session.close()
        
        print(f"\n🎉 DATABASE REBUILD COMPLETE!")
        print(f"   ✅ Tables created: {final_count}")
        print(f"   ✅ Ready for seeding")
        
    except Exception as e:
        print(f"❌ Database rebuild failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(reset_and_rebuild_database())
