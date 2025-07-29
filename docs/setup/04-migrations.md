# 🔄 Guide 4: Run Database Migrations

**SAP-Style Custom Migration System (Phase 2)**

---

## ⚠️ **Status: Phase 2 Implementation**

This guide will be available after **Phase 2: Custom Migration System** is implemented.

### **What This Guide Will Cover:**

- ✅ **Schema Extraction** - Current database schema analysis
- ✅ **Schema Comparison** - Target vs current schema differences
- ✅ **Migration Generation** - Automatic migration script creation
- ✅ **Master Database Migrations** - SAP customizing table updates
- ✅ **Tenant Database Migrations** - Business table schema changes
- ✅ **Parallel Execution** - Migrate all tenant databases simultaneously
- ✅ **Rollback Support** - Safe rollback mechanisms
- ✅ **Verification** - Post-migration validation

---

## 🚧 **Current Phase 1 Migration**

**For Phase 1, migrations are handled by the setup scripts:**

```bash
# Master database setup (includes initial schema)
.\scripts\migrations\setup-master-db.ps1

# Tenant database setup (includes initial schema)
createdb -U postgres metadata_tenant_demo_ecommerce
psql -U postgres -d metadata_tenant_demo_ecommerce -f sql/tenant/01-business-users.sql
```

---

## 🔮 **Phase 2 Preview**

### **Migration Commands (Coming Soon):**

```bash
# Check migration status
npm run db:status

# Run master database migrations
npm run db:master:migrate

# Run all tenant database migrations
npm run db:tenant:migrate-all

# Create new migration
npm run db:create-migration "add-user-preferences"

# Rollback last migration
npm run db:rollback --steps=1
```

### **Migration System Features:**

- **🔍 Schema Discovery** - Automatic database schema detection
- **📊 Diff Generation** - Compare target vs current schemas
- **🚀 Parallel Execution** - Migrate multiple tenant databases simultaneously
- **🔒 Safe Rollbacks** - Automatic backup and rollback capabilities
- **✅ Verification** - Post-migration validation and testing
- **📝 Audit Trail** - Complete migration history and logs

---

## 📋 **Prerequisites (Phase 2)**

- ✅ Phase 1 completed ([Guides 1-3](./README.md))
- ✅ Master and tenant databases created
- ✅ Multi-database manager implemented
- ✅ Custom migration system developed

---

## ➡️ **Current Next Steps**

**For Phase 1:**

1. **✅ COMPLETED:** Master Database Setup
2. **✅ COMPLETED:** Tenant Database Setup
3. **✅ COMPLETED:** First User Creation
4. **⏳ CURRENT:** Test Phase 1 thoroughly
5. **🔄 NEXT:** Proceed to Phase 2 when Phase 1 is stable

**For Phase 2 Planning:**

- Review `old_stuff/migrations/` approach
- Design multi-database migration orchestration
- Implement schema extraction and comparison
- Build migration generation system

---

## 📚 **Related Documentation**

- [Custom Migration System Design](../architecture/migration-system.md) _(Phase 2)_
- [Multi-Database Management](../architecture/multi-database.md)
- [SAP Transport System](../concepts/sap-transport.md) _(Phase 2)_

---

**🎯 This guide will be completed during Phase 2 implementation. Focus on completing and testing Phase 1 first.**
