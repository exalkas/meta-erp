-- Greek ERP/CRM Database Initialization Script
-- Creates database tables, indexes, and initial data
-- Compatible with PostgreSQL 12+ and Greek business requirements

-- Set client encoding to UTF-8 for Greek characters
SET CLIENT_ENCODING TO 'UTF8';
SET TIMEZONE TO 'Europe/Athens';

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Enums for Invoice System
CREATE TYPE invoice_type AS ENUM (
    'sales_invoice', 'receipt', 'credit_note', 'debit_note', 'proforma',
    'delivery_note', 'simplified_invoice', 'self_billing', 'e_invoice',
    'sales_order', 'order_confirmation', 'purchase_order', 
    'request_for_quotation', 'sales_quotation', 'return_note', 'internal_transfer'
);

CREATE TYPE invoice_status AS ENUM (
    'draft', 'pending', 'approved', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded', 'disputed', 'error'
);

CREATE TYPE aade_status AS ENUM (
    'not_submitted', 'pending', 'submitted', 'accepted', 'rejected', 'cancelled', 'error'
);

CREATE TYPE payment_method AS ENUM (
    'cash', 'bank_transfer', 'card', 'check', 'letter_of_credit', 'other'
);

CREATE TYPE business_entity_type AS ENUM (
    'business', 'individual', 'government', 'non_profit'
);

CREATE TYPE business_entity_status AS ENUM (
    'active', 'inactive', 'suspended', 'prospect', 'blocked'
);

CREATE TYPE business_entity_role AS ENUM (
    'customer', 'supplier', 'partner', 'competitor', 'prospect', 'lead'
);

CREATE TYPE payment_terms AS ENUM (
    'due_on_receipt', 'net_7', 'net_14', 'net_30', 'net_45', 'net_60', 'net_90', 'custom'
);

CREATE TYPE contact_method_type AS ENUM (
    'phone', 'email', 'address'
);

-- Company Management Tables
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    afm VARCHAR(9) UNIQUE NOT NULL,
    doy VARCHAR(10) NOT NULL,
    business_activity VARCHAR(255) NOT NULL,
    legal_form VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    mobile VARCHAR(20),
    fax VARCHAR(20),
    website VARCHAR(255),
    address_street VARCHAR(255) NOT NULL,
    address_number VARCHAR(10) NOT NULL,
    address_city VARCHAR(100) NOT NULL,
    address_postal_code VARCHAR(10) NOT NULL,
    address_region VARCHAR(100) NOT NULL,
    address_country VARCHAR(2) NOT NULL DEFAULT 'GR',
    default_currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    default_language VARCHAR(2) NOT NULL DEFAULT 'el',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Europe/Athens',
    aade_enabled BOOLEAN DEFAULT TRUE,
    aade_subscription_key VARCHAR(255),
    aade_test_mode BOOLEAN DEFAULT TRUE,
    vat_number VARCHAR(20) UNIQUE NOT NULL,
    vat_regime VARCHAR(20) NOT NULL DEFAULT 'standard',
    accounting_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    fiscal_year_start VARCHAR(5) NOT NULL DEFAULT '01-01',
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'starter',
    subscription_status VARCHAR(20) NOT NULL DEFAULT 'active',
    billing_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    setup_completed BOOLEAN DEFAULT FALSE,
    database_name VARCHAR(255) UNIQUE NOT NULL,
    database_created BOOLEAN DEFAULT FALSE,
    features_enabled JSONB DEFAULT '{}',
    company_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT chk_afm_format CHECK (afm ~ '^[0-9]{9}$'),
    CONSTRAINT chk_email_format CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$')
);

-- Users Table with Company Isolation
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    role VARCHAR(50) DEFAULT 'employee',
    permissions JSONB DEFAULT '[]',
    department VARCHAR(100),
    position VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending_verification',
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    language VARCHAR(2) DEFAULT 'el',
    timezone VARCHAR(50) DEFAULT 'Europe/Athens',
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    is_super_user BOOLEAN DEFAULT FALSE,
    super_user_created_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    password_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT chk_email_format CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
    CONSTRAINT chk_role_valid CHECK (role IN ('admin', 'manager', 'employee', 'accountant', 'sales'))
);

-- Business Entity Management (replaces customers)
CREATE TABLE IF NOT EXISTS business_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    entity_code VARCHAR(20) UNIQUE NOT NULL,
    entity_type business_entity_type NOT NULL DEFAULT 'business',
    business_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(255) NOT NULL,
    afm VARCHAR(9),
    doy VARCHAR(10),
    business_activity VARCHAR(255),
    legal_form VARCHAR(50),
    vat_number VARCHAR(20),
    vat_exempt BOOLEAN DEFAULT FALSE,
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    fax VARCHAR(20),
    website VARCHAR(255),
    address_street VARCHAR(255),
    address_number VARCHAR(10),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(10),
    address_region VARCHAR(100),
    address_country VARCHAR(2) DEFAULT 'GR',
    billing_address_street VARCHAR(255),
    billing_address_number VARCHAR(10),
    billing_address_city VARCHAR(100),
    billing_address_postal_code VARCHAR(10),
    billing_address_region VARCHAR(100),
    billing_address_country VARCHAR(2) DEFAULT 'GR',
    status business_entity_status NOT NULL DEFAULT 'active',
    entity_category VARCHAR(50),
    entity_segment VARCHAR(50),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms payment_terms DEFAULT 'net_30',
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    supplier_rating INTEGER,
    supplier_category VARCHAR(100),
    lead_time_days INTEGER DEFAULT 0,
    minimum_order_amount DECIMAL(15,2),
    lead_source VARCHAR(100),
    assigned_user_id UUID,
    notes TEXT,
    tags JSONB DEFAULT '[]',
    total_sales DECIMAL(15,2) DEFAULT 0,
    total_purchases DECIMAL(15,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_purchase_orders INTEGER DEFAULT 0,
    last_order_date TIMESTAMP WITH TIME ZONE,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    first_order_date TIMESTAMP WITH TIME ZONE,
    first_purchase_date TIMESTAMP WITH TIME ZONE,
    language VARCHAR(2) DEFAULT 'el',
    preferred_contact_method VARCHAR(20) DEFAULT 'email',
    marketing_consent BOOLEAN DEFAULT FALSE,
    newsletter_subscription BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT chk_afm_format CHECK (afm IS NULL OR afm ~ '^[0-9]{9}$'),
    CONSTRAINT chk_email_format CHECK (email IS NULL OR email ~ '^[^@]+@[^@]+\.[^@]+$')
);

-- Business Entity Roles (many-to-many)
CREATE TABLE IF NOT EXISTS business_entity_roles (
    business_entity_id UUID REFERENCES business_entities(id) ON DELETE CASCADE,
    role business_entity_role,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    PRIMARY KEY (business_entity_id, role)
);

-- Contact Method Subtypes
CREATE TABLE IF NOT EXISTS contact_method_subtypes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    method_type contact_method_type NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_greek VARCHAR(255) NOT NULL,
    description TEXT,
    description_greek TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_default BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    validation_rules JSONB DEFAULT '{}',
    format_template VARCHAR(255),
    auto_suggestions JSONB DEFAULT '[]',
    requires_verification BOOLEAN DEFAULT FALSE,
    allows_marketing BOOLEAN DEFAULT TRUE,
    business_hours_only BOOLEAN DEFAULT FALSE,
    greek_compliance_required BOOLEAN DEFAULT FALSE,
    aade_field_mapping VARCHAR(100),
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(company_id, method_type, code)
);

-- Product/Service Management
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID,
    product_type VARCHAR(20) DEFAULT 'product',
    status VARCHAR(20) DEFAULT 'active',
    unit_of_measure VARCHAR(20) DEFAULT 'piece',
    purchase_price DECIMAL(15,4) DEFAULT 0.00,
    sale_price DECIMAL(15,4) NOT NULL DEFAULT 0.00,
    minimum_sale_price DECIMAL(15,4),
    cost_price DECIMAL(15,4) DEFAULT 0.00,
    vat_category VARCHAR(20) DEFAULT 'standard',
    weight DECIMAL(10,3),
    dimensions_length DECIMAL(10,2),
    dimensions_width DECIMAL(10,2),
    dimensions_height DECIMAL(10,2),
    sku VARCHAR(100),
    barcode VARCHAR(100),
    manufacturer VARCHAR(255),
    brand VARCHAR(255),
    model VARCHAR(255),
    warranty_period INTEGER,
    track_inventory BOOLEAN DEFAULT TRUE,
    current_stock DECIMAL(10,3) DEFAULT 0,
    minimum_stock DECIMAL(10,3) DEFAULT 0,
    maximum_stock DECIMAL(10,3),
    reorder_point DECIMAL(10,3),
    reorder_quantity DECIMAL(10,3),
    lead_time_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_service BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    primary_image_url VARCHAR(500),
    image_urls JSONB DEFAULT '[]',
    primary_supplier_id UUID,
    supplier_product_code VARCHAR(100),
    supplier_lead_time_days INTEGER DEFAULT 0,
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT chk_prices_positive CHECK (sale_price >= 0 AND cost_price >= 0)
);

-- Invoice Management (Updated to match current models)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    business_entity_id UUID NOT NULL REFERENCES business_entities(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    series VARCHAR(20) NOT NULL DEFAULT 'INV',
    sequence_number INTEGER NOT NULL,
    invoice_type invoice_type NOT NULL DEFAULT 'sales_invoice',
    status invoice_status NOT NULL DEFAULT 'draft',
    is_legal_document BOOLEAN NOT NULL DEFAULT TRUE,
    affects_vat BOOLEAN NOT NULL DEFAULT TRUE,
    affects_inventory BOOLEAN NOT NULL DEFAULT TRUE,
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    service_date TIMESTAMP WITH TIME ZONE,
    delivery_date TIMESTAMP WITH TIME ZONE,
    parent_document_id UUID REFERENCES invoices(id),
    original_document_id UUID REFERENCES invoices(id),
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_vat DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    payment_method payment_method DEFAULT 'bank_transfer',
    payment_terms VARCHAR(100),
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    outstanding_amount DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    exchange_rate DECIMAL(10,6) DEFAULT 1.0,
    notes TEXT,
    internal_notes TEXT,
    reference_number VARCHAR(100),
    purchase_order VARCHAR(100),
    project_number VARCHAR(100),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    aade_status aade_status DEFAULT 'not_submitted',
    aade_submission_date TIMESTAMP WITH TIME ZONE,
    aade_response JSONB,
    aade_mark VARCHAR(100),
    aade_qr_code VARCHAR(500),
    aade_cancellation_mark VARCHAR(100),
    mydata_invoice_type VARCHAR(20),
    vat_exemption_reason VARCHAR(255),
    reverse_charge BOOLEAN DEFAULT FALSE,
    ubl_version VARCHAR(10),
    xml_content TEXT,
    digital_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT chk_amounts_positive CHECK (subtotal >= 0 AND total_vat >= 0 AND total_amount >= 0)
);

-- Invoice Line Items (Updated)
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    line_number INTEGER NOT NULL,
    product_code VARCHAR(50),
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,3) NOT NULL,
    unit_of_measure VARCHAR(20),
    unit_price DECIMAL(15,4) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    line_total DECIMAL(15,2) NOT NULL,
    vat_category VARCHAR(20) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL,
    vat_amount DECIMAL(15,2) NOT NULL,
    vat_exemption_reason VARCHAR(255),
    mydata_classification VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_unit_price_positive CHECK (unit_price >= 0)
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT chk_action_valid CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'))
);

-- Greek Tax Configuration
CREATE TABLE IF NOT EXISTS greek_tax_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    config_key VARCHAR(50) NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(company_id, config_key)
);

-- AADE Integration Log
CREATE TABLE IF NOT EXISTS aade_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    submission_type VARCHAR(50) NOT NULL,
    request_data JSONB,
    response_data JSONB,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT chk_submission_type CHECK (submission_type IN ('invoice', 'payment', 'cancellation')),
    CONSTRAINT chk_status_valid CHECK (status IN ('pending', 'success', 'failed', 'retry'))
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_companies_afm ON companies(afm);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_business_entities_company_id ON business_entities(company_id);
CREATE INDEX IF NOT EXISTS idx_business_entities_afm ON business_entities(afm);
CREATE INDEX IF NOT EXISTS idx_business_entities_entity_code ON business_entities(entity_code);
CREATE INDEX IF NOT EXISTS idx_business_entities_display_name ON business_entities(display_name);
CREATE INDEX IF NOT EXISTS idx_business_entities_email ON business_entities(email);
CREATE INDEX IF NOT EXISTS idx_business_entity_roles_entity ON business_entity_roles(business_entity_id);
CREATE INDEX IF NOT EXISTS idx_business_entity_roles_role ON business_entity_roles(role);
CREATE INDEX IF NOT EXISTS idx_contact_method_subtypes_company ON contact_method_subtypes(company_id);
CREATE INDEX IF NOT EXISTS idx_contact_method_subtypes_type ON contact_method_subtypes(method_type);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_business_entity_id ON invoices(business_entity_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_greek_tax_config_company_id ON greek_tax_config(company_id);
CREATE INDEX IF NOT EXISTS idx_aade_submissions_company_id ON aade_submissions(company_id);
CREATE INDEX IF NOT EXISTS idx_aade_submissions_invoice_id ON aade_submissions(invoice_id);

-- Create Functions for Common Operations

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_entities_updated_at BEFORE UPDATE ON business_entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_greek_tax_config_updated_at BEFORE UPDATE ON greek_tax_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(company_uuid UUID, series_name VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    next_aa INTEGER;
    invoice_num VARCHAR;
BEGIN
    -- Get next AA (sequential number) for this company and series
    SELECT COALESCE(MAX(sequence_number), 0) + 1 
    INTO next_aa 
    FROM invoices 
    WHERE company_id = company_uuid 
    AND series = series_name 
    AND EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Generate invoice number: SERIES-YYYY-AA
    invoice_num := series_name || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(next_aa::TEXT, 6, '0');
    
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Function to validate Greek AFM
CREATE OR REPLACE FUNCTION validate_greek_afm(afm_input VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    afm_digits INTEGER[];
    sum_value INTEGER := 0;
    checksum INTEGER;
    i INTEGER;
BEGIN
    -- Check if AFM is exactly 9 digits
    IF afm_input IS NULL OR LENGTH(afm_input) != 9 OR afm_input !~ '^[0-9]{9}$' THEN
        RETURN FALSE;
    END IF;
    
    -- Convert to array of digits
    FOR i IN 1..9 LOOP
        afm_digits[i] := CAST(SUBSTR(afm_input, i, 1) AS INTEGER);
    END LOOP;
    
    -- Calculate checksum
    FOR i IN 1..8 LOOP
        sum_value := sum_value + afm_digits[i] * POWER(2, 9-i);
    END LOOP;
    
    checksum := sum_value % 11;
    
    -- Handle special case
    IF checksum = 10 THEN
        checksum := 0;
    END IF;
    
    -- Validate checksum
    RETURN checksum = afm_digits[9];
END;
$$ LANGUAGE plpgsql;

-- Insert Default Greek Tax Configuration
INSERT INTO greek_tax_config (company_id, config_key, config_value, description) 
SELECT 
    c.id,
    'DEFAULT_VAT_RATE',
    '0.24',
    'Default Greek VAT rate (24%)'
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM greek_tax_config 
    WHERE company_id = c.id AND config_key = 'DEFAULT_VAT_RATE'
);

INSERT INTO greek_tax_config (company_id, config_key, config_value, description) 
SELECT 
    c.id,
    'REDUCED_VAT_RATE_1',
    '0.13',
    'Reduced Greek VAT rate 1 (13%)'
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM greek_tax_config 
    WHERE company_id = c.id AND config_key = 'REDUCED_VAT_RATE_1'
);

INSERT INTO greek_tax_config (company_id, config_key, config_value, description) 
SELECT 
    c.id,
    'REDUCED_VAT_RATE_2',
    '0.06',
    'Reduced Greek VAT rate 2 (6%)'
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM greek_tax_config 
    WHERE company_id = c.id AND config_key = 'REDUCED_VAT_RATE_2'
);

INSERT INTO greek_tax_config (company_id, config_key, config_value, description) 
SELECT 
    c.id,
    'ZERO_VAT_RATE',
    '0.00',
    'Zero Greek VAT rate (0%)'
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM greek_tax_config 
    WHERE company_id = c.id AND config_key = 'ZERO_VAT_RATE'
);

-- Final Success Message
DO $$
BEGIN
    RAISE NOTICE 'Greek ERP/CRM Database initialized successfully!';
    RAISE NOTICE 'Database includes:';
    RAISE NOTICE '- Multi-tenant company management with Greek compliance';
    RAISE NOTICE '- Unified business entity management (customers/suppliers/partners)';
    RAISE NOTICE '- Modern invoice system with 16 Greek document types';
    RAISE NOTICE '- Product and service management';
    RAISE NOTICE '- Contact method subtypes for flexible contact management';
    RAISE NOTICE '- AADE integration logging';
    RAISE NOTICE '- Comprehensive audit trail';
    RAISE NOTICE '- Greek locale and business validation support';
END $$; 