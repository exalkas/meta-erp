# 👤 Guide 3: Create First User

**SAP-Style User Creation for Business Authentication**

---

## 📋 **Prerequisites**

- ✅ Master database created ([Guide 1](./01-master-database.md))
- ✅ Tenant database created ([Guide 2](./02-tenant-database.md))
- ✅ Understanding of multi-method authentication
- ⚠️ Authentication service implementation (will be ready in Phase 3)

---

## **Step-by-Step Instructions**

### **Option A: Create Admin User Only**

```bash
# Windows (PowerShell) - Admin user only
.\scripts\migrations\03-setup-first-user.ps1 -PostgresPassword "YOUR_PASSWORD"

# Linux/macOS (Bash) - Admin user only
./scripts/migrations/03-setup-first-user.sh --postgres-password "YOUR_PASSWORD"
```

### **Option B: Create Admin + Test Users** _(Recommended)_

```bash
# Windows - Create admin + manager + staff test users
.\scripts\migrations\03-setup-first-user.ps1 -PostgresPassword "YOUR_PASSWORD" -CreateTestUsers

# Linux/macOS - Create admin + manager + staff test users
./scripts/migrations/03-setup-first-user.sh --postgres-password "YOUR_PASSWORD" --create-test-users
```

### **Option C: Force Recreate Users** _(If users exist)_

```bash
# Windows - Recreate all users (deletes existing)
.\scripts\migrations\03-setup-first-user.ps1 -PostgresPassword "YOUR_PASSWORD" -CreateTestUsers -Force

# Linux/macOS - Recreate all users (deletes existing)
./scripts/migrations/03-setup-first-user.sh --postgres-password "YOUR_PASSWORD" --create-test-users --force
```

### **Script Parameters:**

| Parameter      | Windows (PowerShell)       | Linux/macOS (Bash)           | Description                          | Default                                | Required       |
| -------------- | -------------------------- | ---------------------------- | ------------------------------------ | -------------------------------------- | -------------- |
| Password       | `-PostgresPassword "pass"` | `--postgres-password "pass"` | PostgreSQL password (avoids prompts) | ""                                     | ✅ Recommended |
| Tenant Slug    | `-TenantSlug "slug"`       | `--tenant-slug "slug"`       | Tenant identifier                    | "demo-eshop-crm"                       | ❌             |
| Database       | `-DatabaseName "name"`     | `--database-name "name"`     | Tenant database name                 | "metadata_tenant_demo_eshop_crm"       | ❌             |
| Master DB      | `-MasterDatabase "name"`   | `--master-database "name"`   | Master database name                 | "metadata_platform_master_development" | ❌             |
| Admin Email    | `-AdminEmail "email"`      | `--admin-email "email"`      | Admin user email                     | "admin@demo-eshop-crm.local"           | ❌             |
| Admin Password | `-AdminPassword "pass"`    | `--admin-password "pass"`    | Admin user password                  | ""                            | ❌             |
| User           | `-PostgresUser "user"`     | `--postgres-user "user"`     | PostgreSQL user                      | "postgres"                             | ❌             |
| Test Users     | `-CreateTestUsers`         | `--create-test-users`        | Create additional test users         | false                                  | ❌             |
| Force          | `-Force`                   | `--force`                    | Recreate existing users              | false                                  | ❌             |

---

## **Expected Results**

### **✅ Admin User Created:**

- **Email**: `admin@demo-eshop-crm.local`
- **Password**: ``
- **Role**: `admin`
- **Status**: Active and verified

### **✅ With `-CreateTestUsers` Flag:**

- **Manager**: `manager@demo-eshop-crm.local` / ``
- **Staff**: `staff@demo-eshop-crm.local` / ``

### **✅ Script Output Should Show:**

```
[OK] Admin user created successfully
[OK] Password authentication method created
[OK] Test users created successfully (if -CreateTestUsers used)
[OK] Ready for authentication service!
```

---

## **Verification Tests**

The script automatically tests the setup, but you can verify manually:

### **Check Users Created:**

```bash
# Windows (PowerShell) - Verify users and authentication methods
$env:PGPASSWORD="YOUR_PASSWORD"; psql -U postgres -d metadata_tenant_demo_eshop_crm -c "
SELECT
    u.email,
    u.role,
    u.is_active,
    COUNT(am.method_id) as auth_methods
FROM users u
LEFT JOIN auth_methods am ON u.user_id = am.user_id
GROUP BY u.user_id, u.email, u.role, u.is_active
ORDER BY u.role;"

# Linux/macOS (Bash) - Verify users and authentication methods
PGPASSWORD="YOUR_PASSWORD" psql -U postgres -d metadata_tenant_demo_eshop_crm -c "
SELECT
    u.email,
    u.role,
    u.is_active,
    COUNT(am.method_id) as auth_methods
FROM users u
LEFT JOIN auth_methods am ON u.user_id = am.user_id
GROUP BY u.user_id, u.email, u.role, u.is_active
ORDER BY u.role;"
```

**Expected Output**: Should show users with their authentication methods (1 method per user)

---

## 🚨 **Troubleshooting**

### **User Creation Fails**

```sql
-- Check if tenant exists
SELECT tenant_id, tenant_name FROM tenant_registry WHERE tenant_slug = 'demo-ecommerce';

-- Check if user already exists
SELECT email FROM users WHERE email = 'admin@demo-ecommerce.local';

-- Verify foreign key constraints
\d+ users
```

### **Authentication Method Creation Fails**

```sql
-- Check if user was created successfully
SELECT user_id, email FROM users WHERE email = 'admin@demo-ecommerce.local';

-- Verify auth_methods table structure
\d+ auth_methods

-- Check for existing authentication methods
SELECT * FROM auth_methods WHERE user_id = (SELECT user_id FROM users WHERE email = 'admin@demo-ecommerce.local');
```

### **JSON Credentials Issues**

```sql
-- Test JSON validity
SELECT
    '{"password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8J.0tnvjE/LbJnLbJnL"}'::jsonb;

-- Check JSON column data type
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'auth_methods' AND column_name = 'credentials_json';
```

---

## 🔐 **Security Considerations**

### **Password Security:**

- ✅ **bcrypt hashing** with cost factor 12
- ✅ **Salt included** in hash automatically
- ✅ **No plaintext storage** of passwords
- ✅ **Strong password** policy for admin accounts

### **User Roles:**

- **admin** - Full system access, enhanced compliance required
- **manager** - Department access, basic compliance
- **staff** - Limited access, basic compliance

### **Compliance Levels:**

- **ENHANCED** - Full KYC/AML verification required (admin users)
- **BASIC** - Standard verification (regular users)
- **PREMIUM** - Advanced compliance for high-risk operations

---

## **Test Accounts**

| Email                          | Password    | Role    | Purpose               |
| ------------------------------ | ----------- | ------- | --------------------- |
| `admin@demo-eshop-crm.local`   | `` | admin   | System administration |
| `manager@demo-eshop-crm.local` | `` | manager | Store management      |
| `staff@demo-eshop-crm.local`   | `` | staff   | Daily operations      |

> **Security Note**: Change default passwords in production! These are only for development testing.

---

## 🧪 **Test Login (When Auth Service Ready)**

```bash
# Test admin login (Phase 3)
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo-ecommerce.local",
    "password": ""
  }'

# Expected response (when auth service is implemented):
# {
#   "access_token": "",
#   "refresh_token": "",
#   "user": {
#     "user_id": "...",
#     "email": "admin@demo-ecommerce.local",
#     "role": "admin",
#     "tenant_id": "..."
#   }
# }
```

---

## ➡️ **Next Steps**

After successful user creation:

1. **✅ COMPLETED:** Master Database Setup
2. **✅ COMPLETED:** Tenant Database Setup
3. **✅ COMPLETED:** First User Creation
4. **🔄 NEXT:** [Run Database Migrations](./04-migrations.md)
5. **⏳ PENDING:** Install Industry Package
6. **⏳ PENDING:** Complete Development Setup

---

## 📚 **Related Documentation**

- [Authentication System Overview](../authentication/overview.md)
- [User Roles and Permissions](../authentication/roles.md)
- [Multi-Method Authentication](../authentication/methods.md)
- [Compliance and KYC](../compliance/overview.md)

---

**🎯 Users are ready for authentication once the auth service is implemented in Phase 3.**
