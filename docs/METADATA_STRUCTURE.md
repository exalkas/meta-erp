# Metadata Structure - App-Based Organization

## Overview

The metadata structure has been reorganized from a flat structure to an app-based hierarchy for better scalability and maintainability.

## Directory Structure

```
data/metadata/
├── apps/                          # App-based metadata organization
│   ├── admin/                     # Admin platform app
│   │   ├── pages/                 # Admin-specific pages
│   │   │   ├── admin-dashboard-page.json
│   │   │   ├── admin-login-page.json
│   │   │   ├── app-builder-main-page.json
│   │   │   └── app-builder-requirements-page.json
│   │   ├── layouts/               # Admin-specific layouts
│   │   │   ├── dashboard-layout.json
│   │   │   └── centered-auth-layout.json
│   │   ├── translations/          # Admin-specific translations
│   │   │   ├── en-translations.json
│   │   │   └── el-translations.json
│   │   ├── themes/                # Admin-specific themes
│   │   │   ├── default-base-theme.json
│   │   │   └── professional-base-theme.json
│   │   ├── business-rules/        # Admin business rules
│   │   └── workflows/             # Admin workflows
│   ├── client/                    # Client business app
│   │   ├── pages/                 # Client-specific pages
│   │   │   ├── dashboard-page.json
│   │   │   ├── login-page.json
│   │   │   ├── roles-catalog-page.json
│   │   │   ├── roles-management-page.json
│   │   │   └── roles-onboarding-page.json
│   │   ├── layouts/               # Client-specific layouts
│   │   ├── translations/          # Client-specific translations
│   │   ├── themes/                # Client-specific themes
│   │   └── workflows/             # Client workflows
│   └── marketing/                 # Marketing website app (future)
│       ├── pages/                 # Landing pages, marketing flows
│       ├── layouts/               # Marketing layouts
│       └── translations/          # Marketing copy
└── verticals/                     # Industry-specific metadata (unchanged)
    ├── legal/
    │   ├── entities/
    │   ├── layouts/
    │   ├── pages/
    │   ├── business-rules/
    │   ├── workflows/
    │   └── translations/
    └── automotive/                # Future verticals
        └── [similar structure]
```

## Old vs New Structure

### Before (Flat Structure)

```
data/metadata/
├── pages/           # Mixed: admin + client pages
├── layouts/         # Mixed: admin + client layouts
├── translations/    # Mixed: admin + client translations
├── themes/          # Mixed: admin + client themes
└── verticals/       # Industry-specific (good)
```

### After (App-Based Structure)

```
data/metadata/
├── apps/
│   ├── admin/       # Complete admin app metadata
│   ├── client/      # Complete client app metadata
│   └── marketing/   # Future: marketing website
└── verticals/       # Industry-specific (unchanged)
```

## Benefits

1. **✅ Clear Separation**: Each app owns its metadata
2. **✅ Scalable**: Easy to add new apps without conflicts
3. **✅ Team-Friendly**: Different teams can work on different apps
4. **✅ Modular**: Apps can be deployed independently
5. **✅ Consistent**: Same structure as `verticals/`
6. **✅ Maintainable**: Reduces cross-app dependencies

## File Ownership

### Admin App (`apps/admin/`)

- **Purpose**: Platform administration, app building, system management
- **Users**: Platform administrators, app builders
- **Pages**: Admin dashboard, login, app-builder, platform management
- **Translations**: Platform terminology, admin-specific UI text

### Client App (`apps/client/`)

- **Purpose**: End-user business application
- **Users**: Business users, role managers, end customers
- **Pages**: Client dashboard, login, role management, business workflows
- **Translations**: Business terminology, user-facing text

### Verticals (`verticals/`)

- **Purpose**: Industry-specific functionality and data models
- **Users**: Industry specialists, vertical app builders
- **Examples**: Legal, automotive, healthcare, etc.
- **Translations**: Industry-specific terminology

## Migration Process

### What Changed

1. **File Locations**: Pages, layouts, translations, themes moved to app directories
2. **Seed Script**: Updated `seed_all.py` to read from new locations
3. **Structure**: Apps now mirror the vertical structure

### What Stayed The Same

1. **File Formats**: All JSON files unchanged
2. **Database Schema**: No database changes required
3. **API**: No API changes - reads from database
4. **Verticals**: Industry-specific structure unchanged

## Translation Standard Integration

The new structure works with our [translation standard](./TRANSLATION_STANDARD.md):

- **Admin translations**: Contains app-builder keys and platform terminology
- **Client translations**: Contains business app terminology
- **Vertical translations**: Contains industry-specific terms

## Seeding Changes

Updated `data/seed-scripts/seed_all.py` to load from new paths:

```python
# Before
"metadata/pages/admin-dashboard-page.json"

# After
"metadata/apps/admin/pages/admin-dashboard-page.json"
```

## Future Expansion

Easy to add new apps:

```bash
mkdir -p data/metadata/apps/marketing/{pages,layouts,translations,themes,workflows}
mkdir -p data/metadata/apps/mobile/{pages,layouts,translations,themes,workflows}
mkdir -p data/metadata/apps/api-gateway/{pages,layouts,translations,themes,workflows}
```

---

**Created**: January 31, 2025  
**Status**: ✅ Active Structure  
**Next Steps**: Add client-specific translations, expand vertical integration
