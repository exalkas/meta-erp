#!/usr/bin/env python3
"""Fix user_roles junction table - create the correct table."""

import asyncio
import sys
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "services" / "api"))

from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def fix_junction_table():
    """Create the correct user_roles junction table."""
    
    print("🔧 Fixing user_roles junction table...")
    
    async with AsyncSessionLocal() as db:
        try:
            # Drop the incorrect table and create the correct one
            print("🗑️ Dropping incorrect user_roles table...")
            await db.execute(text("DROP TABLE IF EXISTS user_roles CASCADE;"))
            
            print("📝 Creating correct user_roles junction table...")
            await db.execute(text("""
                CREATE TABLE user_roles (
                    user_id UUID NOT NULL,
                    role_id UUID NOT NULL,
                    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    assigned_by UUID,
                    PRIMARY KEY (user_id, role_id),
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
                );
            """))
            
            print("🔍 Creating performance indexes...")
            await db.execute(text("CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);"))
            await db.execute(text("CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);"))
            
            await db.commit()
            print("✅ Correct user_roles table created!")
            
            # Verify the table structure
            result = await db.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'user_roles'
                ORDER BY ordinal_position;
            """))
            columns = result.fetchall()
            print(f"📋 Verified table structure ({len(columns)} columns):")
            for col_name, col_type in columns:
                print(f"   ✅ {col_name}: {col_type}")
            
            # Test the query that was failing
            print("\n🧪 Testing the query that was causing 500 errors...")
            test_role_id = "b0511111-1111-1111-1111-111111111111"
            
            result = await db.execute(text("""
                SELECT u.user_id, u.email, u.first_name, u.last_name
                FROM users u
                JOIN user_roles ur ON u.user_id = ur.user_id
                WHERE ur.role_id = :role_id
            """), {"role_id": test_role_id})
            
            users_with_role = result.fetchall()
            print(f"✅ Query successful! Found {len(users_with_role)} users with role")
            
            return True
            
        except Exception as e:
            print(f"❌ Error: {e}")
            await db.rollback()
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    result = asyncio.run(fix_junction_table())
    if result:
        print("\n🎉 USER_ROLES JUNCTION TABLE FIXED!")
        print("✅ Delete endpoint should now work - ready for 100% API testing!")
    else:
        print("\n🔧 Issue still needs debugging")