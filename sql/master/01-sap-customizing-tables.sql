-- ============================================================================
-- SAP-Style Customizing Tables for Master Database
-- ============================================================================
-- Purpose: Store all authentication business logic as configurable data
-- Pattern: T_AUTH_* tables follow SAP naming convention for customizing tables
-- Philosophy: No hardcoded business rules - everything configurable via metadata
-- ============================================================================

-- IMG Activity Hierarchy (SAP Implementation Guide structure)
-- Defines hierarchical configuration activities
CREATE TABLE IF NOT EXISTS T_AUTH_IMG_ACTIVITY (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_activity_id UUID REFERENCES T_AUTH_IMG_ACTIVITY(activity_id),
    activity_code VARCHAR(20) NOT NULL UNIQUE, -- e.g., AUTH_001, AUTH_002
    activity_name VARCHAR(200) NOT NULL,
    description TEXT,
    table_name VARCHAR(50), -- Which customizing table this activity modifies
    maintenance_view VARCHAR(50), -- UI view for maintaining this activity
    sequence_number INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Base Customizing Table (stores actual configuration values)
-- Generic table that can store any key-value configuration
CREATE TABLE IF NOT EXISTS T_AUTH_CUSTOMIZING (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES T_AUTH_IMG_ACTIVITY(activity_id),
    tenant_id UUID, -- NULL = global config, specific UUID = tenant override
    object_type VARCHAR(50) NOT NULL, -- e.g., 'SESSION', 'METHOD', 'RULE'
    object_key VARCHAR(100) NOT NULL, -- e.g., 'MAX_SESSIONS', 'REQUIRE_2FA'
    field_name VARCHAR(50) NOT NULL, -- e.g., 'VALUE', 'ENABLED', 'TIMEOUT'
    field_value TEXT, -- Actual configuration value (JSON for complex data)
    data_type VARCHAR(20) DEFAULT 'STRING', -- STRING, INTEGER, BOOLEAN, JSON
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session Configuration Table (Authentication Session Rules)
-- Specific table for session management configuration
CREATE TABLE IF NOT EXISTS T_AUTH_SESSION_CONFIG (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- NULL = global default, specific UUID = tenant override
    industry_vertical VARCHAR(50), -- FINTECH, ECOMMERCE, OILGAS, AGTECH, INSURANCE
    max_concurrent_sessions INTEGER DEFAULT 3,
    session_timeout_minutes INTEGER DEFAULT 480, -- 8 hours default
    idle_timeout_minutes INTEGER DEFAULT 60, -- 1 hour default
    single_session_mode BOOLEAN DEFAULT false,
    require_device_registration BOOLEAN DEFAULT false,
    enable_session_sharing BOOLEAN DEFAULT false,
    force_logout_on_password_change BOOLEAN DEFAULT true,
    enable_concurrent_session_alerts BOOLEAN DEFAULT true,
    session_extension_allowed BOOLEAN DEFAULT true,
    max_session_extensions INTEGER DEFAULT 3,
    risk_score_threshold DECIMAL(3,2) DEFAULT 0.75, -- 0.00 to 1.00
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 10, -- Higher number = higher priority
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Authentication Method Configuration Table
-- Defines which auth methods are enabled and their settings
CREATE TABLE IF NOT EXISTS T_AUTH_METHOD_CONFIG (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- NULL = global default, specific UUID = tenant override
    industry_vertical VARCHAR(50), -- FINTECH, ECOMMERCE, OILGAS, AGTECH, INSURANCE
    method_type VARCHAR(50) NOT NULL, -- PASSWORD, MAGIC_LINK, TOTP_2FA, WEBAUTHN, SSO
    is_enabled BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false, -- If true, this method is mandatory
    priority INTEGER DEFAULT 10, -- Order of preference
    settings_json JSONB, -- Method-specific settings
    
    -- Password-specific settings
    min_password_length INTEGER,
    require_uppercase BOOLEAN DEFAULT false,
    require_lowercase BOOLEAN DEFAULT false,
    require_numbers BOOLEAN DEFAULT false,
    require_special_chars BOOLEAN DEFAULT false,
    password_expiry_days INTEGER,
    prevent_password_reuse INTEGER DEFAULT 0,
    
    -- 2FA-specific settings
    totp_issuer VARCHAR(100),
    totp_digits INTEGER DEFAULT 6,
    totp_period INTEGER DEFAULT 30,
    backup_codes_count INTEGER DEFAULT 10,
    
    -- Magic link settings
    magic_link_expiry_minutes INTEGER DEFAULT 15,
    magic_link_one_time_use BOOLEAN DEFAULT true,
    
    -- WebAuthn settings
    webauthn_user_verification VARCHAR(20) DEFAULT 'preferred', -- required, preferred, discouraged
    webauthn_timeout_seconds INTEGER DEFAULT 60,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Business Rule Configuration Table (BRF+ equivalent)
-- Stores complex conditional business rules
CREATE TABLE IF NOT EXISTS T_AUTH_RULE_CONFIG (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    rule_type VARCHAR(50) NOT NULL, -- DECISION_TABLE, FORMULA, CONDITION
    description TEXT,
    tenant_id UUID, -- NULL = global rule, specific UUID = tenant-specific
    industry_vertical VARCHAR(50), -- FINTECH, ECOMMERCE, OILGAS, AGTECH, INSURANCE
    
    -- Rule definition (stored as JSON for flexibility)
    condition_json JSONB, -- Rule conditions
    action_json JSONB, -- Actions to take when rule matches
    
    -- Rule metadata
    priority INTEGER DEFAULT 10, -- Execution order
    is_active BOOLEAN DEFAULT true,
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    
    -- Versioning
    version INTEGER DEFAULT 1,
    parent_rule_id UUID REFERENCES T_AUTH_RULE_CONFIG(rule_id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Configuration Table
-- Industry-specific compliance requirements
CREATE TABLE IF NOT EXISTS T_AUTH_COMPLIANCE_CONFIG (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- NULL = global default, specific UUID = tenant override
    industry_vertical VARCHAR(50) NOT NULL, -- FINTECH, ECOMMERCE, OILGAS, AGTECH, INSURANCE
    compliance_type VARCHAR(50) NOT NULL, -- KYC, AML, GDPR, HIPAA, SOX, PCI_DSS
    
    -- Compliance settings
    is_enabled BOOLEAN DEFAULT true,
    is_mandatory BOOLEAN DEFAULT false,
    enforcement_level VARCHAR(20) DEFAULT 'STRICT', -- STRICT, MODERATE, LENIENT
    
    -- Specific requirements
    require_identity_verification BOOLEAN DEFAULT false,
    require_address_verification BOOLEAN DEFAULT false,
    require_document_upload BOOLEAN DEFAULT false,
    allowed_document_types TEXT[], -- passport, driver_license, utility_bill, etc.
    verification_expiry_days INTEGER,
    
    -- Data retention
    data_retention_days INTEGER,
    data_deletion_on_account_closure BOOLEAN DEFAULT true,
    
    -- Audit requirements
    audit_log_retention_years INTEGER DEFAULT 7,
    require_audit_trail BOOLEAN DEFAULT true,
    
    settings_json JSONB, -- Additional compliance-specific settings
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workflow Configuration Table
-- Defines authentication-related workflows
CREATE TABLE IF NOT EXISTS T_AUTH_WORKFLOW_CONFIG (
    workflow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name VARCHAR(100) NOT NULL,
    workflow_type VARCHAR(50) NOT NULL, -- REGISTRATION, PASSWORD_RESET, 2FA_SETUP, KYC
    tenant_id UUID, -- NULL = global workflow, specific UUID = tenant override
    industry_vertical VARCHAR(50), -- FINTECH, ECOMMERCE, OILGAS, AGTECH, INSURANCE
    
    -- Workflow definition
    steps_json JSONB NOT NULL, -- Workflow steps and conditions
    triggers_json JSONB, -- What triggers this workflow
    
    -- Workflow settings
    is_active BOOLEAN DEFAULT true,
    is_mandatory BOOLEAN DEFAULT false,
    auto_start BOOLEAN DEFAULT false,
    timeout_minutes INTEGER DEFAULT 60,
    max_retries INTEGER DEFAULT 3,
    
    -- Notifications
    enable_email_notifications BOOLEAN DEFAULT true,
    enable_sms_notifications BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Business Object Repository (BOR equivalent)
-- Defines authentication business objects and their methods
CREATE TABLE IF NOT EXISTS T_AUTH_BUSINESS_OBJECT (
    object_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_name VARCHAR(100) NOT NULL UNIQUE, -- User, Session, AuthMethod, etc.
    object_type VARCHAR(50) NOT NULL, -- BUSINESS_OBJECT, INTERFACE, EXCEPTION
    description TEXT,
    
    -- Object definition
    attributes_json JSONB, -- Object attributes
    methods_json JSONB, -- Available methods
    events_json JSONB, -- Events this object can trigger
    
    -- Integration settings
    api_endpoint VARCHAR(200), -- REST API endpoint for this object
    database_table VARCHAR(100), -- Associated database table
    
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transport Request Table (SAP Transport System)
-- Manages configuration changes across environments
CREATE TABLE IF NOT EXISTS T_AUTH_TRANSPORT_REQUEST (
    transport_id VARCHAR(20) PRIMARY KEY, -- e.g., TR0001, TR0002
    description TEXT NOT NULL,
    request_type VARCHAR(50) DEFAULT 'CUSTOMIZING', -- CUSTOMIZING, DEVELOPMENT, EMERGENCY
    
    -- Environment progression
    source_environment VARCHAR(20) NOT NULL, -- DEV, QAS, PRD
    target_environment VARCHAR(20), -- QAS, PRD
    current_status VARCHAR(50) DEFAULT 'CREATED', -- CREATED, EXPORTED, IMPORTED, RELEASED
    
    -- Metadata
    created_by VARCHAR(100) NOT NULL,
    assigned_to VARCHAR(100),
    business_justification TEXT,
    technical_description TEXT,
    
    -- Timing
    planned_execution_date TIMESTAMP WITH TIME ZONE,
    actual_execution_date TIMESTAMP WITH TIME ZONE,
    
    -- Progress tracking
    objects_count INTEGER DEFAULT 0,
    objects_processed INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transport Object Table (tracks individual objects in transports)
-- Manages individual configuration objects within transport requests
CREATE TABLE IF NOT EXISTS T_AUTH_TRANSPORT_OBJECT (
    object_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transport_id VARCHAR(20) NOT NULL REFERENCES T_AUTH_TRANSPORT_REQUEST(transport_id),
    
    -- Object identification
    object_type VARCHAR(50) NOT NULL, -- T_AUTH_SESSION_CONFIG, T_AUTH_METHOD_CONFIG, etc.
    object_name VARCHAR(200) NOT NULL, -- Unique identifier for the object
    change_type VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    
    -- Object data
    object_data_json JSONB, -- Complete object data for transport
    
    -- Status tracking
    processing_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PROCESSED, ERROR
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Industry Package Table (Industry Solution packages)
-- Defines pre-configured industry packages (IS-FINTECH, IS-ECOMMERCE, etc.)
CREATE TABLE IF NOT EXISTS T_AUTH_INDUSTRY_PACKAGE (
    package_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_name VARCHAR(50) NOT NULL UNIQUE, -- IS-FINTECH, IS-ECOMMERCE, IS-OILGAS
    display_name VARCHAR(100) NOT NULL,
    industry_vertical VARCHAR(50) NOT NULL, -- FINTECH, ECOMMERCE, OILGAS, AGTECH, INSURANCE
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    
    -- Package metadata
    description TEXT,
    prerequisites TEXT[],
    dependencies VARCHAR(50)[],
    
    -- Configuration templates
    config_template_json JSONB NOT NULL, -- Default configuration for this industry
    
    -- Installation settings
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    auto_configure BOOLEAN DEFAULT true,
    
    -- Script references
    install_script TEXT, -- SQL or Python script for installation
    uninstall_script TEXT, -- Cleanup script
    validation_script TEXT, -- Verification script
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- IMG Activity indexes
CREATE INDEX IF NOT EXISTS idx_auth_img_activity_parent ON T_AUTH_IMG_ACTIVITY(parent_activity_id);
CREATE INDEX IF NOT EXISTS idx_auth_img_activity_code ON T_AUTH_IMG_ACTIVITY(activity_code);
CREATE INDEX IF NOT EXISTS idx_auth_img_activity_active ON T_AUTH_IMG_ACTIVITY(is_active);

-- Customizing indexes
CREATE INDEX IF NOT EXISTS idx_auth_customizing_activity ON T_AUTH_CUSTOMIZING(activity_id);
CREATE INDEX IF NOT EXISTS idx_auth_customizing_tenant ON T_AUTH_CUSTOMIZING(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auth_customizing_object ON T_AUTH_CUSTOMIZING(object_type, object_key);
CREATE INDEX IF NOT EXISTS idx_auth_customizing_active ON T_AUTH_CUSTOMIZING(is_active);

-- Session config indexes
CREATE INDEX IF NOT EXISTS idx_auth_session_tenant ON T_AUTH_SESSION_CONFIG(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auth_session_industry ON T_AUTH_SESSION_CONFIG(industry_vertical);
CREATE INDEX IF NOT EXISTS idx_auth_session_active ON T_AUTH_SESSION_CONFIG(is_active);

-- Method config indexes
CREATE INDEX IF NOT EXISTS idx_auth_method_tenant ON T_AUTH_METHOD_CONFIG(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auth_method_industry ON T_AUTH_METHOD_CONFIG(industry_vertical);
CREATE INDEX IF NOT EXISTS idx_auth_method_type ON T_AUTH_METHOD_CONFIG(method_type);
CREATE INDEX IF NOT EXISTS idx_auth_method_active ON T_AUTH_METHOD_CONFIG(is_active);

-- Rule config indexes
CREATE INDEX IF NOT EXISTS idx_auth_rule_tenant ON T_AUTH_RULE_CONFIG(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auth_rule_industry ON T_AUTH_RULE_CONFIG(industry_vertical);
CREATE INDEX IF NOT EXISTS idx_auth_rule_type ON T_AUTH_RULE_CONFIG(rule_type);
CREATE INDEX IF NOT EXISTS idx_auth_rule_active ON T_AUTH_RULE_CONFIG(is_active);
CREATE INDEX IF NOT EXISTS idx_auth_rule_priority ON T_AUTH_RULE_CONFIG(priority);

-- Transport indexes
CREATE INDEX IF NOT EXISTS idx_auth_transport_status ON T_AUTH_TRANSPORT_REQUEST(current_status);
CREATE INDEX IF NOT EXISTS idx_auth_transport_env ON T_AUTH_TRANSPORT_REQUEST(source_environment, target_environment);
CREATE INDEX IF NOT EXISTS idx_auth_transport_date ON T_AUTH_TRANSPORT_REQUEST(planned_execution_date);

-- Transport object indexes
CREATE INDEX IF NOT EXISTS idx_auth_transport_object_transport ON T_AUTH_TRANSPORT_OBJECT(transport_id);
CREATE INDEX IF NOT EXISTS idx_auth_transport_object_type ON T_AUTH_TRANSPORT_OBJECT(object_type);
CREATE INDEX IF NOT EXISTS idx_auth_transport_object_status ON T_AUTH_TRANSPORT_OBJECT(processing_status);

-- Industry package indexes
CREATE INDEX IF NOT EXISTS idx_auth_industry_package_industry ON T_AUTH_INDUSTRY_PACKAGE(industry_vertical);
CREATE INDEX IF NOT EXISTS idx_auth_industry_package_active ON T_AUTH_INDUSTRY_PACKAGE(is_active);
CREATE INDEX IF NOT EXISTS idx_auth_industry_package_published ON T_AUTH_INDUSTRY_PACKAGE(is_published);

-- ============================================================================
-- TRIGGERS for automatic timestamp updates
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all tables with updated_at columns
CREATE TRIGGER update_auth_img_activity_updated_at BEFORE UPDATE ON T_AUTH_IMG_ACTIVITY FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auth_customizing_updated_at BEFORE UPDATE ON T_AUTH_CUSTOMIZING FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auth_session_config_updated_at BEFORE UPDATE ON T_AUTH_SESSION_CONFIG FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auth_method_config_updated_at BEFORE UPDATE ON T_AUTH_METHOD_CONFIG FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auth_rule_config_updated_at BEFORE UPDATE ON T_AUTH_RULE_CONFIG FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auth_compliance_config_updated_at BEFORE UPDATE ON T_AUTH_COMPLIANCE_CONFIG FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auth_workflow_config_updated_at BEFORE UPDATE ON T_AUTH_WORKFLOW_CONFIG FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auth_business_object_updated_at BEFORE UPDATE ON T_AUTH_BUSINESS_OBJECT FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auth_transport_request_updated_at BEFORE UPDATE ON T_AUTH_TRANSPORT_REQUEST FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auth_industry_package_updated_at BEFORE UPDATE ON T_AUTH_INDUSTRY_PACKAGE FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 