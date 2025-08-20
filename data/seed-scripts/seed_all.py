#!/usr/bin/env python3
"""
Master Seed Script - SAP-Style Metadata Platform

Populates the database with initial data from JSON files:
- Metadata (pages, layouts, themes, translations)
- Auth data (tenants, users, roles, permissions)
- Platform data (components, modules, workflows)

Usage:
    cd services/api
    poetry run python ../../data/seed-scripts/seed_all.py
"""

import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import Dict, List, Any
import uuid
from datetime import datetime

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "services" / "api"))

from app.core.database import init_database, AsyncSessionLocal
from app.core.config import get_settings
from app.core.logging import get_logger
from app.models import (
    # Metadata models
    Tenant, PageDefinition, LayoutDefinition, Theme, ThemeProperty, Translation,
    # New theme variant models
    BaseTheme, ThemeVariant, ThemeVariantProperty,
    # Auth models  
    User, Role, Permission, AuthSession,
    # Platform models
    EntityDefinition, FieldDefinition, ComponentDefinition, EntityLayoutDefinition,
    # SAP-style business configuration models
    BusinessConfigMaster, BusinessConfigEntry, BusinessRuleDefinition,
    FieldLocalizationConfig, ProcessConfigMaster,
    # Vertical configuration models
    VerticalDefinition, VerticalTemplate, VerticalMarketplace,
    VerticalDeployment, MarketplaceReview
)

# Configure logging
logger = get_logger("seed_script")

class DataSeeder:
    """Handles seeding of all platform data from JSON files."""
    
    def __init__(self):
        self.settings = get_settings()
        self.data_root = Path(__file__).parent.parent
        self.session = None
        
    async def initialize(self):
        """Initialize database connection."""
        logger.info("🚀 Initializing database connection...")
        await init_database()
        self.session = AsyncSessionLocal()
    
    async def create_auth_tables(self):
        """Create auth service tables if they don't exist."""
        logger.info("🔐 Creating auth service tables...")
        
        try:
            # Check if auth_methods table exists first
            result = await self.session.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'auth_methods'
                );
            """)
            auth_tables_exist = result.scalar()
            
            if not auth_tables_exist:
                logger.info("📋 Auth tables not found, creating them...")
                
                # Create auth_methods table
                await self.session.execute("""
                    CREATE TABLE IF NOT EXISTS auth_methods (
                        method_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                        tenant_id UUID NOT NULL,
                        
                        -- Method information
                        method_type VARCHAR(50) NOT NULL,
                        is_primary BOOLEAN DEFAULT false,
                        is_enabled BOOLEAN DEFAULT true,
                        
                        -- Method-specific credentials (encrypted/hashed)
                        credentials_json JSONB,
                        
                        -- Password method data
                        password_hash VARCHAR(255),
                        password_salt VARCHAR(255),
                        
                        -- TOTP 2FA method data
                        totp_secret VARCHAR(255),
                        totp_backup_codes_json JSONB,
                        totp_last_used_code VARCHAR(10),
                        
                        -- WebAuthn method data
                        webauthn_credential_id VARCHAR(500),
                        webauthn_public_key TEXT,
                        webauthn_counter INTEGER DEFAULT 0,
                        
                        -- Magic Link method data
                        magic_link_last_sent_at TIMESTAMP WITH TIME ZONE,
                        magic_link_send_count INTEGER DEFAULT 0,
                        
                        -- SSO method data
                        sso_provider VARCHAR(100),
                        sso_external_id VARCHAR(255),
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
                
                # Create tenant_auth_config table
                await self.session.execute("""
                    CREATE TABLE IF NOT EXISTS tenant_auth_config (
                        config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
                        auth_methods_enabled VARCHAR(20)[] NOT NULL DEFAULT ARRAY['password'],
                        require_2fa_for_roles VARCHAR(50)[] NOT NULL DEFAULT ARRAY[]::VARCHAR[],
                        password_policy JSONB NOT NULL DEFAULT '{}',
                        session_settings JSONB NOT NULL DEFAULT '{}',
                        sso_settings JSONB NOT NULL DEFAULT '{}',
                        compliance_level VARCHAR(20) NOT NULL DEFAULT 'basic' CHECK (compliance_level IN ('basic', 'enhanced', 'strict', 'critical')),
                        max_concurrent_sessions INTEGER NOT NULL DEFAULT 5,
                        session_timeout_minutes INTEGER NOT NULL DEFAULT 480,
                        require_device_verification BOOLEAN NOT NULL DEFAULT false,
                        allowed_domains TEXT[],
                        blocked_domains TEXT[],
                        ip_allowlist INET[],
                        ip_blocklist INET[],
                        custom_auth_flows JSONB NOT NULL DEFAULT '{}',
                        audit_settings JSONB NOT NULL DEFAULT '{}',
                        notification_settings JSONB NOT NULL DEFAULT '{}',
                        is_active BOOLEAN NOT NULL DEFAULT true,
                        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        created_by UUID REFERENCES users(user_id)
                    );
                """)
                
                # Create permission_definitions table
                await self.session.execute("""
                    CREATE TABLE IF NOT EXISTS permission_definitions (
                        permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
                        name VARCHAR(100) NOT NULL,
                        display_name VARCHAR(200) NOT NULL,
                        description TEXT,
                        category VARCHAR(50) NOT NULL DEFAULT 'general',
                        resource_type VARCHAR(50) NOT NULL,
                        action VARCHAR(50) NOT NULL,
                        scope VARCHAR(20) NOT NULL DEFAULT 'tenant' CHECK (scope IN ('global', 'tenant', 'user')),
                        conditions JSONB NOT NULL DEFAULT '{}',
                        is_system_permission BOOLEAN NOT NULL DEFAULT false,
                        is_active BOOLEAN NOT NULL DEFAULT true,
                        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        created_by UUID REFERENCES users(user_id),
                        UNIQUE(tenant_id, name)
                    );
                """)
                
                # Create auth_sessions table
                await self.session.execute("""
                    CREATE TABLE IF NOT EXISTS auth_sessions (
                        session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                        tenant_id UUID NOT NULL,
                        
                        -- Session tokens (hashed for security)
                        session_token_hash VARCHAR(255) NOT NULL,
                        refresh_token_hash VARCHAR(255) NOT NULL,
                        
                        -- Device information
                        device_type VARCHAR(50) NOT NULL DEFAULT 'unknown',
                        device_id VARCHAR(255),
                        user_agent TEXT,
                        
                        -- Location and security
                        ip_address INET,
                        country_code VARCHAR(2),
                        city VARCHAR(100),
                        risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
                        is_suspicious BOOLEAN NOT NULL DEFAULT false,
                        requires_verification BOOLEAN NOT NULL DEFAULT false,
                        
                        -- Session lifecycle
                        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        
                        -- Authentication context
                        login_method VARCHAR(50) NOT NULL DEFAULT 'password',
                        mfa_verified BOOLEAN NOT NULL DEFAULT false,
                        device_registered BOOLEAN NOT NULL DEFAULT false,
                        
                        -- Session status
                        is_active BOOLEAN NOT NULL DEFAULT true,
                        revoked_at TIMESTAMP WITH TIME ZONE,
                        revoked_by UUID REFERENCES users(user_id),
                        revoked_reason VARCHAR(255)
                    );
                """)
                
                # Create indexes
                await self.session.execute("CREATE INDEX IF NOT EXISTS idx_auth_methods_user ON auth_methods(user_id);")
                await self.session.execute("CREATE INDEX IF NOT EXISTS idx_auth_methods_tenant ON auth_methods(tenant_id);")
                await self.session.execute("CREATE INDEX IF NOT EXISTS idx_auth_methods_type ON auth_methods(method_type);")
                await self.session.execute("CREATE INDEX IF NOT EXISTS idx_tenant_auth_config_tenant ON tenant_auth_config(tenant_id);")
                await self.session.execute("CREATE INDEX IF NOT EXISTS idx_permission_definitions_tenant ON permission_definitions(tenant_id);")
                await self.session.execute("CREATE INDEX IF NOT EXISTS idx_permission_definitions_name ON permission_definitions(name);")
                await self.session.execute("CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);")
                await self.session.execute("CREATE INDEX IF NOT EXISTS idx_auth_sessions_tenant ON auth_sessions(tenant_id);")
                await self.session.execute("CREATE INDEX IF NOT EXISTS idx_auth_sessions_active ON auth_sessions(is_active);")
                await self.session.execute("CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);")
                await self.session.execute("CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash ON auth_sessions(session_token_hash);")
                
                logger.info("✅ Auth service tables created successfully")
            else:
                logger.info("⏭️ Auth tables already exist, skipping creation")
                    
        except Exception as e:
            logger.error(f"❌ Failed to create auth tables: {e}")
            # Don't fail the entire seeding process for this
            logger.warning("⚠️ Continuing with seeding despite auth table creation failure")
        
    async def seed_all(self):
        """Seed all data in correct dependency order."""
        logger.info("🌱 Starting complete data seeding...")
        
        try:
            # 0. Create auth service tables first (required for authentication)
            await self.create_auth_tables()
            await self.session.commit()
            logger.info("💾 Committed: Auth service tables")
            
            # 1. Tenants first (everything depends on tenants)
            await self.seed_tenants()
            await self.session.commit()
            logger.info("💾 Committed: Tenants")
            
            # 2. Auth data (roles, permissions, users)
            await self.seed_roles()
            await self.seed_permissions()
            await self.seed_role_permissions()
            await self.seed_users()
            await self.seed_auth_methods()
            await self.session.commit()
            logger.info("💾 Committed: Auth data")
            
            # 3. Metadata (pages, layouts, themes, translations)
            await self.seed_layouts()
            await self.seed_theme_variants()
            await self.seed_translations()
            await self.seed_pages()
            await self.session.commit()
            logger.info("💾 Committed: Metadata (ADMIN PAGES INCLUDED!)")
            
            # 4. Platform data (entities, components) - SKIP FOR NOW
            await self.seed_entities()
            await self.seed_components()
            await self.session.commit()
            logger.info("💾 Committed: Platform data")
            
            # 5. SAP-style business configuration
            await self.seed_business_config()
            await self.seed_business_rules()
            await self.seed_field_localization()
            await self.session.commit()
            logger.info("💾 Committed: SAP configuration")
            
            # 5b. Legal vertical business rules and workflows - SKIP problematic ones
            logger.info("⏭️ Skipping problematic Legal sections to avoid rollback")
            # await self.seed_legal_business_rules()  # This has the entity_context error
            # await self.seed_legal_workflows()
            # await self.seed_legal_pages_and_layouts()
            
            # 6. Vertical configuration and marketplace - SKIP FOR NOW  
            logger.info("⏭️ Skipping marketplace sections for now")
            # await self.seed_verticals()
            # await self.seed_vertical_templates()
            # await self.seed_marketplace_listings()
            
            logger.info("✅ CORE DATA SEEDED SUCCESSFULLY! Admin app should work!")
            
        except Exception as e:
            logger.error(f"❌ Seeding failed: {e}")
            await self.session.rollback()
            raise
        finally:
            await self.session.close()
    
    def load_json_data(self, file_path: str) -> List[Dict[str, Any]]:
        """Load and parse JSON data file."""
        full_path = self.data_root / file_path
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                logger.info(f"📁 Loaded {len(data) if isinstance(data, list) else 1} records from {file_path}")
                return data if isinstance(data, list) else [data]
        except FileNotFoundError:
            logger.warning(f"⚠️ File not found: {file_path}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error in {file_path}: {e}")
            return []
    
    async def seed_tenants(self):
        """Seed tenant data."""
        logger.info("🏢 Seeding tenants...")
        tenants_data = self.load_json_data("auth/tenants/demo-tenants.json")
        
        for tenant_data in tenants_data:
            # Check if tenant already exists
            existing = await self.session.get(Tenant, tenant_data["tenant_id"])
            if existing:
                logger.info(f"⏭️ Tenant {tenant_data['tenant_name']} already exists")
                continue
                
            # Map JSON fields to model fields
            tenant = Tenant(
                tenant_id=tenant_data["tenant_id"],
                name=tenant_data["tenant_name"],  # tenant_name -> name
                domain=f"{tenant_data['tenant_name']}.local",  # Generate domain from tenant_name
                subdomain=tenant_data["tenant_name"],  # Use tenant_name as subdomain
                default_locale=tenant_data.get("locale", "en-US"),  # locale -> default_locale
                supported_locales=[tenant_data.get("locale", "en-US"), "en-US"],  # Default supported locales
                status="active" if tenant_data.get("is_active", True) else "suspended",  # is_active -> status
                database_name=f"metadata_tenant_{tenant_data['tenant_name'].replace('-', '_')}",  # Generate DB name
                max_users=tenant_data.get("metadata_json", {}).get("limits", {}).get("max_users", 10),  # From metadata
                subscription_plan=tenant_data.get("subscription_tier", "basic"),  # subscription_tier -> subscription_plan
                subscription_status="active",  # Default to active
                industry_vertical=tenant_data.get("industry"),  # industry -> industry_vertical
                vertical_packs_installed=[],  # Empty by default
                onboarding_completed=not tenant_data.get("is_demo", False),  # Demo tenants not onboarded
                industry_config=tenant_data.get("metadata_json", {}).get("company_info"),  # Company info as industry config
                features_enabled=tenant_data.get("metadata_json", {}).get("features", {}),  # From metadata features
                created_at=datetime.fromisoformat(tenant_data["created_at"].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(tenant_data["updated_at"].replace('Z', '+00:00'))
            )
            self.session.add(tenant)
            logger.info(f"✅ Added tenant: {tenant.name}")
    
    async def seed_roles(self):
        """Seed role data."""
        logger.info("👥 Seeding roles...")
        
        # Load all role files (system, business, and vertical-specific)
        role_files = [
            "auth/roles/system-roles.json",        # System roles
            "auth/roles/business-roles.json",      # Generic business templates
            "auth/roles/ecommerce-roles.json",     # E-commerce vertical
            "auth/roles/automotive-roles.json",    # Automotive vertical
            "auth/roles/oilgas-roles.json",        # Oil & Gas vertical
            "auth/roles/agtech-roles.json",        # AgTech vertical
            "auth/roles/fintech-roles.json",       # FinTech vertical
            "auth/roles/insurance-roles.json",     # Insurance vertical
            "auth/roles/maritime-roles.json"       # Maritime vertical
        ]
        
        all_roles = []
        for file_path in role_files:
            try:
                roles_data = self.load_json_data(file_path)
                all_roles.extend(roles_data)
            except Exception as e:
                logger.warning(f"⚠️ Role file not found: {file_path} (skipping)")
                continue
        
        for role_data in all_roles:
            # Check if role already exists
            existing = await self.session.get(Role, role_data["role_id"])
            if existing:
                logger.info(f"⏭️ Role {role_data['role_name']} already exists")
                continue
                
            # Map JSON fields to model fields
            role = Role(
                role_id=role_data["role_id"],
                tenant_id=None,  # System roles and templates have NULL tenant_id
                name=role_data["role_name"],  # role_name -> name
                display_name=role_data["display_name"],
                description=role_data.get("description"),
                is_system_role=role_data.get("is_system_role", False),
                is_active=role_data.get("is_active", True),
                is_default=False,  # Default to False
                is_template=role_data.get("is_template", False),  # NEW: Template flag
                vertical=role_data.get("vertical"),  # NEW: Industry vertical
                parent_role_id=role_data.get("parent_role_id"),
                level=role_data.get("hierarchy_level", 5),  # hierarchy_level -> level
                max_users=role_data.get("metadata_json", {}).get("max_users"),  # From metadata
                created_at=datetime.fromisoformat(role_data["created_at"].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(role_data["updated_at"].replace('Z', '+00:00'))
            )
            self.session.add(role)
            vertical_text = f" ({role.vertical})" if role.vertical else ""
            template_text = " [TEMPLATE]" if role.is_template else ""
            logger.info(f"✅ Added role: {role.display_name}{vertical_text}{template_text}")
    
    async def seed_permissions(self):
        """Seed permission data."""
        logger.info("🔐 Seeding permissions...")
        
        # Load all permission files
        system_perms = self.load_json_data("auth/permissions/system-permissions.json")
        business_perms = self.load_json_data("auth/permissions/business-permissions.json")
        platform_perms = self.load_json_data("auth/permissions/platform-permissions.json")
        tenant_perms = self.load_json_data("auth/permissions/tenant-permissions.json") 
        app_perms = self.load_json_data("auth/permissions/app-permissions.json")
        marketplace_perms = self.load_json_data("auth/permissions/marketplace-permissions.json")
        application_perms = self.load_json_data("auth/permissions/application-permissions.json")
        
        all_permissions = (system_perms + business_perms + platform_perms + 
                         tenant_perms + app_perms + marketplace_perms + application_perms)
        
        for perm_data in all_permissions:
            # Check if permission already exists
            existing = await self.session.get(Permission, perm_data["permission_id"])
            if existing:
                logger.info(f"⏭️ Permission {perm_data['permission_name']} already exists")
                continue
                
            # Handle both old and new permission formats
            permission = Permission(
                permission_id=perm_data["permission_id"],
                name=perm_data["permission_name"],  # Map permission_name -> name
                display_name=perm_data["display_name"],
                description=perm_data.get("description"),
                # New 4-level permissions have scope/module/feature/action
                module=perm_data.get("module") or perm_data.get("category", "system"),
                action=perm_data.get("action") or perm_data.get("activity", "execute"),
                resource=perm_data.get("feature") or perm_data.get("object_class"),  # feature for new, object_class for old
                is_system_permission=perm_data.get("is_system_permission", False),
                is_active=perm_data.get("is_active", True),
                requires_2fa=perm_data.get("requires_approval", False),  # Map requires_approval -> requires_2fa
                scope=perm_data.get("scope", "tenant").lower(),  # Ensure lowercase scope
                conditions=perm_data.get("metadata_json"),  # Map metadata_json -> conditions
                created_at=datetime.fromisoformat(perm_data["created_at"].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(perm_data.get("updated_at", perm_data["created_at"]).replace('Z', '+00:00'))
            )
            self.session.add(permission)
            logger.info(f"✅ Added permission: {permission.display_name}")

    async def seed_role_permissions(self):
        """Seed role-permission assignments."""
        logger.info("🔗 Seeding role-permission assignments...")
        
        # Load role-permission assignments
        assignments_data = self.load_json_data("auth/role-permissions/default-role-permissions.json")
        
        for assignment_data in assignments_data:
            # Check if assignment already exists
            from sqlalchemy import select, and_
            from app.models.auth import role_permissions
            
            existing = await self.session.execute(
                select(role_permissions).where(
                    and_(
                        role_permissions.c.role_id == assignment_data["role_id"],
                        role_permissions.c.permission_id == assignment_data["permission_id"]
                    )
                )
            )
            if existing.fetchone():
                logger.info(f"⏭️ Role-permission assignment already exists: {assignment_data['description']}")
                continue
            
            # Insert role-permission assignment
            await self.session.execute(
                role_permissions.insert().values(
                    role_id=assignment_data["role_id"],
                    permission_id=assignment_data["permission_id"],
                    granted_at=datetime.fromisoformat(assignment_data["granted_at"].replace('Z', '+00:00')),
                    granted_by=assignment_data.get("granted_by")
                )
            )
            
            logger.info(f"✅ Added role-permission: {assignment_data['description']}")
    
    async def seed_users(self):
        """Seed user data with auth methods."""
        logger.info("👤 Seeding users...")
        users_data = self.load_json_data("auth/users/demo-users.json")
        
        for user_data in users_data:
            # Check if user already exists (by ID or email)
            existing_by_id = await self.session.get(User, user_data["user_id"])
            if existing_by_id:
                logger.info(f"⏭️ User with ID {user_data['user_id']} already exists")
                continue
            
            # Also check by email to avoid unique constraint violations
            from sqlalchemy import select
            existing_by_email = await self.session.execute(
                select(User).where(User.email == user_data["email"])
            )
            if existing_by_email.scalar_one_or_none():
                logger.info(f"⏭️ User with email {user_data['email']} already exists")
                continue
                
            user = User(
                user_id=user_data["user_id"],
                tenant_id=user_data["tenant_id"], 
                email=user_data["email"],
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                display_name=user_data["display_name"],
                username=user_data.get("username"),
                # Note: phone field doesn't exist in API service User model
                phone_verified=user_data.get("phone_verified", False),
                # Note: avatar_url field doesn't exist in API service User model
                timezone=user_data.get("timezone", "UTC"),
                preferred_language=user_data.get("locale", "en-US"),  # locale -> preferred_language
                is_active=user_data.get("is_active", True),
                is_verified=user_data.get("is_verified", True),
                email_verified=user_data.get("is_verified", True),  # Map is_verified to email_verified
                # Note: two_factor_enabled field doesn't exist in API service User model
                # Note: passkey_enabled field doesn't exist in API service User model
                compliance_level=user_data.get("compliance_level", "basic").upper(),  # Convert to uppercase
                last_login_at=None,  # last_login -> last_login_at (always None for new users)
                # Note: metadata_json field doesn't exist in API service User model - store in auth_methods_json
                auth_methods_json=user_data.get("metadata_json", {}),
                created_at=datetime.fromisoformat(user_data["created_at"].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(user_data["updated_at"].replace('Z', '+00:00'))
            )
            self.session.add(user)
            
            # Note: Auth methods are handled by the auth service, not the API service
            # The API service User model only stores basic user info for metadata operations
            
            logger.info(f"✅ Added user: {user.display_name}")
    
    async def seed_auth_methods(self):
        """Seed demo authentication methods for users."""
        logger.info("🔐 Seeding authentication methods...")
        
        try:
            import bcrypt
            import uuid
            
            # Demo users with their passwords
            demo_users = [
                {
                    "user_id": "01111111-1111-1111-1111-111111111111",
                    "tenant_id": "89f84fea-b5b9-413c-945b-002c7fd9555d",
                    "password": ""
                },
                {
                    "user_id": "02222222-2222-2222-2222-222222222222", 
                    "tenant_id": "89f84fea-b5b9-413c-945b-002c7fd9555d",
                    "password": ""
                },
                {
                    "user_id": "03333333-3333-3333-3333-333333333333",
                    "tenant_id": "89f84fea-b5b9-413c-945b-002c7fd9555d", 
                    "password": ""
                }
            ]
            
            for user_data in demo_users:
                # Check if auth method already exists
                result = await self.session.execute("""
                    SELECT method_id FROM auth_methods 
                    WHERE user_id = %s AND method_type = 'PASSWORD'
                """, (user_data["user_id"],))
                
                existing = result.scalar()
                if existing:
                    logger.info(f"⏭️ Auth method already exists for user {user_data['user_id']}")
                    continue
                
                # Create password hash
                password = user_data["password"]
                salt = bcrypt.gensalt()
                password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
                password_salt = salt.decode('utf-8')
                
                # Insert auth method
                await self.session.execute("""
                    INSERT INTO auth_methods (
                        method_id, user_id, tenant_id, method_type, is_primary, is_enabled,
                        password_hash, password_salt, created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, 'PASSWORD', true, true,
                        %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    )
                """, (
                    str(uuid.uuid4()), 
                    user_data["user_id"], 
                    user_data["tenant_id"],
                    password_hash, 
                    password_salt
                ))
                
                logger.info(f"✅ Created auth method for user {user_data['user_id']}")
                
        except Exception as e:
            logger.error(f"❌ Error seeding auth methods: {e}")
            # Don't raise - this is not critical for the core seeding
            logger.warning("⚠️ Continuing with seeding despite auth method creation failure")
    
    async def seed_layouts(self):
        """Seed layout definitions."""
        logger.info("🏗️ Seeding layouts...")
        
        layout_files = [
            # Admin layouts
            "metadata/apps/admin/layouts/centered-auth-layout.json",
            "metadata/apps/admin/layouts/dashboard-layout.json"
        ]
        
        for file_path in layout_files:
            layouts_data = self.load_json_data(file_path)
            
            for layout_data in layouts_data:
                # Check if layout already exists
                existing = await self.session.get(LayoutDefinition, layout_data["layout_id"])
                if existing:
                    logger.info(f"⏭️ Layout {layout_data['name']} already exists")
                    continue
                    
                layout = LayoutDefinition(
                    layout_id=layout_data["layout_id"],
                    name=layout_data["name"],
                    display_name=layout_data["display_name"],
                    description=layout_data.get("description"),
                    category=layout_data.get("category"),
                    sections_json=layout_data.get("sections_json", {}),
                    css_classes_json=layout_data.get("css_classes_json", {}),
                    container_classes=layout_data.get("container_classes"),
                    is_responsive=layout_data.get("is_responsive", True),
                    supports_theming=layout_data.get("supports_theming", True),
                    is_system_layout=layout_data.get("is_system_layout", True),
                    tenant_id=layout_data.get("tenant_id"),
                    created_at=datetime.fromisoformat(layout_data["created_at"].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(layout_data["updated_at"].replace('Z', '+00:00'))
                )
                self.session.add(layout)
                logger.info(f"✅ Added layout: {layout.display_name}")
    
    async def seed_theme_variants(self):
        """Seed theme variants (BaseTheme + ThemeVariant + ThemeVariantProperty)."""
        logger.info("🎨 Seeding theme variants...")
        
        theme_files = [
            # Admin themes (could be shared across apps later)
            "metadata/apps/admin/themes/default-base-theme.json",
            "metadata/apps/admin/themes/professional-base-theme.json"
        ]
        
        for file_path in theme_files:
            base_themes_data = self.load_json_data(file_path)
            
            for base_theme_data in base_themes_data:
                # Check if base theme already exists
                existing = await self.session.get(BaseTheme, base_theme_data["base_theme_id"])
                if existing:
                    logger.info(f"⏭️ Base theme {base_theme_data['name']} already exists")
                    continue
                    
                # Create base theme
                base_theme = BaseTheme(
                    base_theme_id=base_theme_data["base_theme_id"],
                    name=base_theme_data["name"],
                    display_name=base_theme_data["display_name"],
                    description=base_theme_data.get("description"),
                    category=base_theme_data.get("category"),
                    tags=base_theme_data.get("tags", []),
                    is_system_theme=base_theme_data.get("is_system_theme", True),
                    is_active=base_theme_data.get("is_active", True),
                    is_featured=base_theme_data.get("is_featured", False),
                    version=base_theme_data.get("version", "1.0.0"),
                    tenant_id=base_theme_data.get("tenant_id"),
                    created_at=datetime.fromisoformat(base_theme_data["created_at"].replace('Z', '+00:00')) if "created_at" in base_theme_data else None,
                    updated_at=datetime.fromisoformat(base_theme_data["updated_at"].replace('Z', '+00:00')) if "updated_at" in base_theme_data else None
                )
                self.session.add(base_theme)
                
                # Process variants
                for variant_data in base_theme_data.get("variants", []):
                    # Create theme variant
                    theme_variant = ThemeVariant(
                        variant_id=variant_data["variant_id"],
                        base_theme_id=base_theme.base_theme_id,
                        variant_name=variant_data["variant_name"],
                        display_name=variant_data["display_name"],
                        description=variant_data.get("description"),
                        is_default=variant_data.get("is_default", False),
                        is_active=variant_data.get("is_active", True),
                        supports_auto_switch=variant_data.get("supports_auto_switch", True),
                        css_class_prefix=variant_data.get("css_class_prefix"),
                        media_query=variant_data.get("media_query"),
                        created_at=datetime.fromisoformat(variant_data.get("created_at", base_theme_data["created_at"]).replace('Z', '+00:00')),
                        updated_at=datetime.fromisoformat(variant_data.get("updated_at", base_theme_data["updated_at"]).replace('Z', '+00:00'))
                    )
                    self.session.add(theme_variant)
                    
                    # Add variant properties
                    for prop_data in variant_data.get("properties", []):
                        variant_prop = ThemeVariantProperty(
                            variant_id=theme_variant.variant_id,
                            property_key=prop_data["property_key"],
                            property_value=prop_data["property_value"],
                            property_type=prop_data.get("property_type"),
                            category=prop_data.get("category"),
                            subcategory=prop_data.get("subcategory"),
                            description=prop_data.get("description"),
                            css_selector=prop_data.get("css_selector"),
                            important=prop_data.get("important", False)
                        )
                        self.session.add(variant_prop)
                    
                    logger.info(f"  ✅ Added variant: {variant_data['display_name']}")
                
                logger.info(f"✅ Added base theme: {base_theme.display_name}")
    
    async def seed_translations(self):
        """Seed translation data."""
        logger.info("🌐 Seeding translations...")
        
        translation_files = [
            # Admin translations (contains app-builder and platform translations)
            "metadata/apps/admin/translations/en-translations.json",
            "metadata/apps/admin/translations/el-translations.json",
            # Legal vertical translations
            "verticals/legal/translations/en-US.json",
            "verticals/legal/translations/es-US.json"
        ]
        
        for file_path in translation_files:
            translations_data = self.load_json_data(file_path)
            
            # Debug logging
            logger.info(f"🔍 Processing translation file: {file_path}")
            logger.info(f"🔍 Data type: {type(translations_data)}")
            
            # Check if this is a legal translation (wrapped dict) vs admin translation (array)
            if (isinstance(translations_data, list) and 
                len(translations_data) == 1 and 
                isinstance(translations_data[0], dict) and 
                "_metadata" in translations_data[0]):
                # Legal format: flat key-value pairs with _metadata (wrapped in array by load_json_data)
                data = translations_data[0]  # Extract the dict from the array
                metadata = data.get("_metadata", {})
                locale = metadata.get("language_code", "en")
                
                logger.info(f"🔍 Legal format detected - Locale: {locale}")
                
                for key, text in data.items():
                    if key.startswith("_metadata"):
                        continue  # Skip metadata
                    
                    # Only process string values (translations)
                    if isinstance(text, str):
                        translation = Translation(
                            locale=locale,
                            namespace="common",  # Use common namespace for flat keys
                            key=key,
                            text=text,
                            context=None,
                            is_system_translation=True,
                            tenant_id=None,
                            created_at=datetime.now(),
                            updated_at=datetime.now()
                        )
                        self.session.add(translation)
            elif isinstance(translations_data, list):
                # Admin format: array of translation objects
                logger.info(f"🔍 Admin format detected - Processing {len(translations_data)} items")
                for trans_data in translations_data:
                    translation = Translation(
                        locale=trans_data["locale"],
                        namespace=trans_data["namespace"],
                        key=trans_data["key"],
                        text=trans_data["text"],
                        context=trans_data.get("context"),  # Map description -> context
                        is_system_translation=True,
                        tenant_id=None,
                        created_at=datetime.fromisoformat(trans_data.get("created_at", "2025-01-29T00:00:00+00:00").replace('Z', '+00:00')),
                        updated_at=datetime.fromisoformat(trans_data.get("updated_at", "2025-01-29T00:00:00+00:00").replace('Z', '+00:00'))
                    )
                    self.session.add(translation)
            
            logger.info(f"✅ Added translations from: {file_path}")
    
    async def seed_pages(self):
        """Seed page definitions."""
        logger.info("📄 Seeding pages...")
        
        page_files = [
            # Client app pages
            "metadata/apps/client/pages/login-page.json",
            "metadata/apps/client/pages/dashboard-page.json",
            "metadata/apps/client/pages/roles-catalog-page.json",
            "metadata/apps/client/pages/roles-onboarding-page.json", 
            "metadata/apps/client/pages/roles-management-page.json",
            # Admin app pages
            "metadata/apps/admin/pages/admin-login-page.json",
            "metadata/apps/admin/pages/admin-dashboard-page.json",
            "metadata/apps/admin/pages/app-builder-main-page.json",
            "metadata/apps/admin/pages/app-builder-requirements-page.json",
            # Legal app pages
            "verticals/legal/pages/login.json",
            "verticals/legal/pages/dashboard.json",
            "verticals/legal/pages/clients.json"
        ]
        
        for file_path in page_files:
            pages_data = self.load_json_data(file_path)  # Returns a list
            
            for page_data in pages_data:  # Iterate over the list (usually just 1 item)
                # Extract SEO metadata for dedicated columns
                seo_data = page_data.get("metadata_json", {}).get("seo", {})
                
                # Check if page already exists
                existing = await self.session.get(PageDefinition, page_data["page_id"])
                if existing:
                    logger.info(f"🔄 Updating existing page: {page_data['page_name']}")
                    # Update all fields from JSON
                    existing.page_name = page_data["page_name"]
                    existing.route = page_data["route"]
                    existing.title = page_data["title"]
                    existing.description = page_data.get("description")
                    existing.meta_description = seo_data.get("description")
                    existing.meta_keywords = seo_data.get("keywords")
                    existing.page_type = page_data["page_type"]
                    existing.layout_id = page_data.get("layout_id")
                    existing.sections_data_json = page_data.get("sections_data_json", {})
                    existing.components = page_data.get("components", [])
                    existing.initial_state = page_data.get("initial_state", {})
                    existing.state_bindings = page_data.get("state_bindings", {})
                    existing.api_endpoints = page_data.get("api_endpoints", {})
                    existing.callbacks = page_data.get("callbacks", {})
                    existing.real_time_updates = page_data.get("real_time_updates", False)
                    existing.cache_strategy = page_data.get("cache_strategy")
                    existing.websocket_events = page_data.get("websocket_events")
                    existing.metadata_json = page_data.get("metadata_json", {})
                    existing.access_roles = page_data.get("access_roles", [])
                    existing.is_public = page_data.get("is_public", False)
                    existing.tenant_id = page_data.get("tenant_id")
                    existing.updated_at = datetime.fromisoformat(page_data["updated_at"].replace('Z', '+00:00'))
                    page = existing
                else:
                    logger.info(f"➕ Creating new page: {page_data['page_name']}")
                    page = PageDefinition(
                            page_id=page_data["page_id"],
                            page_name=page_data["page_name"],
                            route=page_data["route"],
                            title=page_data["title"],
                            description=page_data.get("description"),
                            meta_description=seo_data.get("description"),  # SEO meta description
                            meta_keywords=seo_data.get("keywords"),  # SEO meta keywords (JSONB)
                            page_type=page_data["page_type"],
                            layout_id=page_data.get("layout_id"),
                            sections_data_json=page_data.get("sections_data_json", {}),
                            components=page_data.get("components", []),
                            initial_state=page_data.get("initial_state", {}),
                            state_bindings=page_data.get("state_bindings", {}),
                            api_endpoints=page_data.get("api_endpoints", {}),
                            callbacks=page_data.get("callbacks", {}),  # Re-added callbacks field!
                            real_time_updates=page_data.get("real_time_updates", False),
                            cache_strategy=page_data.get("cache_strategy"),
                            websocket_events=page_data.get("websocket_events"),
                            metadata_json=page_data.get("metadata_json", {}),
                            access_roles=page_data.get("access_roles", []),
                            is_public=page_data.get("is_public", False),
                            tenant_id=page_data.get("tenant_id"),
                            created_at=datetime.fromisoformat(page_data["created_at"].replace('Z', '+00:00')),
                            updated_at=datetime.fromisoformat(page_data["updated_at"].replace('Z', '+00:00'))
                    )
                self.session.add(page)
                logger.info(f"✅ Added page: {page.page_name}")
    
    async def seed_entities(self):
        """Seed entity definitions - Legal vertical first."""
        logger.info("📊 Seeding entities...")
        
        # TODO: Fix import issue with legal_entities_seed
        # Temporarily disabled to allow basic seeding to complete
        logger.info("⏭️ Entity seeding temporarily disabled (import issue)")
        
        # Import and use the Legal entities seeder
        # from .legal_entities_seed import seed_legal_entities
        # await seed_legal_entities(self.session)
        
        logger.info("✅ Entity seeding skipped for now")
    
    async def seed_components(self):
        """Seed component definitions (placeholder)."""
        logger.info("🧩 Seeding components...")
        # TODO: Add component seeding when component JSON files are created
        logger.info("⏭️ Component seeding not implemented yet")

    async def seed_business_config(self):
        """Seed SAP-style business configuration master and entries."""
        logger.info("⚙️ Seeding business configuration...")
        
        # First, create business configuration master domains
        master_domains = [
            {
                "config_domain": "ENTITY_RULES",
                "config_table": "business_config_entries",
                "description": "Entity-level business rules and validation",
                "version": "1.0"
            },
            {
                "config_domain": "FIELD_CONFIG",
                "config_table": "business_config_entries", 
                "description": "Field-level configuration and validation",
                "version": "1.0"
            },
            {
                "config_domain": "WORKFLOW",
                "config_table": "business_config_entries",
                "description": "Workflow process configuration",
                "version": "1.0"
            },
            {
                "config_domain": "VALIDATION",
                "config_table": "business_config_entries",
                "description": "Data validation rules and patterns",
                "version": "1.0"
            },
            {
                "config_domain": "CALCULATION",
                "config_table": "business_config_entries",
                "description": "Business calculation formulas",
                "version": "1.0"
            },
            {
                "config_domain": "NOTIFICATION",
                "config_table": "business_config_entries",
                "description": "Notification and alert configuration",
                "version": "1.0"
            },
            {
                "config_domain": "INTEGRATION",
                "config_table": "business_config_entries",
                "description": "External system integration settings",
                "version": "1.0"
            },
            {
                "config_domain": "COMPLIANCE",
                "config_table": "business_config_entries",
                "description": "Regulatory compliance rules",
                "version": "1.0"
            },
            {
                "config_domain": "SECURITY",
                "config_table": "business_config_entries",
                "description": "Security and access control rules",
                "version": "1.0"
            },
            {
                "config_domain": "LOCALIZATION",
                "config_table": "business_config_entries",
                "description": "Country and region-specific configuration",
                "version": "1.0"
            }
        ]
        
        for master_data in master_domains:
            # Check if master config already exists
            from sqlalchemy import select
            existing = await self.session.execute(
                select(BusinessConfigMaster).where(
                    BusinessConfigMaster.config_domain == master_data["config_domain"]
                )
            )
            if existing.scalar_one_or_none():
                logger.info(f"⏭️ Business config master {master_data['config_domain']} already exists")
                continue
                
            master_config = BusinessConfigMaster(
                config_domain=master_data["config_domain"],
                config_table=master_data["config_table"],
                description=master_data["description"],
                version=master_data["version"]
            )
            self.session.add(master_config)
            logger.info(f"✅ Added business config master: {master_config.config_domain}")
        
        # Add some initial business configuration entries
        initial_configs = [
            {
                "config_domain": "VALIDATION",
                "config_key": "US_TAX_ID_VALIDATION",
                "country_code": "US",
                "config_values": {
                    "pattern": "^\\d{2}-\\d{7}$",
                    "format_display": "XX-XXXXXXX",
                    "field_name": "EIN",
                    "description": "US Employer Identification Number validation"
                }
            },
            {
                "config_domain": "VALIDATION",
                "config_key": "US_PHONE_VALIDATION", 
                "country_code": "US",
                "config_values": {
                    "pattern": "^\\+?1?[-.\\s]?\\(?[0-9]{3}\\)?[-.\\s]?[0-9]{3}[-.\\s]?[0-9]{4}$",
                    "format_display": "(XXX) XXX-XXXX",
                    "description": "US phone number validation"
                }
            },
            {
                "config_domain": "ENTITY_RULES",
                "config_key": "CLIENT_REQUIRED_FIELDS",
                "vertical_code": "LEGAL",
                "config_values": {
                    "required_fields": ["client_name", "contact_email", "intake_date"],
                    "conditional_required": {
                        "corporate": ["tax_id", "entity_type"],
                        "individual": ["last_name"]
                    }
                }
            },
            {
                "config_domain": "WORKFLOW",
                "config_key": "CLIENT_INTAKE_PROCESS",
                "vertical_code": "LEGAL",
                "config_values": {
                    "steps": [
                        {"name": "validate_required_fields", "type": "validation"},
                        {"name": "conflict_check", "type": "business_rule"},
                        {"name": "assign_client_number", "type": "calculation"},
                        {"name": "send_welcome_email", "type": "notification"}
                    ],
                    "auto_execute": True
                }
            }
        ]
        
        for config_data in initial_configs:
            # Check if config entry already exists
            from sqlalchemy import select, and_
            existing = await self.session.execute(
                select(BusinessConfigEntry).where(
                    and_(
                        BusinessConfigEntry.config_domain == config_data["config_domain"],
                        BusinessConfigEntry.config_key == config_data["config_key"],
                        BusinessConfigEntry.country_code == config_data.get("country_code"),
                        BusinessConfigEntry.vertical_code == config_data.get("vertical_code")
                    )
                )
            )
            if existing.scalar_one_or_none():
                logger.info(f"⏭️ Business config entry {config_data['config_key']} already exists")
                continue
                
            # Get the master config ID
            master = await self.session.execute(
                select(BusinessConfigMaster).where(
                    BusinessConfigMaster.config_domain == config_data["config_domain"]
                )
            )
            master_config = master.scalar_one()
            
            config_entry = BusinessConfigEntry(
                config_master_id=master_config.id,
                config_domain=config_data["config_domain"],
                config_key=config_data["config_key"],
                country_code=config_data.get("country_code"),
                vertical_code=config_data.get("vertical_code"),
                config_values=config_data["config_values"]
            )
            self.session.add(config_entry)
            logger.info(f"✅ Added business config entry: {config_entry.config_key}")

    async def seed_business_rules(self):
        """Seed SAP-style business rule definitions."""
        logger.info("📋 Seeding business rules...")
        
        # Define initial business rules
        initial_rules = [
            {
                "rule_name": "US Tax ID Validation",
                "rule_category": "VALIDATION",
                "rule_type": "CONDITIONAL",
                "description": "Validates US Tax ID (EIN) format",
                "country_code": "US",
                "trigger_conditions": {
                    "events": ["field_change"],
                    "fields": ["tax_id", "ein"]
                },
                "rule_logic": {
                    "conditions": [
                        {
                            "if": {
                                "field": "tax_id",
                                "operator": "matches",
                                "value": "^\\d{2}-\\d{7}$"
                            },
                            "then": {
                                "result": True,
                                "message": "Valid EIN format"
                            }
                        }
                    ],
                    "default_result": {
                        "result": False,
                        "message": "Invalid EIN format. Use XX-XXXXXXX"
                    }
                },
                "input_parameters": {
                    "required": ["tax_id"],
                    "types": {"tax_id": "string"}
                },
                "execution_order": 100
            },
            {
                "rule_name": "Client Conflict Check",
                "rule_category": "VALIDATION",
                "rule_type": "LOOKUP",
                "description": "Checks for client conflicts in legal practice",
                "vertical_code": "LEGAL",
                "trigger_conditions": {
                    "events": ["entity_create", "entity_update"],
                    "entities": ["Client"]
                },
                "rule_logic": {
                    "lookup_table": "existing_clients",
                    "lookup_key": "client_name",
                    "check_fields": ["opposing_parties", "matter_subjects"],
                    "conflict_threshold": 0.8
                },
                "input_parameters": {
                    "required": ["client_name"],
                    "optional": ["opposing_parties", "matter_subjects"],
                    "types": {
                        "client_name": "string",
                        "opposing_parties": "array",
                        "matter_subjects": "array"
                    }
                },
                "execution_order": 50,
                "is_mandatory": True
            },
            {
                "rule_name": "Auto Client Number Generation",
                "rule_category": "CALCULATION",
                "rule_type": "FORMULA",
                "description": "Automatically generates client numbers",
                "trigger_conditions": {
                    "events": ["entity_create"],
                    "entities": ["Client"]
                },
                "rule_logic": {
                    "formula": "CLT-{YYYY}-{sequence:6}",
                    "variables": {
                        "YYYY": "current_year",
                        "sequence": "auto_increment_per_year"
                    },
                    "sequence_config": {
                        "start": 1,
                        "reset_yearly": True
                    }
                },
                "output_format": {
                    "field": "client_number",
                    "type": "string"
                },
                "execution_order": 200
            }
        ]
        
        for rule_data in initial_rules:
            # Check if rule already exists
            from sqlalchemy import select, and_
            existing = await self.session.execute(
                select(BusinessRuleDefinition).where(
                    and_(
                        BusinessRuleDefinition.rule_name == rule_data["rule_name"],
                        BusinessRuleDefinition.country_code == rule_data.get("country_code"),
                        BusinessRuleDefinition.vertical_code == rule_data.get("vertical_code")
                    )
                )
            )
            if existing.scalar_one_or_none():
                logger.info(f"⏭️ Business rule {rule_data['rule_name']} already exists")
                continue
                
            rule = BusinessRuleDefinition(
                rule_name=rule_data["rule_name"],
                rule_category=rule_data["rule_category"],
                rule_type=rule_data["rule_type"],
                description=rule_data.get("description"),
                country_code=rule_data.get("country_code"),
                vertical_code=rule_data.get("vertical_code"),
                trigger_conditions=rule_data["trigger_conditions"],
                rule_logic=rule_data["rule_logic"],
                input_parameters=rule_data.get("input_parameters"),
                output_format=rule_data.get("output_format"),
                execution_order=rule_data.get("execution_order", 100),
                is_mandatory=rule_data.get("is_mandatory", False)
            )
            self.session.add(rule)
            logger.info(f"✅ Added business rule: {rule.rule_name}")

    async def seed_field_localization(self):
        """Seed field localization configurations."""
        logger.info("🌍 Seeding field localization...")
        
        # Define field localization configs
        field_configs = [
            {
                "entity_name": "Client",
                "field_name": "tax_id",
                "country_code": "US",
                "display_name": "EIN",
                "validation_pattern": "^\\d{2}-\\d{7}$",
                "formatting_rules": {
                    "input_format": "XX-XXXXXXX",
                    "display_format": "XX-XXXXXXX",
                    "input_mask": "99-9999999"
                },
                "help_text": "Enter your Employer Identification Number",
                "placeholder": "12-3456789",
                "is_required": True
            },
            {
                "entity_name": "Client", 
                "field_name": "tax_id",
                "country_code": "CA",
                "display_name": "BN",
                "validation_pattern": "^\\d{9}RT\\d{4}$",
                "formatting_rules": {
                    "input_format": "XXXXXXXXXRTXXXX",
                    "display_format": "XXXXXXXXX RT XXXX"
                },
                "help_text": "Enter your Business Number",
                "placeholder": "123456789RT0001",
                "is_required": True
            },
            {
                "entity_name": "Client",
                "field_name": "phone",
                "country_code": "US",
                "display_name": "Phone Number",
                "validation_pattern": "^\\+?1?[-.\\s]?\\(?[0-9]{3}\\)?[-.\\s]?[0-9]{3}[-.\\s]?[0-9]{4}$",
                "formatting_rules": {
                    "input_format": "(XXX) XXX-XXXX",
                    "display_format": "(XXX) XXX-XXXX",
                    "input_mask": "(999) 999-9999"
                },
                "help_text": "Enter US phone number",
                "placeholder": "(555) 123-4567"
            },
            {
                "entity_name": "Client",
                "field_name": "phone", 
                "country_code": "CA",
                "display_name": "Phone Number",
                "validation_pattern": "^\\+?1?[-.\\s]?\\(?[0-9]{3}\\)?[-.\\s]?[0-9]{3}[-.\\s]?[0-9]{4}$",
                "formatting_rules": {
                    "input_format": "(XXX) XXX-XXXX",
                    "display_format": "(XXX) XXX-XXXX",
                    "input_mask": "(999) 999-9999"
                },
                "help_text": "Enter Canadian phone number",
                "placeholder": "(416) 555-0123"
            }
        ]
        
        for config_data in field_configs:
            # Check if field localization already exists
            from sqlalchemy import select, and_
            existing = await self.session.execute(
                select(FieldLocalizationConfig).where(
                    and_(
                        FieldLocalizationConfig.entity_name == config_data["entity_name"],
                        FieldLocalizationConfig.field_name == config_data["field_name"],
                        FieldLocalizationConfig.country_code == config_data["country_code"]
                    )
                )
            )
            if existing.scalar_one_or_none():
                logger.info(f"⏭️ Field localization {config_data['entity_name']}.{config_data['field_name']} ({config_data['country_code']}) already exists")
                continue
                
            field_config = FieldLocalizationConfig(
                entity_name=config_data["entity_name"],
                field_name=config_data["field_name"],
                country_code=config_data["country_code"],
                display_name=config_data["display_name"],
                validation_pattern=config_data.get("validation_pattern"),
                formatting_rules=config_data.get("formatting_rules"),
                help_text=config_data.get("help_text"),
                placeholder=config_data.get("placeholder"),
                is_required=config_data.get("is_required")
            )
            self.session.add(field_config)
            logger.info(f"✅ Added field localization: {field_config.entity_name}.{field_config.field_name} ({field_config.country_code})")

    async def seed_legal_business_rules(self):
        """Seed Legal vertical-specific business rules."""
        logger.info("⚖️ Seeding Legal business rules...")
        
        legal_business_rules = [
            {
                "rule_name": "client_conflict_check",
                "rule_category": "VALIDATION",
                "entity_context": "Client",
                "priority": 1,
                "condition_logic": {
                    "type": "validation",
                    "triggers": ["before_create", "before_update"],
                    "conditions": [
                        {
                            "field": "client_name",
                            "operator": "conflicts_with",
                            "value": "existing_clients",
                            "check_type": "name_similarity"
                        },
                        {
                            "field": "contact_email",
                            "operator": "conflicts_with", 
                            "value": "existing_clients",
                            "check_type": "email_exact"
                        }
                    ]
                },
                "action_definition": {
                    "on_conflict": {
                        "action": "require_approval",
                        "approver_role": "Managing Partner",
                        "notification": "Potential client conflict detected",
                        "block_creation": True
                    },
                    "no_conflict": {
                        "action": "proceed",
                        "log_check": True
                    }
                },
                "context_filters": {
                    "vertical": "LEGAL",
                    "tenant_type": "LAW_FIRM"
                },
                "rule_description": "Mandatory conflict checking for new clients before intake"
            },
            {
                "rule_name": "matter_budget_tracking",
                "rule_category": "MONITORING",
                "entity_context": "Matter",
                "priority": 2,
                "condition_logic": {
                    "type": "monitoring",
                    "triggers": ["time_entry_created", "expense_added"],
                    "conditions": [
                        {
                            "field": "total_time_cost",
                            "operator": "greater_than",
                            "value": "budget_amount * 0.8",
                            "threshold": "80_percent"
                        },
                        {
                            "field": "total_time_cost",
                            "operator": "greater_than",
                            "value": "budget_amount",
                            "threshold": "100_percent"
                        }
                    ]
                },
                "action_definition": {
                    "80_percent": {
                        "action": "notify",
                        "recipients": ["responsible_attorney", "billing_manager"],
                        "message": "Matter approaching budget limit (80%)"
                    },
                    "100_percent": {
                        "action": "require_approval",
                        "approver_role": "Managing Partner",
                        "block_time_entry": True,
                        "message": "Matter budget exceeded - approval required"
                    }
                },
                "context_filters": {
                    "vertical": "LEGAL",
                    "billing_arrangement": ["Hourly", "Fixed Fee"]
                },
                "rule_description": "Monitor matter budget and alert when limits are approached"
            },
            {
                "rule_name": "billing_rate_validation",
                "rule_category": "VALIDATION",
                "entity_context": "TimeEntry",
                "priority": 1,
                "condition_logic": {
                    "type": "validation",
                    "triggers": ["before_create", "before_update"],
                    "conditions": [
                        {
                            "field": "billable_rate",
                            "operator": "empty",
                            "value": None,
                            "condition": "is_billable == true"
                        },
                        {
                            "field": "billable_rate",
                            "operator": "less_than",
                            "value": "attorney_min_rate",
                            "condition": "is_billable == true"
                        },
                        {
                            "field": "hours",
                            "operator": "greater_than",
                            "value": 16,
                            "condition": "single_day_entry"
                        }
                    ]
                },
                "action_definition": {
                    "missing_rate": {
                        "action": "auto_populate",
                        "source": "matter_billing_rate || attorney_default_rate || firm_default_rate"
                    },
                    "rate_too_low": {
                        "action": "require_approval",
                        "approver_role": "Managing Partner",
                        "message": "Billing rate below minimum threshold"
                    },
                    "excessive_hours": {
                        "action": "require_justification",
                        "required_field": "explanation",
                        "message": "Hours exceed reasonable daily limit"
                    }
                },
                "context_filters": {
                    "vertical": "LEGAL"
                },
                "rule_description": "Validate billing rates and reasonable time entry limits"
            },
            {
                "rule_name": "document_privilege_protection",
                "rule_category": "SECURITY",
                "entity_context": "Document",
                "priority": 1,
                "condition_logic": {
                    "type": "security",
                    "triggers": ["before_create", "before_update", "access_attempt"],
                    "conditions": [
                        {
                            "field": "privilege_level",
                            "operator": "in",
                            "value": ["Attorney-Client Privileged", "Work Product", "Highly Confidential"]
                        }
                    ]
                },
                "action_definition": {
                    "privileged_document": {
                        "action": "restrict_access",
                        "allowed_roles": ["Attorney", "Paralegal", "Managing Partner"],
                        "log_access": True,
                        "require_justification": True
                    },
                    "access_violation": {
                        "action": "deny_and_alert",
                        "alert_recipients": ["Managing Partner", "Compliance Officer"],
                        "log_violation": True
                    }
                },
                "context_filters": {
                    "vertical": "LEGAL"
                },
                "rule_description": "Protect attorney-client privileged and work product documents"
            },
            {
                "rule_name": "statute_limitations_monitoring",
                "rule_category": "MONITORING",
                "entity_context": "Matter",
                "priority": 1,
                "condition_logic": {
                    "type": "monitoring",
                    "triggers": ["daily_check", "matter_status_change"],
                    "conditions": [
                        {
                            "field": "statute_of_limitations",
                            "operator": "within_days",
                            "value": 90,
                            "threshold": "90_days"
                        },
                        {
                            "field": "statute_of_limitations",
                            "operator": "within_days",
                            "value": 30,
                            "threshold": "30_days"
                        },
                        {
                            "field": "statute_of_limitations",
                            "operator": "within_days",
                            "value": 7,
                            "threshold": "7_days"
                        }
                    ]
                },
                "action_definition": {
                    "90_days": {
                        "action": "notify",
                        "recipients": ["responsible_attorney"],
                        "frequency": "weekly",
                        "message": "Statute of limitations approaching (90 days)"
                    },
                    "30_days": {
                        "action": "notify",
                        "recipients": ["responsible_attorney", "Managing Partner"],
                        "frequency": "daily",
                        "message": "URGENT: Statute of limitations approaching (30 days)"
                    },
                    "7_days": {
                        "action": "escalate",
                        "recipients": ["Managing Partner", "all_attorneys"],
                        "frequency": "hourly",
                        "message": "CRITICAL: Statute of limitations expires in 7 days",
                        "require_acknowledgment": True
                    }
                },
                "context_filters": {
                    "vertical": "LEGAL",
                    "matter_status": ["Open", "Active"]
                },
                "rule_description": "Monitor statute of limitations deadlines and escalate alerts"
            }
        ]
        
        for rule_data in legal_business_rules:
            # Check if rule already exists
            from sqlalchemy import select
            existing = await self.session.execute(
                select(BusinessRuleDefinition).where(
                    BusinessRuleDefinition.rule_name == rule_data["rule_name"]
                )
            )
            if existing.scalar_one_or_none():
                logger.info(f"⏭️ Business rule {rule_data['rule_name']} already exists")
                continue
                
            rule = BusinessRuleDefinition(
                rule_name=rule_data["rule_name"],
                rule_category=rule_data["rule_category"],
                entity_context=rule_data["entity_context"],
                priority=rule_data["priority"],
                condition_logic=rule_data["condition_logic"],
                action_definition=rule_data["action_definition"],
                context_filters=rule_data["context_filters"],
                rule_description=rule_data["rule_description"],
                is_active=True
            )
            self.session.add(rule)
            logger.info(f"✅ Added Legal business rule: {rule.rule_name}")
        
        await self.session.commit()

    async def seed_legal_workflows(self):
        """Seed Legal vertical workflows using ProcessConfigMaster."""
        logger.info("🔄 Seeding Legal workflows...")
        
        legal_workflows = [
            {
                "process_code": "CLIENT_INTAKE",
                "process_name": "Client Intake Workflow",
                "process_category": "CLIENT_MANAGEMENT",
                "description": "Complete client onboarding process with conflict checking",
                "process_steps": {
                    "steps": [
                        {
                            "step_id": "initial_contact",
                            "step_name": "Initial Contact",
                            "step_type": "USER_TASK",
                            "step_order": 1,
                            "required": True,
                            "form_fields": ["client_name", "contact_email", "phone", "matter_description"],
                            "validation_rules": ["required_fields", "email_format"],
                            "estimated_duration": 15
                        },
                        {
                            "step_id": "conflict_check",
                            "step_name": "Conflict of Interest Check",
                            "step_type": "AUTOMATED_TASK",
                            "step_order": 2,
                            "required": True,
                            "business_rule": "client_conflict_check",
                            "automated": True,
                            "estimated_duration": 2
                        },
                        {
                            "step_id": "conflict_resolution",
                            "step_name": "Resolve Conflicts",
                            "step_type": "USER_TASK", 
                            "step_order": 3,
                            "required": False,
                            "condition": "conflict_detected == true",
                            "assignee_role": "Managing Partner",
                            "form_fields": ["conflict_details", "resolution_action", "approval_decision"],
                            "estimated_duration": 30
                        },
                        {
                            "step_id": "client_creation",
                            "step_name": "Create Client Record",
                            "step_type": "AUTOMATED_TASK",
                            "step_order": 4,
                            "required": True,
                            "condition": "conflict_approved == true OR no_conflict == true",
                            "entity_action": "create_client",
                            "automated": True,
                            "estimated_duration": 1
                        },
                        {
                            "step_id": "engagement_letter",
                            "step_name": "Send Engagement Letter",
                            "step_type": "USER_TASK",
                            "step_order": 5,
                            "required": True,
                            "form_fields": ["engagement_template", "custom_terms", "fee_structure"],
                            "document_generation": True,
                            "estimated_duration": 20
                        },
                        {
                            "step_id": "intake_complete",
                            "step_name": "Intake Complete",
                            "step_type": "AUTOMATED_TASK",
                            "step_order": 6,
                            "required": True,
                            "entity_action": "update_client_status",
                            "status_value": "Active",
                            "notification": ["responsible_attorney", "billing_manager"],
                            "automated": True,
                            "estimated_duration": 1
                        }
                    ],
                    "parallel_steps": [],
                    "decision_points": [
                        {
                            "step_id": "conflict_resolution",
                            "decision_field": "approval_decision",
                            "routes": {
                                "approved": "client_creation",
                                "denied": "workflow_end_rejected"
                            }
                        }
                    ]
                },
                "trigger_conditions": {
                    "triggers": ["manual_start", "form_submission"],
                    "entities": ["Client"],
                    "events": ["new_prospect_inquiry"]
                },
                "automation_level": "SEMI_AUTOMATED",
                "approval_required": True,
                "context_filters": {
                    "vertical": "LEGAL"
                }
            },
            {
                "process_code": "MATTER_LIFECYCLE",
                "process_name": "Matter Lifecycle Management",
                "process_category": "MATTER_MANAGEMENT",
                "description": "Complete matter management from opening to closure",
                "process_steps": {
                    "steps": [
                        {
                            "step_id": "matter_intake",
                            "step_name": "Matter Intake",
                            "step_type": "USER_TASK",
                            "step_order": 1,
                            "required": True,
                            "form_fields": ["matter_name", "client_id", "practice_area", "matter_type", "responsible_attorney"],
                            "validation_rules": ["required_fields", "client_exists"],
                            "estimated_duration": 10
                        },
                        {
                            "step_id": "matter_conflict_check",
                            "step_name": "Matter-Specific Conflict Check",
                            "step_type": "AUTOMATED_TASK",
                            "step_order": 2,
                            "required": True,
                            "business_rule": "matter_conflict_check",
                            "automated": True,
                            "estimated_duration": 2
                        },
                        {
                            "step_id": "matter_setup",
                            "step_name": "Matter Setup",
                            "step_type": "AUTOMATED_TASK",
                            "step_order": 3,
                            "required": True,
                            "entity_action": "create_matter",
                            "auto_generate": ["matter_number"],
                            "automated": True,
                            "estimated_duration": 1
                        },
                        {
                            "step_id": "billing_setup",
                            "step_name": "Billing Configuration",
                            "step_type": "USER_TASK",
                            "step_order": 4,
                            "required": True,
                            "form_fields": ["billing_arrangement", "billing_rate", "estimated_hours", "budget_amount"],
                            "validation_rules": ["billing_rate_validation"],
                            "estimated_duration": 15
                        },
                        {
                            "step_id": "matter_active",
                            "step_name": "Activate Matter",
                            "step_type": "AUTOMATED_TASK",
                            "step_order": 5,
                            "required": True,
                            "entity_action": "update_matter_status",
                            "status_value": "Active",
                            "notification": ["responsible_attorney", "client"],
                            "automated": True,
                            "estimated_duration": 1
                        }
                    ],
                    "parallel_steps": [],
                    "decision_points": []
                },
                "trigger_conditions": {
                    "triggers": ["manual_start"],
                    "entities": ["Matter"],
                    "events": ["new_matter_request"]
                },
                "automation_level": "SEMI_AUTOMATED",
                "approval_required": False,
                "context_filters": {
                    "vertical": "LEGAL"
                }
            },
            {
                "process_code": "TIME_BILLING",
                "process_name": "Time Entry and Billing",
                "process_category": "BILLING",
                "description": "Time tracking, validation, and invoice generation process",
                "process_steps": {
                    "steps": [
                        {
                            "step_id": "time_entry",
                            "step_name": "Time Entry",
                            "step_type": "USER_TASK",
                            "step_order": 1,
                            "required": True,
                            "form_fields": ["matter_id", "entry_date", "hours", "description", "task_code", "is_billable"],
                            "validation_rules": ["required_fields", "reasonable_hours"],
                            "estimated_duration": 5
                        },
                        {
                            "step_id": "rate_calculation",
                            "step_name": "Calculate Billing Rate",
                            "step_type": "AUTOMATED_TASK",
                            "step_order": 2,
                            "required": True,
                            "business_rule": "billing_rate_validation",
                            "automated": True,
                            "estimated_duration": 1
                        },
                        {
                            "step_id": "budget_check",
                            "step_name": "Budget Impact Check",
                            "step_type": "AUTOMATED_TASK",
                            "step_order": 3,
                            "required": True,
                            "business_rule": "matter_budget_tracking",
                            "automated": True,
                            "estimated_duration": 1
                        },
                        {
                            "step_id": "time_approval",
                            "step_name": "Time Entry Approval",
                            "step_type": "USER_TASK",
                            "step_order": 4,
                            "required": False,
                            "condition": "approval_required == true",
                            "assignee_role": "Managing Partner",
                            "form_fields": ["approval_decision", "approval_notes"],
                            "estimated_duration": 5
                        },
                        {
                            "step_id": "billing_ready",
                            "step_name": "Mark Ready for Billing",
                            "step_type": "AUTOMATED_TASK",
                            "step_order": 5,
                            "required": True,
                            "entity_action": "update_time_entry_status",
                            "status_value": "Ready to Bill",
                            "automated": True,
                            "estimated_duration": 1
                        }
                    ],
                    "parallel_steps": [],
                    "decision_points": [
                        {
                            "step_id": "time_approval",
                            "decision_field": "approval_decision",
                            "routes": {
                                "approved": "billing_ready",
                                "rejected": "workflow_end_rejected"
                            }
                        }
                    ]
                },
                "trigger_conditions": {
                    "triggers": ["manual_start", "timer_stop"],
                    "entities": ["TimeEntry"],
                    "events": ["time_entry_created"]
                },
                "automation_level": "HIGHLY_AUTOMATED",
                "approval_required": False,
                "context_filters": {
                    "vertical": "LEGAL"
                }
            }
        ]
        
        for workflow_data in legal_workflows:
            # Check if workflow already exists
            from sqlalchemy import select
            existing = await self.session.execute(
                select(ProcessConfigMaster).where(
                    ProcessConfigMaster.process_code == workflow_data["process_code"]
                )
            )
            if existing.scalar_one_or_none():
                logger.info(f"⏭️ Workflow {workflow_data['process_code']} already exists")
                continue
                
            workflow = ProcessConfigMaster(
                process_code=workflow_data["process_code"],
                process_name=workflow_data["process_name"],
                process_category=workflow_data["process_category"],
                description=workflow_data["description"],
                process_steps=workflow_data["process_steps"],
                trigger_conditions=workflow_data["trigger_conditions"],
                automation_level=workflow_data["automation_level"],
                approval_required=workflow_data["approval_required"],
                context_filters=workflow_data["context_filters"],
                is_active=True
            )
            self.session.add(workflow)
            logger.info(f"✅ Added Legal workflow: {workflow.process_name}")
        
        await self.session.commit()

    async def seed_legal_pages_and_layouts(self):
        """Seed Legal vertical pages and layouts."""
        logger.info("📄 Seeding Legal pages and layouts...")
        
        # Use the new JSON loader for organized data
        from .legal_json_loader import seed_legal_from_json
        await seed_legal_from_json(self.session)
        
        logger.info("✅ Legal vertical pages and layouts seeded successfully")

    async def seed_verticals(self):
        """Seed vertical definitions."""
        logger.info("🏢 Seeding vertical definitions...")
        
        # Define industry verticals
        verticals = [
            {
                "vertical_code": "LEGAL",
                "vertical_name": "Legal Services",
                "description": "Law firms, legal practices, and legal service providers",
                "category": "PROFESSIONAL_SERVICES",
                "default_entities": {
                    "entities": ["Client", "Matter", "TimeEntry", "Document", "Invoice", "Contact"],
                    "relationships": {
                        "Client": ["Matter", "Invoice", "Contact"],
                        "Matter": ["TimeEntry", "Document", "Invoice"]
                    }
                },
                "default_workflows": {
                    "client_onboarding": "Client intake and conflict checking process",
                    "matter_management": "Matter lifecycle and case management",
                    "time_billing": "Time tracking and billing generation",
                    "document_review": "Document review and approval workflow"
                },
                "compliance_requirements": {
                    "client_confidentiality": "Attorney-client privilege protection",
                    "conflict_checking": "Mandatory conflict of interest checks",
                    "trust_accounting": "Client trust account compliance",
                    "professional_responsibility": "Legal ethics and professional conduct"
                },
                "country_adaptations": {
                    "US": {"bar_requirements": True, "state_regulations": True},
                    "CA": {"law_society_requirements": True, "provincial_regulations": True},
                    "UK": {"solicitors_regulation": True, "barrister_standards": True}
                },
                "tags": ["legal", "law firm", "attorney", "lawyer", "practice management"],
                "target_company_size": ["SMALL", "MEDIUM", "LARGE"],
                "maturity_level": "STABLE"
            },
            {
                "vertical_code": "MEDICAL",
                "vertical_name": "Healthcare & Medical",
                "description": "Healthcare providers, medical practices, and healthcare organizations",
                "category": "HEALTHCARE",
                "default_entities": {
                    "entities": ["Patient", "Appointment", "MedicalRecord", "Prescription", "Insurance", "Provider"],
                    "relationships": {
                        "Patient": ["Appointment", "MedicalRecord", "Prescription", "Insurance"],
                        "Provider": ["Appointment", "MedicalRecord", "Prescription"]
                    }
                },
                "compliance_requirements": {
                    "hipaa_compliance": "Patient data privacy and security",
                    "medical_licensing": "Healthcare provider licensing verification",
                    "prescription_tracking": "Controlled substance monitoring",
                    "insurance_compliance": "Healthcare insurance regulations"
                },
                "country_adaptations": {
                    "US": {"hipaa": True, "fda_regulations": True},
                    "CA": {"pipeda": True, "health_canada": True},
                    "UK": {"gdpr": True, "nhs_standards": True}
                },
                "tags": ["healthcare", "medical", "hospital", "clinic", "patient management"],
                "target_company_size": ["SMALL", "MEDIUM", "LARGE", "ENTERPRISE"],
                "maturity_level": "BETA"
            },
            {
                "vertical_code": "AUTOMOTIVE",
                "vertical_name": "Automotive Services", 
                "description": "Auto dealerships, service centers, and automotive businesses",
                "category": "AUTOMOTIVE",
                "default_entities": {
                    "entities": ["Vehicle", "Customer", "ServiceOrder", "Parts", "Technician", "Invoice"],
                    "relationships": {
                        "Customer": ["Vehicle", "ServiceOrder", "Invoice"],
                        "Vehicle": ["ServiceOrder", "Parts"],
                        "ServiceOrder": ["Parts", "Technician"]
                    }
                },
                "compliance_requirements": {
                    "environmental_regulations": "Automotive environmental compliance",
                    "safety_standards": "Vehicle safety and inspection standards",
                    "warranty_tracking": "Manufacturer warranty compliance"
                },
                "tags": ["automotive", "auto dealer", "service center", "vehicle", "parts"],
                "target_company_size": ["SMALL", "MEDIUM", "LARGE"],
                "maturity_level": "ALPHA"
            },
            {
                "vertical_code": "RETAIL",
                "vertical_name": "Retail & E-commerce",
                "description": "Retail stores, e-commerce businesses, and merchandise operations",
                "category": "RETAIL",
                "default_entities": {
                    "entities": ["Product", "Customer", "Order", "Inventory", "Supplier", "Payment"],
                    "relationships": {
                        "Customer": ["Order", "Payment"],
                        "Order": ["Product", "Payment"],
                        "Product": ["Inventory", "Supplier"]
                    }
                },
                "compliance_requirements": {
                    "payment_compliance": "PCI DSS and payment security",
                    "tax_compliance": "Sales tax and VAT regulations",
                    "consumer_protection": "Consumer rights and returns policy"
                },
                "tags": ["retail", "ecommerce", "online store", "inventory", "sales"],
                "target_company_size": ["SMALL", "MEDIUM", "LARGE", "ENTERPRISE"],
                "maturity_level": "BETA"
            }
        ]
        
        for vertical_data in verticals:
            # Check if vertical already exists
            from sqlalchemy import select
            existing = await self.session.execute(
                select(VerticalDefinition).where(
                    VerticalDefinition.vertical_code == vertical_data["vertical_code"]
                )
            )
            if existing.scalar_one_or_none():
                logger.info(f"⏭️ Vertical {vertical_data['vertical_code']} already exists")
                continue
                
            vertical = VerticalDefinition(
                vertical_code=vertical_data["vertical_code"],
                vertical_name=vertical_data["vertical_name"],
                description=vertical_data["description"],
                category=vertical_data["category"],
                default_entities=vertical_data["default_entities"],
                default_workflows=vertical_data["default_workflows"],
                compliance_requirements=vertical_data["compliance_requirements"],
                country_adaptations=vertical_data.get("country_adaptations"),
                tags=vertical_data["tags"],
                target_company_size=vertical_data["target_company_size"],
                maturity_level=vertical_data["maturity_level"]
            )
            self.session.add(vertical)
            logger.info(f"✅ Added vertical: {vertical.vertical_name}")

    async def seed_vertical_templates(self):
        """Seed vertical templates."""
        logger.info("📋 Seeding vertical templates...")
        
        # Get existing verticals
        from sqlalchemy import select
        
        # Legal templates
        legal_vertical = await self.session.execute(
            select(VerticalDefinition).where(VerticalDefinition.vertical_code == "LEGAL")
        )
        legal_vertical = legal_vertical.scalar_one_or_none()
        
        if legal_vertical:
            legal_templates = [
                {
                    "template_name": "Solo Law Practice Starter",
                    "template_category": "SMALL_BUSINESS",
                    "description": "Perfect for solo practitioners and small law firms starting out",
                    "entity_configurations": {
                        "Client": {
                            "fields": ["client_name", "contact_email", "phone", "address", "intake_date", "practice_area"],
                            "required_fields": ["client_name", "contact_email"],
                            "validation_rules": ["conflict_check", "client_type_validation"]
                        },
                        "Matter": {
                            "fields": ["matter_name", "client_id", "practice_area", "status", "responsible_attorney", "billing_rate"],
                            "required_fields": ["matter_name", "client_id", "practice_area"],
                            "status_workflow": ["Open", "Active", "On Hold", "Closed"]
                        },
                        "TimeEntry": {
                            "fields": ["matter_id", "attorney_id", "entry_date", "hours", "description", "billable_rate"],
                            "required_fields": ["matter_id", "entry_date", "hours", "description"],
                            "business_rules": ["billing_validation", "reasonable_hours_check"]
                        }
                    },
                    "workflow_configurations": {
                        "client_intake": {
                            "steps": ["validate_client_info", "conflict_check", "generate_client_number", "send_welcome_email"],
                            "automation": True
                        },
                        "time_billing": {
                            "steps": ["validate_time_entry", "calculate_charges", "generate_invoice", "send_to_client"],
                            "automation": False
                        }
                    },
                    "setup_wizard_steps": [
                        {"step": "firm_info", "title": "Law Firm Information"},
                        {"step": "practice_areas", "title": "Practice Areas"},
                        {"step": "billing_rates", "title": "Billing Configuration"},
                        {"step": "user_setup", "title": "User Accounts"},
                        {"step": "sample_data", "title": "Sample Data"}
                    ],
                    "complexity_level": "BASIC",
                    "estimated_setup_time": 30,
                    "target_users": {"min": 1, "max": 5}
                },
                {
                    "template_name": "Mid-Size Law Firm Suite",
                    "template_category": "ENTERPRISE",
                    "description": "Comprehensive solution for established law firms with multiple attorneys",
                    "entity_configurations": {
                        "Client": {
                            "fields": ["client_name", "contact_email", "phone", "address", "client_type", "entity_type", "tax_id", "intake_date", "practice_area", "referral_source"],
                            "required_fields": ["client_name", "contact_email", "client_type"],
                            "validation_rules": ["conflict_check", "client_type_validation", "tax_id_validation"]
                        },
                        "Matter": {
                            "fields": ["matter_name", "client_id", "practice_area", "matter_type", "status", "responsible_attorney", "billing_arrangement", "billing_rate", "estimated_hours", "budget"],
                            "required_fields": ["matter_name", "client_id", "practice_area", "responsible_attorney"],
                            "business_rules": ["budget_tracking", "matter_approval_workflow"]
                        },
                        "TimeEntry": {
                            "fields": ["matter_id", "attorney_id", "entry_date", "hours", "description", "task_code", "billable_rate", "billing_status"],
                            "required_fields": ["matter_id", "entry_date", "hours", "description", "task_code"],
                            "business_rules": ["billing_validation", "approval_workflow", "budget_check"]
                        },
                        "Document": {
                            "fields": ["matter_id", "document_type", "title", "file_path", "version", "privilege_level", "created_by", "reviewed_by"],
                            "required_fields": ["matter_id", "document_type", "title"],
                            "business_rules": ["privilege_protection", "version_control"]
                        }
                    },
                    "complexity_level": "ADVANCED",
                    "estimated_setup_time": 120,
                    "target_users": {"min": 10, "max": 100}
                }
            ]
            
            for template_data in legal_templates:
                # Check if template already exists
                existing = await self.session.execute(
                    select(VerticalTemplate).where(
                        VerticalTemplate.vertical_id == legal_vertical.vertical_id,
                        VerticalTemplate.template_name == template_data["template_name"]
                    )
                )
                if existing.scalar_one_or_none():
                    logger.info(f"⏭️ Template {template_data['template_name']} already exists")
                    continue
                    
                template = VerticalTemplate(
                    vertical_id=legal_vertical.vertical_id,
                    template_name=template_data["template_name"],
                    template_category=template_data["template_category"],
                    description=template_data["description"],
                    entity_configurations=template_data["entity_configurations"],
                    workflow_configurations=template_data["workflow_configurations"],
                    setup_wizard_steps=template_data["setup_wizard_steps"],
                    complexity_level=template_data["complexity_level"],
                    estimated_setup_time=template_data["estimated_setup_time"],
                    target_users=template_data["target_users"],
                    is_published=True
                )
                self.session.add(template)
                logger.info(f"✅ Added template: {template.template_name}")

    async def seed_marketplace_listings(self):
        """Seed marketplace listings."""
        logger.info("🛒 Seeding marketplace listings...")
        
        # Get existing templates
        from sqlalchemy import select
        
        solo_template = await self.session.execute(
            select(VerticalTemplate).where(
                VerticalTemplate.template_name == "Solo Law Practice Starter"
            )
        )
        solo_template = solo_template.scalar_one_or_none()
        
        midsize_template = await self.session.execute(
            select(VerticalTemplate).where(
                VerticalTemplate.template_name == "Mid-Size Law Firm Suite"
            )
        )
        midsize_template = midsize_template.scalar_one_or_none()
        
        marketplace_listings = []
        
        if solo_template:
            marketplace_listings.append({
                "vertical_id": solo_template.vertical_id,
                "template_id": solo_template.template_id,
                "title": "Solo Law Practice Starter - Free Template",
                "short_description": "Get started with law practice management in 30 minutes",
                "full_description": "Perfect starter template for solo practitioners and small law firms. Includes client management, matter tracking, time billing, and basic document management. Quick setup with guided wizard.",
                "category": "LEGAL_STARTER",
                "price": 0.00,
                "pricing_model": "FREE",
                "license_type": "MIT",
                "keywords": ["legal", "solo practice", "starter", "free", "law firm"],
                "approval_status": "APPROVED"
            })
        
        if midsize_template:
            marketplace_listings.append({
                "vertical_id": midsize_template.vertical_id,
                "template_id": midsize_template.template_id,
                "title": "Professional Law Firm Suite - Premium",
                "short_description": "Enterprise-grade legal practice management for growing firms",
                "full_description": "Comprehensive solution for established law firms with multiple attorneys. Advanced features include conflict checking, document privilege protection, approval workflows, budget tracking, and compliance tools.",
                "category": "LEGAL_PREMIUM",
                "price": 299.00,
                "pricing_model": "ONE_TIME",
                "license_type": "COMMERCIAL",
                "keywords": ["legal", "enterprise", "premium", "law firm", "professional"],
                "rating_average": 4.8,
                "rating_count": 24,
                "download_count": 156,
                "approval_status": "APPROVED"
            })
        
        for listing_data in marketplace_listings:
            # Check if listing already exists
            existing = await self.session.execute(
                select(VerticalMarketplace).where(
                    VerticalMarketplace.template_id == listing_data["template_id"]
                )
            )
            if existing.scalar_one_or_none():
                logger.info(f"⏭️ Marketplace listing {listing_data['title']} already exists")
                continue
                
            listing = VerticalMarketplace(
                vertical_id=listing_data["vertical_id"],
                template_id=listing_data["template_id"],
                title=listing_data["title"],
                short_description=listing_data["short_description"],
                full_description=listing_data["full_description"],
                category=listing_data["category"],
                price=listing_data["price"],
                pricing_model=listing_data["pricing_model"],
                license_type=listing_data["license_type"],
                keywords=listing_data["keywords"],
                rating_average=listing_data.get("rating_average", 0.00),
                rating_count=listing_data.get("rating_count", 0),
                download_count=listing_data.get("download_count", 0),
                approval_status=listing_data["approval_status"],
                published_at=datetime.utcnow() if listing_data["approval_status"] == "APPROVED" else None
            )
            self.session.add(listing)
            logger.info(f"✅ Added marketplace listing: {listing.title}")

async def main():
    """Main seeding function."""
    logger.info("🌱 SAP-Style Platform Data Seeder Starting...")
    
    seeder = DataSeeder()
    await seeder.initialize()
    await seeder.seed_all()
    
    logger.info("🎉 Data seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())