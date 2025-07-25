"""
Development Data Setup Script

Creates development tenant, users, login page metadata, and component definitions
for testing the metadata-driven platform.
"""

import asyncio
import sys
import os
from datetime import datetime, timezone
from uuid import uuid4
import bcrypt

# Add the services/api directory to Python path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_engine
from app.core.logging import setup_logging, get_logger
from app.models.metadata import (
    Tenant, EntityDefinition, FieldDefinition, PicklistValue, 
    LayoutDefinition, Translation, Theme, ThemeProperty
)
from app.models.platform import (
    PageDefinition, ComponentDefinition, ModuleManifest
)
from app.models.auth import (
    User, Role, Permission, SecuritySettings, user_roles, role_permissions
)

# Setup logging
setup_logging()
logger = get_logger("dev_data_setup")


async def create_dev_data():
    """Create all development data."""
    
    engine = get_engine()
    async with AsyncSession(engine) as session:
        try:
            logger.info("Starting development data setup...")
            
            # Create development tenant
            tenant = await create_dev_tenant(session)
            logger.info(f"Created development tenant: {tenant.tenant_id}")
            
            # Create permissions and roles
            permissions = await create_permissions(session)
            roles = await create_roles(session, permissions)
            logger.info(f"Created {len(permissions)} permissions and {len(roles)} roles")
            
            # Create development users
            users = await create_dev_users(session, tenant, roles)
            logger.info(f"Created {len(users)} development users")
            
            # Create security settings
            await create_security_settings(session, tenant)
            logger.info("Created security settings")
            
            # Create default theme
            theme = await create_default_theme(session, tenant)
            logger.info(f"Created default theme: {theme.theme_id}")
            
            # Create core module and components
            module = await create_core_module(session)
            components = await create_core_components(session, module)
            logger.info(f"Created core module with {len(components)} components")
            
            # Create login form entity and fields
            login_entity = await create_login_entity(session, tenant)
            login_fields = await create_login_fields(session, login_entity)
            logger.info(f"Created login entity with {len(login_fields)} fields")
            
            # Create login page layout
            login_layout = await create_login_layout(session, login_entity)
            logger.info(f"Created login layout: {login_layout.layout_id}")
            
            # Create login page definition
            login_page = await create_login_page(session, tenant)
            logger.info(f"Created login page: {login_page.page_id}")
            
            # Create translations
            translations = await create_translations(session, tenant)
            logger.info(f"Created {len(translations)} translations")
            
            # Commit all changes
            await session.commit()
            logger.info("Development data setup completed successfully!")
            
            # Print summary
            await print_setup_summary(tenant, users)
            
        except Exception as e:
            await session.rollback()
            logger.error(f"Development data setup failed: {str(e)}")
            raise


async def create_dev_tenant(session: AsyncSession) -> Tenant:
    """Create development tenant."""
    
    tenant_id = uuid4()
    tenant = Tenant(
        tenant_id=tenant_id,
        name="Development Corp",
        subdomain="dev",
        domain="dev.local",
        status="active",
        database_name="tenant_dev_local",
        subscription_plan="development",
        default_locale="en",
        supported_locales=["en", "el"],
        default_theme_id=None,  # Will be set after theme creation
        features_enabled=["auth", "metadata", "components", "workflows"],
        created_by=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    session.add(tenant)
    await session.flush()  # Get the ID
    return tenant


async def create_permissions(session: AsyncSession) -> list[Permission]:
    """Create system permissions."""
    
    permission_data = [
        ("system.admin", "Full system administration"),
        ("tenant.admin", "Tenant administration"),
        ("user.manage", "Manage users and roles"),
        ("metadata.read", "Read metadata definitions"),
        ("metadata.write", "Write metadata definitions"),
        ("component.read", "Read component catalog"),
        ("component.write", "Write component definitions"),
        ("page.read", "Read page definitions"),
        ("page.write", "Write page definitions"),
        ("entity.read", "Read entity definitions"),
        ("entity.write", "Write entity definitions"),
        ("workflow.read", "Read workflow definitions"),
        ("workflow.write", "Write workflow definitions"),
        ("auth.login", "Login to system"),
        ("auth.refresh", "Refresh authentication tokens"),
    ]
    
    permissions = []
    for name, description in permission_data:
        permission = Permission(
            permission_id=uuid4(),
            name=name,
            description=description,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        permissions.append(permission)
        session.add(permission)
    
    await session.flush()
    return permissions


async def create_roles(session: AsyncSession, permissions: list[Permission]) -> list[Role]:
    """Create system roles with permissions."""
    
    # Create permission lookup
    perm_map = {p.name: p for p in permissions}
    
    # Define role configurations
    role_configs = [
        {
            "name": "System Admin",
            "description": "Full system access",
            "permissions": [
                "system.admin", "tenant.admin", "user.manage",
                "metadata.read", "metadata.write", "component.read", "component.write",
                "page.read", "page.write", "entity.read", "entity.write",
                "workflow.read", "workflow.write", "auth.login", "auth.refresh"
            ]
        },
        {
            "name": "Tenant Admin", 
            "description": "Tenant administration access",
            "permissions": [
                "tenant.admin", "user.manage", "metadata.read", "metadata.write",
                "component.read", "page.read", "page.write", "entity.read", "entity.write",
                "workflow.read", "workflow.write", "auth.login", "auth.refresh"
            ]
        },
        {
            "name": "Manager",
            "description": "Manager level access",
            "permissions": [
                "metadata.read", "component.read", "page.read", 
                "entity.read", "workflow.read", "auth.login", "auth.refresh"
            ]
        },
        {
            "name": "User",
            "description": "Basic user access",
            "permissions": ["auth.login", "auth.refresh"]
        }
    ]
    
    roles = []
    for role_config in role_configs:
        role = Role(
            role_id=uuid4(),
            name=role_config["name"],
            description=role_config["description"],
            is_system_role=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        session.add(role)
        await session.flush()
        
        # Add permissions to role
        for perm_name in role_config["permissions"]:
            if perm_name in perm_map:
                role.permissions.append(perm_map[perm_name])
        
        roles.append(role)
    
    return roles


async def create_dev_users(session: AsyncSession, tenant: Tenant, roles: list[Role]) -> list[User]:
    """Create development users (admin and demo in same company)."""
    
    # Create role lookup
    role_map = {r.name: r for r in roles}
    
    # Hash passwords
    admin_password = bcrypt.hashpw("".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    demo_password = bcrypt.hashpw("demo123!".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # User configurations
    user_configs = [
        {
            "email": "admin@dev.local",
            "first_name": "Admin",
            "last_name": "User",
            "password_hash": admin_password,
            "roles": ["System Admin"],
            "is_system_user": True
        },
        {
            "email": "demo@dev.local", 
            "first_name": "Demo",
            "last_name": "User",
            "password_hash": demo_password,
            "roles": ["User"],
            "is_system_user": False
        }
    ]
    
    users = []
    for user_config in user_configs:
        user = User(
            user_id=uuid4(),
            tenant_id=tenant.tenant_id,
            email=user_config["email"],
            first_name=user_config["first_name"],
            last_name=user_config["last_name"],
            password_hash=user_config["password_hash"],
            is_active=True,
            is_verified=True,
            is_system_user=user_config["is_system_user"],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        session.add(user)
        await session.flush()
        
        # Add roles to user
        for role_name in user_config["roles"]:
            if role_name in role_map:
                user.roles.append(role_map[role_name])
        
        users.append(user)
    
    return users


async def create_security_settings(session: AsyncSession, tenant: Tenant):
    """Create security settings for the tenant."""
    
    settings = SecuritySettings(
        setting_id=uuid4(),
        tenant_id=tenant.tenant_id,
        password_min_length=8,
        password_require_uppercase=True,
        password_require_lowercase=True,
        password_require_numbers=True,
        password_require_symbols=False,
        password_expiry_days=90,
        max_login_attempts=5,
        account_lockout_minutes=30,
        session_timeout_minutes=1440,  # 24 hours
        enable_2fa=False,  # Start with disabled for development
        enable_magic_link=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    session.add(settings)


async def create_default_theme(session: AsyncSession, tenant: Tenant) -> Theme:
    """Create default theme for the tenant."""
    
    theme = Theme(
        theme_id=uuid4(),
        tenant_id=None,  # Global theme
        name="Development Theme",
        description="Default theme for development environment",
        is_system_theme=True,
        is_default=True,
        version="1.0.0",
        created_by=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    session.add(theme)
    await session.flush()
    
    # Create theme properties
    theme_properties = [
        ("--primary-color", "#0066CC", "color", "Primary brand color"),
        ("--secondary-color", "#FFF700", "color", "Secondary accent color"),
        ("--background-color", "#FFFFFF", "color", "Main background color"),
        ("--text-color", "#333333", "color", "Primary text color"),
        ("--border-color", "#E5E7EB", "color", "Border color"),
        ("--font-family", "Inter, sans-serif", "font", "Primary font family"),
        ("--border-radius", "8px", "size", "Default border radius"),
        ("--shadow", "0 1px 3px rgba(0, 0, 0, 0.1)", "shadow", "Default shadow"),
    ]
    
    for key, value, prop_type, description in theme_properties:
        theme_prop = ThemeProperty(
            property_id=uuid4(),
            theme_id=theme.theme_id,
            property_key=key,
            property_value=value,
            property_type=prop_type,
            category="core",
            description=description,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        session.add(theme_prop)
    
    # Update tenant with default theme
    tenant.default_theme_id = theme.theme_id
    
    return theme


async def create_core_module(session: AsyncSession) -> ModuleManifest:
    """Create core UI components module."""
    
    module = ModuleManifest(
        manifest_id=uuid4(),
        module_id="core",
        name="Core UI Components",
        version="1.0.0",
        description="Essential UI components for the metadata-driven platform",
        author="Metadata ERP Team",
        license="MIT",
        keywords=["ui", "components", "core"],
        dependencies={},
        peer_dependencies={},
        configuration_schema={},
        is_system_module=True,
        is_published=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    session.add(module)
    await session.flush()
    return module


async def create_core_components(session: AsyncSession, module: ModuleManifest) -> list[ComponentDefinition]:
    """Create core UI component definitions."""
    
    component_configs = [
        {
            "name": "Input",
            "type": "fieldControl",
            "category": "Form",
            "description": "Basic text input field",
            "props_schema": {
                "type": "object",
                "properties": {
                    "type": {"type": "string", "default": "text"},
                    "placeholder": {"type": "string"},
                    "disabled": {"type": "boolean", "default": False},
                    "required": {"type": "boolean", "default": False}
                }
            }
        },
        {
            "name": "SimplePasswordInput",
            "type": "fieldControl", 
            "category": "Form",
            "description": "Password input with toggle visibility",
            "props_schema": {
                "type": "object",
                "properties": {
                    "placeholder": {"type": "string"},
                    "disabled": {"type": "boolean", "default": False},
                    "required": {"type": "boolean", "default": False}
                }
            }
        },
        {
            "name": "Button",
            "type": "action",
            "category": "Form",
            "description": "Clickable button component",
            "props_schema": {
                "type": "object",
                "properties": {
                    "variant": {"type": "string", "enum": ["primary", "secondary", "danger"], "default": "primary"},
                    "size": {"type": "string", "enum": ["sm", "md", "lg"], "default": "md"},
                    "disabled": {"type": "boolean", "default": False},
                    "loading": {"type": "boolean", "default": False}
                }
            }
        },
        {
            "name": "Checkbox",
            "type": "fieldControl",
            "category": "Form", 
            "description": "Checkbox input field",
            "props_schema": {
                "type": "object",
                "properties": {
                    "label": {"type": "string"},
                    "disabled": {"type": "boolean", "default": False}
                }
            }
        },
        {
            "name": "Alert",
            "type": "display",
            "category": "Feedback",
            "description": "Alert message component",
            "props_schema": {
                "type": "object",
                "properties": {
                    "type": {"type": "string", "enum": ["error", "warning", "info", "success"], "default": "info"},
                    "variant": {"type": "string", "enum": ["filled", "outlined"], "default": "filled"},
                    "message": {"type": "string", "required": True}
                }
            }
        },
        {
            "name": "Logo",
            "type": "display",
            "category": "Brand",
            "description": "Company logo component",
            "props_schema": {
                "type": "object",
                "properties": {
                    "size": {"type": "string", "enum": ["sm", "md", "lg"], "default": "md"}
                }
            }
        },
        {
            "name": "LanguageSelector",
            "type": "control",
            "category": "Navigation",
            "description": "Language selection dropdown with flags",
            "props_schema": {
                "type": "object",
                "properties": {
                    "variant": {"type": "string", "enum": ["dropdown", "toggle"], "default": "dropdown"},
                    "size": {"type": "string", "enum": ["sm", "md", "lg"], "default": "md"},
                    "showFlag": {"type": "boolean", "default": True},
                    "showNativeName": {"type": "boolean", "default": True},
                    "position": {"type": "string", "enum": ["top-right", "top-left"], "default": "top-right"}
                }
            }
        },
        {
            "name": "ThemeSelector", 
            "type": "control",
            "category": "Navigation",
            "description": "Theme selection toggle (light/dark)",
            "props_schema": {
                "type": "object",
                "properties": {
                    "variant": {"type": "string", "enum": ["toggle", "dropdown"], "default": "toggle"},
                    "size": {"type": "string", "enum": ["sm", "md", "lg"], "default": "md"},
                    "position": {"type": "string", "enum": ["top-right", "top-left"], "default": "top-right"}
                }
            }
        },
    ]
    
    components = []
    for config in component_configs:
        component = ComponentDefinition(
            component_id=uuid4(),
            name=config["name"],
            type=config["type"],
            props_schema=config["props_schema"],
            module=module.module_id,
            icon=None,
            category=config["category"],
            description=config["description"],
            version="1.0.0",
            is_system_component=True,
            supports_children=config["type"] == "layout",
            default_props={},
            style_schema={},
            event_handlers=["onClick"] if config["type"] == "action" else [],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        components.append(component)
        session.add(component)
    
    return components


async def create_login_entity(session: AsyncSession, tenant: Tenant) -> EntityDefinition:
    """Create LoginForm entity definition."""
    
    entity = EntityDefinition(
        id=uuid4(),
        tenant_id=None,  # Global entity
        entity_name="LoginForm",
        display_label="Login Form",
        plural_label="Login Forms",
        description="User login form entity",
        icon="login",
        color="#0066CC",
        is_system_entity=True,
        supports_attachments=False,
        supports_comments=False,
        supports_workflows=False,
        auto_number_format=None,
        default_sort_field="email",
        default_sort_order="asc",
        api_name="login_form",
        enable_api=False,
        created_by=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    session.add(entity)
    await session.flush()
    return entity


async def create_login_fields(session: AsyncSession, entity: EntityDefinition) -> list[FieldDefinition]:
    """Create fields for the LoginForm entity."""
    
    field_configs = [
        {
            "field_name": "email",
            "label_key": "Login.Email.Label",
            "data_type": "email",
            "is_required": True,
            "sort_order": 1,
            "placeholder": "user@example.com",
            "help_text": "Enter your email address"
        },
        {
            "field_name": "password",
            "label_key": "Login.Password.Label", 
            "data_type": "password",
            "is_required": True,
            "sort_order": 2,
            "placeholder": "••••••••",
            "help_text": "Enter your password"
        },
        {
            "field_name": "rememberMe",
            "label_key": "Login.RememberMe.Label",
            "data_type": "boolean",
            "is_required": False,
            "sort_order": 3,
            "default_value": "false",
            "help_text": "Keep me logged in"
        }
    ]
    
    fields = []
    for config in field_configs:
        field = FieldDefinition(
            id=uuid4(),
            entity_id=entity.id,
            field_name=config["field_name"],
            label_key=config["label_key"],
            data_type=config["data_type"],
            is_required=config["is_required"],
            is_system_field=True,
            default_value=config.get("default_value"),
            sort_order=config["sort_order"],
            api_name=config["field_name"],
            help_text=config["help_text"],
            placeholder=config["placeholder"],
            field_group="authentication",
            validation_rules={"min_length": 8} if config["data_type"] == "password" else {},
            created_by=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        fields.append(field)
        session.add(field)
    
    return fields


async def create_login_layout(session: AsyncSession, entity: EntityDefinition) -> LayoutDefinition:
    """Create layout for the LoginForm."""
    
    layout = LayoutDefinition(
        layout_id=uuid4(),
        tenant_id=None,  # Global layout
        entity_id=entity.id,
        layout_name="LoginLayout",
        layout_type="form",
        description="Standard login form layout",
        is_system_layout=True,
        sections=[
            {
                "title": None,
                "fields": ["email", "password", "rememberMe"]
            }
        ],
        responsive_config={
            "mobile": {"columns": 1},
            "tablet": {"columns": 1}, 
            "desktop": {"columns": 1}
        },
        created_by=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    session.add(layout)
    await session.flush()
    return layout


async def create_login_page(session: AsyncSession, tenant: Tenant) -> PageDefinition:
    """Create login page definition."""
    
    page = PageDefinition(
        page_id=uuid4(),
        tenant_id=None,  # Global page
        page_name="Login",
        route="/login",
        title="Login to Metadata ERP",  # Changed from title_key
        description="User authentication page",  # Changed from meta_description
        page_type="auth",  # Added this field
        components=[
            {
                "type": "ThemeSelector",
                "props": {
                    "variant": "toggle",
                    "size": "sm",
                    "position": "top-right"
                },
                "position": {"x": "top-4", "y": "right-4"}
            },
            {
                "type": "LanguageSelector", 
                "props": {
                    "variant": "dropdown",
                    "size": "sm",
                    "showFlag": True,
                    "showNativeName": True,
                    "position": "top-right"
                },
                "position": {"x": "top-4", "y": "right-12"}
            },
            {
                "type": "PageHeader",
                "props": {
                    "titleKey": "Login.PageTitle",
                    "subtitleKey": "Login.PageSubtitle"
                }
            },
            {
                "type": "Form",
                "props": {
                    "entity": "LoginForm",
                    "layout": "LoginLayout",
                    "submitLabelKey": "Login.Submit"
                }
            }
        ],
        access_roles=[],
        is_public=True,
        metadata_json={  # Changed from layout_config
            "theme": "default",
            "layout": "centered",
            "background": "gradient"
        },
        created_by=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    session.add(page)
    await session.flush()
    return page


async def create_translations(session: AsyncSession, tenant: Tenant) -> list[Translation]:
    """Create translations for the login page."""
    
    translation_data = [
        # English translations
        ("en", "Login.PageTitle", "Welcome Back"),
        ("en", "Login.PageSubtitle", "Please sign in to continue"),
        ("en", "Login.Email.Label", "Email Address"),
        ("en", "Login.Password.Label", "Password"),
        ("en", "Login.RememberMe.Label", "Remember me"),
        ("en", "Login.Submit", "Sign In"),
        ("en", "Login.ForgotPassword", ""),
        
        # Greek translations  
        ("el", "Login.PageTitle", "Καλώς Ξαναήρθατε"),
        ("el", "Login.PageSubtitle", "Συνδεθείτε για να συνεχίσετε"),
        ("el", "Login.Email.Label", "Διεύθυνση Email"),
        ("el", "Login.Password.Label", "Κωδικός Πρόσβασης"),
        ("el", "Login.RememberMe.Label", "Θυμήσου με"),
        ("el", "Login.Submit", "Σύνδεση"),
        ("el", "Login.ForgotPassword", "Ξεχάσατε τον κωδικό σας;"),
    ]
    
    translations = []
    for locale, key, text in translation_data:
        translation = Translation(
            translation_id=uuid4(),
            tenant_id=None,  # Global translations
            locale=locale,
            namespace="auth",
            key=key,
            text=text,
            is_system_translation=True,
            is_approved=True,
            created_by=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        translations.append(translation)
        session.add(translation)
    
    return translations


async def print_setup_summary(tenant: Tenant, users: list[User]):
    """Print a summary of the created development data."""
    
    print("\n" + "="*60)
    print("🎉 DEVELOPMENT DATA SETUP COMPLETED!")
    print("="*60)
    
    print(f"\n📊 TENANT INFORMATION:")
    print(f"   Company: {tenant.name}")
    print(f"   Tenant ID: {tenant.tenant_id}")
    print(f"   Domain: {tenant.domain}")
    print(f"   Subdomain: {tenant.subdomain}")
    print(f"   Database: {tenant.database_name}")
    
    print(f"\n👥 DEVELOPMENT USERS:")
    for user in users:
        print(f"   📧 {user.email}")
        print(f"      Password: {'' if 'admin' in user.email else 'demo123!'}")
        print(f"      Name: {user.first_name} {user.last_name}")
        print(f"      Roles: {[role.name for role in user.roles]}")
        print()
    
    print(f"🔗 READY TO TEST:")
    print(f"   1. Start services: npm run dev (from root)")
    print(f"   2. Open: http://localhost:3000/login")
    print(f"   3. Login with admin@dev.local / ")
    print(f"   4. Or login with demo@dev.local / demo123!")
    
    print(f"\n🏗️ METADATA CREATED:")
    print(f"   ✅ Login page definition (/login route)")
    print(f"   ✅ LoginForm entity with email/password fields")
    print(f"   ✅ Core UI components (Input, Button, etc.)")
    print(f"   ✅ Translations (English + Greek)")
    print(f"   ✅ Default theme and permissions")
    
    print(f"\n🚀 NEXT STEPS:")
    print(f"   1. Test login flow with metadata-driven rendering")
    print(f"   2. Test one-user-one-session policy")
    print(f"   3. Test JWT token refresh")
    print(f"   4. Build additional pages using metadata")
    
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(create_dev_data()) 