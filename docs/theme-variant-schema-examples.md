# Theme Variant System - Schema Examples

## 🎯 New Architecture Overview

The new theme variant system supports:

- **Base Themes**: Professional, Corporate, Modern (marketplace items)
- **Standard Variants**: Light & Dark (Tailwind compatible)
- **Enterprise Features**: Marketplace, versioning, tenant customization

## 📊 Sample Data Structure

### 1. Base Themes

```json
{
  "base_theme_id": "professional-001",
  "name": "professional",
  "display_name": "Professional Business Theme",
  "description": "Professional theme inspired by business industry",
  "creator_id": "creator-001",
  "category": "business",
  "tags": ["professional", "blue", "business", "corporate"],
  "is_system_theme": true,
  "is_featured": true,
  "version": "2.1.0",
  "variants": ["light", "dark"]
}
```

### 2. Theme Variants

```json
// Professional Light Variant
{
  "variant_id": "professional-light-001",
  "base_theme_id": "professional-001",
  "variant_name": "light",
  "display_name": "Light Mode",
  "is_default": true,
  "css_class_prefix": null,
  "media_query": "@media (prefers-color-scheme: light)"
}

// Professional Dark Variant
{
  "variant_id": "professional-dark-001",
  "base_theme_id": "professional-001",
  "variant_name": "dark",
  "display_name": "Dark Mode",
  "is_default": false,
  "css_class_prefix": "dark",
  "media_query": "@media (prefers-color-scheme: dark)"
}
```

### 3. Theme Variant Properties

```json
// Maritime Light Colors
{
  "variant_id": "maritime-light-001",
  "properties": [
    {
      "property_key": "--primary-color",
      "property_value": "#0066CC",
      "property_type": "color",
      "category": "colors",
      "subcategory": "primary"
    },
    {
      "property_key": "--background-color",
      "property_value": "#FFFFFF",
      "property_type": "color",
      "category": "colors",
      "subcategory": "background"
    }
  ]
}

// Maritime Dark Colors
{
  "variant_id": "maritime-dark-001",
  "properties": [
    {
      "property_key": "--primary-color",
      "property_value": "#4A9EFF",
      "property_type": "color",
      "category": "colors",
      "subcategory": "primary"
    },
    {
      "property_key": "--background-color",
      "property_value": "#1A1A1A",
      "property_type": "color",
      "category": "colors",
      "subcategory": "background"
    }
  ]
}
```

## 🚀 API Usage Examples

### Frontend Theme Selection

```typescript
// User selects theme
const selectedTheme = "maritime"
const isDarkMode = true

// API call
const themeData = await fetch(`/api/themes/${selectedTheme}/${isDarkMode ? 'dark' : 'light'}`)

// Response
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
    "--background-color": "#1A1A1A",
    "--text-color": "#FFFFFF"
  }
}
```

### CSS Generation

```css
/* Auto-generated CSS from theme variant properties */
:root {
  --primary-color: #0066cc;
  --background-color: #ffffff;
  --text-color: #1a1a1a;
}

.dark {
  --primary-color: #4a9eff;
  --background-color: #1a1a1a;
  --text-color: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --primary-color: #4a9eff;
    --background-color: #1a1a1a;
    --text-color: #ffffff;
  }
}
```

## 🎨 Migration from Current Schema

### Current Data

```json
// Old structure
{
  "theme_id": "light",
  "name": "light",
  "properties": [...]
}
```

### New Structure

```json
// Migrated to
{
  "base_theme": {
    "name": "default",
    "display_name": "Default Theme"
  },
  "variant": {
    "variant_name": "light",
    "display_name": "Light Mode"
  }
}
```

## 🏪 Marketplace Benefits

1. **Theme Packages**: Creators sell complete light+dark theme pairs
2. **Versioning**: Themes can be updated with new variants
3. **Ratings & Reviews**: Users rate complete theme experiences
4. **Easy Installation**: One click installs both variants
5. **Tenant Customization**: Tenants can override specific properties

## 🔧 Next Steps

1. **Migration Script**: Convert existing themes to new structure
2. **API Engine Updates**: Update theme lookup logic
3. **Frontend Integration**: Update theme context and toggle
4. **CSS Generation**: Build variant-aware CSS output
