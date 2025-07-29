-- ============================================================================
-- Tenant Database Schema: Business Users & Authentication
-- ============================================================================
-- Purpose: Store business users and authentication data for a specific tenant
-- Scope: Tenant-specific user accounts, sessions, and authentication methods
-- Pattern: Each tenant has their own database with this schema
-- ============================================================================

-- Business Users (Tenant-specific users)
-- These are the actual users of the business applications
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL, -- References master.tenant_registry.tenant_id
    
    -- Basic user information
    username VARCHAR(100) UNIQUE, -- Optional username (some tenants use email only)
    email VARCHAR(255) NOT NULL UNIQUE,
    
    -- Profile information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200), -- Full name or preferred display name
    
    -- Authentication methods (stored as JSONB for flexibility)
    auth_methods_json JSONB DEFAULT '{}', -- Enabled auth methods for this user
    
    -- Security and compliance
    compliance_level VARCHAR(50) DEFAULT 'BASIC', -- BASIC, ENHANCED, PREMIUM
    kyc_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED, EXPIRED
    kyc_completed_at TIMESTAMP WITH TIME ZONE,
    kyc_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Account status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    
    -- Business context
    role VARCHAR(100), -- Business role (not system role)
    department VARCHAR(100),
    employee_id VARCHAR(50),
    manager_user_id UUID REFERENCES users(user_id),
    
    -- Preferences
    preferred_language VARCHAR(5) DEFAULT 'en-US',
    timezone VARCHAR(50) DEFAULT 'UTC',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    
    -- Security tracking
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    
    -- Terms and privacy
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    privacy_accepted_at TIMESTAMP WITH TIME ZONE,
    marketing_consent BOOLEAN DEFAULT false,
    
    -- Audit fields
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- Authentication Sessions (Active user sessions)
-- Tracks all active sessions for users with detailed security information
CREATE TABLE IF NOT EXISTS auth_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL, -- Double-check tenant boundary
    
    -- Session information
    session_token_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed session token
    refresh_token_hash VARCHAR(255) UNIQUE, -- Hashed refresh token
    
    -- Device and client information
    device_type VARCHAR(50), -- mobile, tablet, desktop, api, unknown
    device_id VARCHAR(255), -- Unique device identifier
    user_agent TEXT,
    
    -- Network information
    ip_address INET,
    country_code VARCHAR(3), -- Detected from IP
    city VARCHAR(100), -- Detected from IP
    
    -- Session security
    risk_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00 risk assessment
    is_suspicious BOOLEAN DEFAULT false,
    requires_verification BOOLEAN DEFAULT false,
    
    -- Session lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Session metadata
    login_method VARCHAR(50), -- password, magic_link, totp, webauthn, sso
    mfa_verified BOOLEAN DEFAULT false,
    device_registered BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES users(user_id),
    revoked_reason VARCHAR(200)
);

-- Authentication Methods (User-specific auth method configurations)
-- Stores configuration for each auth method per user
CREATE TABLE IF NOT EXISTS auth_methods (
    method_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    -- Method information
    method_type VARCHAR(50) NOT NULL, -- PASSWORD, MAGIC_LINK, TOTP_2FA, WEBAUTHN, SSO
    is_primary BOOLEAN DEFAULT false, -- Primary authentication method
    is_enabled BOOLEAN DEFAULT true,
    
    -- Method-specific credentials (encrypted/hashed)
    credentials_json JSONB, -- Method-specific data (encrypted)
    
    -- Password method data
    password_hash VARCHAR(255), -- bcrypt hash
    password_salt VARCHAR(255), -- Additional salt if needed
    
    -- TOTP 2FA method data
    totp_secret VARCHAR(255), -- Encrypted TOTP secret
    totp_backup_codes_json JSONB, -- Encrypted backup codes
    totp_last_used_code VARCHAR(10), -- Prevent replay attacks
    
    -- WebAuthn method data
    webauthn_credential_id VARCHAR(500), -- Base64 encoded credential ID
    webauthn_public_key TEXT, -- Public key for verification
    webauthn_counter INTEGER DEFAULT 0, -- Signature counter
    webauthn_transports TEXT[], -- Supported transports
    
    -- Magic Link method data
    magic_link_last_sent_at TIMESTAMP WITH TIME ZONE,
    magic_link_send_count INTEGER DEFAULT 0, -- Rate limiting
    
    -- SSO method data
    sso_provider VARCHAR(100), -- google, microsoft, saml, etc.
    sso_external_id VARCHAR(255), -- External user ID
    sso_last_token_refresh TIMESTAMP WITH TIME ZONE,
    
    -- Security metadata
    setup_completed_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_success_at TIMESTAMP WITH TIME ZONE,
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Magic Links (Temporary authentication links)
-- Stores active magic links for passwordless authentication
CREATE TABLE IF NOT EXISTS magic_links (
    link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE, -- NULL for registration links
    tenant_id UUID NOT NULL,
    
    -- Link information
    email VARCHAR(255) NOT NULL, -- Target email address
    token_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed token
    
    -- Link purpose
    purpose VARCHAR(50) NOT NULL, -- LOGIN, REGISTRATION, PASSWORD_RESET, EMAIL_VERIFICATION
    
    -- Security
    ip_address INET, -- IP that requested the link
    user_agent TEXT, -- User agent that requested the link
    
    -- Link lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    used_from_ip INET, -- IP that used the link
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER DEFAULT 1, -- How many times this link can be used
    use_count INTEGER DEFAULT 0
);

-- User Roles & Permissions (Tenant-specific RBAC)
-- Defines business roles and permissions within the tenant
CREATE TABLE IF NOT EXISTS user_roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Role information
    role_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    description TEXT,
    
    -- Role metadata
    is_system_role BOOLEAN DEFAULT false, -- Created by system vs custom
    is_active BOOLEAN DEFAULT true,
    
    -- Permissions (stored as JSON for flexibility)
    permissions_json JSONB DEFAULT '{}',
    
    -- Hierarchy
    parent_role_id UUID REFERENCES user_roles(role_id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, role_name)
);

-- User Role Assignments (Many-to-many relationship)
-- Assigns roles to users
CREATE TABLE IF NOT EXISTS user_role_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES user_roles(role_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    -- Assignment metadata
    assigned_by UUID REFERENCES users(user_id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(user_id, role_id)
);

-- Tenant-Specific Authentication Configuration Overrides
-- Allows tenants to override master authentication configuration
CREATE TABLE IF NOT EXISTS tenant_auth_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Configuration key-value pairs
    setting_name VARCHAR(100) NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'STRING', -- STRING, INTEGER, BOOLEAN, JSON
    
    -- Override information
    overrides_master BOOLEAN DEFAULT false, -- Does this override master config?
    master_config_id UUID, -- References master T_AUTH_* table
    
    -- Validation
    is_valid BOOLEAN DEFAULT true,
    validation_error TEXT,
    
    -- Metadata
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, setting_name)
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_user_id) WHERE manager_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;

-- Auth sessions indexes
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_tenant ON auth_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_refresh ON auth_sessions(refresh_token_hash) WHERE refresh_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_auth_sessions_active ON auth_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_device ON auth_sessions(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_auth_sessions_ip ON auth_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_suspicious ON auth_sessions(is_suspicious) WHERE is_suspicious = true;

-- Auth methods indexes
CREATE INDEX IF NOT EXISTS idx_auth_methods_user ON auth_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_methods_tenant ON auth_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auth_methods_type ON auth_methods(method_type);
CREATE INDEX IF NOT EXISTS idx_auth_methods_primary ON auth_methods(is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_auth_methods_enabled ON auth_methods(is_enabled);

-- Magic links indexes
CREATE INDEX IF NOT EXISTS idx_magic_links_user ON magic_links(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_magic_links_tenant ON magic_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_magic_links_purpose ON magic_links(purpose);
CREATE INDEX IF NOT EXISTS idx_magic_links_expires ON magic_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_magic_links_active ON magic_links(is_active);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_name ON user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_user_roles_system ON user_roles(is_system_role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_parent ON user_roles(parent_role_id) WHERE parent_role_id IS NOT NULL;

-- User role assignments indexes
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_tenant ON user_role_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_active ON user_role_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_expires ON user_role_assignments(expires_at) WHERE expires_at IS NOT NULL;

-- Tenant auth config indexes
CREATE INDEX IF NOT EXISTS idx_tenant_auth_config_tenant ON tenant_auth_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_auth_config_setting ON tenant_auth_config(setting_name);
CREATE INDEX IF NOT EXISTS idx_tenant_auth_config_overrides ON tenant_auth_config(overrides_master) WHERE overrides_master = true;

-- ============================================================================
-- TRIGGERS for automatic timestamp updates
-- ============================================================================

-- Function to update the updated_at timestamp (reuse from master DB)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auth_methods_updated_at BEFORE UPDATE ON auth_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_auth_config_updated_at BEFORE UPDATE ON tenant_auth_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECURITY ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables to ensure tenant isolation
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_auth_config ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (these would be customized based on application needs)
-- Note: In a true multi-database setup, RLS is less critical since each tenant 
-- has their own database, but it's still good practice for defense in depth

-- Users table policy - users can only see users from their tenant
CREATE POLICY tenant_isolation_users ON users
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Sessions table policy - users can only see their own sessions or admin can see all
CREATE POLICY tenant_isolation_sessions ON auth_sessions
    FOR ALL
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        AND (
            user_id = current_setting('app.current_user_id', true)::uuid
            OR current_setting('app.user_role', true) = 'admin'
        )
    );

-- Auth methods policy - users can only see their own auth methods
CREATE POLICY tenant_isolation_auth_methods ON auth_methods
    FOR ALL
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        AND user_id = current_setting('app.current_user_id', true)::uuid
    );

-- Magic links policy - users can only see their own magic links
CREATE POLICY tenant_isolation_magic_links ON magic_links
    FOR ALL
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        AND (
            user_id = current_setting('app.current_user_id', true)::uuid
            OR user_id IS NULL  -- Allow access to registration magic links
        )
    );

-- Roles policy - all users in tenant can see roles
CREATE POLICY tenant_isolation_roles ON user_roles
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Role assignments policy - users can see their own assignments or admin can see all
CREATE POLICY tenant_isolation_role_assignments ON user_role_assignments
    FOR ALL
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        AND (
            user_id = current_setting('app.current_user_id', true)::uuid
            OR current_setting('app.user_role', true) = 'admin'
        )
    );

-- Tenant config policy - admin users can manage config
CREATE POLICY tenant_isolation_config ON tenant_auth_config
    FOR ALL
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid
        AND current_setting('app.user_role', true) = 'admin'
    ); 