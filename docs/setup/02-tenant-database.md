# 🏢 Guide 2: Create First Tenant Database

**SAP-Style Tenant Database Setup for Business Data**

---

## 📋 **Prerequisites**

- ✅ Master database setup completed ([Guide 1](./01-master-database.md))
- ✅ Multi-database manager available
- ✅ Understanding of tenant isolation principles

---

## **Step-by-Step Instructions**

### **Option A: Automated Script** _(Recommended)_

```bash
# Windows (PowerShell) - Default demo e-shop tenant
.\scripts\migrations\02-setup-tenant-db.ps1 -PostgresPassword "YOUR_PASSWORD"

# Linux/macOS (Bash) - Default demo e-shop tenant
./scripts/migrations/02-setup-tenant-db.sh --postgres-password "YOUR_PASSWORD"

# Windows - With custom parameters
.\scripts\migrations\02-setup-tenant-db.ps1 `
  -PostgresPassword "YOUR_PASSWORD" `
  -TenantName "My Custom Tenant" `
  -TenantSlug "my-custom-tenant" `
  -DatabaseName "metadata_tenant_my_custom_tenant" `
  -IndustryVertical "FINTECH"

# Linux/macOS - With custom parameters
./scripts/migrations/02-setup-tenant-db.sh \
  --postgres-password "YOUR_PASSWORD" \
  --tenant-name "My Custom Tenant" \
  --tenant-slug "my-custom-tenant" \
  --database-name "metadata_tenant_my_custom_tenant" \
  --industry-vertical "FINTECH"
```

### **Option B: Force Recreate** _(If tenant exists)_

```bash
# Windows - Recreate tenant database (drops existing)
.\scripts\migrations\02-setup-tenant-db.ps1 -PostgresPassword "YOUR_PASSWORD" -Force

# Linux/macOS - Recreate tenant database (drops existing)
./scripts/migrations/02-setup-tenant-db.sh --postgres-password "YOUR_PASSWORD" --force
```

### **Script Parameters:**

| Parameter   | Windows (PowerShell)       | Linux/macOS (Bash)           | Description                          | Default                                | Required       |
| ----------- | -------------------------- | ---------------------------- | ------------------------------------ | -------------------------------------- | -------------- |
| Password    | `-PostgresPassword "pass"` | `--postgres-password "pass"` | PostgreSQL password (avoids prompts) | ""                                     | ✅ Recommended |
| Tenant Name | `-TenantName "name"`       | `--tenant-name "name"`       | Display name for tenant              | "Demo E-shop CRM & ERP"                | ❌             |
| Tenant Slug | `-TenantSlug "slug"`       | `--tenant-slug "slug"`       | URL-safe tenant identifier           | "demo-eshop-crm"                       | ❌             |
| Database    | `-DatabaseName "name"`     | `--database-name "name"`     | Tenant database name                 | "metadata_tenant_demo_eshop_crm"       | ❌             |
| Industry    | `-IndustryVertical "type"` | `--industry-vertical "type"` | Industry type                        | "ECOMMERCE"                            | ❌             |
| User        | `-PostgresUser "user"`     | `--postgres-user "user"`     | PostgreSQL user                      | "postgres"                             | ❌             |
| Master DB   | `-MasterDatabase "name"`   | `--master-database "name"`   | Master database name                 | "metadata_platform_master_development" | ❌             |
| Force       | `-Force`                   | `--force`                    | Recreate if database exists          | false                                  | ❌             |

---

## **Expected Results**

### **✅ Tenant Database Created:**

- **Name**: `metadata_tenant_demo_eshop_crm`
- **Purpose**: Business data and tenant-specific authentication
- **Industry**: E-commerce vertical configuration
- **Registration**: Automatically registered in Master database

### **✅ Script Output Should Show:**

```
[OK] Tenant database created successfully
[OK] Tenant schema applied successfully
[OK] Tenant registered in Master database
[OK] Ready for first user creation!
```

---

## **Verification Tests**

The script automatically tests the setup, but you can verify manually:

### **Check Tenant Registration:**

```bash
# Windows (PowerShell) - Verify tenant is registered in master database
$env:PGPASSWORD="YOUR_PASSWORD"; psql -U postgres -d metadata_platform_master_development -c "
SELECT
    tenant_name,
    tenant_slug,
    database_name,
    industry_vertical,
    status
FROM tenant_registry
WHERE tenant_slug = 'demo-eshop-crm';"

# Linux/macOS (Bash) - Verify tenant is registered in master database
PGPASSWORD="YOUR_PASSWORD" psql -U postgres -d metadata_platform_master_development -c "
SELECT
    tenant_name,
    tenant_slug,
    database_name,
    industry_vertical,
    status
FROM tenant_registry
WHERE tenant_slug = 'demo-eshop-crm';"
```

### **Check Business Tables:**

```bash
# Windows (PowerShell) - Test basic connectivity and verify tables
$env:PGPASSWORD="YOUR_PASSWORD"; psql -U postgres -d metadata_tenant_demo_eshop_crm -c "SELECT COUNT(*) FROM users;"

# Linux/macOS (Bash) - Test basic connectivity and verify tables
PGPASSWORD="YOUR_PASSWORD" psql -U postgres -d metadata_tenant_demo_eshop_crm -c "SELECT COUNT(*) FROM users;"
```

**Expected Output**: Should connect without errors and return `0` (no users yet)

---

## 🚨 **Troubleshooting**

### **Database Creation Fails**

```bash
# Check available databases
psql -U postgres -l

# Check disk space
df -h

# Verify PostgreSQL permissions
psql -U postgres -c "SELECT current_user, session_user;"
```

### **Schema Application Fails**

```bash
# Check if schema file exists
ls -la sql/tenant/01-business-users.sql

# Apply schema with verbose output
psql -U postgres -d metadata_tenant_demo_ecommerce -f sql/tenant/01-business-users.sql -v ON_ERROR_STOP=1
```

### **Tenant Registration Fails**

```sql
-- Check if tenant already exists
SELECT * FROM tenant_registry WHERE tenant_slug = 'demo-ecommerce';

-- Check for UUID generation function
SELECT gen_random_uuid();
```

---

## 📊 **Database Schema Details**

### **Authentication & Security Tables**

- **users** - Business user accounts with compliance levels
- **auth_sessions** - Session management with risk scoring
- **auth_methods** - Multi-method authentication support

### **Configuration Tables**

- **tenant_auth_config** - Override global authentication settings
- **tenant_workflow_config** - Customize workflows per tenant

### **Compliance & Audit Tables**

- **audit_logs** - Tamper-proof audit trail
- **compliance_records** - KYC/AML document management

### **Business Data Tables (Examples)**

- **customers** - Customer relationship management
- **products** - Product catalog management
- **orders** - Order processing and tracking

---

## 🎯 **Industry-Specific Configuration**

### **E-commerce Defaults Applied:**

- **Multi-session support** - Up to 5 concurrent sessions
- **Guest checkout** - Optional user registration
- **Cart persistence** - 24-hour session timeout
- **Payment methods** - Multiple payment options supported
- **Order tracking** - Comprehensive order lifecycle

### **Security Configuration:**

- **2FA** - Optional but recommended
- **Password policy** - Moderate requirements
- **Session management** - Convenient but secure

---

## ➡️ **Next Steps**

After successful tenant database creation:

1. **✅ COMPLETED:** Master Database Setup
2. **✅ COMPLETED:** Tenant Database Setup
3. **🔄 NEXT:** [Create First User](./03-first-user.md)
4. **⏳ PENDING:** Run Database Migrations
5. **⏳ PENDING:** Install Industry Package
6. **⏳ PENDING:** Complete Development Setup

---

## 📚 **Related Documentation**

- [Multi-Tenant Architecture](../architecture/multi-tenant.md)
- [Business Data Models](../architecture/business-models.md)
- [Authentication System](../authentication/overview.md)
- [E-commerce Vertical](../verticals/ecommerce.md)

---

**🎯 Complete and test this step before proceeding to user creation.**
