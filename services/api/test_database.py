#!/usr/bin/env python3
"""Test database structure and role system."""

import asyncio
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def test_database():
    """Test database structure and role system."""
    print("🧪 Testing Database Structure...")
    
    try:
        async with AsyncSessionLocal() as db:
            # Check if new columns exist
            result = await db.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'roles' 
                AND column_name IN ('is_template', 'vertical')
            """))
            columns = [row[0] for row in result.fetchall()]
            print(f"📋 Role table columns found: {columns}")
            
            if 'is_template' not in columns or 'vertical' not in columns:
                print("❌ Missing required columns - applying migration...")
                # Run migration statements separately
                migration_statements = [
                    "ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE",
                    "ALTER TABLE roles ADD COLUMN IF NOT EXISTS vertical VARCHAR(50)",
                    "CREATE INDEX IF NOT EXISTS idx_role_template ON roles(is_template)",
                    "CREATE INDEX IF NOT EXISTS idx_role_vertical ON roles(vertical)"
                ]
                
                for stmt in migration_statements:
                    await db.execute(text(stmt))
                    
                await db.commit()
                print("✅ Migration applied successfully")
            else:
                print("✅ Required columns already exist")
                
            # Check existing roles
            result = await db.execute(text("SELECT COUNT(*) FROM roles"))
            count = result.scalar()
            print(f"📊 Current roles in database: {count}")
            
            # Check template roles
            result = await db.execute(text("""
                SELECT COUNT(*) FROM roles 
                WHERE is_template = true
            """))
            template_count = result.scalar()
            print(f"🎯 Template roles: {template_count}")
            
            # Check vertical roles
            result = await db.execute(text("""
                SELECT vertical, COUNT(*) 
                FROM roles 
                WHERE vertical IS NOT NULL 
                GROUP BY vertical
            """))
            verticals = result.fetchall()
            print(f"🏢 Vertical roles: {dict(verticals)}")
                
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = asyncio.run(test_database())
    if success:
        print("✅ Database test completed successfully")
    else:
        print("❌ Database test failed")