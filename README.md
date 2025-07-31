# 🚢 **Axiologic Platform - SAP-Style Metadata-Driven System**

A **production-ready**, **metadata-driven** business platform with **SAP-style architecture**, **multi-tenant support**, and **complete authentication system**.

## 🎯 **Core Features**

- 🔐 **SAP-Style Authentication** - Complete JWT-based auth with roles, permissions, and 2FA
- 📊 **Metadata-Driven UI** - Pages, layouts, themes, and components from database
- 🏢 **Multi-Tenant Architecture** - Complete tenant isolation with per-tenant databases
- 🚢 **Maritime Business Logic** - Vessel management, voyage planning, port operations
- 🌐 **Internationalization** - English/Greek support with database translations
- 🎨 **Dynamic Theming** - Real-time theme switching with CSS custom properties
- 🛡️ **Enterprise Security** - Role-based access control with SAP authorization patterns
- 📱 **Mobile-Ready** - Responsive design with mobile-first approach

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Auth Service  │    │   API Service   │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (FastAPI)     │
│   Port: 3000    │    │   Port: 8001    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    │   Port: 5432    │
                    └─────────────────┘
```

## 🚀 **Quick Start**

### **1. Prerequisites**

- **PostgreSQL 16+** running on localhost:5432
- **Python 3.11+** with Poetry
- **Node.js 18+** with npm
- **PowerShell** (Windows) or Bash (Linux/Mac)

### **2. Start Services**

```powershell
# 1. Start Auth Service (Port 8001)
cd services/auth
poetry install
poetry run python -m uvicorn main:app --reload --port 8001

# 2. Start API Service with seeded data (Port 8000)
./scripts/start-api-server.ps1 -SeedData

# 3. Start Frontend (Port 3000)
cd apps/client
npm install
npm run dev
```

### **3. Test Complete Setup**

```powershell
# Test all services and endpoints
./scripts/test-complete-setup.ps1
```

### **4. Access the Platform**

- 🌐 **Frontend**: http://localhost:3000
- 🔐 **Auth API**: http://localhost:8001/docs
- 📊 **Metadata API**: http://localhost:8000/docs

**Default Login:**

- Email: `admin@demo-eshop-crm.local`
- Password: ``

## 📁 **Project Structure**

```
metadata-erp/
├── 📱 apps/                     # Frontend applications
│   ├── client/                  # Main business app (Next.js)
│   ├── admin/                   # Admin dashboard
│   └── marketing/               # Marketing website
├── 🔧 services/                 # Backend services
│   ├── auth/                    # Authentication service (FastAPI)
│   └── api/                     # Main API service (FastAPI)
├── 📦 packages/                 # Shared packages
│   └── shared/                  # Shared UI components & utilities
├── 📊 data/                     # JSON data & seed scripts
│   ├── metadata/                # Pages, layouts, themes, translations
│   ├── auth/                    # Roles, permissions, users, tenants
│   └── seed-scripts/            # Database seeding scripts
├── 📚 docs/                     # Documentation
├── 🛠️ scripts/                  # Setup and utility scripts
└── 🗄️ old_stuff/               # Legacy code (to be removed)
```

## 🔐 **Authentication System**

### **SAP-Style Role Hierarchy**

```
┌─ SAP_SYSTEM_ADMIN (Level 1)
│  └─ SAP_TENANT_ADMIN (Level 2)
│     └─ SAP_BUSINESS_ADMIN (Level 3)
│        └─ SAP_POWER_USER (Level 4)
│           └─ SAP_END_USER (Level 5)
│              └─ SAP_READ_ONLY (Level 6)
```

### **Maritime Business Roles**

- 🚢 **Maritime Operations Manager** - Fleet and voyage management
- 🏝️ **Port Agent** - Port operations and customs clearance
- 💼 **Commercial Manager** - Customer relationships and contracts
- 💰 **Finance Controller** - Financial oversight and approvals
- 📋 **Compliance Officer** - Regulatory compliance and certifications

### **Permission System**

SAP-style authorization objects with activity codes:

- `S_TCODE_*` - Transaction code access
- `Z_MARITIME_VESSEL_*` - Vessel management permissions
- `Z_CUSTOMER_*` - Customer data permissions
- `Z_FINANCE_APPROVE` - Financial approval permissions

## 📊 **Metadata System**

### **Dynamic Page Rendering**

Pages are defined in the database with:

- **PageDefinitions** - Page structure and configuration
- **LayoutDefinitions** - Reusable layout templates
- **ComponentDefinitions** - UI component catalog
- **Themes** - Visual styling and branding
- **Translations** - Multi-language support

### **Example Page Definition**

```json
{
  "page_id": "dashboard-page-001",
  "page_name": "dashboard",
  "route": "/dashboard",
  "layout_id": "dashboard-layout",
  "sections_data_json": {
    "header": [{"type": "Navigation", "props": {...}}],
    "main": [{"type": "DashboardGrid", "props": {...}}]
  },
  "access_roles": ["authenticated"],
  "is_public": false
}
```

## 🌐 **Multi-Language Support**

- **Primary**: English (en)
- **Business**: Greek (el) - for Greek maritime compliance
- **Translation Keys**: Stored in database with namespace organization
- **Dynamic Loading**: Translations fetched based on user locale

## 🎨 **Theming System**

- **Maritime Theme** - Professional blue ocean colors
- **Light Theme** - Clean modern interface
- **Dark Theme** - Reduced eye strain for night operations
- **CSS Custom Properties** - Real-time theme switching
- **Responsive Design** - Mobile-first with breakpoint support

## 🗄️ **Database Schema**

### **Metadata Tables**

- `page_definitions` - Dynamic page configurations
- `layout_definitions` - Reusable layout templates
- `themes` & `theme_properties` - Visual styling
- `translations` - Multi-language content
- `entity_definitions` & `field_definitions` - Business object metadata

### **Auth Tables**

- `tenants` - Multi-tenant configuration
- `users` - User accounts and profiles
- `roles` - Hierarchical role system
- `permissions` - SAP-style authorization objects
- `auth_sessions` - Session management
- `auth_methods` - Authentication credentials

### **Platform Tables**

- `component_definitions` - UI component catalog
- `workflow_definitions` - Business process automation
- `module_manifests` - Platform extensions

## 🛠️ **Development Workflow**

### **Environment Setup**

```powershell
# 1. Clone repository
git clone <repository-url>
cd metadata-erp

# 2. Install dependencies
npm install                    # Root workspace
cd services/auth && poetry install
cd ../api && poetry install
cd ../../apps/client && npm install

# 3. Configure database
# Update connection strings in .env files

# 4. Seed database
./scripts/start-api-server.ps1 -SeedData

# 5. Start development
npm run dev                    # Starts all services
```

### **Adding New Features**

1. **Define Metadata** - Create JSON files in `data/` directory
2. **Update Models** - Modify SQLAlchemy models if needed
3. **Create Seed Data** - Add to seed scripts
4. **Build Components** - Add to shared UI package
5. **Test Integration** - Use test scripts to verify

### **Database Changes**

```powershell
# Create migration
cd services/api
poetry run alembic revision --autogenerate -m "description"

# Apply migration
poetry run alembic upgrade head

# Re-seed data
poetry run python ../../data/seed-scripts/seed_all.py
```

## 🧪 **Testing**

### **Automated Testing**

```powershell
# Test complete platform
./scripts/test-complete-setup.ps1

# Test authentication only
./scripts/test-auth-flow.ps1

# Test metadata API
./scripts/test-metadata-api.ps1
```

### **Manual Testing**

1. **Login Flow** - Test user authentication and authorization
2. **Page Rendering** - Verify metadata-driven page generation
3. **Theme Switching** - Test dynamic theme changes
4. **Language Switching** - Test translation loading
5. **Role-Based Access** - Test permission enforcement

## 🚀 **Deployment**

### **Production Environment**

```bash
# Build frontend
cd apps/client
npm run build

# Start services with PM2
pm2 start ecosystem.config.js

# Or use Docker
docker-compose up -d
```

### **Environment Variables**

```bash
# Auth Service
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
JWT_SECRET_KEY=your-jwt-secret
SECRET_KEY=your-app-secret

# API Service
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
SECRET_KEY=your-api-secret
SERVICE_PORT=8000

# Frontend
NEXT_PUBLIC_AUTH_URL=https://auth.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## 📈 **Performance**

- **Database Queries** - Optimized with proper indexing and caching
- **API Response Times** - <200ms for metadata, <2s for complex operations
- **Frontend Rendering** - Server-side generation with client hydration
- **Caching Strategy** - Redis for metadata, browser cache for static assets

## 🔒 **Security**

- **Authentication** - JWT with refresh tokens and 2FA support
- **Authorization** - SAP-style role-based access control
- **Data Protection** - Encryption at rest and in transit
- **Tenant Isolation** - Complete data separation between tenants
- **Audit Logging** - Comprehensive activity tracking

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 **License**

This project is proprietary software. All rights reserved.

## 📞 **Support**

- 📧 **Email**: support@axiologic.online
- 📞 **Phone**: +30 210 1234567
- 🌐 **Website**: https://axiologic.online
- 📖 **Documentation**: https://docs.axiologic.online

---

**Built with ❤️ for the maritime industry by Axiologic Solutions**
