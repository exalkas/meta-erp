#!/usr/bin/env python3
"""
Investigate Index Corruption
Find and manually remove the problematic index
"""

import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal

async def investigate_index_corruption():
    """Investigate and fix the index corruption issue."""
    print("🔍 INVESTIGATING INDEX CORRUPTION")
    print("=" * 50)
    
    session = AsyncSessionLocal()
    
    try:
        # 1. Check if the specific index exists
        print("\n🔍 Step 1: Check problematic index existence...")
        result = await session.execute(text("""
            SELECT indexname, tablename, schemaname 
            FROM pg_indexes 
            WHERE indexname = 'idx_business_config_active'
        """))
        index_info = result.fetchall()
        
        if index_info:
            for idx in index_info:
                print(f"   ⚠️ Found: {idx[0]} on table {idx[1]} in schema {idx[2]}")
        else:
            print("   ✅ Index not found in pg_indexes")
        
        # 2. Check in information_schema
        print("\n🔍 Step 2: Check in information_schema...")
        result = await session.execute(text("""
            SELECT constraint_name, table_name, constraint_type
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'idx_business_config_active'
        """))
        constraint_info = result.fetchall()
        
        if constraint_info:
            for constraint in constraint_info:
                print(f"   ⚠️ Found constraint: {constraint[0]} on table {constraint[1]} type {constraint[2]}")
        else:
            print("   ✅ No constraint found")
        
        # 3. Check pg_stat_user_indexes
        print("\n🔍 Step 3: Check pg_stat_user_indexes...")
        result = await session.execute(text("""
            SELECT indexrelname, relname, schemaname
            FROM pg_stat_user_indexes 
            WHERE indexrelname = 'idx_business_config_active'
        """))
        stat_info = result.fetchall()
        
        if stat_info:
            for stat in stat_info:
                print(f"   ⚠️ Found in stats: {stat[0]} on table {stat[1]} in schema {stat[2]}")
        else:
            print("   ✅ Not found in stats")
        
        # 4. Check pg_class directly
        print("\n🔍 Step 4: Check pg_class for the index...")
        result = await session.execute(text("""
            SELECT relname, relkind, relnamespace
            FROM pg_class 
            WHERE relname = 'idx_business_config_active'
        """))
        class_info = result.fetchall()
        
        if class_info:
            for cls in class_info:
                print(f"   ⚠️ Found in pg_class: {cls[0]} kind={cls[1]} namespace={cls[2]}")
        else:
            print("   ✅ Not found in pg_class")
        
        # 5. Try to force drop the index
        print("\n🔨 Step 5: Force drop the index...")
        try:
            await session.execute(text('DROP INDEX IF EXISTS "idx_business_config_active" CASCADE'))
            await session.commit()
            print("   ✅ Drop command executed successfully")
        except Exception as e:
            print(f"   ❌ Drop failed: {e}")
        
        # 6. Try alternative drop syntax
        print("\n🔨 Step 6: Try alternative drop syntax...")
        try:
            await session.execute(text('DROP INDEX IF EXISTS idx_business_config_active CASCADE'))
            await session.commit()
            print("   ✅ Alternative drop executed successfully")
        except Exception as e:
            print(f"   ❌ Alternative drop failed: {e}")
        
        # 7. Check all business_config related indexes
        print("\n🔍 Step 7: Check all business_config indexes...")
        result = await session.execute(text("""
            SELECT indexname, tablename 
            FROM pg_indexes 
            WHERE indexname LIKE '%business_config%'
            ORDER BY indexname
        """))
        business_indexes = result.fetchall()
        
        if business_indexes:
            print(f"   Found {len(business_indexes)} business_config indexes:")
            for idx in business_indexes:
                print(f"     - {idx[0]} on {idx[1]}")
        else:
            print("   ✅ No business_config indexes found")
        
        # 8. Final verification
        print("\n✅ Step 8: Final verification...")
        result = await session.execute(text("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE indexname = 'idx_business_config_active'
        """))
        final_check = result.fetchall()
        
        if final_check:
            print("   ❌ Index still exists after drop attempts")
            return False
        else:
            print("   ✅ Index successfully removed")
            return True
            
    except Exception as e:
        print(f"❌ Investigation failed: {e}")
        return False
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(investigate_index_corruption())
