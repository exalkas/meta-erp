"""Platform models for the metadata-driven no-code/low-code system."""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .metadata import Base


# ================================
# LAYOUT ENGINE MODELS
# ================================

class LayoutDefinition(Base):
    """Layout definitions for section-based page composition."""
    
    __tablename__ = "layout_definitions"
    
    layout_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=True)
    
    # Layout identification
    name = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)  # auth, dashboard, content, etc.
    
    # Layout structure
    sections_json = Column(JSON, nullable=False)  # {"header": {}, "main": {}, "sidebar": {}, "footer": {}}
    css_classes_json = Column(JSON, nullable=True)  # Tailwind classes per section
    container_classes = Column(String(500), nullable=True)  # Main container classes
    
    # Layout configuration
    is_responsive = Column(Boolean, default=True)
    supports_theming = Column(Boolean, default=True)
    max_sections = Column(Integer, nullable=True)  # Maximum sections supported
    
    # Layout metadata
    preview_image = Column(String(500), nullable=True)
    is_system_layout = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    tenant = relationship("Tenant")
    pages = relationship("PageDefinition", back_populates="layout")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("tenant_id", "name", name="uq_layout_tenant_name"),
        Index("idx_layout_tenant_id", "tenant_id"),
        Index("idx_layout_category", "category"),
        Index("idx_layout_system", "is_system_layout"),
        Index("idx_layout_active", "is_active"),
    )


# ================================
# PAGE ENGINE MODELS
# ================================

class PageDefinition(Base):
    """Dynamic page definitions for runtime page generation."""
    
    __tablename__ = "page_definitions"
    
    page_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=True)
    
    # Page identification
    page_name = Column(String(100), nullable=False)
    route = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    page_type = Column(String(50), nullable=False)  # auth, dashboard, content, form, etc.
    
    # Layout system (NEW)
    layout_id = Column(UUID(as_uuid=True), ForeignKey("layout_definitions.layout_id"), nullable=True)
    sections_data_json = Column(JSON, nullable=True)  # Components per section: {"header": [...], "main": [...]}
    
    # Legacy components (for backward compatibility)
    components = Column(JSON, nullable=False, default=lambda: [])  # Array of component instances
    
    # Page configuration
    metadata_json = Column(JSON, nullable=True)  # Additional page configuration
    access_roles = Column(JSON, default=lambda: [])
    is_public = Column(Boolean, default=False)
    
    # State management (Enhanced page features)
    initial_state = Column(JSON, nullable=True)  # Page-level initial state
    state_bindings = Column(JSON, nullable=True)  # Component state bindings
    api_endpoints = Column(JSON, nullable=True)  # API endpoint configuration
    real_time_updates = Column(Boolean, default=False)  # WebSocket support
    cache_strategy = Column(String(50), nullable=True)  # Caching configuration
    websocket_events = Column(JSON, nullable=True)  # Real-time event types
    
    # SEO and metadata
    meta_description = Column(Text, nullable=True)
    meta_keywords = Column(JSON, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    tenant = relationship("Tenant")
    layout = relationship("LayoutDefinition", back_populates="pages")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("tenant_id", "page_name", name="uq_page_tenant_name"),
        UniqueConstraint("tenant_id", "route", name="uq_page_tenant_route"),
        Index("idx_page_tenant_id", "tenant_id"),
        Index("idx_page_route", "route"),
        Index("idx_page_public", "is_public"),
        Index("idx_page_type", "page_type"),
        Index("idx_page_layout_id", "layout_id"),  # NEW index for layout
    )


class ComponentDefinition(Base):
    """Component catalog for the platform."""
    
    __tablename__ = "component_definitions"
    
    component_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Component identification
    name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Component type and categorization
    type = Column(String(50), nullable=False)  # fieldControl, dashboardWidget, layoutSection
    category = Column(String(50), nullable=True)  # Form, Chart, List, etc.
    module = Column(String(100), nullable=False)  # e.g., core, erp.inventory
    
    # Component configuration
    props_schema = Column(JSON, nullable=False)  # JSON Schema for props
    default_props = Column(JSON, nullable=True)
    supports_children = Column(Boolean, default=False)  # Can contain child components
    style_schema = Column(JSON, nullable=True)  # JSON Schema for styling options
    event_handlers = Column(JSON, default=lambda: [])  # Available event handlers
    
    # UI metadata
    icon = Column(String(100), nullable=True)
    preview_image = Column(String(500), nullable=True)
    tags = Column(JSON, default=lambda: [])
    documentation_url = Column(String(500), nullable=True)  # Component documentation
    
    # Marketplace info
    is_marketplace_item = Column(Boolean, default=False)
    price = Column(Numeric(10, 2), nullable=True)
    creator_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_system_component = Column(Boolean, default=False)  # System vs custom component
    version = Column(String(20), default="1.0.0")
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    dependencies = relationship("ComponentDependency", back_populates="component", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        Index("idx_component_type", "type"),
        Index("idx_component_category", "category"),
        Index("idx_component_module", "module"),
        Index("idx_component_active", "is_active"),
        Index("idx_component_marketplace", "is_marketplace_item"),
        Index("idx_component_system", "is_system_component"),  # Added index
    )


class ComponentDependency(Base):
    """Component dependencies for the catalog system."""
    
    __tablename__ = "component_dependencies"
    
    dependency_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)  # Changed from id
    component_id = Column(UUID(as_uuid=True), ForeignKey("component_definitions.component_id"), nullable=False)
    depends_on_component_id = Column(UUID(as_uuid=True), ForeignKey("component_definitions.component_id"), nullable=False)  # Changed name
    
    # Dependency configuration
    dependency_type = Column(String(50), default="required")  # Added dependency_type
    version_constraint = Column(String(50), nullable=True)  # e.g., ">=1.0.0"
    is_optional = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    component = relationship("ComponentDefinition", foreign_keys=[component_id], back_populates="dependencies")
    depends_on = relationship("ComponentDefinition", foreign_keys=[depends_on_component_id])
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("component_id", "depends_on_component_id", name="uq_component_dependency"),
        Index("idx_dependency_component", "component_id"),
        Index("idx_dependency_depends_on", "depends_on_component_id"),  # Updated field name
    )


class ModuleManifest(Base):
    """Module manifests for the plugin system."""
    
    __tablename__ = "module_manifests"
    
    manifest_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)  # Added manifest_id
    module_id = Column(String(100), nullable=False, unique=True)  # Made non-primary, unique
    
    # Module information
    name = Column(String(255), nullable=False)
    display_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    version = Column(String(20), nullable=False)
    
    # Module configuration
    components = Column(JSON, nullable=False)  # Array of component definitions
    dependencies = Column(JSON, default=lambda: [])
    peer_dependencies = Column(JSON, default=lambda: [])  # Peer dependencies
    permissions = Column(JSON, default=lambda: [])
    configuration_schema = Column(JSON, nullable=True)  # Module configuration schema
    
    # Module metadata
    author = Column(String(255), nullable=True)
    homepage = Column(String(500), nullable=True)
    repository_url = Column(String(500), nullable=True)  # Changed from repository
    documentation_url = Column(String(500), nullable=True)  # Documentation URL
    keywords = Column(JSON, default=lambda: [])  # Search keywords
    license = Column(String(100), nullable=True)
    
    # Installation info
    is_system_module = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_published = Column(Boolean, default=False)  # Published to marketplace
    install_script = Column(Text, nullable=True)  # Installation script
    uninstall_script = Column(Text, nullable=True)  # Uninstallation script
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Constraints
    __table_args__ = (
        Index("idx_module_id", "module_id"),  # Added index for module_id
        Index("idx_module_active", "is_active"),
        Index("idx_module_system", "is_system_module"),
        Index("idx_module_published", "is_published"),  # Added index
    )


# ================================
# WORKFLOW ENGINE MODELS
# ================================

class WorkflowDefinition(Base):
    """Workflow definitions for automation."""
    
    __tablename__ = "workflow_definitions"
    
    workflow_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    
    # Workflow identification
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Workflow configuration
    trigger_config = Column(JSON, nullable=False)  # When to trigger
    conditions = Column(JSON, nullable=True)  # Conditions to check
    actions = Column(JSON, nullable=False)  # Actions to execute
    
    # Workflow settings
    is_active = Column(Boolean, default=True)
    execution_order = Column(Integer, default=0)
    max_executions_per_hour = Column(Integer, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    tenant = relationship("Tenant")
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("tenant_id", "name", name="uq_workflow_tenant_name"),
        Index("idx_workflow_tenant_id", "tenant_id"),
        Index("idx_workflow_active", "is_active"),
    )


class WorkflowExecution(Base):
    """Workflow execution logs."""
    
    __tablename__ = "workflow_executions"
    
    execution_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflow_definitions.workflow_id"), nullable=False)
    
    # Execution info
    trigger_data = Column(JSON, nullable=True)
    execution_context = Column(JSON, nullable=True)
    result = Column(JSON, nullable=True)
    
    # Status
    status = Column(String(20), nullable=False)  # pending, running, completed, failed
    error_message = Column(Text, nullable=True)
    
    # Timing
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    
    # Relationships
    workflow = relationship("WorkflowDefinition", back_populates="executions")
    
    # Constraints
    __table_args__ = (
        Index("idx_execution_workflow_id", "workflow_id"),
        Index("idx_execution_status", "status"),
        Index("idx_execution_started_at", "started_at"),
    )


# ================================
# BILLING ENGINE MODELS
# ================================

class PaymentProvider(Base):
    """Payment providers for billing engine."""
    
    __tablename__ = "payment_providers"
    
    provider_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Provider information
    name = Column(String(100), nullable=False, unique=True)  # Stripe, PayPal, Square
    display_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Configuration
    configuration = Column(JSON, nullable=False)  # Provider-specific config
    supported_currencies = Column(JSON, default=lambda: ["USD", "EUR"])
    supported_countries = Column(JSON, default=lambda: [])
    
    # Features
    supports_subscriptions = Column(Boolean, default=True)
    supports_one_time = Column(Boolean, default=True)
    supports_usage_based = Column(Boolean, default=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_test_mode = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Constraints
    __table_args__ = (
        Index("idx_provider_active", "is_active"),
        Index("idx_provider_test_mode", "is_test_mode"),
    )


class BillingPlan(Base):
    """Billing plans for subscription management."""
    
    __tablename__ = "billing_plans"
    
    plan_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=True)  # NULL = global
    
    # Plan information
    plan_name = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Pricing configuration
    pricing_model = Column(String(50), nullable=False)  # subscription, usage, one_time
    price_config = Column(JSON, nullable=False)  # {amount, currency, billing_cycle}
    
    # Features and limits
    features = Column(JSON, default=lambda: [])
    usage_limits = Column(JSON, nullable=True)
    
    # Plan settings
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=True)
    trial_period_days = Column(Integer, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tenant = relationship("Tenant")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("tenant_id", "plan_name", name="uq_plan_tenant_name"),
        Index("idx_plan_tenant_id", "tenant_id"),
        Index("idx_plan_active", "is_active"),
        Index("idx_plan_public", "is_public"),
    )


# ================================
# TAX ENGINE MODELS
# ================================

class TaxJurisdiction(Base):
    """Tax jurisdictions for multi-country tax calculations."""
    
    __tablename__ = "tax_jurisdictions"
    
    jurisdiction_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Jurisdiction information
    country_code = Column(String(3), nullable=False)  # ISO 3166
    region_code = Column(String(10), nullable=True)
    jurisdiction_name = Column(String(255), nullable=False)
    
    # Tax system information
    tax_system = Column(String(50), nullable=False)  # VAT, GST, Sales_Tax
    authority_name = Column(String(255), nullable=True)  # e.g., "AADE"
    authority_website = Column(String(500), nullable=True)
    
    # Configuration
    default_currency = Column(String(3), default="USD")
    filing_requirements = Column(JSON, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tax_rates = relationship("TaxRate", back_populates="jurisdiction", cascade="all, delete-orphan")
    calculation_rules = relationship("TaxCalculationRule", back_populates="jurisdiction", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        Index("idx_jurisdiction_country", "country_code"),
        Index("idx_jurisdiction_active", "is_active"),
        Index("idx_jurisdiction_tax_system", "tax_system"),
    )


class TaxRate(Base):
    """Tax rates for different jurisdictions and categories."""
    
    __tablename__ = "tax_rates"
    
    rate_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jurisdiction_id = Column(UUID(as_uuid=True), ForeignKey("tax_jurisdictions.jurisdiction_id"), nullable=False)
    
    # Rate information
    tax_type = Column(String(50), nullable=False)  # VAT, GST, Federal, State
    rate_name = Column(String(255), nullable=False)
    rate_percentage = Column(Numeric(5, 4), nullable=False)
    
    # Applicability
    product_categories = Column(JSON, default=lambda: [])  # Which products
    business_types = Column(JSON, default=lambda: [])  # Which business types
    transaction_types = Column(JSON, default=lambda: [])  # Sale, purchase, import
    
    # Effective dates
    effective_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    
    # Configuration
    is_compound = Column(Boolean, default=False)  # Tax on tax
    calculation_order = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    jurisdiction = relationship("TaxJurisdiction", back_populates="tax_rates")
    
    # Constraints
    __table_args__ = (
        Index("idx_tax_rate_jurisdiction", "jurisdiction_id"),
        Index("idx_tax_rate_effective", "effective_date"),
        Index("idx_tax_rate_type", "tax_type"),
    )


class TaxCalculationRule(Base):
    """Complex tax calculation rules for different scenarios."""
    
    __tablename__ = "tax_calculation_rules"
    
    rule_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jurisdiction_id = Column(UUID(as_uuid=True), ForeignKey("tax_jurisdictions.jurisdiction_id"), nullable=False)
    
    # Rule information
    rule_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Rule logic
    conditions = Column(JSON, nullable=False)  # When this rule applies
    calculations = Column(JSON, nullable=False)  # How to calculate tax
    
    # Rule configuration
    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    # Effective dates
    effective_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    jurisdiction = relationship("TaxJurisdiction", back_populates="calculation_rules")
    
    # Constraints
    __table_args__ = (
        Index("idx_tax_rule_jurisdiction", "jurisdiction_id"),
        Index("idx_tax_rule_active", "is_active"),
        Index("idx_tax_rule_priority", "priority"),
        Index("idx_tax_rule_effective", "effective_date"),
    )


# ================================
# MARKETPLACE ENGINE MODELS
# ================================

class MarketplaceItem(Base):
    """Items available in the component marketplace."""
    
    __tablename__ = "marketplace_items"
    
    item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    
    # Item information
    name = Column(String(255), nullable=False)
    display_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    long_description = Column(Text, nullable=True)
    
    # Item type and category
    item_type = Column(String(50), nullable=False)  # component, theme, template, module
    category = Column(String(100), nullable=False)
    tags = Column(JSON, default=lambda: [])
    
    # Pricing
    price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    license_type = Column(String(50), nullable=False)  # free, paid, subscription
    
    # Content
    content_package = Column(JSON, nullable=False)  # Package definition
    screenshots = Column(JSON, default=lambda: [])
    demo_url = Column(String(500), nullable=True)
    
    # Stats and ratings
    download_count = Column(Integer, default=0)
    rating_average = Column(Numeric(3, 2), nullable=True)
    rating_count = Column(Integer, default=0)
    
    # Status
    status = Column(String(20), default="pending")  # pending, approved, rejected
    is_featured = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    creator = relationship("User")
    reviews = relationship("MarketplaceReview", back_populates="item", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        Index("idx_marketplace_creator", "creator_id"),
        Index("idx_marketplace_type", "item_type"),
        Index("idx_marketplace_category", "category"),
        Index("idx_marketplace_status", "status"),
        Index("idx_marketplace_featured", "is_featured"),
        Index("idx_marketplace_rating", "rating_average"),
    )


class MarketplaceReview(Base):
    """Reviews for marketplace items."""
    
    __tablename__ = "marketplace_reviews"
    
    review_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("marketplace_items.item_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    
    # Review content
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String(255), nullable=True)
    review_text = Column(Text, nullable=True)
    
    # Review metadata
    is_verified_purchase = Column(Boolean, default=False)
    helpful_count = Column(Integer, default=0)
    
    # Status
    is_approved = Column(Boolean, default=True)
    is_flagged = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    item = relationship("MarketplaceItem", back_populates="reviews")
    user = relationship("User")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("item_id", "user_id", name="uq_review_item_user"),
        Index("idx_review_item", "item_id"),
        Index("idx_review_user", "user_id"),
        Index("idx_review_rating", "rating"),
        Index("idx_review_approved", "is_approved"),
    ) 