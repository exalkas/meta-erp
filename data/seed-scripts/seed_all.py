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
    EntityDefinition, FieldDefinition, ComponentDefinition, EntityLayoutDefinition
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
        
    async def seed_all(self):
        """Seed all data in correct dependency order."""
        logger.info("🌱 Starting complete data seeding...")
        
        try:
            # 1. Tenants first (everything depends on tenants)
            await self.seed_tenants()
            
            # 2. Auth data (roles, permissions, users)
            await self.seed_roles()
            await self.seed_permissions()
            await self.seed_role_permissions()
            await self.seed_users()
            
            # 3. Metadata (pages, layouts, themes, translations)
            await self.seed_layouts()
            await self.seed_theme_variants()
            await self.seed_translations()
            await self.seed_pages()
            
            # 4. Platform data (entities, components)
            await self.seed_entities()
            await self.seed_components()
            
            await self.session.commit()
            logger.info("✅ All data seeded successfully!")
            
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
        
        # Load system and business permissions
        system_perms = self.load_json_data("auth/permissions/system-permissions.json")
        business_perms = self.load_json_data("auth/permissions/business-permissions.json")
        all_permissions = system_perms + business_perms
        
        for perm_data in all_permissions:
            # Check if permission already exists
            existing = await self.session.get(Permission, perm_data["permission_id"])
            if existing:
                logger.info(f"⏭️ Permission {perm_data['permission_name']} already exists")
                continue
                
            permission = Permission(
                permission_id=perm_data["permission_id"],
                name=perm_data["permission_name"],  # Map permission_name -> name
                display_name=perm_data["display_name"],
                description=perm_data.get("description"),
                module=perm_data.get("category", "system"),  # Map category -> module, default to "system"
                action=perm_data.get("activity", "execute"),  # Map activity -> action, default to "execute"
                resource=perm_data.get("object_class"),  # Map object_class -> resource
                is_system_permission=perm_data.get("is_system_permission", False),
                is_active=perm_data.get("is_active", True),
                requires_2fa=perm_data.get("requires_approval", False),  # Map requires_approval -> requires_2fa
                scope=perm_data.get("scope", "tenant"),  # Default scope to "tenant"
                conditions=perm_data.get("metadata_json"),  # Map metadata_json -> conditions
                created_at=datetime.fromisoformat(perm_data["created_at"].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(perm_data["updated_at"].replace('Z', '+00:00'))
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
    
    async def seed_layouts(self):
        """Seed layout definitions."""
        logger.info("🏗️ Seeding layouts...")
        
        layout_files = [
            "metadata/layouts/centered-auth-layout.json",
            "metadata/layouts/dashboard-layout.json"
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
            "metadata/themes/default-base-theme.json",
            "metadata/themes/professional-base-theme.json"
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
            "metadata/translations/en-translations.json",
            "metadata/translations/el-translations.json"
        ]
        
        for file_path in translation_files:
            translations_data = self.load_json_data(file_path)
            
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
            "metadata/pages/login-page.json",
            "metadata/pages/dashboard-page.json",
            "metadata/pages/roles-catalog-page.json",
            "metadata/pages/roles-onboarding-page.json", 
            "metadata/pages/roles-management-page.json"
        ]
        
        for file_path in page_files:
            page_data = self.load_json_data(file_path)  # Single page object, not array
            
            # Check if page already exists
            existing = await self.session.get(PageDefinition, page_data["page_id"])
            if existing:
                logger.info(f"⏭️ Page {page_data['page_name']} already exists")
                continue
                    
            # Extract SEO metadata for dedicated columns
            seo_data = page_data.get("metadata_json", {}).get("seo", {})
            
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
        """Seed entity definitions (placeholder)."""
        logger.info("📊 Seeding entities...")
        # TODO: Add entity seeding when entity JSON files are created
        logger.info("⏭️ Entity seeding not implemented yet")
    
    async def seed_components(self):
        """Seed component definitions (placeholder)."""
        logger.info("🧩 Seeding components...")
        # TODO: Add component seeding when component JSON files are created
        logger.info("⏭️ Component seeding not implemented yet")

async def main():
    """Main seeding function."""
    logger.info("🌱 SAP-Style Platform Data Seeder Starting...")
    
    seeder = DataSeeder()
    await seeder.initialize()
    await seeder.seed_all()
    
    logger.info("🎉 Data seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())