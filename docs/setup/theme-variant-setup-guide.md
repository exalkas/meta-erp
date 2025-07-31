# 🎨 Theme Variant System Setup Guide

## Overview

This guide covers setting up the new **Enterprise Theme Variant System** which supports marketplace-ready themes with light/dark variants.

## 🏗️ Database Setup

### 1. Create New Tables

Run the database migration to create the new theme variant tables:

```sql
-- Create BaseTheme table (marketplace themes)
CREATE TABLE base_themes (
    base_theme_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    creator_id UUID,
    marketplace_url VARCHAR(500),
    price DECIMAL(10,2),
    download_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2),
    category VARCHAR(100),
    tags JSONB DEFAULT '[]',
    preview_image VARCHAR(500),
    demo_url VARCHAR(500),
    is_system_theme BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    version VARCHAR(20) DEFAULT '1.0.0',
    min_platform_version VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    CONSTRAINT uq_base_theme_tenant_name UNIQUE(tenant_id, name)
);

-- Create ThemeVariant table (light/dark variants)
CREATE TABLE theme_variants (
    variant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_theme_id UUID NOT NULL REFERENCES base_themes(base_theme_id) ON DELETE CASCADE,
    variant_name VARCHAR(50) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    supports_auto_switch BOOLEAN DEFAULT TRUE,
    css_class_prefix VARCHAR(50),
    media_query VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_theme_variant_name UNIQUE(base_theme_id, variant_name)
);

-- Create ThemeVariantProperty table (CSS properties)
CREATE TABLE theme_variant_properties (
    property_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES theme_variants(variant_id) ON DELETE CASCADE,
    property_key VARCHAR(100) NOT NULL,
    property_value VARCHAR(500) NOT NULL,
    property_type VARCHAR(50),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    description TEXT,
    css_selector VARCHAR(200),
    important BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_theme_variant_property_key UNIQUE(variant_id, property_key)
);

-- Create indexes for performance
CREATE INDEX idx_base_theme_tenant_id ON base_themes(tenant_id);
CREATE INDEX idx_base_theme_active ON base_themes(is_active);
CREATE INDEX idx_base_theme_featured ON base_themes(is_featured);
CREATE INDEX idx_base_theme_category ON base_themes(category);
CREATE INDEX idx_base_theme_creator ON base_themes(creator_id);

CREATE INDEX idx_theme_variant_base_theme ON theme_variants(base_theme_id);
CREATE INDEX idx_theme_variant_active ON theme_variants(is_active);
CREATE INDEX idx_theme_variant_default ON theme_variants(is_default);

CREATE INDEX idx_theme_variant_property_variant ON theme_variant_properties(variant_id);
CREATE INDEX idx_theme_variant_property_category ON theme_variant_properties(category);
CREATE INDEX idx_theme_variant_property_type ON theme_variant_properties(property_type);
```

### 2. Seed Default Themes

Create the default system themes:

```sql
-- Insert Maritime base theme
INSERT INTO base_themes (
    base_theme_id, name, display_name, description, category,
    is_system_theme, is_active, is_featured, version
) VALUES (
    'maritime-001-0000-0000-000000000001',
    'maritime',
    'Maritime Professional Theme',
    'Professional theme inspired by maritime industry',
    'business',
    TRUE, TRUE, TRUE, '1.0.0'
);

-- Insert Default base theme (for migration)
INSERT INTO base_themes (
    base_theme_id, name, display_name, description, category,
    is_system_theme, is_active, is_featured, version
) VALUES (
    'default-001-0000-0000-000000000001',
    'default',
    'Default System Theme',
    'Default theme for new installations',
    'system',
    TRUE, TRUE, FALSE, '1.0.0'
);

-- Create Light variants
INSERT INTO theme_variants (
    variant_id, base_theme_id, variant_name, display_name,
    is_default, css_class_prefix, media_query
) VALUES
(
    'maritime-light-0000-0000-000000000001',
    'maritime-001-0000-0000-000000000001',
    'light',
    'Light Mode',
    TRUE, NULL, '@media (prefers-color-scheme: light)'
),
(
    'default-light-0000-0000-000000000001',
    'default-001-0000-0000-000000000001',
    'light',
    'Light Mode',
    TRUE, NULL, '@media (prefers-color-scheme: light)'
);

-- Create Dark variants
INSERT INTO theme_variants (
    variant_id, base_theme_id, variant_name, display_name,
    is_default, css_class_prefix, media_query
) VALUES
(
    'maritime-dark-0000-0000-000000000001',
    'maritime-001-0000-0000-000000000001',
    'dark',
    'Dark Mode',
    FALSE, 'dark', '@media (prefers-color-scheme: dark)'
),
(
    'default-dark-0000-0000-000000000001',
    'default-001-0000-0000-000000000001',
    'dark',
    'Dark Mode',
    FALSE, 'dark', '@media (prefers-color-scheme: dark)'
);
```

### 3. Add Theme Properties

```sql
-- Maritime Light Theme Properties
INSERT INTO theme_variant_properties (variant_id, property_key, property_value, property_type, category, subcategory) VALUES
('maritime-light-0000-0000-000000000001', '--primary-color', '#0066CC', 'color', 'colors', 'primary'),
('maritime-light-0000-0000-000000000001', '--secondary-color', '#4A90B8', 'color', 'colors', 'secondary'),
('maritime-light-0000-0000-000000000001', '--background-color', '#FFFFFF', 'color', 'colors', 'background'),
('maritime-light-0000-0000-000000000001', '--text-color', '#1A1A1A', 'color', 'colors', 'text'),
('maritime-light-0000-0000-000000000001', '--border-color', '#E5E7EB', 'color', 'colors', 'border');

-- Maritime Dark Theme Properties
INSERT INTO theme_variant_properties (variant_id, property_key, property_value, property_type, category, subcategory) VALUES
('maritime-dark-0000-0000-000000000001', '--primary-color', '#4A9EFF', 'color', 'colors', 'primary'),
('maritime-dark-0000-0000-000000000001', '--secondary-color', '#6BB6FF', 'color', 'colors', 'secondary'),
('maritime-dark-0000-0000-000000000001', '--background-color', '#1A1A1A', 'color', 'colors', 'background'),
('maritime-dark-0000-0000-000000000001', '--text-color', '#FFFFFF', 'color', 'colors', 'text'),
('maritime-dark-0000-0000-000000000001', '--border-color', '#374151', 'color', 'colors', 'border');
```

## 🔧 Backend Setup

### 1. Update Database Models

The new models are already defined in `services/api/app/models/platform.py`:

- `BaseTheme`
- `ThemeVariant`
- `ThemeVariantProperty`

### 2. Update Theme Engine

Update the theme engine to use the new variant system:

```python
# services/api/app/engines/theme_variant_engine.py
class ThemeVariantEngine:

    async def get_theme_variant(
        self,
        theme_name: str,
        variant_name: str = "light",
        tenant_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get theme variant with CSS properties."""

        # Get base theme
        base_theme = await self.get_base_theme(theme_name, tenant_id)
        if not base_theme:
            return None

        # Get specific variant
        variant = await self.get_variant(base_theme.base_theme_id, variant_name)
        if not variant:
            # Fallback to default variant
            variant = await self.get_default_variant(base_theme.base_theme_id)

        # Get all properties for this variant
        properties = await self.get_variant_properties(variant.variant_id)

        return {
            "base_theme": {
                "name": base_theme.name,
                "display_name": base_theme.display_name,
                "version": base_theme.version
            },
            "variant": {
                "variant_name": variant.variant_name,
                "display_name": variant.display_name,
                "css_class_prefix": variant.css_class_prefix
            },
            "css_properties": {
                prop.property_key: prop.property_value
                for prop in properties
            }
        }
```

### 3. Update API Endpoints

Add new theme variant endpoints:

```python
# services/api/app/api/themes.py
@router.get("/themes/{theme_name}")
async def get_theme_default_variant(theme_name: str):
    """Get default variant for theme."""
    return await theme_engine.get_theme_variant(theme_name)

@router.get("/themes/{theme_name}/{variant_name}")
async def get_theme_specific_variant(theme_name: str, variant_name: str):
    """Get specific theme variant."""
    return await theme_engine.get_theme_variant(theme_name, variant_name)
```

## 🎨 Frontend Setup

### 1. Update Theme Context

```typescript
// packages/shared/ui/src/contexts/ThemeVariantContext.tsx
interface ThemeVariantContextType {
  selectedTheme: string;      // "maritime", "corporate"
  selectedVariant: string;    // "light", "dark"
  cssProperties: Record<string, string>;
  setTheme: (theme: string) => void;
  setVariant: (variant: string) => void;
  toggleDarkMode: () => void;
}

export const ThemeVariantProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [selectedTheme, setSelectedTheme] = useState("maritime");
  const [selectedVariant, setSelectedVariant] = useState("light");
  const [cssProperties, setCssProperties] = useState<Record<string, string>>({});

  const loadThemeVariant = async () => {
    const response = await fetch(`/api/themes/${selectedTheme}/${selectedVariant}`);
    const data = await response.json();
    setCssProperties(data.css_properties);

    // Apply CSS custom properties
    Object.entries(data.css_properties).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  };

  useEffect(() => {
    loadThemeVariant();
  }, [selectedTheme, selectedVariant]);

  return (
    <ThemeVariantContext.Provider value={{
      selectedTheme,
      selectedVariant,
      cssProperties,
      setTheme: setSelectedTheme,
      setVariant: setSelectedVariant,
      toggleDarkMode: () => setSelectedVariant(prev => prev === "light" ? "dark" : "light")
    }}>
      {children}
    </ThemeVariantContext.Provider>
  );
};
```

### 2. Update Theme Toggle Component

```typescript
// packages/shared/ui/src/components/theme/ThemeToggle.tsx
export const ThemeToggle: React.FC = () => {
  const { selectedVariant, toggleDarkMode } = useThemeVariant();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {selectedVariant === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
};
```

## 🧪 Testing

### Test Theme Variant API

```bash
# Test default variant
curl http://localhost:8000/api/themes/maritime

# Test specific variant
curl http://localhost:8000/api/themes/maritime/dark

# Expected response:
{
  "base_theme": {
    "name": "maritime",
    "display_name": "Maritime Professional Theme"
  },
  "variant": {
    "variant_name": "dark",
    "display_name": "Dark Mode"
  },
  "css_properties": {
    "--primary-color": "#4A9EFF",
    "--background-color": "#1A1A1A"
  }
}
```

## 🚀 Migration from Current System

### Automatic Migration Script

```python
# scripts/migrate_themes_to_variants.py
async def migrate_existing_themes():
    """Migrate existing Theme model to new BaseTheme + ThemeVariant system."""

    # Get all existing themes
    existing_themes = await session.execute(select(Theme))

    for theme in existing_themes.scalars():
        # Create base theme
        if theme.name in ["light", "dark"]:
            base_theme_name = "default"
        else:
            base_theme_name = theme.name

        # Create or get base theme
        base_theme = await get_or_create_base_theme(base_theme_name)

        # Create variant
        variant_name = "light" if theme.name == "light" else "dark"
        variant = await create_theme_variant(base_theme.base_theme_id, variant_name)

        # Migrate properties
        for prop in theme.theme_properties:
            await create_variant_property(variant.variant_id, prop)
```

## 📚 Resources

- **Schema Examples**: `docs/theme-variant-schema-examples.md`
- **API Documentation**: Check FastAPI docs at `/docs`
- **Database Models**: `services/api/app/models/platform.py`
- **Frontend Components**: `packages/shared/ui/src/components/theme/`

## ✅ Verification Checklist

- [ ] Database tables created successfully
- [ ] Default themes and variants seeded
- [ ] Theme properties populated
- [ ] API endpoints returning correct data
- [ ] Frontend theme toggle working
- [ ] CSS custom properties applied correctly
- [ ] Migration from old system completed
