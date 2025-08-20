#!/usr/bin/env python3
"""
Nuclear Database Reset - Complete Cleanup
Drop EVERYTHING manually and rebuild clean
"""

import asyncio
from sqlalchemy import text
from app.core.database import engine, AsyncSessionLocal
from app.models.base import Base

async def nuclear_database_reset():
    """Complete nuclear database reset - drop everything manually."""
    print("☢️ NUCLEAR DATABASE RESET")
    print("=" * 50)
    print("⚠️  WARNING: This will destroy ALL data in the database!")
    
    try:
        # Step 1: Drop all indexes manually
        print("\n🧨 Step 1: Dropping all indexes...")
        session = AsyncSessionLocal()
        
        # Get all indexes in public schema
        result = await session.execute(text("""
            SELECT indexname FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname NOT LIKE 'pg_%'
            AND indexname NOT LIKE '%_pkey'
        """))
        indexes = [row[0] for row in result.fetchall()]
        print(f"   Found {len(indexes)} indexes to drop")
        
        for index in indexes:
            try:
                await session.execute(text(f'DROP INDEX IF EXISTS "{index}" CASCADE'))
                print(f"   ✅ Dropped index: {index}")
            except Exception as e:
                print(f"   ⚠️ Could not drop index {index}: {e}")
        
        await session.commit()
        await session.close()
        
        # Step 2: Drop all tables manually  
        print("\n🧨 Step 2: Dropping all tables...")
        session = AsyncSessionLocal()
        
        # Get all tables in public schema
        result = await session.execute(text("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
        """))
        tables = [row[0] for row in result.fetchall()]
        print(f"   Found {len(tables)} tables to drop")
        
        for table in tables:
            try:
                await session.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))
                print(f"   ✅ Dropped table: {table}")
            except Exception as e:
                print(f"   ⚠️ Could not drop table {table}: {e}")
        
        await session.commit()
        await session.close()
        
        # Step 3: Drop all sequences
        print("\n🧨 Step 3: Dropping all sequences...")
        session = AsyncSessionLocal()
        
        result = await session.execute(text("""
            SELECT sequencename FROM pg_sequences 
            WHERE schemaname = 'public'
        """))
        sequences = [row[0] for row in result.fetchall()]
        print(f"   Found {len(sequences)} sequences to drop")
        
        for sequence in sequences:
            try:
                await session.execute(text(f'DROP SEQUENCE IF EXISTS "{sequence}" CASCADE'))
                print(f"   ✅ Dropped sequence: {sequence}")
            except Exception as e:
                print(f"   ⚠️ Could not drop sequence {sequence}: {e}")
        
        await session.commit()
        await session.close()
        
        # Step 4: Verify complete cleanup
        print("\n🔍 Step 4: Verify complete cleanup...")
        session = AsyncSessionLocal()
        
        result = await session.execute(text("SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'"))
        table_count = result.scalar()
        
        result = await session.execute(text("SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname NOT LIKE 'pg_%'"))
        index_count = result.scalar()
        
        print(f"   📊 Remaining tables: {table_count}")
        print(f"   📊 Remaining indexes: {index_count}")
        
        await session.close()
        
        # Step 5: Create everything fresh
        print("\n🏗️ Step 5: Creating all tables fresh...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print("   ✅ All tables and indexes created fresh")
        
        # Step 6: Final verification
        print("\n✅ Step 6: Final verification...")
        session = AsyncSessionLocal()
        
        result = await session.execute(text("SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'"))
        final_tables = result.scalar()
        
        result = await session.execute(text("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename IN ('tenants', 'page_definitions', 'users', 'roles')
            ORDER BY tablename
        """))
        key_tables = [row[0] for row in result.fetchall()]
        
        await session.close()
        
        print(f"   📊 Final table count: {final_tables}")
        print(f"   🔑 Key tables: {key_tables}")
        
        if 'tenants' in key_tables:
            print("\n🎉 DATABASE NUCLEAR RESET COMPLETE!")
            print("   ✅ Clean slate ready for seeding")
            return True
        else:
            print("\n❌ Nuclear reset failed - tenants table missing")
            return False
            
    except Exception as e:
        print(f"❌ Nuclear reset failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    asyncio.run(nuclear_database_reset())
