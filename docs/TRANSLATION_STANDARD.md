# Translation Standard - Metadata-Driven Platform

## Overview

This document defines the translation standard for the metadata-driven platform. The system uses **flat keys**, **vertical-specific translations**, and **configuration-driven fallback logic** for maximum flexibility and maintainability.

## Translation Key Strategy

### **Flat Keys with Dot Notation**

- ✅ Use: `"navigation.dashboard"`, `"sidebar_sections.practice_management"`
- ❌ Avoid: `"nav": { "dashboard": "Dashboard" }` (nested structures)

### **Why Flat Keys?**

- **Per-page loading**: Load only translations needed for specific pages
- **Vertical isolation**: Legal app gets legal translations, admin gets admin translations
- **Simpler processing**: Direct key-value lookup without nested navigation
- **Database optimized**: Efficient storage and querying in flat structure
- **Cross-context reuse**: Same key works across components on a page

## Key Naming Conventions

### **Format**: `snake_case`

```json
"project_name"          // Good
"projectName"           // Avoid camelCase
"project-name"          // Avoid kebab-case
```

### **Grouping by Context (Dot Notation)**

```json
// Navigation items
"navigation.dashboard"
"navigation.clients"
"navigation.matters"

// Sidebar sections
"sidebar_sections.practice_management"
"sidebar_sections.time_billing"
"sidebar_sections.legal_tools"

// Page titles
"page_titles.dashboard_title"
"page_titles.clients_title"
"page_titles.matters_title"

// Entity labels
"entity_labels.client_name"
"entity_labels.matter_number"
"entity_labels.billing_rate"
```

### **Common Patterns**

```json
// Labels
"field_name"

// Placeholders
"field_name_placeholder"

// Help text
"field_name_help"

// Validation messages
"field_name_required"
"field_name_invalid"
```

## Vertical-Aware Translation System

### **Vertical Context**

Each app specifies its vertical context to get appropriate translations:

```typescript
<TranslationProvider
  tenantId={tenantId}
  defaultLanguage="en-US"
  verticalContext="legal"  // 🎯 Key addition
/>
```

### **Supported Verticals**

- **`legal`**: Legal practice management (en-US, es-US)
- **`admin`**: Platform administration (el, en, es)
- **`automotive`**: Car dealerships (en-US, es-US, de-DE)
- **`healthcare`**: Medical practices (en-US, es-US)
- **`fintech`**: Financial services (en-US, en-GB, de-DE, fr-FR)
- **`ecommerce`**: Retail operations (en-US, es-US, fr-CA, en-CA)

## Configuration-Driven Fallback

### **Fallback Configuration**

All fallback logic is defined in `services/api/config/locale_fallback_config.json`:

```json
{
  "vertical_specific_fallbacks": {
    "legal": {
      "description": "Legal vertical prioritizes business locales",
      "supported_locales": ["en-US", "es-US"],
      "fallback_chain": ["en-US", "es-US"]
    },
    "admin": {
      "description": "Admin vertical uses generic locales",
      "supported_locales": ["el", "en", "es"],
      "fallback_chain": ["el", "en", "es"]
    }
  }
}
```

### **Fallback Process**

1. **Check vertical configuration**: Get fallback chain for the vertical
2. **Try each locale in order**: Query database for each fallback locale
3. **Return first match**: Use first locale that has translations
4. **No hardcoded values**: All rules come from configuration

### **Example: Legal App**

```typescript
// Legal app requests Greek (el) with vertical="legal"
// Configuration fallback chain: ["en-US", "es-US"]

1. Skip Greek admin translations (wrong vertical)
2. Try: en-US → "navigation.dashboard": "Dashboard" ✅
3. Legal app shows English legal translations
```

## Translation Files Structure

### **Vertical-Specific Locations**

```
data/
├── metadata/apps/admin/translations/          # Admin app translations
│   ├── en-translations.json                   # Generic English
│   └── el-translations.json                   # Generic Greek
├── verticals/legal/translations/               # Legal vertical translations
│   ├── en-US.json                             # Legal English (US)
│   └── es-US.json                             # Legal Spanish (US)
└── verticals/automotive/translations/          # Future automotive vertical
    ├── en-US.json
    ├── es-US.json
    └── de-DE.json
```

### **Flat Key Format**

```json
{
  "navigation.dashboard": "Dashboard",
  "navigation.clients": "Clients",
  "navigation.matters": "Matters",
  "sidebar_sections.practice_management": "Practice Management",
  "entity_labels.client_name": "Client Name",
  "entity_labels.matter_number": "Matter Number",
  "page_titles.dashboard_title": "Legal Practice Dashboard"
}
```

### **Seeding Process**

Translations are seeded by `data/seed-scripts/seed_all.py`:

1. **Admin translations**: Loaded from `metadata/apps/admin/translations/`
2. **Vertical translations**: Loaded from `verticals/{vertical}/translations/`
3. **Database storage**: Stored as flat key-value pairs in `Translation` table
4. **Namespace**: All stored in `'common'` namespace for component compatibility

## Metadata Usage

### **Page Definitions (Legal Dashboard)**

```json
{
  "page_name": "legal_dashboard",
  "sections_data_json": {
    "sidebar": [
      {
        "type": "SidebarMenu",
        "props": {
          "sections": [
            {
              "title_key": "sidebar_sections.practice_management",
              "items": [
                {
                  "label_key": "navigation.dashboard",
                  "route": "/dashboard",
                  "icon": "Home"
                },
                {
                  "label_key": "navigation.clients",
                  "route": "/clients",
                  "icon": "Users"
                }
              ]
            }
          ]
        }
      }
    ]
  }
}
```

### **Component Props**

Components receive translation keys and resolve them via `t()` function:

```tsx
// Sidebar component
<span className="truncate">{t(item.label_key)}</span>

// Where item.label_key = "navigation.dashboard"
// t() resolves to "Dashboard" from legal translations
```

## Implementation Guidelines

### **For New Verticals**

1. **Create translation directory**: `data/verticals/{vertical}/translations/`
2. **Add translation files**: `en-US.json`, `es-US.json`, etc.
3. **Update fallback config**: Add vertical to `locale_fallback_config.json`
4. **Set vertical context**: `<TranslationProvider verticalContext="new_vertical" />`

### **For New Apps**

1. **Determine vertical**: Choose existing vertical or create new one
2. **Set TranslationProvider**: Include `verticalContext` prop
3. **Use translation keys**: Reference keys in page definitions and components
4. **Test fallback**: Verify appropriate translations load

### **Adding New Languages**

1. **Create translation files**: Add new locale files to vertical directories
2. **Update fallback config**: Add locale to vertical's `fallback_chain`
3. **Seed translations**: Run `seed_all.py` to load into database
4. **Test**: Verify new language works with vertical context

### **Testing Translation System**

1. **Test vertical isolation**: Legal gets legal translations, admin gets admin
2. **Test fallback**: Missing locales fall back to configured alternatives
3. **Test configuration**: Modify config file and verify behavior changes
4. **Test page loading**: Each page loads appropriate translation set
5. **Test race conditions**: Rapid language switching should not cause errors

### **Race Condition Prevention (FIXED January 2025)**

**CRITICAL ISSUE RESOLVED**: Components rendering before translations loaded.

**Technical Solution:**

```tsx
// Added in TranslationContext.tsx
if (isLoading) {
  return interpolateString(defaultValue, variables);
}

// Language state only updates AFTER translations load
const setLanguage = async (newLanguage: Language) => {
  await fetchTranslations(newLanguage); // Wait for translations
  setLanguageState(newLanguage); // Then update state
};
```

**Impact:**

- ✅ Eliminated "Translation not found" errors during language switching
- ✅ Components wait for translations before rendering
- ✅ Smooth transitions between English/Spanish in legal app
- ✅ No more race condition warnings in console

## Benefits

- ✅ **Vertical Isolation**: Each app gets appropriate translations
- ✅ **Configuration-Driven**: No hardcoded fallback logic
- ✅ **Per-Page Loading**: Load only needed translations
- ✅ **Deployment Flexible**: Different configs for different deployments
- ✅ **Easily Extensible**: Add verticals/languages via configuration
- ✅ **Database Optimized**: Flat structure for efficient queries
- ✅ **Future-Proof**: Ready for metadata-driven translation management

## Architecture Summary

```mermaid
graph TD
    A[Legal App] -->|verticalContext="legal"| B[TranslationProvider]
    B -->|GET /translations/el?vertical=legal| C[Translation API]
    C -->|Load config| D[locale_fallback_config.json]
    D -->|fallback_chain: ["en-US", "es-US"]| C
    C -->|Query database| E[Translation Table]
    E -->|"navigation.dashboard": "Dashboard"| C
    C -->|Return legal translations| B
    B -->|Provide t() function| F[Sidebar Component]
    F -->|t("navigation.dashboard")| G["Dashboard"]
```

## Future Roadmap

- **Phase 1**: ✅ **Completed** - Configuration-driven vertical-aware system
- **Phase 2**: Move fallback configuration to database as VerticalDefinition metadata
- **Phase 3**: Dynamic translation loading based on page metadata
- **Phase 4**: User-customizable translations per tenant
- **Phase 5**: AI-assisted translation generation for new verticals

---

**Last Updated**: January 3, 2025  
**Status**: ✅ **Active Standard** - Configuration-Driven, Vertical-Aware, Race-Condition Free
