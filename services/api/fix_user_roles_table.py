#!/usr/bin/env python3
"""Fix user_roles table issue."""

import asyncio
import sys
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "services" / "api"))

from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def fix_user_roles_table():
    """Check and create user_roles table if missing."""
    
    print("🔧 Fixing user_roles table...")
    
    async with AsyncSessionLocal() as db:
        try:
            # Check if user_roles table exists
            result = await db.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'user_roles'
                );
            """))
            table_exists = result.scalar()
            
            if table_exists:
                print("✅ user_roles table already exists")
                
                # Check table structure
                result = await db.execute(text("""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'user_roles'
                    ORDER BY ordinal_position;
                """))
                columns = result.fetchall()
                print(f"📋 Table structure ({len(columns)} columns):")
                for col_name, col_type in columns:
                    print(f"   - {col_name}: {col_type}")
                    
            else:
                print("❌ user_roles table missing - creating it...")
                
                # Create user_roles table
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
                
                # Create indexes for performance
                await db.execute(text("""
                    CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
                """))
                await db.execute(text("""
                    CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
                """))
                
                await db.commit()
                print("✅ user_roles table created successfully!")
            
            # Test the relationship query that was failing
            print("\n🧪 Testing problematic query...")
            test_role_id = "b0511111-1111-1111-1111-111111111111"  # Business Owner template
            
            result = await db.execute(text("""
                SELECT u.user_id, u.email, u.first_name, u.last_name
                FROM users u
                JOIN user_roles ur ON u.user_id = ur.user_id
                WHERE ur.role_id = :role_id
            """), {"role_id": test_role_id})
            
            users_with_role = result.fetchall()
            print(f"✅ Query successful - found {len(users_with_role)} users with role {test_role_id}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    result = asyncio.run(fix_user_roles_table())
    if result:
        print("\n🎉 USER_ROLES TABLE FIXED! Ready for 100% API testing!")
    else:
        print("\n🔧 Issue still needs debugging")