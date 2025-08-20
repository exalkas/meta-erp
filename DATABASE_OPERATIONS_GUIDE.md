# 🗄️ DATABASE OPERATIONS GUIDE

## Complete Guide for Setting Up and Managing the ERP Platform Database

This guide provides **step-by-step instructions** for database operations on any machine (laptop/desktop).

---

## **📋 PREREQUISITES**

### **Required Software**

- ✅ **PostgreSQL 16+** installed and running
- ✅ **Python 3.11+** with Poetry
- ✅ **Git** for repository access
- ✅ **PowerShell** (Windows) or **Bash** (Linux/macOS)

### **Environment Setup**

1. **Clone Repository**:

   ```powershell
   git clone <repository-url>
   cd meta-erp
   ```

2. **Install Dependencies**:

   ```powershell
   # Install backend dependencies
   cd services/api
   poetry install

   # Install frontend dependencies
   cd ../../
   npm install
   ```

---

## **🔧 1. DATABASE INITIALIZATION**

### **Step 1.1: Create Database**

```powershell
# Connect to PostgreSQL as superuser
psql -U postgres

# Create the database
CREATE DATABASE metadata_erp;
CREATE USER erp_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE metadata_erp TO erp_user;
\q
```

### **Step 1.2: Configure Environment**

Create `services/api/.env` file:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/metadata_erp
CREATE_TABLES_ON_STARTUP=false

# JWT & Security Settings
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30
SECRET_KEY=your-secret-key-here

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001","http://localhost:8001"]

# Other settings...
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO
```

---

## **🌱 2. DATABASE SEEDING (COMPLETE SETUP)**

### **Step 2.1: Reset and Rebuild Database**

```powershell
# Navigate to API directory
cd services/api

# Run database reset (if needed)
poetry run python reset_and_rebuild_db.py
```

### **Step 2.2: Seed All Data**

```powershell
# Run complete seeding script
cd services/api
poetry run python ../../data/seed-scripts/seed_all.py
```

**This will populate:**

- ✅ **1 Demo Tenant** (ID: `89f84fea-b5b9-413c-945b-002c7fd9555d`)
- ✅ **6 Demo Users** (admin, bizadmin, operations, commercial, finance, user)
- ✅ **Roles & Permissions** (admin, manager, staff, etc.)
- ✅ **2 Layouts** (auth + dashboard)
- ✅ **2 Base Themes** (default + maritime with variants)
- ✅ **64 Translations** (English + Greek)
- ✅ **9 Pages** (including 4 admin pages)
- ✅ **SAP-style Business Configuration** (12 config domains)
- ✅ **Business Rules & Field Localization**

---

## **🔑 3. LOGIN CREDENTIALS**

### **Admin User (Full Access)**

- **Email**: `admin@demo-eshop-crm.local`
- **Username**: `admin`
- **Password**: ``

### **Other Demo Users**

All have password: ``

- `bizadmin@demo-eshop-crm.local` (Business Admin)
- `operations@demo-eshop-crm.local` (Operations)
- `commercial@demo-eshop-crm.local` (Commercial)
- `finance@demo-eshop-crm.local` (Finance)
- `user@demo-eshop-crm.local` (Basic User)

---

## **🚀 4. START SERVICES**

### **Step 4.1: Start API Service**

```powershell
cd services/api
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **Step 4.2: Start Admin App**

```powershell
cd apps/admin
npm run dev
# Runs on http://localhost:3001
```

### **Step 4.3: Start Client App (Optional)**

```powershell
cd apps/client
npm run dev
# Runs on http://localhost:3000
```

---

## **🔍 5. VERIFICATION & TESTING**

### **Step 5.1: Check Database State**

```powershell
cd services/api
poetry run python check_database_state.py
```

### **Step 5.2: Check Admin Pages**

```powershell
cd services/api
poetry run python check_admin_pages.py
```

### **Step 5.3: Test API Endpoints**

```powershell
# Test tenant info
curl http://localhost:8000/metadata/pages/login?tenant_id=89f84fea-b5b9-413c-945b-002c7fd9555d

# Test admin login page
curl http://localhost:8000/metadata/pages/admin-login?tenant_id=89f84fea-b5b9-413c-945b-002c7fd9555d
```

### **Step 5.4: Test Login**

Navigate to: `http://localhost:3001/login`

- Email: `admin@demo-eshop-crm.local`
- Password: ``

---

## **🛠️ 6. TROUBLESHOOTING**

### **Problem: Empty Database**

```powershell
# Reset and rebuild database
cd services/api
poetry run python reset_and_rebuild_db.py

# Re-seed data
poetry run python ../../data/seed-scripts/seed_all.py
```

### **Problem: Index Conflicts**

This has been fixed in the latest version. If you encounter it:

```powershell
cd services/api
poetry run python nuclear_db_reset.py
poetry run python reset_and_rebuild_db.py
```

### **Problem: Missing Pages**

```powershell
# Check if pages exist
cd services/api
poetry run python check_admin_pages.py

# If missing, re-seed pages only
cd ../../
python data/seed-scripts/seed_all.py
```

### **Problem: Permission Errors**

- Ensure PostgreSQL user has proper permissions
- Check `.env` file DATABASE_URL
- Verify PostgreSQL service is running

### **Problem: CORS Errors**

- Check `CORS_ORIGINS` in `.env` includes your port
- Restart API service after changes

---

## **📁 7. KEY FILES & DIRECTORIES**

### **Critical Database Files**

```
data/
├── seed-scripts/
│   └── seed_all.py                 # ⭐ MAIN SEEDING SCRIPT
├── auth/
│   ├── users/demo-users.json       # User credentials
│   ├── roles/system-roles.json     # User roles
│   └── tenants/demo-tenants.json   # Demo tenant
├── metadata/
│   ├── pages/                      # Page definitions (UI)
│   │   ├── admin-login-page.json   # Admin login
│   │   ├── admin-dashboard-page.json
│   │   ├── app-builder-main-page.json
│   │   └── app-builder-requirements-page.json
│   ├── layouts/                    # Layout definitions
│   ├── translations/               # i18n translations
│   └── themes/                     # Theme definitions
└── business-config/                # SAP-style configuration
```

### **Critical API Files**

```
services/api/
├── .env                           # ⭐ ENVIRONMENT CONFIG
├── reset_and_rebuild_db.py        # Database reset utility
├── check_database_state.py        # Database verification
├── check_admin_pages.py          # Admin pages verification
└── app/
    ├── models/                    # Database models
    └── core/
        └── database.py            # Database connection
```

---

## **🎯 8. QUICK SETUP SUMMARY**

For **new machine setup**, run these commands in order:

```powershell
# 1. Setup repository
git clone <repo-url>
cd meta-erp
npm install

# 2. Setup API
cd services/api
poetry install
# Create .env file (see Step 1.2)

# 3. Reset database (if needed)
poetry run python reset_and_rebuild_db.py

# 4. Seed database
poetry run python ../../data/seed-scripts/seed_all.py

# 5. Verify setup
poetry run python check_database_state.py
poetry run python check_admin_pages.py

# 6. Start services
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
cd ../../apps/admin
npm run dev
```

**Login at**: `http://localhost:3001/login`  
**Credentials**: `admin@demo-eshop-crm.local` / ``

---

## **✅ SUCCESS INDICATORS**

You know everything is working when:

1. ✅ **Database**: `check_database_state.py` shows 49 tables
2. ✅ **Pages**: `check_admin_pages.py` shows 2 admin pages + 2 app builder pages
3. ✅ **API**: `http://localhost:8000/docs` loads (FastAPI docs)
4. ✅ **Admin**: `http://localhost:3001/login` loads admin login page
5. ✅ **Login**: Can login with admin credentials and reach dashboard

**🎉 Platform Ready for Application Builder Development!**
