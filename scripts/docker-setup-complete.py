#!/usr/bin/env python3
"""
Complete Docker Database Setup Script
=====================================
This script replicates the functionality of the PowerShell setup scripts
but works inside Docker containers for consistent setup.

Based on:
- scripts/migrations/02-setup-tenant-db.ps1
- scripts/migrations/03-setup-first-user.ps1
"""

import asyncio
import asyncpg
import bcrypt
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Configuration
DATABASE_CONFIG = {
    'host': 'postgres',
    'port': 5432,
    'user': 'postgres',
    'password': '',
    'database': 'metadata_erp'
}

TENANT_CONFIG = {
    'tenant_id': '89f84fea-b5b9-413c-945b-002c7fd9555d',
    'tenant_name': 'Demo E-shop CRM & ERP',
    'tenant_slug': 'demo-eshop-crm',
    'industry_vertical': 'ECOMMERCE'
}

ADMIN_USER = {
    'email': 'admin@demo-eshop-crm.local',
    'password': '',
    'first_name': 'System',
    'last_name': 'Administrator',
    'display_name': 'System Administrator'
}

async def connect_database(database_name=None):
    """Create database connection"""
    config = DATABASE_CONFIG.copy()
    if database_name:
        config['database'] = database_name
    return await asyncpg.connect(**config)

async def run_sql_file(conn, sql_file_path):
    """Execute SQL file"""
    if not Path(sql_file_path).exists():
        raise FileNotFoundError(f"SQL file not found: {sql_file_path}")
    
    with open(sql_file_path, 'r') as f:
        sql_content = f.read()
    
    # Execute the SQL file content
    await conn.execute(sql_content)
    print(f"✅ Applied SQL file: {sql_file_path}")

async def create_tenant_schema():
    """Create the tenant database schema using the proper SQL file"""
    print("🏗️ Creating tenant database schema...")
    
    conn = await connect_database('metadata_erp')
    try:
        # Use the exact same SQL file that the PowerShell script uses
        await run_sql_file(conn, '/app/sql/tenant/01-business-users.sql')
        print("✅ Tenant schema created successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to create tenant schema: {e}")
        return False
    finally:
        await conn.close()

async def create_admin_user():
    """Create the admin user with proper authentication method"""
    print("👤 Creating admin user...")
    
    conn = await connect_database('metadata_erp')
    try:
        # Check if user already exists
        user_exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)",
            ADMIN_USER['email']
        )
        
        if user_exists:
            print(f"ℹ️ User {ADMIN_USER['email']} already exists")
        else:
            # Create the user
            user_id = await conn.fetchval("""
                INSERT INTO users (
                    user_id,
                    tenant_id,
                    email,
                    first_name,
                    last_name,
                    display_name,
                    is_active,
                    is_verified,
                    email_verified,
                    compliance_level,
                    kyc_status,
                    preferred_language,
                    timezone,
                    role,
                    created_at,
                    updated_at
                ) VALUES (
                    '01111111-1111-1111-1111-111111111111'::uuid,
                    $1::uuid,
                    $2,
                    $3,
                    $4,
                    $5,
                    true,
                    true,
                    true,
                    'PREMIUM',
                    'VERIFIED',
                    'en-US',
                    'UTC',
                    'admin',
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                ) RETURNING user_id
            """, 
            TENANT_CONFIG['tenant_id'],
            ADMIN_USER['email'],
            ADMIN_USER['first_name'],
            ADMIN_USER['last_name'],
            ADMIN_USER['display_name']
            )
            print(f"✅ Created user: {ADMIN_USER['email']}")
        
        # Create password authentication method
        await create_auth_method(conn)
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to create admin user: {e}")
        return False
    finally:
        await conn.close()

async def create_auth_method(conn):
    """Create password authentication method for admin user"""
    print("🔐 Creating password authentication method...")
    
    try:
        # Check if auth method already exists
        auth_exists = await conn.fetchval("""
            SELECT EXISTS(
                SELECT 1 FROM auth_methods am 
                JOIN users u ON am.user_id = u.user_id 
                WHERE u.email = $1 AND am.method_type = 'PASSWORD'
            )
        """, ADMIN_USER['email'])
        
        if auth_exists:
            print("ℹ️ Password authentication method already exists")
            # Update the existing method with new password hash
            password_hash = bcrypt.hashpw(
                ADMIN_USER['password'].encode('utf-8'), 
                bcrypt.gensalt()
            ).decode('utf-8')
            
            await conn.execute("""
                UPDATE auth_methods 
                SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = (SELECT user_id FROM users WHERE email = $2) 
                AND method_type = 'PASSWORD'
            """, password_hash, ADMIN_USER['email'])
            print("✅ Updated existing password authentication method")
        else:
            # Generate bcrypt password hash
            password_hash = bcrypt.hashpw(
                ADMIN_USER['password'].encode('utf-8'), 
                bcrypt.gensalt()
            ).decode('utf-8')
            
            # Create auth method
            await conn.execute("""
                INSERT INTO auth_methods (
                    user_id,
                    tenant_id,
                    method_type,
                    is_primary,
                    is_enabled,
                    password_hash,
                    setup_completed_at,
                    created_at,
                    updated_at
                ) VALUES (
                    (SELECT user_id FROM users WHERE email = $1),
                    $2::uuid,
                    'PASSWORD',
                    true,
                    true,
                    $3,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                )
            """, 
            ADMIN_USER['email'],
            TENANT_CONFIG['tenant_id'],
            password_hash
            )
            print("✅ Created password authentication method")
            
    except Exception as e:
        print(f"❌ Failed to create auth method: {e}")
        raise

async def verify_setup():
    """Verify that everything was set up correctly"""
    print("🔍 Verifying setup...")
    
    conn = await connect_database('metadata_erp')
    try:
        # Check required tables exist
        tables = await conn.fetch("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'auth_sessions', 'auth_methods', 'magic_links')
        """)
        
        table_names = [row['table_name'] for row in tables]
        required_tables = ['users', 'auth_sessions', 'auth_methods', 'magic_links']
        
        missing_tables = set(required_tables) - set(table_names)
        if missing_tables:
            print(f"❌ Missing tables: {missing_tables}")
            return False
        
        print(f"✅ All required tables exist: {table_names}")
        
        # Check admin user exists
        user = await conn.fetchrow(
            "SELECT user_id, email, is_active FROM users WHERE email = $1",
            ADMIN_USER['email']
        )
        
        if not user:
            print(f"❌ Admin user not found: {ADMIN_USER['email']}")
            return False
        
        print(f"✅ Admin user exists: {user['email']} (active: {user['is_active']})")
        
        # Check auth method exists
        auth_method = await conn.fetchrow("""
            SELECT am.method_type, am.is_enabled, length(am.password_hash) as hash_length
            FROM auth_methods am 
            JOIN users u ON am.user_id = u.user_id 
            WHERE u.email = $1 AND am.method_type = 'PASSWORD'
        """, ADMIN_USER['email'])
        
        if not auth_method:
            print(f"❌ Password authentication method not found")
            return False
        
        print(f"✅ Auth method exists: {auth_method['method_type']} (enabled: {auth_method['is_enabled']}, hash_length: {auth_method['hash_length']})")
        
        # Test password verification
        password_hash = await conn.fetchval("""
            SELECT am.password_hash
            FROM auth_methods am 
            JOIN users u ON am.user_id = u.user_id 
            WHERE u.email = $1 AND am.method_type = 'PASSWORD'
        """, ADMIN_USER['email'])
        
        if password_hash:
            password_valid = bcrypt.checkpw(
                ADMIN_USER['password'].encode('utf-8'),
                password_hash.encode('utf-8')
            )
            
            if password_valid:
                print("✅ Password verification test passed")
            else:
                print("❌ Password verification test failed")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False
    finally:
        await conn.close()

async def main():
    """Main setup function"""
    print("🚀 Starting Complete Docker Database Setup")
    print("=" * 50)
    
    try:
        # Step 1: Create tenant schema
        if not await create_tenant_schema():
            sys.exit(1)
        
        # Step 2: Create admin user and auth method
        if not await create_admin_user():
            sys.exit(1)
        
        # Step 3: Verify setup
        if not await verify_setup():
            sys.exit(1)
        
        print("\n" + "=" * 50)
        print("🎉 DOCKER DATABASE SETUP COMPLETE!")
        print("=" * 50)
        print(f"✅ Database: {DATABASE_CONFIG['database']}")
        print(f"✅ Admin user: {ADMIN_USER['email']}")
        print(f"✅ Password: {ADMIN_USER['password']}")
        print(f"✅ Tenant: {TENANT_CONFIG['tenant_name']}")
        print("\n🔗 You can now login to the legal app!")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
