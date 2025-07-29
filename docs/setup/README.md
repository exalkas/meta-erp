# 📖 SAP-Style Platform Setup Guides

**Complete step-by-step guides for setting up the metadata-driven platform**

---

## 🎯 **Setup Philosophy**

These guides follow the **"one step at a time"** development approach:

1. ✅ **Complete** each step fully
2. ✅ **Test** thoroughly before proceeding
3. ✅ **Validate** integration with existing systems
4. ✅ **Document** any issues encountered
5. ✅ **Proceed** only when current step is stable

---

## 📋 **Setup Guide Index**

### **Phase 1: Database Foundation (✅ COMPLETE)**

| Guide                                  | Title                               | Status      | Time   | Description                                                |
| -------------------------------------- | ----------------------------------- | ----------- | ------ | ---------------------------------------------------------- |
| **[Guide 1](./01-master-database.md)** | 🏗️ **Create Master Database**       | ✅ Complete | 10 min | SAP customizing tables, component catalog, tenant registry |
| **[Guide 2](./02-tenant-database.md)** | 🏢 **Create First Tenant Database** | ✅ Complete | 5 min  | Business data tables, authentication, compliance           |
| **[Guide 3](./03-first-user.md)**      | 👤 **Create First User**            | ✅ Complete | 5 min  | Admin, manager, staff accounts with authentication         |

**🎉 Result:** Auth service running on http://localhost:8001 with Master + Tenant DB architecture

### **Phase 2A: Auth Service (✅ COMPLETE)**

| Service                    | Title                         | Status     | Port | Description                             |
| -------------------------- | ----------------------------- | ---------- | ---- | --------------------------------------- |
| **Authentication Service** | 🔐 **SAP-Style Auth Service** | ✅ Running | 8001 | FastAPI service with structured logging |

**🎯 Current Status:** Service operational, ready for auth endpoint implementation

### **Phase 2B: Authentication Endpoints (🔄 IN PROGRESS)**

| Implementation        | Title                            | Status     | Time   | Description                              |
| --------------------- | -------------------------------- | ---------- | ------ | ---------------------------------------- |
| **Auth Router**       | 🔑 **Login/Register/Logout**     | 🔄 Next    | 30 min | Connect routes to SAP customizing engine |
| **Demo User Testing** | 🧪 **Test Auth with Demo Users** | ⏳ Pending | 15 min | Validate authentication flow             |

### **Phase 2C: Migration System**

| Guide                                    | Title                           | Status     | Time   | Description                                |
| ---------------------------------------- | ------------------------------- | ---------- | ------ | ------------------------------------------ |
| **[Guide 4](./04-migrations.md)**        | 🔄 **Run Database Migrations**  | 🔄 Phase 2 | 15 min | Custom migration system, schema management |
| **[Guide 5](./05-industry-packages.md)** | 📦 **Install Industry Package** | 🔄 Phase 2 | 10 min | FinTech, E-commerce, Oil & Gas packages    |

### **Phase 3: Complete Setup**

| Guide                                    | Title                             | Status     | Time   | Description                         |
| ---------------------------------------- | --------------------------------- | ---------- | ------ | ----------------------------------- |
| **[Guide 6](./06-development-setup.md)** | 🚀 **Complete Development Setup** | ⏳ Phase 3 | 20 min | Full environment, services, testing |

---

## 🚀 **Quick Start**

### **For Phase 2B (Current): Authentication Endpoints**

**✅ Prerequisites Complete:**

- Master database operational: `metadata_platform_master_development`
- Tenant database operational: `metadata_tenant_demo_eshop_crm`
- Auth service running: http://localhost:8001
- Demo users created: admin@demo-eshop-crm.com, manager@demo-eshop-crm.com, staff@demo-eshop-crm.com

**🔄 Next Steps:**

1. Implement auth router with /login, /register, /logout endpoints
2. Connect routes to SAP-style customizing engine
3. Test authentication with demo users
4. Prepare for frontend integration (Phase 3)

### **For New Setup (Phase 1 Complete):**

```bash
# Windows (PowerShell) - Replace "YOUR_PASSWORD" with your PostgreSQL password

# 1. Create Master Database (10 min)
.\scripts\migrations\01-setup-master-db.ps1 -PostgresPassword "YOUR_PASSWORD"

# 2. Create Tenant Database (5 min)
.\scripts\migrations\02-setup-tenant-db.ps1 -PostgresPassword "YOUR_PASSWORD"

# 3. Create First User (5 min)
.\scripts\migrations\03-setup-first-user.ps1 -PostgresPassword "YOUR_PASSWORD" -CreateTestUsers

# Total: ~20 minutes for complete Phase 1 setup
```

```bash
# Linux/macOS (Bash) - Replace "YOUR_PASSWORD" with your PostgreSQL password

# 1. Create Master Database (10 min)
./scripts/migrations/01-setup-master-db.sh --postgres-password "YOUR_PASSWORD"

# 2. Create Tenant Database (5 min)
./scripts/migrations/02-setup-tenant-db.sh --postgres-password "YOUR_PASSWORD"

# 3. Create First User (5 min)
./scripts/migrations/03-setup-first-user.sh --postgres-password "YOUR_PASSWORD" --create-test-users

# Total: ~20 minutes for complete Phase 1 setup
```

### **For New Team Members:**

```bash
# Windows (PowerShell) - Option A: Step-by-Step (Recommended)
.\scripts\migrations\01-setup-master-db.ps1 -PostgresPassword "YOUR_PASSWORD"
.\scripts\migrations\02-setup-tenant-db.ps1 -PostgresPassword "YOUR_PASSWORD"
.\scripts\migrations\03-setup-first-user.ps1 -PostgresPassword "YOUR_PASSWORD" -CreateTestUsers

# Windows (PowerShell) - Option B: Force Recreate (if databases exist)
.\scripts\migrations\01-setup-master-db.ps1 -PostgresPassword "YOUR_PASSWORD" -Force
.\scripts\migrations\02-setup-tenant-db.ps1 -PostgresPassword "YOUR_PASSWORD" -Force
.\scripts\migrations\03-setup-first-user.ps1 -PostgresPassword "YOUR_PASSWORD" -CreateTestUsers -Force
```

```bash
# Linux/macOS (Bash) - Option A: Step-by-Step (Recommended)
./scripts/migrations/01-setup-master-db.sh --postgres-password "YOUR_PASSWORD"
./scripts/migrations/02-setup-tenant-db.sh --postgres-password "YOUR_PASSWORD"
./scripts/migrations/03-setup-first-user.sh --postgres-password "YOUR_PASSWORD" --create-test-users

# Linux/macOS (Bash) - Option B: Force Recreate (if databases exist)
./scripts/migrations/01-setup-master-db.sh --postgres-password "YOUR_PASSWORD" --force
./scripts/migrations/02-setup-tenant-db.sh --postgres-password "YOUR_PASSWORD" --force
./scripts/migrations/03-setup-first-user.sh --postgres-password "YOUR_PASSWORD" --create-test-users --force
```

---

## 🧪 **Testing After Each Guide**

### **After Guide 1 - Master Database:**

```sql
-- Should show ~11 SAP customizing tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'T_AUTH_%';
```

### **After Guide 2 - Tenant Database:**

```sql
-- Should show business tables
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('users', 'auth_sessions', 'customers', 'products');
```

### **After Guide 3 - First User:**

```sql
-- Should show created users
SELECT email, role FROM users ORDER BY role;
```

---

## 📊 **Platform Architecture Overview**

### **Master Database (`metadata_platform_master_development`)**

- **SAP Customizing Tables (T*AUTH*\*)** - All authentication business logic
- **Component Catalog** - UI component definitions and manifests
- **Tenant Registry** - Central tracking of all tenant databases
- **Global Reference Data** - Countries, currencies, languages
- **Industry Packages** - Vertical solution templates

### **Tenant Database (`metadata_tenant_demo_eshop_crm`)**

- **Business Users** - Customer accounts and authentication
- **Business Data** - Customers, products, orders, etc.
- **Tenant Overrides** - Tenant-specific customizing
- **Audit & Compliance** - Complete audit trail and KYC records

### **Running Services (✅ Operational)**

- **Authentication Service** - http://localhost:8001
  - FastAPI with async SQLAlchemy 2.0
  - Master + Tenant database connectivity
  - Structured JSON logging with request tracking
  - Health monitoring and database status reporting

---

## **Prerequisites**

**Required Software:**

- **Node.js 20+** with npm
- **Python 3.11+** with Poetry
- **PostgreSQL 17+** (local development database)
- **Git** for version control

**Development Tools:**

- **PowerShell 5.1+** (Windows) or **Bash** (Linux/macOS)
- **VS Code** (recommended with recommended extensions)
- **pgAdmin** or **DBeaver** (optional database GUI)

---

## 🚨 **Common Issues & Solutions**

### **PostgreSQL Connection Issues**

```bash
# Check if PostgreSQL is running
pg_ctl status

# Start PostgreSQL if needed
pg_ctl start

# Test connection
psql -U postgres -c "SELECT version();"
```

### **Permission Issues**

```bash
# Grant createdb privilege
psql -U postgres -c "ALTER USER postgres CREATEDB;"

# Check current user privileges
psql -U postgres -c "\du"
```

### **Database Already Exists**

```bash
# Drop and recreate (use with caution!)
.\scripts\migrations\setup-master-db.ps1 -Force
```

---

## 📚 **Related Documentation**

### **Architecture Documentation:**

- [Multi-Database Architecture](../architecture/multi-database.md)
- [SAP Customizing System](../concepts/sap-customizing.md)
- [Component Catalog](../architecture/component-catalog.md)

### **Development Documentation:**

- [PROJECT_RULES.md](../../PROJECT_RULES.md) - Development rules and philosophy
- [CHANGELOG.md](../../CHANGELOG.md) - Project evolution and decisions

### **Phase Documentation:**

- [Phase 1: Multi-Database Foundation](../phases/phase-1.md)
- [Phase 2: Custom Migration System](../phases/phase-2.md)
- [Phase 3: SAP Auth Engine](../phases/phase-3.md)

---

## 🎯 **Success Criteria**

### **Phase 1 Complete When:**

- ✅ Master database with SAP customizing tables
- ✅ Tenant database with business tables
- ✅ First users created with authentication
- ✅ All verification tests pass
- ✅ Database connections working

### **Ready for Phase 2 When:**

- ✅ Phase 1 completely tested and stable
- ✅ No database connection issues
- ✅ All guides completed successfully
- ✅ Team understands multi-database architecture

---

## ➡️ **What's Next?**

After completing **Phase 1** with these guides:

1. **🔄 Phase 2:** Custom Migration System Implementation
2. **⚡ Phase 3:** SAP Authentication Engine Development
3. **🌐 Phase 4:** Frontend Integration with Real APIs
4. **🚀 Phase 5:** Complete Platform Testing

---

**🎯 Follow these guides in order, test each step thoroughly, and only proceed when everything is working correctly.**
