#!/usr/bin/env python3
"""
Docker Auth Methods Setup Script
================================
Creates just the missing auth_methods table and admin user auth method.
This works with the existing database created by seed_all.py.
"""

import asyncio
import asyncpg
import bcrypt
import sys

# Configuration
DATABASE_CONFIG = {
    'host': 'postgres',
    'port': 5432,
    'user': 'postgres',
    'password': '',
    'database': 'metadata_erp'
}

TENANT_CONFIG = {
    'tenant_id': '89f84fea-b5b9-413c-945b-002c7fd9555d'
}

ADMIN_USER = {
    'email': 'admin@demo-eshop-crm.local',
    'password': ''
}

async def connect_database():
    """Create database connection"""
    return await asyncpg.connect(**DATABASE_CONFIG)

async def create_auth_methods_table():
    """Create the auth_methods table only"""
    print("🔐 Creating auth_methods table...")
    
    conn = await connect_database()
    try:
        # Check if table already exists
        table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'auth_methods'
            )
        """)
        
        if table_exists:
            print("ℹ️ auth_methods table already exists")
            return True
        
        # Create the auth_methods table (extracted from sql/tenant/01-business-users.sql)
        await conn.execute("""
            CREATE TABLE auth_methods (
                method_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                tenant_id UUID NOT NULL,
                
                -- Method information
                method_type VARCHAR(50) NOT NULL, -- PASSWORD, MAGIC_LINK, TOTP_2FA, WEBAUTHN, SSO
                is_primary BOOLEAN DEFAULT false, -- Primary authentication method
                is_enabled BOOLEAN DEFAULT true,
                
                -- Method-specific credentials (encrypted/hashed)
                credentials_json JSONB, -- Method-specific data (encrypted)
                
                -- Password method data
                password_hash VARCHAR(255), -- bcrypt hash
                password_salt VARCHAR(255), -- Additional salt if needed
                
                -- TOTP 2FA method data
                totp_secret VARCHAR(255), -- Encrypted TOTP secret
                totp_backup_codes_json JSONB, -- Encrypted backup codes
                totp_last_used_code VARCHAR(10), -- Prevent replay attacks
                
                -- WebAuthn method data
                webauthn_credential_id VARCHAR(500), -- Base64 encoded credential ID
                webauthn_public_key TEXT, -- Public key for verification
                webauthn_counter INTEGER DEFAULT 0, -- Signature counter
                webauthn_transports TEXT[], -- Supported transports
                
                -- Magic Link method data
                magic_link_last_sent_at TIMESTAMP WITH TIME ZONE,
                magic_link_send_count INTEGER DEFAULT 0, -- Rate limiting
                
                -- SSO method data
                sso_provider VARCHAR(100), -- google, microsoft, saml, etc.
                sso_external_id VARCHAR(255), -- External user ID
                sso_last_token_refresh TIMESTAMP WITH TIME ZONE,
                
                -- Security metadata
                setup_completed_at TIMESTAMP WITH TIME ZONE,
                last_used_at TIMESTAMP WITH TIME ZONE,
                last_success_at TIMESTAMP WITH TIME ZONE,
                failed_attempts INTEGER DEFAULT 0,
                locked_until TIMESTAMP WITH TIME ZONE,
                
                -- Audit
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create indexes
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_auth_methods_user ON auth_methods(user_id);
            CREATE INDEX IF NOT EXISTS idx_auth_methods_tenant ON auth_methods(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_auth_methods_type ON auth_methods(method_type);
            CREATE INDEX IF NOT EXISTS idx_auth_methods_primary ON auth_methods(is_primary) WHERE is_primary = true;
            CREATE INDEX IF NOT EXISTS idx_auth_methods_enabled ON auth_methods(is_enabled);
        """)
        
        # Create unique constraint for user + method type
        await conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_methods_user_type 
            ON auth_methods(user_id, method_type);
        """)
        
        # Create update trigger
        await conn.execute("""
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
            
            CREATE TRIGGER update_auth_methods_updated_at 
            BEFORE UPDATE ON auth_methods 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """)
        
        print("✅ auth_methods table created successfully")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create auth_methods table: {e}")
        return False
    finally:
        await conn.close()

async def create_admin_auth_method():
    """Create password authentication method for admin user"""
    print("👤 Creating admin authentication method...")
    
    conn = await connect_database()
    try:
        # Check if admin user exists
        admin_user = await conn.fetchrow(
            "SELECT user_id, email FROM users WHERE email = $1",
            ADMIN_USER['email']
        )
        
        if not admin_user:
            print(f"❌ Admin user not found: {ADMIN_USER['email']}")
            return False
        
        print(f"ℹ️ Found admin user: {admin_user['user_id']}")
        
        # Check if auth method already exists
        auth_exists = await conn.fetchval("""
            SELECT EXISTS(
                SELECT 1 FROM auth_methods 
                WHERE user_id = $1 AND method_type = 'PASSWORD'
            )
        """, admin_user['user_id'])
        
        if auth_exists:
            print("ℹ️ Password authentication method already exists")
            # Update the existing method with new password hash
            password_hash = bcrypt.hashpw(
                ADMIN_USER['password'].encode('utf-8'), 
                bcrypt.gensalt()
            ).decode('utf-8')
            
            await conn.execute("""
                UPDATE auth_methods 
                SET password_hash = $1, 
                    updated_at = CURRENT_TIMESTAMP,
                    is_enabled = true,
                    is_primary = true
                WHERE user_id = $2 AND method_type = 'PASSWORD'
            """, password_hash, admin_user['user_id'])
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
                    $1,
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
            admin_user['user_id'],
            TENANT_CONFIG['tenant_id'],
            password_hash
            )
            print("✅ Created password authentication method")
        
        return True
            
    except Exception as e:
        print(f"❌ Failed to create auth method: {e}")
        return False
    finally:
        await conn.close()

async def verify_setup():
    """Verify authentication setup works"""
    print("🔍 Verifying authentication setup...")
    
    conn = await connect_database()
    try:
        # Check admin user and auth method
        result = await conn.fetchrow("""
            SELECT 
                u.user_id,
                u.email,
                u.is_active,
                am.method_type,
                am.is_enabled,
                am.is_primary,
                length(am.password_hash) as hash_length
            FROM users u
            JOIN auth_methods am ON u.user_id = am.user_id
            WHERE u.email = $1 AND am.method_type = 'PASSWORD'
        """, ADMIN_USER['email'])
        
        if not result:
            print(f"❌ Admin user or auth method not found")
            return False
        
        print(f"✅ User: {result['email']} (active: {result['is_active']})")
        print(f"✅ Auth method: {result['method_type']} (enabled: {result['is_enabled']}, primary: {result['is_primary']})")
        print(f"✅ Password hash length: {result['hash_length']}")
        
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
                print("✅ Password verification test PASSED")
                return True
            else:
                print("❌ Password verification test FAILED")
                return False
        
        return False
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False
    finally:
        await conn.close()

async def main():
    """Main setup function"""
    print("🚀 Creating Auth Methods for Docker Setup")
    print("=" * 50)
    
    try:
        # Step 1: Create auth_methods table
        if not await create_auth_methods_table():
            sys.exit(1)
        
        # Step 2: Create admin auth method
        if not await create_admin_auth_method():
            sys.exit(1)
        
        # Step 3: Verify setup
        if not await verify_setup():
            sys.exit(1)
        
        print("\n" + "=" * 50)
        print("🎉 AUTH METHODS SETUP COMPLETE!")
        print("=" * 50)
        print(f"✅ Database: {DATABASE_CONFIG['database']}")
        print(f"✅ Admin user: {ADMIN_USER['email']}")
        print(f"✅ Password: {ADMIN_USER['password']}")
        print("\n🔗 Login should now work in the legal app!")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
