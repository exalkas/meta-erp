"""
Vertical Configuration Models - Industry Template System

Models for managing industry verticals, templates, and rapid deployment.
Enables any industry vertical to be deployed as configuration templates.
"""

import uuid
from datetime import datetime, date
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    Index,
    Numeric,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class VerticalDefinition(Base):
    """Industry vertical definitions and configuration."""
    
    __tablename__ = "vertical_definitions"
    
    vertical_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Vertical identification
    vertical_code = Column(String(50), nullable=False)  # 'LEGAL', 'MEDICAL', 'AUTOMOTIVE'
    vertical_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)  # 'PROFESSIONAL_SERVICES', 'HEALTHCARE', 'MANUFACTURING'
    
    # Vertical configuration
    default_entities = Column(JSON, nullable=True)  # Standard entities for this vertical
    default_workflows = Column(JSON, nullable=True)  # Standard processes
    compliance_requirements = Column(JSON, nullable=True)  # Industry compliance needs
    integration_requirements = Column(JSON, nullable=True)  # External system integrations
    
    # Business rules
    validation_rules = Column(JSON, nullable=True)  # Industry-specific validation
    calculation_rules = Column(JSON, nullable=True)  # Industry calculations
    workflow_rules = Column(JSON, nullable=True)  # Standard workflow logic
    
    # Localization
    country_adaptations = Column(JSON, nullable=True)  # Country-specific adaptations
    language_requirements = Column(JSON, nullable=True)  # Required languages
    
    # Marketplace information
    icon = Column(String(255), nullable=True)  # Vertical icon URL
    tags = Column(JSON, default=list, nullable=False)  # Search tags
    target_company_size = Column(JSON, nullable=True)  # 'SMALL', 'MEDIUM', 'ENTERPRISE'
    pricing_model = Column(String(50), nullable=True)  # 'FREE', 'SUBSCRIPTION', 'ONE_TIME'
    
    # Status and lifecycle
    is_active = Column(Boolean, default=True, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    maturity_level = Column(String(50), default="BETA", nullable=False)  # 'ALPHA', 'BETA', 'STABLE'
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    vertical_templates = relationship("VerticalTemplate", back_populates="vertical_definition", cascade="all, delete-orphan")
    marketplace_listings = relationship("VerticalMarketplace", back_populates="vertical_definition", cascade="all, delete-orphan")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("vertical_code", name="uq_vertical_code"),
        Index("idx_vertical_category", "category"),
        Index("idx_vertical_active", "is_active"),
        Index("idx_vertical_featured", "is_featured"),
        Index("idx_vertical_maturity", "maturity_level"),
    )
    
    def __repr__(self):
        return f"<VerticalDefinition(code='{self.vertical_code}', name='{self.vertical_name}')>"


class VerticalTemplate(Base):
    """Vertical templates for quick start configurations."""
    
    __tablename__ = "vertical_templates"
    
    template_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vertical_id = Column(UUID(as_uuid=True), ForeignKey("vertical_definitions.vertical_id"), nullable=False)
    
    # Template identification
    template_name = Column(String(255), nullable=False)
    template_category = Column(String(100), nullable=True)  # 'SMALL_BUSINESS', 'ENTERPRISE', 'STARTER'
    description = Column(Text, nullable=True)
    
    # Template configuration
    entity_configurations = Column(JSON, nullable=True)  # Pre-configured entities
    workflow_configurations = Column(JSON, nullable=True)  # Pre-configured workflows
    page_layouts = Column(JSON, nullable=True)  # Pre-configured page layouts
    user_roles = Column(JSON, nullable=True)  # Standard user roles
    business_rules = Column(JSON, nullable=True)  # Template-specific business rules
    
    # Deployment settings
    setup_wizard_steps = Column(JSON, nullable=True)  # Onboarding flow
    sample_data = Column(JSON, nullable=True)  # Demo data for testing
    configuration_instructions = Column(JSON, nullable=True)  # Setup guidance
    migration_scripts = Column(JSON, nullable=True)  # Data migration helpers
    
    # Template metadata
    complexity_level = Column(String(50), default="INTERMEDIATE", nullable=False)  # 'BASIC', 'INTERMEDIATE', 'ADVANCED'
    estimated_setup_time = Column(Integer, nullable=True)  # Minutes to deploy
    target_users = Column(JSON, nullable=True)  # Target user count range
    required_integrations = Column(JSON, nullable=True)  # Required external systems
    
    # Marketplace information
    preview_images = Column(JSON, nullable=True)  # Screenshot URLs
    demo_video_url = Column(String(500), nullable=True)
    documentation_url = Column(String(500), nullable=True)
    
    # Status and versioning
    version = Column(String(20), default="1.0.0", nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    is_certified = Column(Boolean, default=False, nullable=False)  # Verified by platform team
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    vertical_definition = relationship("VerticalDefinition", back_populates="vertical_templates")
    marketplace_items = relationship("VerticalMarketplace", back_populates="vertical_template", cascade="all, delete-orphan")
    deployments = relationship("VerticalDeployment", back_populates="vertical_template", cascade="all, delete-orphan")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("vertical_id", "template_name", name="uq_vertical_template_name"),
        Index("idx_vertical_template_vertical", "vertical_id"),
        Index("idx_vertical_template_category", "template_category"),
        Index("idx_vertical_template_published", "is_published"),
        Index("idx_vertical_template_certified", "is_certified"),
        Index("idx_vertical_template_complexity", "complexity_level"),
    )
    
    def __repr__(self):
        return f"<VerticalTemplate(name='{self.template_name}', version='{self.version}')>"


class VerticalMarketplace(Base):
    """Marketplace listings for vertical templates."""
    
    __tablename__ = "vertical_marketplace"
    
    marketplace_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vertical_id = Column(UUID(as_uuid=True), ForeignKey("vertical_definitions.vertical_id"), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("vertical_templates.template_id"), nullable=False)
    publisher_id = Column(UUID(as_uuid=True), nullable=True)  # Who published this
    
    # Marketplace info
    title = Column(String(255), nullable=False)
    short_description = Column(String(500), nullable=True)
    full_description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    
    # Pricing and licensing
    price = Column(Numeric(10, 2), default=0.00, nullable=False)  # 0.00 for free templates
    currency = Column(String(3), default="USD", nullable=False)
    license_type = Column(String(50), default="MIT", nullable=False)  # 'MIT', 'COMMERCIAL', 'CUSTOM'
    pricing_model = Column(String(50), default="ONE_TIME", nullable=False)  # 'FREE', 'ONE_TIME', 'SUBSCRIPTION'
    
    # Marketplace metrics
    rating_average = Column(Numeric(3, 2), default=0.00, nullable=False)
    rating_count = Column(Integer, default=0, nullable=False)
    download_count = Column(Integer, default=0, nullable=False)
    installation_count = Column(Integer, default=0, nullable=False)
    revenue_generated = Column(Numeric(12, 2), default=0.00, nullable=False)
    
    # Content and media
    screenshots = Column(JSON, nullable=True)  # Array of image URLs
    demo_video_url = Column(String(500), nullable=True)
    documentation_url = Column(String(500), nullable=True)
    changelog_url = Column(String(500), nullable=True)
    support_contact = Column(String(255), nullable=True)
    
    # SEO and discovery
    keywords = Column(JSON, nullable=True)  # Search keywords
    compatibility_info = Column(JSON, nullable=True)  # System requirements
    featured_until = Column(DateTime(timezone=True), nullable=True)  # Featured expiry
    
    # Status and approval
    approval_status = Column(String(50), default="PENDING", nullable=False)  # 'DRAFT', 'PENDING', 'APPROVED', 'REJECTED'
    rejection_reason = Column(Text, nullable=True)
    is_featured = Column(Boolean, default=False, nullable=False)
    is_editor_choice = Column(Boolean, default=False, nullable=False)
    
    # Metadata
    published_at = Column(DateTime(timezone=True), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    vertical_definition = relationship("VerticalDefinition", back_populates="marketplace_listings")
    vertical_template = relationship("VerticalTemplate", back_populates="marketplace_items")
    reviews = relationship("MarketplaceReview", back_populates="marketplace_listing", cascade="all, delete-orphan")
    installations = relationship("VerticalInstallation", back_populates="marketplace_listing", cascade="all, delete-orphan")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("vertical_id", "template_id", name="uq_marketplace_vertical_template"),
        Index("idx_marketplace_vertical", "vertical_id"),
        Index("idx_marketplace_template", "template_id"),
        Index("idx_marketplace_publisher", "publisher_id"),
        Index("idx_vertical_marketplace_category", "category"),
        Index("idx_marketplace_price", "price"),
        Index("idx_vertical_marketplace_rating", "rating_average"),
        Index("idx_vertical_marketplace_downloads", "download_count"),
        Index("idx_vertical_marketplace_status", "approval_status"),
        Index("idx_vertical_marketplace_featured", "is_featured"),
    )
    
    def __repr__(self):
        return f"<VerticalMarketplace(title='{self.title}', price='{self.price}')>"


class MarketplaceReview(Base):
    """Reviews and ratings for marketplace templates."""
    
    __tablename__ = "marketplace_reviews"
    
    review_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    marketplace_id = Column(UUID(as_uuid=True), ForeignKey("vertical_marketplace.marketplace_id"), nullable=False)
    reviewer_tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    reviewer_user_id = Column(UUID(as_uuid=True), nullable=False)
    
    # Review content
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String(255), nullable=True)
    review_text = Column(Text, nullable=True)
    pros = Column(Text, nullable=True)
    cons = Column(Text, nullable=True)
    
    # Review metadata
    verified_purchase = Column(Boolean, default=False, nullable=False)
    deployment_experience = Column(String(50), nullable=True)  # 'EASY', 'MODERATE', 'DIFFICULT'
    recommendation_score = Column(Integer, nullable=True)  # 1-10 NPS style
    
    # Community engagement
    helpful_votes = Column(Integer, default=0, nullable=False)
    total_votes = Column(Integer, default=0, nullable=False)
    
    # Moderation
    review_status = Column(String(50), default="PUBLISHED", nullable=False)  # 'PUBLISHED', 'MODERATED', 'HIDDEN'
    moderation_reason = Column(Text, nullable=True)
    moderated_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    marketplace_listing = relationship("VerticalMarketplace", back_populates="reviews")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("marketplace_id", "reviewer_tenant_id", name="uq_review_marketplace_tenant"),
        Index("idx_review_marketplace", "marketplace_id"),
        Index("idx_review_tenant", "reviewer_tenant_id"),
        Index("idx_review_rating", "rating"),
        Index("idx_review_status", "review_status"),
        Index("idx_review_helpful", "helpful_votes"),
    )
    
    def __repr__(self):
        return f"<MarketplaceReview(rating={self.rating}, marketplace_id='{self.marketplace_id}')>"


class VerticalDeployment(Base):
    """Track vertical template deployments and configurations."""
    
    __tablename__ = "vertical_deployments"
    
    deployment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("vertical_templates.template_id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    
    # Deployment info
    deployment_name = Column(String(255), nullable=False)
    deployment_status = Column(String(50), default="PLANNING", nullable=False)  # 'PLANNING', 'CONFIGURING', 'TESTING', 'DEPLOYED', 'FAILED'
    deployment_phase = Column(String(50), nullable=True)  # 'ENTITIES', 'WORKFLOWS', 'UI', 'TESTING', 'FINALIZATION'
    
    # Progress tracking
    completion_percentage = Column(Integer, default=0, nullable=False)
    current_task = Column(String(255), nullable=True)
    estimated_completion_date = Column(DateTime(timezone=True), nullable=True)
    actual_completion_date = Column(DateTime(timezone=True), nullable=True)
    
    # Configuration tracking
    entities_configured = Column(Integer, default=0, nullable=False)
    workflows_configured = Column(Integer, default=0, nullable=False)
    pages_configured = Column(Integer, default=0, nullable=False)
    business_rules_configured = Column(Integer, default=0, nullable=False)
    components_configured = Column(Integer, default=0, nullable=False)
    
    # Quality metrics
    test_coverage_percentage = Column(Integer, default=0, nullable=False)
    configuration_errors = Column(Integer, default=0, nullable=False)
    performance_score = Column(Integer, nullable=True)  # 1-100 performance rating
    
    # Customization tracking
    customizations_applied = Column(JSON, nullable=True)  # Custom modifications
    custom_entities_added = Column(Integer, default=0, nullable=False)
    custom_workflows_added = Column(Integer, default=0, nullable=False)
    
    # Deployment metadata
    deployment_notes = Column(Text, nullable=True)
    deployment_environment = Column(String(50), default="PRODUCTION", nullable=False)  # 'DEVELOPMENT', 'STAGING', 'PRODUCTION'
    
    # User tracking
    deployed_by = Column(UUID(as_uuid=True), nullable=False)
    deployed_at = Column(DateTime(timezone=True), nullable=True)
    last_modified_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    vertical_template = relationship("VerticalTemplate", back_populates="deployments")
    deployment_steps = relationship("DeploymentStep", back_populates="deployment", cascade="all, delete-orphan")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("template_id", "tenant_id", "deployment_name", name="uq_deployment_template_tenant_name"),
        Index("idx_deployment_template", "template_id"),
        Index("idx_deployment_tenant", "tenant_id"),
        Index("idx_deployment_status", "deployment_status"),
        Index("idx_deployment_phase", "deployment_phase"),
        Index("idx_deployment_completion", "completion_percentage"),
        Index("idx_deployment_environment", "deployment_environment"),
    )
    
    def __repr__(self):
        return f"<VerticalDeployment(name='{self.deployment_name}', status='{self.deployment_status}')>"


class DeploymentStep(Base):
    """Individual steps in vertical deployment process."""
    
    __tablename__ = "deployment_steps"
    
    step_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deployment_id = Column(UUID(as_uuid=True), ForeignKey("vertical_deployments.deployment_id"), nullable=False)
    
    # Step identification
    step_name = Column(String(255), nullable=False)
    step_category = Column(String(100), nullable=False)  # 'SETUP', 'CONFIGURATION', 'VALIDATION', 'DEPLOYMENT'
    step_order = Column(Integer, nullable=False)
    
    # Step status
    step_status = Column(String(50), default="PENDING", nullable=False)  # 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED'
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    # Step details
    configuration_data = Column(JSON, nullable=True)  # Step-specific config
    validation_results = Column(JSON, nullable=True)  # Validation outcomes
    error_details = Column(JSON, nullable=True)  # Error information
    output_data = Column(JSON, nullable=True)  # Step results
    
    # Automation
    is_automated = Column(Boolean, default=False, nullable=False)
    automation_script = Column(String(500), nullable=True)
    requires_manual_review = Column(Boolean, default=False, nullable=False)
    
    # User tracking
    assigned_to = Column(UUID(as_uuid=True), nullable=True)
    completed_by = Column(UUID(as_uuid=True), nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    deployment = relationship("VerticalDeployment", back_populates="deployment_steps")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("deployment_id", "step_name", name="uq_deployment_step_name"),
        Index("idx_deployment_step_deployment", "deployment_id"),
        Index("idx_deployment_step_category", "step_category"),
        Index("idx_deployment_step_status", "step_status"),
        Index("idx_deployment_step_order", "step_order"),
        Index("idx_deployment_step_automated", "is_automated"),
    )
    
    def __repr__(self):
        return f"<DeploymentStep(name='{self.step_name}', status='{self.step_status}')>"


class VerticalInstallation(Base):
    """Track marketplace template installations by tenants."""
    
    __tablename__ = "vertical_installations"
    
    installation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    marketplace_id = Column(UUID(as_uuid=True), ForeignKey("vertical_marketplace.marketplace_id"), nullable=False)
    buyer_tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=False)
    
    # Purchase information
    purchase_price = Column(Numeric(10, 2), nullable=False)
    purchase_currency = Column(String(3), default="USD", nullable=False)
    payment_method = Column(String(50), nullable=True)
    transaction_id = Column(String(255), nullable=True)
    
    # Installation details
    installation_status = Column(String(50), default="PURCHASED", nullable=False)  # 'PURCHASED', 'INSTALLING', 'INSTALLED', 'FAILED'
    installation_date = Column(DateTime(timezone=True), nullable=True)
    configuration_customizations = Column(JSON, nullable=True)  # Custom modifications
    
    # Support and updates
    support_expires_at = Column(DateTime(timezone=True), nullable=True)
    update_subscription = Column(Boolean, default=True, nullable=False)
    last_updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Usage tracking
    first_used_at = Column(DateTime(timezone=True), nullable=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    usage_frequency = Column(String(50), nullable=True)  # 'DAILY', 'WEEKLY', 'MONTHLY', 'RARELY'
    
    # Metadata
    purchased_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    marketplace_listing = relationship("VerticalMarketplace", back_populates="installations")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("marketplace_id", "buyer_tenant_id", name="uq_installation_marketplace_tenant"),
        Index("idx_installation_marketplace", "marketplace_id"),
        Index("idx_installation_tenant", "buyer_tenant_id"),
        Index("idx_installation_status", "installation_status"),
        Index("idx_installation_date", "installation_date"),
        Index("idx_installation_support", "support_expires_at"),
    )
    
    def __repr__(self):
        return f"<VerticalInstallation(marketplace_id='{self.marketplace_id}', tenant_id='{self.buyer_tenant_id}')>"