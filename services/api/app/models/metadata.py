"""Metadata models for the CRM+ERP system."""

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
    String,
    Text,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class Tenant(Base):
    """Tenant configuration and settings."""
    
    __tablename__ = "tenants"
    
    tenant_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), unique=True, nullable=False)
    subdomain = Column(String(100), unique=True, nullable=True)
    
    # Localization settings
    default_locale = Column(String(10), default="el_GR", nullable=False)
    supported_locales = Column(JSON, default=["el_GR", "en_US"])
    
    # Theme settings
    default_theme_id = Column(UUID(as_uuid=True), ForeignKey("themes.theme_id"), nullable=True)
    
    # Status and configuration
    status = Column(String(20), default="active", nullable=False)  # active, suspended, archived
    database_name = Column(String(100), nullable=False)  # Tenant-specific database name
    max_users = Column(Integer, default=10)
    
    # Billing and subscription
    subscription_plan = Column(String(50), default="basic")
    subscription_status = Column(String(20), default="active")
    
    # Vertical and industry configuration
    industry_vertical = Column(String(50), nullable=True)  # Primary industry (ecommerce, automotive, etc.)
    vertical_packs_installed = Column(JSON, default=lambda: [])  # Installed vertical packs
    onboarding_completed = Column(Boolean, default=False)  # Onboarding wizard completed
    industry_config = Column(JSON, nullable=True)  # Industry-specific configuration
    
    # Feature flags
    features_enabled = Column(JSON, default=lambda: {
        "ai_features": True,
        "voice_integration": False,
        "advanced_analytics": False,
        "custom_widgets": True,
        "marketplace_access": True,
    })
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    field_definitions = relationship("FieldDefinition", back_populates="tenant", cascade="all, delete-orphan")
    entity_definitions = relationship("EntityDefinition", back_populates="tenant", cascade="all, delete-orphan")
    layout_definitions = relationship("EntityLayoutDefinition", back_populates="tenant", cascade="all, delete-orphan")
    list_view_definitions = relationship("ListViewDefinition", back_populates="tenant", cascade="all, delete-orphan")
    translations = relationship("Translation", back_populates="tenant", cascade="all, delete-orphan")
    themes = relationship("Theme", back_populates="tenant", cascade="all, delete-orphan", foreign_keys="Theme.tenant_id")
    # NEW: Theme variant system
    base_themes = relationship("BaseTheme", back_populates="tenant", cascade="all, delete-orphan", foreign_keys="BaseTheme.tenant_id")
    
    # Indexes
    __table_args__ = (
        Index("idx_tenant_domain", "domain"),
        Index("idx_tenant_status", "status"),
        Index("idx_tenant_created_at", "created_at"),
        Index("idx_tenant_industry", "industry_vertical"),  # Added index for industry queries
        Index("idx_tenant_onboarding", "onboarding_completed"),  # Added index for onboarding status
    )
    
    def __repr__(self):
        return f"<Tenant(name='{self.name}', domain='{self.domain}')>"


class EntityDefinition(Base):
    """Entity metadata definitions."""
    
    __tablename__ = "entity_definitions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=True)  # NULL = global
    
    # Entity identification
    entity_name = Column(String(100), nullable=False)  # e.g., "Account", "Contact"
    display_label = Column(String(255), nullable=False)  # Display name
    plural_label = Column(String(255), nullable=False)  # Plural display name
    
    # Entity configuration
    description = Column(Text, nullable=True)
    icon = Column(String(100), nullable=True)  # Icon identifier
    color = Column(String(20), nullable=True)  # Color theme
    
    # Vertical-specific configuration
    vertical = Column(String(50), nullable=True)  # Industry vertical (ecommerce, automotive, etc.)
    vertical_pack_id = Column(String(100), nullable=True)  # Which vertical pack provides this entity
    industry_specific_config = Column(JSON, nullable=True)  # Vertical-specific settings
    
    # Business configuration
    is_system_entity = Column(Boolean, default=False)  # System vs custom entity
    is_active = Column(Boolean, default=True)
    supports_attachments = Column(Boolean, default=True)
    supports_comments = Column(Boolean, default=True)
    supports_workflows = Column(Boolean, default=True)
    
    # Record management
    auto_number_format = Column(String(50), nullable=True)  # e.g., "ACC-{0000}"
    default_sort_field = Column(String(100), nullable=True)
    default_sort_order = Column(String(10), default="ASC")
    
    # API configuration
    api_name = Column(String(100), nullable=True)  # Custom API endpoint name
    enable_api = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="entity_definitions")
    field_definitions = relationship("FieldDefinition", back_populates="entity", cascade="all, delete-orphan")
    layout_definitions = relationship("EntityLayoutDefinition", back_populates="entity", cascade="all, delete-orphan")
    list_view_definitions = relationship("ListViewDefinition", back_populates="entity", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("tenant_id", "entity_name", name="uq_entity_tenant_name"),
        Index("idx_entity_tenant_id", "tenant_id"),
        Index("idx_entity_name", "entity_name"),
        Index("idx_entity_active", "is_active"),
        Index("idx_entity_vertical", "vertical"),  # Added index for vertical queries
        Index("idx_entity_vertical_pack", "vertical_pack_id"),  # Added index for pack queries
    )
    
    def __repr__(self):
        return f"<EntityDefinition(entity_name='{self.entity_name}', tenant_id='{self.tenant_id}')>"


class FieldDefinition(Base):
    """Field metadata definitions."""
    
    __tablename__ = "field_definitions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=True)  # NULL = global
    entity_id = Column(UUID(as_uuid=True), ForeignKey("entity_definitions.id"), nullable=False)
    
    # Field identification
    field_name = Column(String(100), nullable=False)  # Database column name
    label_key = Column(String(255), nullable=False)  # Translation key
    api_name = Column(String(100), nullable=True)  # Custom API field name
    
    # Field type and validation
    data_type = Column(String(50), nullable=False)  # string, integer, decimal, date, datetime, boolean, picklist, lookup, file, etc.
    length = Column(Integer, nullable=True)  # For string fields
    precision = Column(Integer, nullable=True)  # For decimal fields
    scale = Column(Integer, nullable=True)  # For decimal fields
    
    # Field behavior
    is_required = Column(Boolean, default=False)
    is_unique = Column(Boolean, default=False)
    is_indexed = Column(Boolean, default=False)
    is_searchable = Column(Boolean, default=True)
    is_sortable = Column(Boolean, default=True)
    is_filterable = Column(Boolean, default=True)
    is_system_field = Column(Boolean, default=False)  # Added missing field
    
    # Display configuration
    default_value = Column(JSON, nullable=True)  # Default value (JSON for flexibility)
    help_text = Column(Text, nullable=True)
    placeholder = Column(String(255), nullable=True)
    
    # Field ordering and grouping
    sort_order = Column(Integer, default=0)
    field_group = Column(String(100), nullable=True)  # Grouping for UI
    
    # Validation rules
    validation_rules = Column(JSON, nullable=True)  # JSON validation rules
    
    # Picklist configuration
    picklist_name = Column(String(100), nullable=True)  # Reference to picklist
    
    # Lookup configuration
    lookup_entity = Column(String(100), nullable=True)  # Target entity for lookups
    lookup_field = Column(String(100), nullable=True)  # Display field for lookups
    
    # File configuration
    allowed_file_types = Column(JSON, nullable=True)  # For file fields
    max_file_size = Column(Integer, nullable=True)  # In bytes
    
    # Conditional display
    visibility_conditions = Column(JSON, nullable=True)  # When to show/hide field
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="field_definitions")
    entity = relationship("EntityDefinition", back_populates="field_definitions")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("entity_id", "field_name", name="uq_field_entity_name"),
        Index("idx_field_tenant_id", "tenant_id"),
        Index("idx_field_entity_id", "entity_id"),
        Index("idx_field_data_type", "data_type"),
        Index("idx_field_sort_order", "sort_order"),
    )
    
    def __repr__(self):
        return f"<FieldDefinition(field_name='{self.field_name}', entity_id='{self.entity_id}')>"


class EntityLayoutDefinition(Base):
    """Layout metadata for entity forms and views."""
    
    __tablename__ = "entity_layout_definitions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=True)  # NULL = global
    entity_id = Column(UUID(as_uuid=True), ForeignKey("entity_definitions.id"), nullable=False)
    
    # Layout identification
    layout_name = Column(String(100), nullable=False)  # e.g., "Default", "Compact", "Detailed"
    layout_type = Column(String(50), nullable=False)  # form, list, detail, card, kanban
    
    # Layout configuration
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)
    is_system_layout = Column(Boolean, default=False)
    
    # Layout structure (JSON)
    sections = Column(JSON, nullable=False)  # Layout sections and field arrangements
    # Example structure:
    # {
    #   "sections": [
    #     {
    #       "title": "Basic Information",
    #       "columns": 2,
    #       "fields": ["name", "email", "phone"],
    #       "collapsible": false
    #     }
    #   ]
    # }
    
    # Responsive configuration
    responsive_config = Column(JSON, nullable=True)  # Mobile/tablet layouts
    
    # Conditional layout
    visibility_conditions = Column(JSON, nullable=True)  # When to show this layout
    
    # User permissions
    allowed_profiles = Column(JSON, nullable=True)  # Profile IDs that can use this layout
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="layout_definitions")
    entity = relationship("EntityDefinition", back_populates="layout_definitions")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("entity_id", "layout_name", name="uq_layout_entity_name"),
        Index("idx_entity_layout_tenant_id", "tenant_id"),
        Index("idx_entity_layout_entity_id", "entity_id"),
        Index("idx_entity_layout_type", "layout_type"),
        Index("idx_entity_layout_default", "is_default"),
    )
    
    def __repr__(self):
        return f"<LayoutDefinition(layout_name='{self.layout_name}', entity_id='{self.entity_id}')>"


class ListViewDefinition(Base):
    """List view metadata for entity data tables."""
    
    __tablename__ = "list_view_definitions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=True)
    entity_id = Column(UUID(as_uuid=True), ForeignKey("entity_definitions.id"), nullable=False)
    
    # View identification
    view_name = Column(String(100), nullable=False)  # e.g., "all_contacts", "active_customers"
    display_label = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Column configuration
    columns = Column(JSON, nullable=False)  # Array of column definitions
    # Example: [{"field": "name", "label": "Name", "sortable": true, "filterable": true, "width": 200}]
    
    # Default behavior
    default_sort_field = Column(String(100), nullable=True)
    default_sort_order = Column(String(10), default="ASC")  # ASC, DESC
    default_page_size = Column(Integer, default=25)
    
    # Filter configuration
    quick_filters = Column(JSON, nullable=True)  # Quick filter buttons
    # Example: [{"field": "status", "label": "Active", "value": "active"}]
    
    advanced_filters = Column(JSON, nullable=True)  # Advanced filter configuration
    # Example: {"enabled": true, "operators": ["equals", "contains", "range"]}
    
    # Search configuration  
    search_enabled = Column(Boolean, default=True)
    search_fields = Column(JSON, nullable=True)  # Fields to search across
    global_search = Column(Boolean, default=True)  # Search all visible columns
    
    # Pagination configuration
    pagination_enabled = Column(Boolean, default=True)
    page_size_options = Column(JSON, default=lambda: [10, 25, 50, 100])
    show_total_count = Column(Boolean, default=True)
    
    # Export and bulk actions
    export_enabled = Column(Boolean, default=False)
    export_formats = Column(JSON, default=lambda: ["csv", "excel"])
    bulk_actions = Column(JSON, nullable=True)  # Available bulk operations
    
    # UI configuration
    row_actions = Column(JSON, nullable=True)  # Row-level actions (edit, delete, etc.)
    toolbar_actions = Column(JSON, nullable=True)  # Toolbar actions (new, import, etc.)
    show_row_numbers = Column(Boolean, default=False)
    striped_rows = Column(Boolean, default=True)
    
    # Access control
    access_roles = Column(JSON, default=lambda: [])
    is_public = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="list_view_definitions")
    entity = relationship("EntityDefinition", back_populates="list_view_definitions")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("tenant_id", "entity_id", "view_name", name="uq_listview_tenant_entity_name"),
        Index("idx_listview_tenant_id", "tenant_id"),
        Index("idx_listview_entity_id", "entity_id"),
    )
    
    def __repr__(self):
        return f"<ListViewDefinition(view_name='{self.view_name}', entity_id='{self.entity_id}')>"


class PicklistValue(Base):
    """Picklist values for dropdown fields."""
    
    __tablename__ = "picklist_values"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=True)  # NULL = global
    
    # Picklist identification
    picklist_name = Column(String(100), nullable=False)
    value = Column(String(255), nullable=False)
    label = Column(String(255), nullable=False)
    
    # Value configuration
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    
    # Styling
    color = Column(String(20), nullable=True)
    icon = Column(String(100), nullable=True)
    
    # Dependencies
    parent_value = Column(String(255), nullable=True)  # For dependent picklists
    dependency_field = Column(String(100), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("tenant_id", "picklist_name", "value", name="uq_picklist_tenant_name_value"),
        Index("idx_picklist_tenant_id", "tenant_id"),
        Index("idx_picklist_name", "picklist_name"),
        Index("idx_picklist_active", "is_active"),
        Index("idx_picklist_sort_order", "sort_order"),
    )
    
    def __repr__(self):
        return f"<PicklistValue(picklist_name='{self.picklist_name}', value='{self.value}')>"


class Translation(Base):
    """Translations for all translatable content."""
    
    __tablename__ = "translations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=True)  # NULL = global
    
    # Translation identification
    locale = Column(String(10), nullable=False)  # e.g., "el_GR", "en_US"
    key = Column(String(500), nullable=False)  # Translation key
    text = Column(Text, nullable=False)  # Translated text
    
    # Translation context
    namespace = Column(String(100), nullable=True)  # e.g., "entity", "field", "ui"
    context = Column(String(255), nullable=True)  # Additional context
    
    # Translation metadata
    is_system_translation = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=True)
    translator_notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="translations")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("tenant_id", "locale", "key", name="uq_translation_tenant_locale_key"),
        Index("idx_translation_tenant_id", "tenant_id"),
        Index("idx_translation_locale", "locale"),
        Index("idx_translation_key", "key"),
        Index("idx_translation_namespace", "namespace"),
    )
    
    def __repr__(self):
        return f"<Translation(locale='{self.locale}', key='{self.key}')>"


class Theme(Base):
    """Theme definitions for UI customization."""
    
    __tablename__ = "themes"
    
    theme_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=True)  # NULL = global
    
    # Theme identification
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Theme inheritance
    parent_theme_id = Column(UUID(as_uuid=True), ForeignKey("themes.theme_id"), nullable=True)
    
    # Theme configuration
    is_system_theme = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    
    # Theme version
    version = Column(String(20), default="1.0.0")
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="themes", foreign_keys=[tenant_id])
    parent_theme = relationship("Theme", remote_side=[theme_id])
    theme_properties = relationship("ThemeProperty", back_populates="theme", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("tenant_id", "name", name="uq_theme_tenant_name"),
        Index("idx_theme_tenant_id", "tenant_id"),
        Index("idx_theme_active", "is_active"),
        Index("idx_theme_default", "is_default"),
    )
    
    def __repr__(self):
        return f"<Theme(name='{self.name}', tenant_id='{self.tenant_id}')>"


class ThemeProperty(Base):
    """Individual theme properties (CSS custom properties)."""
    
    __tablename__ = "theme_properties"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    theme_id = Column(UUID(as_uuid=True), ForeignKey("themes.theme_id"), nullable=False)
    
    # Property definition
    property_key = Column(String(100), nullable=False)  # e.g., "--primary-color"
    property_value = Column(String(500), nullable=False)  # e.g., "#0066CC"
    
    # Property metadata
    property_type = Column(String(50), nullable=True)  # color, size, font, etc.
    category = Column(String(100), nullable=True)  # colors, typography, spacing, etc.
    description = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    theme = relationship("Theme", back_populates="theme_properties")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("theme_id", "property_key", name="uq_theme_property_key"),
        Index("idx_theme_property_theme_id", "theme_id"),
        Index("idx_theme_property_category", "category"),
    )
    
    def __repr__(self):
        return f"<ThemeProperty(property_key='{self.property_key}', theme_id='{self.theme_id}')>" 