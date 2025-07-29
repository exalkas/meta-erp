# 🏗️ Guide 1: Create Master Database

**SAP-Style Master Database Setup for Metadata Platform**

---

## **Prerequisites**

- ✅ **PostgreSQL 17+** installed and running
- ✅ **Database admin access** (default user: `postgres`)
- ✅ **PowerShell 5.1+** (Windows) or **Bash** (Linux/macOS)
- ✅ **Project repository** cloned and available

---

## **Step-by-Step Instructions**

### **Option A: Automated Script** _(Recommended)_

```bash
# Windows (PowerShell)
.\scripts\migrations\01-setup-master-db.ps1 --postgres-password "YOUR_PASSWORD"

# Linux/macOS (Bash)
./scripts/migrations/01-setup-master-db.sh --postgres-password "YOUR_PASSWORD"
```

### **Option B: Force Recreate** _(If database exists)_

```bash
# Windows - Recreate master database (drops existing)
.\scripts\migrations\01-setup-master-db.ps1 --postgres-password "YOUR_PASSWORD" -Force

# Linux/macOS - Recreate master database (drops existing)
./scripts/migrations/01-setup-master-db.sh --postgres-password "YOUR_PASSWORD" --force
```

### **Script Parameters:**

| Parameter   | Windows (PowerShell)       | Linux/macOS (Bash)           | Description                          | Default                          | Required       |
| ----------- | -------------------------- | ---------------------------- | ------------------------------------ | -------------------------------- | -------------- |
| Password    | `-PostgresPassword "pass"` | `--postgres-password "pass"` | PostgreSQL password (avoids prompts) | ""                               | ✅ Recommended |
| Environment | `-Environment "dev"`       | `--environment "dev"`        | Environment name suffix              | "development"                    | ❌             |
| Database    | `-DatabaseName "name"`     | `--database-name "name"`     | Custom database name                 | `metadata_platform_master_{env}` | ❌             |
| User        | `-PostgresUser "user"`     | `--postgres-user "user"`     | PostgreSQL user                      | "postgres"                       | ❌             |
| Force       | `-Force`                   | `--force`                    | Recreate if database exists          | false                            | ❌             |

---

## **Expected Results**

### **✅ Master Database Created:**

- **Database Name**: `metadata_platform_master_development`
- **SAP Customizing Tables**: 11 tables created (`T_AUTH_*`)
- **Component Catalog**: Ready for platform components
- **Tenant Registry**: Ready for multi-tenant management

### **✅ Script Output Should Show:**

```
[OK] Master database created successfully
[OK] Master schema applied successfully
[OK] Ready for SAP-style multi-database platform!
```

---

## **Verification Tests**

The script automatically tests the setup, but you can verify manually:

### **Quick Connection Test:**

```bash
# Windows (PowerShell)
$env:PGPASSWORD="YOUR_PASSWORD"; psql -U postgres -d metadata_platform_master_development -c "SELECT COUNT(*) FROM T_AUTH_IMG_ACTIVITY;"

# Linux/macOS (Bash)
PGPASSWORD="YOUR_PASSWORD" psql -U postgres -d metadata_platform_master_development -c "SELECT COUNT(*) FROM T_AUTH_IMG_ACTIVITY;"
```

### **Check SAP Tables:**

```bash
# Windows (PowerShell)
$env:PGPASSWORD="YOUR_PASSWORD"; psql -U postgres -d metadata_platform_master_development -c "\dt T_AUTH_*"

# Linux/macOS (Bash)
PGPASSWORD="YOUR_PASSWORD" psql -U postgres -d metadata_platform_master_development -c "\dt T_AUTH_*"
```

**Expected Output**: Should show 11 SAP customizing tables

---

## 🚨 **Troubleshooting**

### **Database Already Exists Error**

```bash
# Use --force flag to recreate
.\scripts\migrations\setup-master-db.ps1 -Force
```

### **PostgreSQL Connection Issues**

```bash
# Check PostgreSQL is running
pg_ctl status

# Check connection
psql -U postgres -d postgres -c "SELECT version();"
```

### **Permission Issues**

```bash
# Ensure PostgreSQL user has createdb privileges
psql -U postgres -c "ALTER USER postgres CREATEDB;"
```

---

## 📊 **Database Schema Overview**

### **SAP Customizing Layer**

- **T_AUTH_IMG_ACTIVITY** - Hierarchical configuration menu (SAP IMG equivalent)
- **T_AUTH_CUSTOMIZING** - Generic key-value configuration storage
- **Industry-Specific Configs** - Session, method, rule, compliance configurations

### **Component Catalog Layer**

- **component_definitions** - UI component registry
- **module_manifests** - Component package definitions
- **vertical_packs** - Industry solution packages

### **Platform Management Layer**

- **tenant_registry** - Master list of all tenant databases
- **platform_users** - Platform admin accounts
- **Global reference data** - Countries, currencies, languages

---

## ➡️ **Next Steps**

After successful master database creation:

1. **✅ COMPLETED:** Master Database Setup
2. **🔄 NEXT:** [Create First Tenant Database](./02-tenant-database.md)
3. **⏳ PENDING:** Create First User
4. **⏳ PENDING:** Run Database Migrations
5. **⏳ PENDING:** Install Industry Package
6. **⏳ PENDING:** Complete Development Setup

---

## 📚 **Related Documentation**

- [SAP Customizing Concepts](../concepts/sap-customizing.md)
- [Multi-Database Architecture](../architecture/multi-database.md)
- [Component Catalog System](../architecture/component-catalog.md)
- [Industry Packages](../concepts/industry-packages.md)

---

**🎯 This guide follows the "one step at a time" development philosophy. Complete and test each step before proceeding.**
