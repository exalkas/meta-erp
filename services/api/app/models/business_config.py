"""SAP-style business configuration models."""

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


class BusinessConfigMaster(Base):
    """Master table for business configuration domains (SAP T-Code style)."""
    
    __tablename__ = "business_config_master"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Configuration domain
    config_domain = Column(String(50), nullable=False)  # 'ENTITY_RULES', 'FIELD_CONFIG', 'WORKFLOW'
    config_table = Column(String(100), nullable=False)  # Physical table name for this domain
    description = Column(Text, nullable=True)
    version = Column(String(10), default="1.0", nullable=False)
    
    # Status and lifecycle
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    config_entries = relationship("BusinessConfigEntry", back_populates="config_master", cascade="all, delete-orphan")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("config_domain", name="uq_business_config_domain"),
        Index("idx_business_config_domain", "config_domain"),
        Index("idx_business_config_master_active", "is_active"),
    )
    
    def __repr__(self):
        return f"<BusinessConfigMaster(config_domain='{self.config_domain}', version='{self.version}')>"


class BusinessConfigEntry(Base):
    """SAP-style business configuration entries with country/industry context."""
    
    __tablename__ = "business_config_entries"
    
    entry_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    config_master_id = Column(UUID(as_uuid=True), ForeignKey("business_config_master.id"), nullable=False)
    
    # Configuration identification
    config_domain = Column(String(50), nullable=False)  # Duplicate for query optimization
    config_key = Column(String(255), nullable=False)  # 'CLIENT_VALIDATION', 'BILLING_RULES'
    
    # Localization context
    country_code = Column(String(2), nullable=True)  # 'US', 'CA', 'UK'
    state_province = Column(String(10), nullable=True)  # 'CA', 'NY', 'TX' for US-specific rules
    industry_code = Column(String(50), nullable=True)  # 'LEGAL', 'MEDICAL', 'AUTOMOTIVE'
    vertical_code = Column(String(50), nullable=True)  # 'LAW_FIRM', 'HOSPITAL', 'DEALERSHIP'
    
    # Tenant context
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=True)  # Tenant-specific overrides
    
    # Configuration data
    config_values = Column(JSON, nullable=False)  # Business rule configuration
    
    # Lifecycle management
    effective_from = Column(Date, nullable=True)
    effective_to = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Change tracking (SAP-style)
    transport_number = Column(String(20), nullable=True)  # SAP-style change tracking
    change_user_id = Column(UUID(as_uuid=True), nullable=True)
    change_timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    config_master = relationship("BusinessConfigMaster", back_populates="config_entries")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint(
            "config_domain", "config_key", "country_code", "state_province", 
            "industry_code", "vertical_code", "tenant_id",
            name="uq_business_config_entry"
        ),
        Index("idx_business_config_domain_key", "config_domain", "config_key"),
        Index("idx_business_config_country", "country_code"),
        Index("idx_business_config_industry", "industry_code"),
        Index("idx_business_config_vertical", "vertical_code"),
        Index("idx_business_config_tenant", "tenant_id"),
        Index("idx_business_config_effective", "effective_from", "effective_to"),
        Index("idx_business_config_entries_active", "is_active"),
    )
    
    def __repr__(self):
        return f"<BusinessConfigEntry(domain='{self.config_domain}', key='{self.config_key}', country='{self.country_code}')>"


class BusinessRuleDefinition(Base):
    """Configurable business rule definitions (SAP-style rule engine)."""
    
    __tablename__ = "business_rule_definitions"
    
    rule_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Rule identification
    rule_name = Column(String(255), nullable=False)
    rule_category = Column(String(100), nullable=False)  # 'VALIDATION', 'CALCULATION', 'WORKFLOW'
    rule_type = Column(String(50), nullable=False)  # 'CONDITIONAL', 'LOOKUP', 'FORMULA'
    description = Column(Text, nullable=True)
    
    # Rule logic configuration
    trigger_conditions = Column(JSON, nullable=False)  # When this rule should execute
    rule_logic = Column(JSON, nullable=False)  # Configurable business logic
    input_parameters = Column(JSON, nullable=True)  # Expected input structure
    output_format = Column(JSON, nullable=True)  # Expected output structure
    
    # Localization context
    country_code = Column(String(2), nullable=True)
    industry_code = Column(String(50), nullable=True)
    vertical_code = Column(String(50), nullable=True)
    
    # Tenant context
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=True)  # Tenant-specific rules
    
    # Rule execution configuration
    execution_order = Column(Integer, default=100, nullable=False)  # Rule execution priority
    is_mandatory = Column(Boolean, default=False, nullable=False)  # Cannot be disabled
    error_handling = Column(JSON, nullable=True)  # How to handle rule failures
    
    # Performance configuration
    cache_results = Column(Boolean, default=False, nullable=False)
    cache_duration_minutes = Column(Integer, nullable=True)
    max_execution_time_ms = Column(Integer, default=5000, nullable=False)
    
    # Lifecycle management
    version = Column(String(10), default="1.0", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    modified_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    rule_executions = relationship("BusinessRuleExecution", back_populates="rule_definition", cascade="all, delete-orphan")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint(
            "rule_name", "country_code", "industry_code", "vertical_code", "tenant_id",
            name="uq_business_rule_context"
        ),
        Index("idx_business_rule_category", "rule_category"),
        Index("idx_business_rule_type", "rule_type"),
        Index("idx_business_rule_country", "country_code"),
        Index("idx_business_rule_industry", "industry_code"),
        Index("idx_business_rule_vertical", "vertical_code"),
        Index("idx_business_rule_tenant", "tenant_id"),
        Index("idx_business_rule_active", "is_active"),
        Index("idx_business_rule_execution_order", "execution_order"),
    )
    
    def __repr__(self):
        return f"<BusinessRuleDefinition(name='{self.rule_name}', category='{self.rule_category}')>"


class BusinessRuleExecution(Base):
    """Track business rule execution history and performance."""
    
    __tablename__ = "business_rule_executions"
    
    execution_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_id = Column(UUID(as_uuid=True), ForeignKey("business_rule_definitions.rule_id"), nullable=False)
    
    # Execution context
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    entity_type = Column(String(100), nullable=True)  # What entity triggered this rule
    entity_id = Column(UUID(as_uuid=True), nullable=True)  # Which record triggered this rule
    
    # Execution data
    input_data = Column(JSON, nullable=True)  # Input data for the rule
    output_data = Column(JSON, nullable=True)  # Rule execution result
    execution_status = Column(String(50), nullable=False)  # 'SUCCESS', 'FAILURE', 'TIMEOUT', 'SKIPPED'
    error_message = Column(Text, nullable=True)
    
    # Performance metrics
    execution_time_ms = Column(Integer, nullable=True)
    memory_usage_mb = Column(Numeric(10, 2), nullable=True)
    
    # Execution metadata
    executed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    rule_definition = relationship("BusinessRuleDefinition", back_populates="rule_executions")
    
    # Constraints and indexes
    __table_args__ = (
        Index("idx_business_rule_execution_rule", "rule_id"),
        Index("idx_business_rule_execution_tenant", "tenant_id"),
        Index("idx_business_rule_execution_status", "execution_status"),
        Index("idx_business_rule_execution_time", "executed_at"),
        Index("idx_business_rule_execution_entity", "entity_type", "entity_id"),
        Index("idx_business_rule_execution_performance", "execution_time_ms"),
    )
    
    def __repr__(self):
        return f"<BusinessRuleExecution(rule_id='{self.rule_id}', status='{self.execution_status}')>"


class FieldLocalizationConfig(Base):
    """Country-specific field behavior and validation (SAP-style field localization)."""
    
    __tablename__ = "field_localization_config"
    
    localization_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Field identification
    entity_name = Column(String(100), nullable=False)
    field_name = Column(String(100), nullable=False)
    
    # Localization context
    country_code = Column(String(2), nullable=False)
    state_province = Column(String(10), nullable=True)  # For country subdivisions
    
    # Localized field properties
    display_name = Column(String(255), nullable=False)  # 'SSN' vs 'SIN' vs 'National Insurance'
    validation_pattern = Column(Text, nullable=True)  # Country-specific regex
    formatting_rules = Column(JSON, nullable=True)  # Display and input formatting
    field_type = Column(String(50), nullable=True)  # Override field type if needed
    lookup_table = Column(String(100), nullable=True)  # Country-specific lookup data
    
    # Field behavior
    is_required = Column(Boolean, nullable=True)  # Override required status
    help_text = Column(Text, nullable=True)  # Localized help text
    placeholder = Column(String(255), nullable=True)  # Localized placeholder
    
    # Business rules
    business_rules = Column(JSON, nullable=True)  # Country-specific business logic
    validation_rules = Column(JSON, nullable=True)  # Country-specific validation
    
    # Lifecycle
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint(
            "entity_name", "field_name", "country_code", "state_province",
            name="uq_field_localization"
        ),
        Index("idx_field_localization_entity", "entity_name"),
        Index("idx_field_localization_field", "field_name"),
        Index("idx_field_localization_country", "country_code"),
        Index("idx_field_localization_active", "is_active"),
    )
    
    def __repr__(self):
        return f"<FieldLocalizationConfig(entity='{self.entity_name}', field='{self.field_name}', country='{self.country_code}')>"


class ProcessConfigMaster(Base):
    """Process configuration master table (SAP-style workflow customization)."""
    
    __tablename__ = "process_config_master"
    
    process_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Process identification
    process_name = Column(String(255), nullable=False)  # 'Client Intake', 'Invoice Generation'
    process_category = Column(String(100), nullable=False)  # 'CRM', 'FINANCIAL', 'COMPLIANCE'
    description = Column(Text, nullable=True)
    
    # Localization context
    country_code = Column(String(2), nullable=True)
    industry_code = Column(String(50), nullable=True)
    vertical_code = Column(String(50), nullable=True)
    
    # Tenant context
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.tenant_id"), nullable=True)
    
    # Process configuration
    process_steps = Column(JSON, nullable=False)  # Configurable workflow steps
    business_rules = Column(JSON, nullable=True)  # Business rules for this process
    approval_matrix = Column(JSON, nullable=True)  # Who can approve each step
    notification_rules = Column(JSON, nullable=True)  # When to send notifications
    error_handling = Column(JSON, nullable=True)  # How to handle process errors
    
    # Process behavior
    parallel_execution = Column(Boolean, default=False, nullable=False)  # Can steps run in parallel
    timeout_config = Column(JSON, nullable=True)  # Step timeout configuration
    retry_policy = Column(JSON, nullable=True)  # Retry failed steps
    
    # Lifecycle
    version = Column(String(10), default="1.0", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    workflow_steps = relationship("WorkflowStepDefinition", back_populates="process_config", cascade="all, delete-orphan")
    workflow_triggers = relationship("WorkflowTrigger", back_populates="process_config", cascade="all, delete-orphan")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint(
            "process_name", "country_code", "industry_code", "vertical_code", "tenant_id",
            name="uq_process_config_context"
        ),
        Index("idx_process_config_category", "process_category"),
        Index("idx_process_config_country", "country_code"),
        Index("idx_process_config_industry", "industry_code"),
        Index("idx_process_config_vertical", "vertical_code"),
        Index("idx_process_config_tenant", "tenant_id"),
        Index("idx_process_config_active", "is_active"),
    )
    
    def __repr__(self):
        return f"<ProcessConfigMaster(name='{self.process_name}', category='{self.process_category}')>"


class WorkflowStepDefinition(Base):
    """Configurable workflow step definitions."""
    
    __tablename__ = "workflow_step_definitions"
    
    step_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    process_id = Column(UUID(as_uuid=True), ForeignKey("process_config_master.process_id"), nullable=False)
    
    # Step identification
    step_name = Column(String(255), nullable=False)
    step_type = Column(String(50), nullable=False)  # 'VALIDATION', 'CALCULATION', 'NOTIFICATION'
    step_order = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    
    # Step configuration
    input_mapping = Column(JSON, nullable=True)  # How to map input data
    processing_logic = Column(JSON, nullable=False)  # What this step does
    output_mapping = Column(JSON, nullable=True)  # How to map output data
    error_handling = Column(JSON, nullable=True)  # Step-specific error handling
    
    # Conditional execution
    execution_conditions = Column(JSON, nullable=True)  # When this step should run
    skip_conditions = Column(JSON, nullable=True)  # When to skip this step
    
    # Step behavior
    is_required = Column(Boolean, default=True, nullable=False)
    timeout_seconds = Column(Integer, default=300, nullable=False)  # 5 minute default
    retry_count = Column(Integer, default=0, nullable=False)
    
    # Lifecycle
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    process_config = relationship("ProcessConfigMaster", back_populates="workflow_steps")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("process_id", "step_name", name="uq_workflow_step_process_name"),
        Index("idx_workflow_step_process", "process_id"),
        Index("idx_workflow_step_type", "step_type"),
        Index("idx_workflow_step_order", "step_order"),
        Index("idx_workflow_step_active", "is_active"),
    )
    
    def __repr__(self):
        return f"<WorkflowStepDefinition(name='{self.step_name}', type='{self.step_type}')>"


class WorkflowTrigger(Base):
    """Configurable workflow triggers."""
    
    __tablename__ = "workflow_triggers"
    
    trigger_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    process_id = Column(UUID(as_uuid=True), ForeignKey("process_config_master.process_id"), nullable=False)
    
    # Trigger identification
    trigger_name = Column(String(255), nullable=False)
    trigger_type = Column(String(50), nullable=False)  # 'EVENT', 'SCHEDULE', 'CONDITION'
    description = Column(Text, nullable=True)
    
    # Trigger configuration
    trigger_conditions = Column(JSON, nullable=False)  # What triggers this workflow
    data_mapping = Column(JSON, nullable=True)  # How to map trigger data to workflow
    
    # Trigger behavior
    is_enabled = Column(Boolean, default=True, nullable=False)
    retry_policy = Column(JSON, nullable=True)
    rate_limiting = Column(JSON, nullable=True)  # Prevent too many triggers
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    process_config = relationship("ProcessConfigMaster", back_populates="workflow_triggers")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint("process_id", "trigger_name", name="uq_workflow_trigger_process_name"),
        Index("idx_workflow_trigger_process", "process_id"),
        Index("idx_workflow_trigger_type", "trigger_type"),
        Index("idx_workflow_trigger_enabled", "is_enabled"),
    )
    
    def __repr__(self):
        return f"<WorkflowTrigger(name='{self.trigger_name}', type='{self.trigger_type}')>"