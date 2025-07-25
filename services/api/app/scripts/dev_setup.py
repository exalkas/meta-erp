"""Development setup script for metadata ERP system."""

import asyncio
import uuid
from datetime import datetime
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import engine, async_session_local
from app.core.logging import get_logger, setup_logging
from app.models import (
    Base,
    Tenant,
    User,
    Role,
    Permission,
    SecuritySettings,
    EntityDefinition,
    FieldDefinition,
    Translation,
    Theme,
    ThemeProperty,
)
from app.services.auth import AuthService

# Setup logging
setup_logging()
logger = get_logger("dev_setup")


async def create_default_permissions() -> List[Permission]:
    """Create default system permissions."""
    permissions = [
        # System permissions
        Permission(
            name="system.admin",
            display_name="System Administration",
            description="Full system administration access",
            module="system",
            action="admin",
            scope="system",
            is_system_permission=True,
        ),
        
        # User management
        Permission(
            name="users.create",
            display_name="Create Users",
            description="Create new user accounts",
            module="users",
            action="create",
            scope="tenant",
            is_system_permission=True,
        ),
        Permission(
            name="users.read",
            display_name="View Users",
            description="View user accounts",
            module="users",
            action="read",
            scope="tenant",
            is_system_permission=True,
        ),
        Permission(
            name="users.update",
            display_name="Update Users",
            description="Update user accounts",
            module="users",
            action="update",
            scope="tenant",
            is_system_permission=True,
        ),
        Permission(
            name="users.delete",
            display_name="Delete Users",
            description="Delete user accounts",
            module="users",
            action="delete",
            scope="tenant",
            is_system_permission=True,
        ),
        
        # CRM permissions
        Permission(
            name="accounts.create",
            display_name="Create Accounts",
            description="Create new account records",
            module="crm",
            action="create",
            resource="account",
            scope="tenant",
        ),
        Permission(
            name="accounts.read",
            display_name="View Accounts",
            description="View account records",
            module="crm",
            action="read",
            resource="account",
            scope="tenant",
        ),
        Permission(
            name="accounts.update",
            display_name="Update Accounts",
            description="Update account records",
            module="crm",
            action="update",
            resource="account",
            scope="tenant",
        ),
        Permission(
            name="accounts.delete",
            display_name="Delete Accounts",
            description="Delete account records",
            module="crm",
            action="delete",
            resource="account",
            scope="tenant",
        ),
        
        # Metadata permissions
        Permission(
            name="metadata.read",
            display_name="View Metadata",
            description="View entity and field definitions",
            module="metadata",
            action="read",
            scope="tenant",
            is_system_permission=True,
        ),
        Permission(
            name="metadata.admin",
            display_name="Metadata Administration",
            description="Full metadata management access",
            module="metadata",
            action="admin",
            scope="tenant",
            is_system_permission=True,
        ),
    ]
    
    return permissions


async def create_default_tenant(db: AsyncSession) -> Tenant:
    """Create default development tenant."""
    tenant = Tenant(
        name="Development Company",
        domain="dev.local",
        subdomain="dev",
        default_locale="el_GR",
        supported_locales=["el_GR", "en_US"],
        database_name="tenant_dev",
        max_users=100,
        subscription_plan="enterprise",
        features_enabled={
            "ai_features": True,
            "voice_integration": True,
            "advanced_analytics": True,
            "custom_widgets": True,
            "marketplace_access": True,
        }
    )
    
    db.add(tenant)
    await db.flush()
    
    # Create security settings
    security_settings = SecuritySettings(
        tenant_id=tenant.tenant_id,
        min_password_length=8,
        require_uppercase=True,
        require_lowercase=True,
        require_numbers=True,
        require_special_chars=False,
        max_failed_attempts=5,
        lockout_duration_minutes=30,
        session_timeout_minutes=480,
        require_2fa=False,
        require_2fa_for_admins=True,
        allow_magic_links=True,
        magic_link_expiry_minutes=15,
        require_email_verification=False,  # Disabled for development
    )
    
    db.add(security_settings)
    
    return tenant


async def create_default_roles(db: AsyncSession, tenant: Tenant, permissions: List[Permission]) -> List[Role]:
    """Create default roles for the tenant."""
    # System Administrator Role
    admin_role = Role(
        tenant_id=tenant.tenant_id,
        name="system_admin",
        display_name="System Administrator",
        description="Full system access with all permissions",
        is_system_role=True,
        level=0,
    )
    
    # Tenant Administrator Role
    tenant_admin_role = Role(
        tenant_id=tenant.tenant_id,
        name="tenant_admin",
        display_name="Tenant Administrator",
        description="Full tenant administration access",
        is_default=False,
        level=1,
    )
    
    # Manager Role
    manager_role = Role(
        tenant_id=tenant.tenant_id,
        name="manager",
        display_name="Manager",
        description="Management level access to CRM and reporting",
        is_default=False,
        level=2,
    )
    
    # User Role (Default)
    user_role = Role(
        tenant_id=tenant.tenant_id,
        name="user",
        display_name="Standard User",
        description="Standard user access to CRM features",
        is_default=True,
        level=3,
    )
    
    roles = [admin_role, tenant_admin_role, manager_role, user_role]
    
    for role in roles:
        db.add(role)
    
    await db.flush()
    
    # Assign permissions to roles
    from app.models.auth import role_permissions
    
    # System admin gets all permissions
    for permission in permissions:
        await db.execute(
            role_permissions.insert().values(
                role_id=admin_role.role_id,
                permission_id=permission.permission_id,
            )
        )
    
    # Tenant admin gets tenant-level permissions
    tenant_permissions = [p for p in permissions if p.scope in ["tenant", "user", "record"]]
    for permission in tenant_permissions:
        await db.execute(
            role_permissions.insert().values(
                role_id=tenant_admin_role.role_id,
                permission_id=permission.permission_id,
            )
        )
    
    # Manager gets CRM and read permissions
    manager_permissions = [p for p in permissions if p.module in ["crm", "metadata"] and p.action in ["read", "create", "update"]]
    for permission in manager_permissions:
        await db.execute(
            role_permissions.insert().values(
                role_id=manager_role.role_id,
                permission_id=permission.permission_id,
            )
        )
    
    # Standard user gets basic CRM read permissions
    user_permissions = [p for p in permissions if p.module == "crm" and p.action in ["read", "create"]]
    for permission in user_permissions:
        await db.execute(
            role_permissions.insert().values(
                role_id=user_role.role_id,
                permission_id=permission.permission_id,
            )
        )
    
    return roles


async def create_default_users(db: AsyncSession, tenant: Tenant, roles: List[Role]) -> List[User]:
    """Create default users for development."""
    auth_service = AuthService(db)
    
    # Find roles
    admin_role = next(r for r in roles if r.name == "system_admin")
    user_role = next(r for r in roles if r.name == "user")
    
    # Create admin user
    admin_user = await auth_service.register_user(
        email="admin@dev.local",
        password="",
        first_name="System",
        last_name="Administrator",
        tenant_id=str(tenant.tenant_id),
        username="admin",
        send_verification=False,
    )
    
    # Manually verify the admin user
    admin_user.is_verified = True
    admin_user.is_superuser = True
    admin_user.is_tenant_admin = True
    
    # Create demo user
    demo_user = await auth_service.register_user(
        email="demo@dev.local",
        password="demo123!",
        first_name="Demo",
        last_name="User",
        tenant_id=str(tenant.tenant_id),
        username="demo",
        send_verification=False,
    )
    
    # Manually verify the demo user
    demo_user.is_verified = True
    
    # Assign roles manually (since the auth service default role assignment may not have worked)
    from app.models.auth import user_roles
    
    # Assign admin role to admin user
    await db.execute(
        user_roles.insert().values(
            user_id=admin_user.user_id,
            role_id=admin_role.role_id,
        )
    )
    
    # User role is already assigned by default
    
    return [admin_user, demo_user]


async def create_default_entities(db: AsyncSession, tenant: Tenant):
    """Create default entity definitions."""
    # Account entity
    account_entity = EntityDefinition(
        tenant_id=None,  # Global entity
        entity_name="Account",
        display_label="Account",
        plural_label="Accounts",
        description="Customer and prospect accounts",
        icon="building",
        color="blue",
        is_system_entity=True,
        supports_attachments=True,
        supports_comments=True,
        auto_number_format="ACC-{0000}",
        default_sort_field="name",
    )
    
    db.add(account_entity)
    await db.flush()
    
    # Account fields
    account_fields = [
        FieldDefinition(
            tenant_id=None,
            entity_id=account_entity.id,
            field_name="name",
            label_key="Account.Name.Label",
            data_type="string",
            is_required=True,
            is_searchable=True,
            sort_order=1,
            length=255,
        ),
        FieldDefinition(
            tenant_id=None,
            entity_id=account_entity.id,
            field_name="email",
            label_key="Account.Email.Label",
            data_type="string",
            is_required=False,
            is_searchable=True,
            sort_order=2,
            length=255,
            validation_rules={"format": "email"},
        ),
        FieldDefinition(
            tenant_id=None,
            entity_id=account_entity.id,
            field_name="phone",
            label_key="Account.Phone.Label",
            data_type="string",
            is_required=False,
            sort_order=3,
            length=20,
        ),
        FieldDefinition(
            tenant_id=None,
            entity_id=account_entity.id,
            field_name="type",
            label_key="Account.Type.Label",
            data_type="picklist",
            is_required=True,
            sort_order=4,
            picklist_name="Account.Type",
        ),
        FieldDefinition(
            tenant_id=None,
            entity_id=account_entity.id,
            field_name="industry",
            label_key="Account.Industry.Label",
            data_type="picklist",
            is_required=False,
            sort_order=5,
            picklist_name="Account.Industry",
        ),
    ]
    
    for field in account_fields:
        db.add(field)


async def create_default_translations(db: AsyncSession):
    """Create default translations."""
    translations = [
        # Account entity translations
        Translation(
            tenant_id=None,
            locale="en_US",
            key="Account.Name.Label",
            text="Account Name",
            namespace="entity",
        ),
        Translation(
            tenant_id=None,
            locale="el_GR",
            key="Account.Name.Label",
            text="Όνομα Λογαριασμού",
            namespace="entity",
        ),
        Translation(
            tenant_id=None,
            locale="en_US",
            key="Account.Email.Label",
            text="Email Address",
            namespace="entity",
        ),
        Translation(
            tenant_id=None,
            locale="el_GR",
            key="Account.Email.Label",
            text="Διεύθυνση Email",
            namespace="entity",
        ),
        Translation(
            tenant_id=None,
            locale="en_US",
            key="Account.Phone.Label",
            text="Phone Number",
            namespace="entity",
        ),
        Translation(
            tenant_id=None,
            locale="el_GR",
            key="Account.Phone.Label",
            text="Αριθμός Τηλεφώνου",
            namespace="entity",
        ),
        Translation(
            tenant_id=None,
            locale="en_US",
            key="Account.Type.Label",
            text="Account Type",
            namespace="entity",
        ),
        Translation(
            tenant_id=None,
            locale="el_GR",
            key="Account.Type.Label",
            text="Τύπος Λογαριασμού",
            namespace="entity",
        ),
        Translation(
            tenant_id=None,
            locale="en_US",
            key="Account.Industry.Label",
            text="Industry",
            namespace="entity",
        ),
        Translation(
            tenant_id=None,
            locale="el_GR",
            key="Account.Industry.Label",
            text="Κλάδος",
            namespace="entity",
        ),
    ]
    
    for translation in translations:
        db.add(translation)


async def create_default_theme(db: AsyncSession) -> Theme:
    """Create default theme."""
    theme = Theme(
        tenant_id=None,  # Global theme
        name="Default Light",
        description="Default light theme for the application",
        is_system_theme=True,
        is_default=True,
        version="1.0.0",
    )
    
    db.add(theme)
    await db.flush()
    
    # Theme properties
    theme_properties = [
        ThemeProperty(
            theme_id=theme.theme_id,
            property_key="--primary-color",
            property_value="#0066CC",
            property_type="color",
            category="colors",
            description="Primary brand color",
        ),
        ThemeProperty(
            theme_id=theme.theme_id,
            property_key="--secondary-color",
            property_value="#6C757D",
            property_type="color",
            category="colors",
            description="Secondary color",
        ),
        ThemeProperty(
            theme_id=theme.theme_id,
            property_key="--success-color",
            property_value="#28A745",
            property_type="color",
            category="colors",
            description="Success color",
        ),
        ThemeProperty(
            theme_id=theme.theme_id,
            property_key="--warning-color",
            property_value="#FFC107",
            property_type="color",
            category="colors",
            description="Warning color",
        ),
        ThemeProperty(
            theme_id=theme.theme_id,
            property_key="--error-color",
            property_value="#DC3545",
            property_type="color",
            category="colors",
            description="Error color",
        ),
        ThemeProperty(
            theme_id=theme.theme_id,
            property_key="--background-color",
            property_value="#FFFFFF",
            property_type="color",
            category="colors",
            description="Main background color",
        ),
        ThemeProperty(
            theme_id=theme.theme_id,
            property_key="--text-color",
            property_value="#212529",
            property_type="color",
            category="colors",
            description="Primary text color",
        ),
    ]
    
    for prop in theme_properties:
        db.add(prop)
    
    return theme


async def setup_development_data():
    """Set up development data."""
    logger.info("Starting development data setup...")
    
    try:
        async with async_session_local() as db:
            # Check if data already exists
            result = await db.execute(select(Tenant).where(Tenant.domain == "dev.local"))
            existing_tenant = result.scalar_one_or_none()
            
            if existing_tenant:
                logger.info("Development data already exists, skipping setup")
                return
            
            # Create permissions first
            logger.info("Creating default permissions...")
            permissions = create_default_permissions()
            for permission in permissions:
                db.add(permission)
            await db.flush()
            
            # Create default tenant
            logger.info("Creating default tenant...")
            tenant = await create_default_tenant(db)
            
            # Create roles
            logger.info("Creating default roles...")
            roles = await create_default_roles(db, tenant, permissions)
            
            # Create users
            logger.info("Creating default users...")
            users = await create_default_users(db, tenant, roles)
            
            # Create entities
            logger.info("Creating default entities...")
            await create_default_entities(db, tenant)
            
            # Create translations
            logger.info("Creating default translations...")
            await create_default_translations(db)
            
            # Create theme
            logger.info("Creating default theme...")
            await create_default_theme(db)
            
            # Commit all changes
            await db.commit()
            
            logger.info("Development data setup completed successfully!")
            logger.info(f"Default tenant: {tenant.domain}")
            logger.info("Default users:")
            for user in users:
                logger.info(f"  - {user.email} ({user.full_name})")
            
    except Exception as exc:
        logger.exception("Development data setup failed")
        raise


async def main():
    """Main setup function."""
    logger.info("Starting development setup...")
    
    # Create database tables
    logger.info("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Setup development data
    await setup_development_data()
    
    logger.info("Development setup completed!")


if __name__ == "__main__":
    asyncio.run(main()) 