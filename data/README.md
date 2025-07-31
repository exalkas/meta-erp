# 📊 Data Directory - SAP-Style Metadata Platform

This directory contains **JSON data files** that mirror the database structure and are used for:

- 🌱 **Database Seeding** - Initial data population
- 🧪 **Testing** - Consistent test data across environments
- 📦 **Backup/Export** - Human-readable data exports
- 🔄 **Migration** - Data transformation during updates

## 📁 **Directory Structure**

```
data/
├── README.md                    # This file
├── metadata/                    # Platform metadata tables
│   ├── pages/                  # PageDefinitions
│   ├── layouts/                # LayoutDefinitions
│   ├── themes/                 # Themes & ThemeProperties
│   ├── translations/           # Translation data
│   ├── entities/               # EntityDefinitions
│   ├── fields/                 # FieldDefinitions
│   └── components/             # ComponentDefinitions
├── platform/                   # Platform-specific data
│   ├── workflows/              # WorkflowDefinitions
│   ├── modules/                # ModuleManifests
│   └── marketplace/            # MarketplaceItems
├── auth/                       # SAP-style authentication data
│   ├── roles/                  # Role definitions
│   ├── permissions/            # Permission definitions
│   ├── users/                  # Initial user data
│   └── tenants/                # Tenant configurations
└── seed-scripts/               # Python scripts for database seeding
    ├── seed_all.py            # Master seeding script
    ├── seed_metadata.py       # Metadata seeding
    ├── seed_auth.py           # Auth data seeding
    └── seed_platform.py       # Platform data seeding
```

## 🎯 **Data Organization Principles**

- **SAP-Style Structure** - Each entity type in separate files
- **Environment Support** - Different data for dev/staging/prod
- **Tenant Isolation** - Separate data per tenant where applicable
- **Validation Ready** - JSON schemas for data validation
- **Seed Script Ready** - Structured for easy database population

## 🚀 **Usage**

```bash
# Seed all data
poetry run python data/seed-scripts/seed_all.py

# Seed specific data types
poetry run python data/seed-scripts/seed_metadata.py
poetry run python data/seed-scripts/seed_auth.py
```
