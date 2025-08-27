#!/usr/bin/env python3
"""
Debug Table Creation - Step by Step
"""

import asyncio
from sqlalchemy import text
from app.core.database import engine, AsyncSessionLocal
from app.models.base import Base
from app.core.config import get_settings

async def debug_table_creation():
    """Debug table creation process step by step."""
    print("🔧 DEBUGGING TABLE CREATION")
    print("=" * 50)
    
    settings = get_settings()
    print(f"📊 Database URL: {settings.database_url[:50]}...")
    
    try:
        # Step 1: Check initial state
        print("\n🔍 Step 1: Check initial state")
        session = AsyncSessionLocal()
        result = await session.execute(text("SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'"))
        initial_count = result.scalar()
        print(f"   Initial tables: {initial_count}")
        await session.close()
        
        # Step 2: Try to create tables
        print("\n🔧 Step 2: Creating tables...")
        async with engine.begin() as conn:
            print("   ✅ Transaction started")
            await conn.run_sync(Base.metadata.create_all)
            print("   ✅ create_all() completed")
            
            # Check tables within transaction
            result = await conn.execute(text("SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'"))
            mid_count = result.scalar()
            print(f"   Tables in transaction: {mid_count}")
            
            # List some tables
            result = await conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' LIMIT 5"))
            tables = [row[0] for row in result.fetchall()]
            print(f"   Sample tables: {tables}")
            
        print("   ✅ Transaction committed")
        
        # Step 3: Check final state
        print("\n✅ Step 3: Check final state")
        session = AsyncSessionLocal()
        result = await session.execute(text("SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'"))
        final_count = result.scalar()
        print(f"   Final tables: {final_count}")
        
        if final_count > 0:
            result = await session.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"))
            tables = [row[0] for row in result.fetchall()]
            print(f"   All tables: {tables[:10]}...")  # Show first 10
        await session.close()
        
    except Exception as e:
        print(f"❌ Error during table creation: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_table_creation())
