-- ============================================================================
-- Component Catalog & Platform Metadata for Master Database
-- ============================================================================
-- Purpose: Store global component definitions, module manifests, and platform metadata
-- Scope: Platform-wide components and modules available to all tenants
-- Philosophy: Reusable components with metadata-driven configuration
-- ============================================================================

-- Component Definitions (UI Components)
-- Stores all available UI components for the platform
CREATE TABLE IF NOT EXISTS component_definitions (
    component_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, -- Component name (e.g., 'DynamicForm', 'DataTable')
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    
    -- Component metadata
    category VARCHAR(50), -- 'form', 'layout', 'business', 'ui', 'greek'
    tags TEXT[], -- Searchable tags
    
    -- Component definition
    props_schema JSONB NOT NULL, -- JSON Schema for component props
    default_props JSONB, -- Default prop values
    
    -- Component capabilities
    supports_children BOOLEAN DEFAULT false,
    is_container BOOLEAN DEFAULT false,
    is_system_component BOOLEAN DEFAULT false, -- Core platform component
    is_business_component BOOLEAN DEFAULT false, -- Business logic component
    
    -- Styling and layout
    style_schema JSONB, -- Supported CSS properties and classes
    layout_constraints JSONB, -- Where this component can be placed
    responsive_behavior VARCHAR(50) DEFAULT 'adaptive', -- adaptive, fixed, mobile-first
    
    -- Events and interactions
    event_handlers JSONB, -- Supported event handlers (onClick, onChange, etc.)
    emitted_events TEXT[], -- Events this component can emit
    
    -- Dependencies
    dependencies TEXT[], -- Other components this depends on
    peer_dependencies TEXT[], -- Components that work well together
    
    -- Documentation
    documentation_url VARCHAR(500),
    example_usage JSONB, -- Example usage scenarios
    
    -- Marketplace
    is_published BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    price_tier VARCHAR(20) DEFAULT 'free', -- free, basic, premium, enterprise
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_deprecated BOOLEAN DEFAULT false,
    deprecation_notice TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Module Manifests (Component Packages)
-- Defines packages of related components
CREATE TABLE IF NOT EXISTS module_manifests (
    manifest_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, -- Module name (e.g., 'greek-business-components')
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    
    -- Module metadata
    author VARCHAR(100),
    license VARCHAR(50) DEFAULT 'MIT',
    keywords TEXT[],
    category VARCHAR(50), -- 'business', 'ui', 'integration', 'industry'
    
    -- Industry vertical
    target_industry VARCHAR(50), -- FINTECH, ECOMMERCE, OILGAS, AGTECH, INSURANCE, GENERAL
    
    -- Module contents
    components TEXT[] NOT NULL, -- List of component names in this module
    dependencies TEXT[], -- Other modules this depends on
    peer_dependencies TEXT[], -- Recommended companion modules
    
    -- Configuration
    configuration_schema JSONB, -- Module configuration options
    default_configuration JSONB, -- Default module settings
    
    -- Installation
    is_published BOOLEAN DEFAULT false,
    is_core_module BOOLEAN DEFAULT false, -- Core platform module
    install_script TEXT, -- Installation instructions
    uninstall_script TEXT, -- Cleanup instructions
    
    -- Repository information
    repository_url VARCHAR(500),
    documentation_url VARCHAR(500),
    
    -- Marketplace
    download_count INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0.0, -- 0.0 to 5.0
    review_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Component Dependencies (Relationship tracking)
-- Tracks dependencies between components
CREATE TABLE IF NOT EXISTS component_dependencies (
    dependency_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_id UUID NOT NULL REFERENCES component_definitions(component_id) ON DELETE CASCADE,
    depends_on_component_id UUID NOT NULL REFERENCES component_definitions(component_id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) NOT NULL DEFAULT 'REQUIRED', -- REQUIRED, OPTIONAL, PEER
    version_constraint VARCHAR(50), -- Version compatibility (e.g., '>=1.0.0', '^2.0.0')
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(component_id, depends_on_component_id)
);

-- Vertical Packs (Industry Solution Packages)
-- Defines complete industry solutions as metadata packages
CREATE TABLE IF NOT EXISTS vertical_packs (
    pack_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'ecommerce-complete', 'fintech-core'
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    
    -- Industry targeting
    industry_vertical VARCHAR(50) NOT NULL, -- FINTECH, ECOMMERCE, OILGAS, AGTECH, INSURANCE
    target_size VARCHAR(50) DEFAULT 'ALL', -- STARTUP, SMB, ENTERPRISE, ALL
    
    -- Pack contents (stored as JSON for flexibility)
    entities_json JSONB, -- Entity definitions for this vertical
    pages_json JSONB, -- Page definitions and layouts
    workflows_json JSONB, -- Business workflows
    integrations_json JSONB, -- Third-party integrations
    components_json JSONB, -- Custom components for this vertical
    themes_json JSONB, -- Industry-specific themes
    translations_json JSONB, -- Industry-specific translations
    
    -- Requirements
    required_modules TEXT[], -- Required module manifests
    recommended_modules TEXT[], -- Recommended additional modules
    
    -- Installation
    is_published BOOLEAN DEFAULT false,
    installation_guide TEXT, -- Detailed installation instructions
    setup_wizard_config JSONB, -- Setup wizard configuration
    
    -- Marketplace
    price_model VARCHAR(20) DEFAULT 'free', -- free, one-time, subscription
    price_amount DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Usage statistics
    install_count INTEGER DEFAULT 0,
    active_tenant_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Global Reference Data (Countries, Currencies, Languages)
-- Platform-wide reference data used by all tenants
CREATE TABLE IF NOT EXISTS countries (
    country_code VARCHAR(3) PRIMARY KEY, -- ISO 3166-1 alpha-3 (e.g., 'USA', 'GRC')
    country_code_2 VARCHAR(2) NOT NULL UNIQUE, -- ISO 3166-1 alpha-2 (e.g., 'US', 'GR')
    name VARCHAR(100) NOT NULL,
    official_name VARCHAR(200),
    
    -- Geographic data
    region VARCHAR(50), -- Europe, Asia, Americas, Africa, Oceania
    subregion VARCHAR(50), -- Western Europe, Southeast Asia, etc.
    
    -- Economic data
    currency_code VARCHAR(3), -- References currencies table
    phone_prefix VARCHAR(10), -- International dialing code
    
    -- Localization
    default_language VARCHAR(5), -- Language code (e.g., 'en-US', 'el-GR')
    timezone VARCHAR(50), -- Primary timezone
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    number_format VARCHAR(20) DEFAULT '1,000.00',
    
    -- Business context
    business_days_per_week INTEGER DEFAULT 5,
    weekend_days VARCHAR(20) DEFAULT 'Saturday,Sunday',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_eu_member BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Currencies (Global currency definitions)
-- Platform-wide currency information
CREATE TABLE IF NOT EXISTS currencies (
    currency_code VARCHAR(3) PRIMARY KEY, -- ISO 4217 (e.g., 'USD', 'EUR', 'GBP')
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10), -- $, €, £, etc.
    symbol_position VARCHAR(10) DEFAULT 'before', -- before, after
    
    -- Formatting
    decimal_places INTEGER DEFAULT 2,
    decimal_separator VARCHAR(5) DEFAULT '.',
    thousands_separator VARCHAR(5) DEFAULT ',',
    
    -- Exchange rates (placeholder - would be updated by external service)
    exchange_rate_to_usd DECIMAL(15,6) DEFAULT 1.000000,
    last_rate_update TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_cryptocurrency BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Languages (Platform language support)
-- Defines supported languages for internationalization
CREATE TABLE IF NOT EXISTS languages (
    language_code VARCHAR(5) PRIMARY KEY, -- IETF language tag (e.g., 'en-US', 'el-GR')
    name VARCHAR(100) NOT NULL, -- English name
    native_name VARCHAR(100), -- Native name (e.g., 'Ελληνικά')
    
    -- Language properties
    direction VARCHAR(3) DEFAULT 'ltr', -- ltr, rtl
    script VARCHAR(50), -- Latin, Greek, Arabic, etc.
    
    -- Localization
    country_code VARCHAR(3), -- Primary country for this language
    region VARCHAR(50), -- Regional variant
    
    -- Formatting preferences
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(20) DEFAULT 'HH:mm:ss',
    number_format VARCHAR(20) DEFAULT '1,000.00',
    
    -- Platform support
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    completion_percentage INTEGER DEFAULT 0, -- Translation completion %
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Platform Users (Platform-wide admin accounts)
-- Administrative users who can access the platform itself (not tenant users)
CREATE TABLE IF NOT EXISTS platform_users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    
    -- Authentication
    password_hash VARCHAR(255), -- For platform admin accounts
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    
    -- Platform role
    role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- admin, developer, support, viewer
    permissions_json JSONB, -- Platform-specific permissions
    
    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    preferred_language VARCHAR(5) DEFAULT 'en-US',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Security
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_by UUID REFERENCES platform_users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tenant Registry (Master list of all tenants)
-- Central registry of all tenant databases and their metadata
CREATE TABLE IF NOT EXISTS tenant_registry (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_name VARCHAR(200) NOT NULL,
    tenant_slug VARCHAR(100) NOT NULL UNIQUE, -- URL-friendly identifier
    
    -- Database information
    database_name VARCHAR(100) NOT NULL UNIQUE, -- Actual database name
    database_url VARCHAR(500), -- Full connection string (encrypted)
    
    -- Industry and vertical
    industry_vertical VARCHAR(50) NOT NULL, -- FINTECH, ECOMMERCE, OILGAS, AGTECH, INSURANCE
    industry_sub_vertical VARCHAR(50), -- More specific classification
    
    -- Tenant configuration
    installed_vertical_packs TEXT[], -- List of installed vertical pack IDs
    installed_modules TEXT[], -- List of installed module names
    configuration_json JSONB, -- Tenant-specific configuration
    
    -- Business information
    business_name VARCHAR(200),
    business_country VARCHAR(3) REFERENCES countries(country_code),
    business_currency VARCHAR(3) REFERENCES currencies(currency_code),
    business_language VARCHAR(5) REFERENCES languages(language_code),
    
    -- Subscription and limits
    subscription_tier VARCHAR(50) DEFAULT 'starter', -- starter, professional, enterprise
    user_limit INTEGER DEFAULT 10,
    storage_limit_gb INTEGER DEFAULT 5,
    api_call_limit INTEGER DEFAULT 10000,
    
    -- Status and lifecycle
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, terminated, trial
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Administrative
    created_by UUID REFERENCES platform_users(user_id),
    primary_contact_email VARCHAR(255),
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Component definitions indexes
CREATE INDEX IF NOT EXISTS idx_component_definitions_name ON component_definitions(name);
CREATE INDEX IF NOT EXISTS idx_component_definitions_category ON component_definitions(category);
CREATE INDEX IF NOT EXISTS idx_component_definitions_active ON component_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_component_definitions_published ON component_definitions(is_published);
CREATE INDEX IF NOT EXISTS idx_component_definitions_system ON component_definitions(is_system_component);

-- Module manifests indexes
CREATE INDEX IF NOT EXISTS idx_module_manifests_name ON module_manifests(name);
CREATE INDEX IF NOT EXISTS idx_module_manifests_industry ON module_manifests(target_industry);
CREATE INDEX IF NOT EXISTS idx_module_manifests_published ON module_manifests(is_published);
CREATE INDEX IF NOT EXISTS idx_module_manifests_core ON module_manifests(is_core_module);

-- Component dependencies indexes
CREATE INDEX IF NOT EXISTS idx_component_dependencies_component ON component_dependencies(component_id);
CREATE INDEX IF NOT EXISTS idx_component_dependencies_depends_on ON component_dependencies(depends_on_component_id);
CREATE INDEX IF NOT EXISTS idx_component_dependencies_type ON component_dependencies(dependency_type);

-- Vertical packs indexes
CREATE INDEX IF NOT EXISTS idx_vertical_packs_industry ON vertical_packs(industry_vertical);
CREATE INDEX IF NOT EXISTS idx_vertical_packs_published ON vertical_packs(is_published);
CREATE INDEX IF NOT EXISTS idx_vertical_packs_active ON vertical_packs(is_active);

-- Countries indexes
CREATE INDEX IF NOT EXISTS idx_countries_code_2 ON countries(country_code_2);
CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region);
CREATE INDEX IF NOT EXISTS idx_countries_currency ON countries(currency_code);
CREATE INDEX IF NOT EXISTS idx_countries_active ON countries(is_active);

-- Currencies indexes
CREATE INDEX IF NOT EXISTS idx_currencies_active ON currencies(is_active);
CREATE INDEX IF NOT EXISTS idx_currencies_crypto ON currencies(is_cryptocurrency);

-- Languages indexes
CREATE INDEX IF NOT EXISTS idx_languages_country ON languages(country_code);
CREATE INDEX IF NOT EXISTS idx_languages_active ON languages(is_active);
CREATE INDEX IF NOT EXISTS idx_languages_default ON languages(is_default);

-- Platform users indexes
CREATE INDEX IF NOT EXISTS idx_platform_users_username ON platform_users(username);
CREATE INDEX IF NOT EXISTS idx_platform_users_email ON platform_users(email);
CREATE INDEX IF NOT EXISTS idx_platform_users_role ON platform_users(role);
CREATE INDEX IF NOT EXISTS idx_platform_users_active ON platform_users(is_active);

-- Tenant registry indexes
CREATE INDEX IF NOT EXISTS idx_tenant_registry_slug ON tenant_registry(tenant_slug);
CREATE INDEX IF NOT EXISTS idx_tenant_registry_database ON tenant_registry(database_name);
CREATE INDEX IF NOT EXISTS idx_tenant_registry_industry ON tenant_registry(industry_vertical);
CREATE INDEX IF NOT EXISTS idx_tenant_registry_status ON tenant_registry(status);
CREATE INDEX IF NOT EXISTS idx_tenant_registry_tier ON tenant_registry(subscription_tier);

-- ============================================================================
-- TRIGGERS for automatic timestamp updates
-- ============================================================================

-- Add triggers to all tables with updated_at columns
CREATE TRIGGER update_component_definitions_updated_at BEFORE UPDATE ON component_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_module_manifests_updated_at BEFORE UPDATE ON module_manifests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vertical_packs_updated_at BEFORE UPDATE ON vertical_packs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_currencies_updated_at BEFORE UPDATE ON currencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_languages_updated_at BEFORE UPDATE ON languages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_users_updated_at BEFORE UPDATE ON platform_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_registry_updated_at BEFORE UPDATE ON tenant_registry FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 