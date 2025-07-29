"""
SAP-Style Authentication Customizing Tables

True SAP approach with:
- IMG (Implementation Guide) hierarchical configuration
- Customizing tables for all business logic  
- Transport system for config migration
- No hardcoded business rules
- Industry solution packages
"""

from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime, JSON, UUID,
    ForeignKey, Index, UniqueConstraint, DECIMAL
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from datetime import datetime
from typing import Optional, Dict, Any

Base = declarative_base()

# =============================================
# SAP-STYLE CUSTOMIZING TABLES
# =============================================

class T_AUTH_IMG_ACTIVITY(Base):
    """IMG Activity Definitions (SAP Table CUST_IMGACT)
    
    Defines the Implementation Guide structure for authentication configuration.
    Each activity represents a configuration step in the IMG tree.
    """
    __tablename__ = "t_auth_img_activity"
    
    activity_id = Column(String(30), primary_key=True)  # e.g., "AUTH_BASIC_SETTINGS"
    parent_activity_id = Column(String(30), ForeignKey("t_auth_img_activity.activity_id"), nullable=True)
    activity_name = Column(String(100), nullable=False)
    description = Column(Text)
    config_table = Column(String(30), nullable=True)  # Which customizing table to maintain
    config_view = Column(String(30), nullable=True)   # Maintenance view
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    transport_required = Column(Boolean, default=True)
    
    # IMG hierarchy
    parent_activity = relationship("T_AUTH_IMG_ACTIVITY", remote_side=[activity_id])
    child_activities = relationship("T_AUTH_IMG_ACTIVITY")
    
    __table_args__ = (
        Index("idx_img_parent", "parent_activity_id"),
        Index("idx_img_sort", "sort_order"),
    )

class T_AUTH_CUSTOMIZING(Base):
    """Master Customizing Table (SAP Style)
    
    Central registry of all authentication customizing entries.
    Similar to SAP's CUST_* tables.
    """
    __tablename__ = "t_auth_customizing"
    
    client = Column(String(3), primary_key=True, default="001")  # SAP client concept
    table_name = Column(String(30), primary_key=True)
    key_fields = Column(String(500), primary_key=True)  # Concatenated key fields
    
    # Transport management
    transport_request = Column(String(20), nullable=True)
    created_by = Column(String(12), nullable=False)
    created_on = Column(DateTime(timezone=True), server_default=func.now())
    changed_by = Column(String(12), nullable=True)
    changed_on = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    valid_from = Column(DateTime(timezone=True), nullable=True)
    valid_to = Column(DateTime(timezone=True), nullable=True)
    
    __table_args__ = (
        Index("idx_customizing_transport", "transport_request"),
        Index("idx_customizing_table", "table_name"),
    )

class T_AUTH_METHOD_CONFIG(Base):
    """Authentication Method Configuration (Customizing)
    
    SAP-style customizing table defining authentication methods per client/tenant.
    No hardcoded logic - everything configurable.
    """
    __tablename__ = "t_auth_method_config"
    
    client = Column(String(3), primary_key=True, default="001")
    auth_method = Column(String(20), primary_key=True)  # PASSWORD, MAGIC_LINK, SSO, etc.
    tenant_id = Column(UUID(as_uuid=True), primary_key=True, nullable=True)  # NULL = global
    
    # Method configuration
    is_enabled = Column(Boolean, default=True, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    display_order = Column(Integer, default=10)
    
    # Method-specific parameters (SAP-style parameter table approach)
    config_parameters = Column(JSON, nullable=True)
    
    # Validation rules (stored as configuration, not code)
    validation_rules = Column(JSON, nullable=True)
    
    # Transport fields
    transport_request = Column(String(20), nullable=True)
    created_by = Column(String(12), nullable=False)
    created_on = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index("idx_auth_method_tenant", "tenant_id"),
        Index("idx_auth_method_enabled", "is_enabled"),
    )

class T_AUTH_RULE_CONFIG(Base):
    """Authentication Rules Configuration (Business Rules Framework)
    
    SAP BRF+ style rule configuration. All authentication logic
    defined in rules, not hardcoded.
    """
    __tablename__ = "t_auth_rule_config"
    
    client = Column(String(3), primary_key=True, default="001")
    rule_id = Column(String(30), primary_key=True)  # e.g., "SESSION_LIMIT_CHECK"
    tenant_id = Column(UUID(as_uuid=True), primary_key=True, nullable=True)
    
    # Rule definition
    rule_name = Column(String(100), nullable=False)
    rule_type = Column(String(20), nullable=False)  # DECISION_TABLE, FORMULA, CONDITION
    
    # Rule logic (SAP-style decision table or formula)
    rule_definition = Column(JSON, nullable=False)
    
    # Activation
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=100)
    
    # Context conditions
    application_context = Column(JSON, nullable=True)
    
    # Transport fields
    transport_request = Column(String(20), nullable=True)
    created_by = Column(String(12), nullable=False)
    created_on = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index("idx_auth_rule_type", "rule_type"),
        Index("idx_auth_rule_active", "is_active"),
    )

class T_AUTH_SESSION_CONFIG(Base):
    """Session Management Configuration (Customizing)
    
    SAP-style session configuration. All session logic configurable.
    """
    __tablename__ = "t_auth_session_config"
    
    client = Column(String(3), primary_key=True, default="001")
    session_profile = Column(String(20), primary_key=True)  # e.g., "FINTECH", "ECOMMERCE"
    tenant_id = Column(UUID(as_uuid=True), primary_key=True, nullable=True)
    
    # Session parameters
    max_sessions = Column(Integer, default=1)
    session_timeout_min = Column(Integer, default=480)
    idle_timeout_min = Column(Integer, default=60)
    
    # Session behavior rules
    single_session_mode = Column(Boolean, default=False)
    auto_logout_on_new = Column(Boolean, default=False)
    
    # Advanced settings
    allow_concurrent_ip = Column(Boolean, default=True)
    track_device_fingerprint = Column(Boolean, default=True)
    
    # Risk management
    risk_threshold = Column(DECIMAL(3, 2), default=0.8)
    risk_action = Column(String(20), default="CHALLENGE")  # BLOCK, CHALLENGE, LOG
    
    # Transport fields
    transport_request = Column(String(20), nullable=True)
    created_by = Column(String(12), nullable=False)
    created_on = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index("idx_session_profile", "session_profile"),
    )

class T_AUTH_COMPLIANCE_CONFIG(Base):
    """Compliance Configuration (Industry-Specific)
    
    SAP-style industry solution configuration.
    Each industry vertical as configurable compliance rules.
    """
    __tablename__ = "t_auth_compliance_config"
    
    client = Column(String(3), primary_key=True, default="001")
    industry_code = Column(String(10), primary_key=True)  # FINTECH, OILGAS, etc.
    compliance_area = Column(String(30), primary_key=True)  # KYC, 2FA, AUDIT, etc.
    tenant_id = Column(UUID(as_uuid=True), primary_key=True, nullable=True)
    
    # Compliance requirements
    is_mandatory = Column(Boolean, default=False)
    enforcement_level = Column(String(10), default="WARN")  # ERROR, WARN, INFO
    
    # Compliance rules (configurable, not hardcoded)
    compliance_rules = Column(JSON, nullable=False)
    
    # Validation and workflow
    validation_class = Column(String(50), nullable=True)  # Plugin class for validation
    workflow_template = Column(String(30), nullable=True)
    
    # Transport fields
    transport_request = Column(String(20), nullable=True)
    created_by = Column(String(12), nullable=False)
    created_on = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index("idx_compliance_industry", "industry_code"),
        Index("idx_compliance_mandatory", "is_mandatory"),
    )

class T_AUTH_WORKFLOW_CONFIG(Base):
    """Authentication Workflow Configuration
    
    SAP-style workflow configuration for authentication processes.
    """
    __tablename__ = "t_auth_workflow_config"
    
    client = Column(String(3), primary_key=True, default="001")
    workflow_id = Column(String(30), primary_key=True)  # e.g., "USER_REGISTRATION"
    step_number = Column(Integer, primary_key=True)
    tenant_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Step definition
    step_name = Column(String(100), nullable=False)
    step_type = Column(String(20), nullable=False)  # VALIDATION, APPROVAL, NOTIFICATION
    
    # Step configuration
    step_config = Column(JSON, nullable=False)
    
    # Flow control
    next_step_success = Column(Integer, nullable=True)
    next_step_failure = Column(Integer, nullable=True)
    
    # Conditions
    execution_conditions = Column(JSON, nullable=True)
    
    # Transport fields
    transport_request = Column(String(20), nullable=True)
    created_by = Column(String(12), nullable=False)
    created_on = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index("idx_workflow_id", "workflow_id"),
        Index("idx_workflow_step", "step_number"),
    )

# =============================================
# SAP-STYLE BUSINESS OBJECTS
# =============================================

class T_AUTH_BUSINESS_OBJECT(Base):
    """Business Object Repository for Authentication
    
    SAP BOR-style business object definitions.
    Defines authentication entities in metadata, not code.
    """
    __tablename__ = "t_auth_business_object"
    
    client = Column(String(3), primary_key=True, default="001")
    object_type = Column(String(10), primary_key=True)  # USER, SESSION, TOKEN, etc.
    
    # Object definition
    object_name = Column(String(100), nullable=False)
    object_category = Column(String(20), nullable=False)  # ENTITY, PROCESS, DOCUMENT
    
    # Object structure (metadata-driven)
    object_structure = Column(JSON, nullable=False)
    
    # Methods and events
    object_methods = Column(JSON, nullable=True)
    object_events = Column(JSON, nullable=True)
    
    # Authorization object
    auth_object = Column(String(10), nullable=True)
    
    # Transport fields
    transport_request = Column(String(20), nullable=True)
    created_by = Column(String(12), nullable=False)
    created_on = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index("idx_bo_type", "object_type"),
        Index("idx_bo_category", "object_category"),
    )

# =============================================
# SAP-STYLE TRANSPORT SYSTEM
# =============================================

class T_AUTH_TRANSPORT_REQUEST(Base):
    """Transport Request Management
    
    SAP-style transport system for moving authentication
    configurations between environments.
    """
    __tablename__ = "t_auth_transport_request"
    
    transport_request = Column(String(20), primary_key=True)  # e.g., "DEV001K900001"
    
    # Request information
    request_type = Column(String(4), nullable=False, default="CUST")  # CUST, COPY, etc.
    description = Column(String(100), nullable=False)
    target_system = Column(String(3), nullable=True)  # QAS, PRD
    
    # Status
    status = Column(String(1), nullable=False, default="D")  # D=Modifiable, R=Released
    release_date = Column(DateTime(timezone=True), nullable=True)
    import_date = Column(DateTime(timezone=True), nullable=True)
    
    # Owner
    created_by = Column(String(12), nullable=False)
    created_on = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index("idx_transport_status", "status"),
        Index("idx_transport_created", "created_by"),
    )

class T_AUTH_TRANSPORT_OBJECT(Base):
    """Transport Objects (Customizing Entries)
    
    Individual customizing entries included in transport requests.
    """
    __tablename__ = "t_auth_transport_object"
    
    transport_request = Column(String(20), ForeignKey("t_auth_transport_request.transport_request"), primary_key=True)
    object_type = Column(String(4), primary_key=True, default="TABU")  # Table entry
    object_name = Column(String(120), primary_key=True)  # Table name + key
    
    # Object details
    table_name = Column(String(30), nullable=False)
    table_key = Column(String(500), nullable=False)
    
    # Operation
    operation = Column(String(1), nullable=False, default="I")  # I=Insert, U=Update, D=Delete
    
    # Change tracking
    changed_by = Column(String(12), nullable=False)
    changed_on = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    transport_req = relationship("T_AUTH_TRANSPORT_REQUEST")
    
    __table_args__ = (
        Index("idx_transport_table", "table_name"),
        Index("idx_transport_operation", "operation"),
    )

# =============================================
# SAP-STYLE INDUSTRY SOLUTION PACKAGES
# =============================================

class T_AUTH_INDUSTRY_PACKAGE(Base):
    """Industry Solution Packages
    
    SAP-style industry solutions (IS-*) for authentication.
    Pre-configured authentication setups for industries.
    """
    __tablename__ = "t_auth_industry_package"
    
    package_id = Column(String(20), primary_key=True)  # e.g., "IS_FINTECH_AUTH"
    
    # Package information
    package_name = Column(String(100), nullable=False)
    industry_code = Column(String(10), nullable=False)
    version = Column(String(10), nullable=False, default="1.0.0")
    
    # Package content (transportable customizing)
    package_content = Column(JSON, nullable=False)
    
    # Dependencies
    prerequisite_packages = Column(JSON, nullable=True)
    
    # Installation
    installation_guide = Column(Text, nullable=True)
    default_transport = Column(String(20), nullable=True)
    
    # Status
    is_released = Column(Boolean, default=False)
    release_date = Column(DateTime(timezone=True), nullable=True)
    
    # Owner
    created_by = Column(String(12), nullable=False)
    created_on = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index("idx_package_industry", "industry_code"),
        Index("idx_package_released", "is_released"),
    ) 