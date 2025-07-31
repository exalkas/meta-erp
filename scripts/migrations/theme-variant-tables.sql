-- Theme Variant System - SQL DDL Statements
-- Creates new BaseTheme + ThemeVariant + ThemeVariantProperty tables
-- Compatible with PostgreSQL 16/17

-- ========================================
-- Base Themes Table (Marketplace Themes)
-- ========================================
CREATE TABLE IF NOT EXISTS base_themes (
    base_theme_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    
    -- Theme identification
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Marketplace information
    creator_id UUID,
    marketplace_url VARCHAR(500),
    price DECIMAL(10,2),
    download_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2),
    
    -- Theme metadata
    category VARCHAR(100),
    tags JSONB DEFAULT '[]'::jsonb,
    preview_image VARCHAR(500),
    demo_url VARCHAR(500),
    
    -- Theme configuration
    is_system_theme BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    
    -- Versioning
    version VARCHAR(20) DEFAULT '1.0.0',
    min_platform_version VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    CONSTRAINT uq_base_theme_tenant_name UNIQUE(tenant_id, name)
);

-- ========================================
-- Theme Variants Table (Light/Dark)
-- ========================================
CREATE TABLE IF NOT EXISTS theme_variants (
    variant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_theme_id UUID NOT NULL REFERENCES base_themes(base_theme_id) ON DELETE CASCADE,
    
    -- Variant identification
    variant_name VARCHAR(50) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Variant configuration
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    supports_auto_switch BOOLEAN DEFAULT true,
    
    -- CSS generation
    css_class_prefix VARCHAR(50),
    media_query VARCHAR(200),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_theme_variant_name UNIQUE(base_theme_id, variant_name)
);

-- ========================================
-- Theme Variant Properties Table (CSS Custom Properties)
-- ========================================
CREATE TABLE IF NOT EXISTS theme_variant_properties (
    property_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES theme_variants(variant_id) ON DELETE CASCADE,
    
    -- CSS Property definition
    property_key VARCHAR(100) NOT NULL,
    property_value VARCHAR(500) NOT NULL,
    
    -- Property metadata
    property_type VARCHAR(50),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    description TEXT,
    
    -- CSS generation hints
    css_selector VARCHAR(200),
    important BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_theme_variant_property_key UNIQUE(variant_id, property_key)
);

-- ========================================
-- Indexes for Performance
-- ========================================

-- Base Themes indexes
CREATE INDEX IF NOT EXISTS idx_base_theme_tenant_id ON base_themes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_base_theme_active ON base_themes(is_active);
CREATE INDEX IF NOT EXISTS idx_base_theme_featured ON base_themes(is_featured);
CREATE INDEX IF NOT EXISTS idx_base_theme_category ON base_themes(category);
CREATE INDEX IF NOT EXISTS idx_base_theme_creator ON base_themes(creator_id);

-- Theme Variants indexes
CREATE INDEX IF NOT EXISTS idx_theme_variant_base_theme ON theme_variants(base_theme_id);
CREATE INDEX IF NOT EXISTS idx_theme_variant_active ON theme_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_theme_variant_default ON theme_variants(is_default);

-- Theme Variant Properties indexes
CREATE INDEX IF NOT EXISTS idx_theme_variant_property_variant ON theme_variant_properties(variant_id);
CREATE INDEX IF NOT EXISTS idx_theme_variant_property_category ON theme_variant_properties(category);
CREATE INDEX IF NOT EXISTS idx_theme_variant_property_type ON theme_variant_properties(property_type);

-- ========================================
-- Comments for Documentation
-- ========================================
COMMENT ON TABLE base_themes IS 'Base themes that can have light/dark variants (maritime, corporate, etc.)';
COMMENT ON TABLE theme_variants IS 'Light/Dark variants of base themes with actual styling properties';
COMMENT ON TABLE theme_variant_properties IS 'CSS custom properties for specific theme variants';

COMMENT ON COLUMN base_themes.tenant_id IS 'NULL = global/system theme, specific UUID = tenant-specific theme';
COMMENT ON COLUMN theme_variants.css_class_prefix IS 'For Tailwind: "dark" or null for light variant';
COMMENT ON COLUMN theme_variants.media_query IS 'CSS media query for auto-switching: "(prefers-color-scheme: dark)"';
COMMENT ON COLUMN theme_variant_properties.property_key IS 'CSS custom property name: "--primary-color", "--background-color"';
COMMENT ON COLUMN theme_variant_properties.property_value IS 'CSS property value: "#3182ce", "rgba(255, 255, 255, 0.9)"';