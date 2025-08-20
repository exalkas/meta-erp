"""Database models package."""

from app.models.base import Base

from app.models.metadata import (
    Tenant,
    FieldDefinition,
    EntityDefinition,
    EntityLayoutDefinition,
    PicklistValue,
    Translation,
    Theme,
    ThemeProperty,
)

from app.models.auth import (
    User,
    Role,
    Permission,
    AuthSession,
    MagicLink,
    AuditLog,
    SecuritySettings,
)

from app.models.platform import (
    BaseTheme,
    ThemeVariant,
    ThemeVariantProperty,
    PageDefinition,
    LayoutDefinition,
    ComponentDefinition,
    ComponentDependency,
    ModuleManifest,
    WorkflowDefinition,
    WorkflowExecution,
    PaymentProvider,
    BillingPlan,
    TaxJurisdiction,
    TaxRate,
    TaxCalculationRule,
    MarketplaceItem,
)

from app.models.business_config import (
    BusinessConfigMaster,
    BusinessConfigEntry,
    BusinessRuleDefinition,
    BusinessRuleExecution,
    FieldLocalizationConfig,
    ProcessConfigMaster,
    WorkflowStepDefinition,
    WorkflowTrigger,
)

from app.models.vertical_config import (
    VerticalDefinition,
    VerticalTemplate,
    VerticalMarketplace,
    MarketplaceReview,
    VerticalDeployment,
    DeploymentStep,
    VerticalInstallation,
)

__all__ = [
    "Base",
    "Tenant",
    "FieldDefinition", 
    "EntityDefinition",
    "EntityLayoutDefinition",
    "LayoutDefinition",  # Platform layout definition
    "PicklistValue",
    "Translation",
    "Theme",
    "ThemeProperty",
    "BaseTheme",  # New theme variant system
    "ThemeVariant",
    "ThemeVariantProperty",
    "User",
    "Role",
    "Permission", 
    "AuthSession",
    "MagicLink",
    "AuditLog",
    "SecuritySettings",
    "PageDefinition",
    "ComponentDefinition",
    "ComponentDependency",
    "ModuleManifest",
    "WorkflowDefinition",
    "WorkflowExecution",
    "PaymentProvider",
    "BillingPlan",
    "TaxJurisdiction",
    "TaxRate",
    "TaxCalculationRule",
    "MarketplaceItem",
    # Business Configuration Models
    "BusinessConfigMaster",
    "BusinessConfigEntry", 
    "BusinessRuleDefinition",
    "BusinessRuleExecution",
    "FieldLocalizationConfig",
    "ProcessConfigMaster",
    "WorkflowStepDefinition",
    "WorkflowTrigger",
    # Vertical Configuration Models
    "VerticalDefinition",
    "VerticalTemplate",
    "VerticalMarketplace",
    "MarketplaceReview",
    "VerticalDeployment",
    "DeploymentStep", 
    "VerticalInstallation",
] 