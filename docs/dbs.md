## 🏗️ Master Database (metadata_platform_master_development)

What belongs here:\* Global Components & Layouts - Reusable across all tenants

- Base Themes - Default themes available to all tenants
- System Roles & Permissions - Platform-wide security model
- Global Translations - Base language support
- Component Catalog - Shared component registry
- System Configuration - Platform settings

Why: These are platform assets that multiple tenants share to avoid duplication and ensure consistency.

## 🏢 Tenant Database (metadata_tenant_demo_eshop_crm)

What belongs here:\* Page Definitions - Tenant-specific pages and navigation

- Tenant Users - User accounts for this specific tenant
- Business Data - Customer records, orders, etc.
- Tenant Customizations - Custom themes, layouts, overrides
- Tenant-specific Workflows - Business process definitions

Why: These are tenant-specific assets that should be isolated for security, customization, and data privacy.

### 🏗️ **Architecture Clarification**

You were **absolutely correct** - the page definitions belong in the **tenant database**! Here's the proper data distribution:

**Master Database** (`metadata_platform_master_development`):

```
✅ Global components, layouts, themes
✅ System roles & permissions
✅ Base translations
✅ Platform configuration
```

**Tenant Database** (`metadata_tenant_demo_eshop_crm`):

```
✅ Page definitions (like dashboard)
✅ Tenant users & business data
✅ Tenant-specific customizations
✅ Navigation structures
```
