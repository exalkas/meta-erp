# 🏗️ **PROJECT RULES & GUIDELINES**

## Metadata-Driven No-Code/Low-Code Application Platform

> **Version:** 1.13.1
> **Last Updated:** August 30, 2025
> **Target:** SAP-Style Vertical-First Industry Solutions Platform
> **Status:** Admin Application Fully Functional ✅ - RBAC, translations, and app-builder interface operational

---

## 📋 **SYSTEM OVERVIEW**

### **Core Architecture**

- **Type:** Metadata-driven, vertical-first application platform
- **Strategy:** Industry-specific solutions via metadata packs (6 target verticals)
- **Scope:** Rapid deployment of deep industry solutions (E-commerce, Automotive, Oil & Gas, AgTech, FinTech, Insurance/MedTech)
- **Structure:** Monorepo with NPM workspaces (frontend) + Poetry workspaces (backend)
- **Frontend:** 6 Next.js 15+ applications with dynamic page rendering
- **Backend:** 6 FastAPI services + 2 AI services with metadata engines
- **Database:** PostgreSQL (Master DB + Tenant-specific DBs) with component catalog
- **Cache:** Redis with metadata caching
- **Infrastructure:** Hybrid Docker development (backend) + local frontend, Kubernetes for production

### **Applications**

**Platform Applications:**

1. **admin** - System administration (global platform management)
2. **marketing** - Marketing website and public landing pages
3. **setup** - Data migration tool for users migrating from other systems

**Vertical-Specific Applications:** 4. **legal-app** - Legal Practice Management (Legal-US pack) 5. **ecommerce-app** - E-commerce Platform (future) 6. **automotive-app** - Auto Service Management (future) 7. **fintech-app** - Financial Services Platform (future) 8. **agtech-app** - Agricultural Technology Platform (future) 9. **medtech-app** - Medical Technology Platform (future)

### **Services**

1. **api** - Core business logic and metadata management
2. **auth** - Authentication and authorization
3. **files** - File storage and management
4. **integrations** - External API integrations
5. **ai-support-service** - AI-powered support features
6. **voice-service** - Voice recognition and processing

---

## 🏭 **VERTICAL-FIRST STRATEGY**

### **Target Industries & Go-to-Market**

Our platform deploys as **industry-specific solutions** rather than generic tools. Each vertical includes pre-built entities, workflows, integrations, and compliance features.

### **Priority Vertical Markets**

#### **1. 🛒 E-Commerce & Retail** (Primary Launch)

- **Features:** Shopify/WooCommerce sync, inventory management, omni-channel POS, shipping integrations
- **Integrations:** Shopify, WooCommerce, Magento, QuickBooks, UPS/FedEx/DHL, Square/Stripe
- **Workflows:** Low-stock alerts, abandoned cart follow-ups, loyalty programs, return processing

#### **2. 🚗 Automotive Dealers & Service**

- **Features:** Vehicle inventory (VIN decoding), deal structuring, service scheduling, parts management
- **Integrations:** DMS systems (CDK, Reynolds & Reynolds), OEM APIs, financing partners
- **Workflows:** Trade-in appraisals, F&I processes, maintenance reminders, warranty tracking

#### **3. ⛽ Oil & Gas Operations**

- **Features:** Asset tracking, IoT sensor integration, compliance management, procurement
- **Integrations:** SCADA systems, IoT platforms, regulatory databases, ERP systems
- **Workflows:** Permit-to-work, incident reporting, preventive maintenance, contract lifecycle

#### **4. 🌾 AgTech & Farming**

- **Features:** Field management, crop planning, equipment tracking, yield analytics
- **Integrations:** Weather APIs, IoT sensors, GIS systems, certification bodies
- **Workflows:** Planting schedules, harvest forecasting, subsidy tracking, traceability

#### **5. 💰 FinTech Enterprise**

- **Features:** Multi-currency ledger, KYC/AML, payment rails, risk management
- **Integrations:** ACH/SWIFT/SEPA, credit bureaus, regulatory systems, banking APIs
- **Workflows:** Onboarding, transaction monitoring, compliance reporting, reconciliation

#### **6. 🏥 Insurance & MedTech**

- **Features:** Policy management, claims processing, regulatory reporting, device integration
- **Integrations:** Telematics, wearables, regulatory systems, actuarial databases
- **Workflows:** Underwriting, claims adjudication, HIPAA compliance, FDA submissions

### **Vertical Pack Architecture**

Each vertical deploys as a **metadata module** containing:

```json
{
  "verticalId": "automotive.dealer",
  "displayName": "Automotive Dealer Management",
  "entities": ["Vehicle", "ServiceOrder", "Customer", "TradeIn"],
  "workflows": ["trade_in_appraisal", "service_reminder", "financing_workflow"],
  "integrations": ["cdkDMS", "vinDecoding", "creditPartners"],
  "dashboards": ["dealer_overview", "service_metrics", "inventory_turnover"],
  "compliance": ["automotive_regulations", "state_licensing"]
}
```

### **Installation & Onboarding**

1. **Tenant Onboarding Wizard:** "Which industry are you in?"
2. **Vertical Pack Installation:** Auto-install entities, workflows, integrations
3. **Configuration:** Industry-specific setup (tax jurisdictions, compliance, integrations)
4. **Training:** Vertical-specific training materials and support

### **Competitive Advantages**

- ✅ **Deeper Than Horizontal Solutions:** Industry-specific features out-of-the-box
- ✅ **Faster Than Custom Development:** Metadata = rapid deployment
- ✅ **More Configurable Than Vertical SaaS:** Still customizable via metadata
- ✅ **Marketplace Ready:** Components shareable across verticals

---

## 🎯 **CORE PRINCIPLES**

### **🚀 CARDINAL RULE: KEEP THINGS SIMPLE**

- **Simplicity First:** Choose the simplest solution that works
- **No Over-Engineering:** Build only what's needed now
- **Clear Code:** Readable code over clever code
- **Progressive Enhancement:** Start simple, add complexity only when necessary

### **📋 DEVELOPMENT RULE: PLAN FIRST**

- **Before Code:** Show what you're going to do, get agreement, then implement
- **No Surprises:** Never start coding without explicit approval
- **Clear Communication:** Explain the approach before the implementation
- **Iterate:** Plan → Agree → Implement → Reflect → Repeat

### **1. Metadata-First Platform Architecture**

- **Everything Dynamic:** Pages, forms, entities, workflows all defined in metadata
- **Component Catalog:** Reusable UI components with JSON schema props
- **Module System:** WordPress-style plugin architecture with manifests
- **Runtime Rendering:** UI generated completely from database metadata
- **No Hardcoding:** Everything configurable per tenant through metadata

### **2. Multi-Tenancy Strategy**

- **Database:** Master DB for global data + separate tenant DBs [[memory:2922900]]
- **Isolation:** Complete data separation between tenants
- **Scaling:** Independent scaling per tenant
- **Compliance:** Tenant-specific data residency
- **Custom Layouts:** Tenant-specific page layouts and UI configurations

### **3. Development Workflow**

- **Platform:** Windows 11 + PowerShell for development, Ubuntu for deployment
- **Commands:** Use PowerShell syntax locally (no `&&` chains)
- **Planning:** Plan thoroughly before tool calls, reflect on outcomes
- **Verification:** Use tools to verify code, don't guess or hallucinate

### **4. Code Quality Standards**

- **Architecture:** SOLID principles, clean architecture
- **Error Handling:** Comprehensive error handling with proper HTTP status codes
- **Logging:** Structured logging throughout the application
- **Testing:** Production-level code with full test coverage
- **Documentation:** Concise principles and guidelines without code examples [[memory:2922916]]

---

## 🏛️ **SAP-STYLE DATABASE ARCHITECTURE**

### **Master Database (`metadata_platform_master`)**

**Core Principle:** Global platform metadata, SAP customizing tables, and industry packages.

```sql
-- SAP-Style Customizing Tables (Business Logic as Data)
T_AUTH_IMG_ACTIVITY (activity_id, parent_id, description, table_name, maintenance_view)
T_AUTH_CUSTOMIZING (tenant_id, activity_id, field_name, field_value, is_active)
T_AUTH_SESSION_CONFIG (config_id, tenant_id, max_sessions, timeout_minutes, single_session_mode)
T_AUTH_METHOD_CONFIG (config_id, tenant_id, method_type, is_enabled, settings_json)
T_AUTH_RULE_CONFIG (rule_id, rule_name, condition_json, action_json, priority)
T_AUTH_BUSINESS_OBJECT (object_id, object_name, methods_json, events_json)
T_AUTH_TRANSPORT_REQUEST (transport_id, description, source_env, target_env, status)
T_AUTH_TRANSPORT_OBJECT (transport_id, object_type, object_name, change_type)
T_AUTH_INDUSTRY_PACKAGE (package_id, package_name, industry, config_json, install_script)

-- Component Catalog & Platform Metadata
component_definitions (component_id, name, props_schema, supports_children, is_system)
module_manifests (manifest_id, name, version, components, dependencies, install_script)
vertical_packs (pack_id, industry, entities_json, workflows_json, integrations_json)

-- Global Reference Data
countries (country_code, name, currency_code, time_zone)
currencies (currency_code, symbol, decimal_places)
languages (language_code, name, direction)

-- Platform Administration
platform_users (user_id, email, role, permissions_json)
tenant_registry (tenant_id, database_name, industry_vertical, status)
```

### **Tenant Databases (`metadata_tenant_{tenant_id}`)**

**Core Principle:** Business data and tenant-specific customizing overrides.

```sql
-- Business Users & Authentication
users (user_id, tenant_id, email, auth_methods_json, compliance_level)
auth_sessions (session_id, user_id, device_type, ip_address, expires_at, risk_score)
auth_methods (method_id, user_id, method_type, credentials_json, is_primary)

-- Business Entities (Dynamic based on EntityDefinitions)
customers (id, tenant_id, name, industry, custom_fields_json)
products (id, tenant_id, name, category, price, custom_fields_json)
orders (id, tenant_id, customer_id, total_amount, status, custom_fields_json)
-- ... all industry-specific business entities

-- Tenant-Specific Customizing Overrides
tenant_auth_config (config_id, setting_name, setting_value, overrides_master)
tenant_workflow_config (workflow_id, tenant_id, config_json, is_active)

-- Audit & Compliance
audit_logs (log_id, tenant_id, user_id, action, object_type, timestamp, details_json)
compliance_records (record_id, tenant_id, compliance_type, status, evidence_json)
```

### **Multi-Database Strategy**

- **Master Database:** Single database for all global platform data, SAP customizing, and industry packages
- **Tenant Databases:** One database per tenant for complete data isolation and security
- **Connection Routing:** Automatic routing based on tenant context in all API calls
- **Industry Packages:** Transportable metadata from master to tenant (IS-FINTECH, IS-ECOMMERCE, etc.)
- **Cross-Tenant Security:** Absolute data boundaries enforced at database level

### **SAP-Style Migration System (NO ALEMBIC)**

**Philosophy:** Direct Python + SQL approach based on proven custom migration system.

```bash
scripts/migrations/
├── sap_migration_system.py          # Main orchestrator (like complete_migration.py)
├── master_db_schema_manager.py      # Manage master DB schema and SAP tables
├── tenant_db_schema_manager.py      # Manage all tenant databases
├── sap_schema_extractor.py          # Extract current schemas from both DB types
├── sap_schema_comparator.py         # Compare current vs target schemas
├── sap_data_transformer.py          # Transform data during migrations
├── industry_package_installer.py    # Install IS-* packages from master to tenant
├── transport_manager.py             # SAP-style transport system (DEV→QAS→PRD)
└── cross_platform_runner.py         # Windows PowerShell + Linux Bash compatibility

Cross-Platform Scripts:
├── setup-master-db.ps1/.sh          # Initialize master database
├── create-tenant-db.ps1/.sh          # Create new tenant database
├── migrate-all-dbs.ps1/.sh           # Migrate master + all tenant databases
├── install-industry-pack.ps1/.sh     # Install industry package to tenant
└── transport-changes.ps1/.sh         # Apply transport across environments
```

### **Industry Package System**

**IS-FINTECH Package:**

- Single session enforcement (max_sessions: 1)
- Mandatory 2FA for all users
- KYC compliance workflows
- Risk assessment rules
- 1-hour session timeout

**IS-ECOMMERCE Package:**

- Multi-session support (max_sessions: 5)
- Optional 2FA
- Guest checkout workflows
- Social login integration
- 24-hour session timeout

**IS-OILGAS Package:**

- Single session enforcement
- Safety certification requirements
- Permit-to-work integration
- 8-hour session timeout

### **SAP Transport System**

**Environment Progression:** DEV → QAS → PRD

```sql
-- Transport Request Example
transport_id: TR001
description: "Setup FinTech Authentication Rules"
objects: [
  {type: "T_AUTH_SESSION_CONFIG", change: "INSERT"},
  {type: "T_AUTH_METHOD_CONFIG", change: "UPDATE"},
  {type: "T_AUTH_RULE_CONFIG", change: "INSERT"}
]
status: "DEV_COMPLETE" → "QAS_APPLIED" → "PRD_READY"
```

---

## 🎨 **FRONTEND ARCHITECTURE**

### **Technology Stack**

- **Framework:** Next.js 15+ with App Router and dynamic page rendering
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS with custom design system
- **State:** React Context + Custom hooks
- **Forms:** React Hook Form + Zod validation
- **Internationalization:** i18next with dynamic loading
- **Theme Variants:** Enterprise theme system with light/dark variants

### **Component Organization**

```
packages/shared/ui/src/components/
├── auth/           # Authentication components
├── business/       # Business entity components
├── forms/          # Dynamic form components
├── greek/          # Greek-specific components
├── layout/         # Layout components
├── multilingual/   # i18n components
├── ui/             # Base UI components
└── widget-system/  # Widget/bot system
```

### **Metadata-Driven Components**

- Dynamic forms based on field definitions
- Layout builder using layout definitions
- Entity builders with custom fields
- Widget system for extensibility
- Theme engine with CSS custom properties

---

## 🔧 **BACKEND ARCHITECTURE**

### **Technology Stack**

- **Framework:** FastAPI 0.100+
- **Language:** Python 3.11+
- **Database:** SQLAlchemy 2.0 + Asyncpg
- **Cache:** Redis with async client
- **Authentication:** JWT with refresh tokens
- **Validation:** Pydantic v2
- **Testing:** Pytest with async support
- **AI:** Custom models for Greek business context

### **Service Communication**

- **Internal:** HTTP/REST between services
- **Auth:** JWT tokens passed between services
- **Cache:** Redis for shared state
- **Events:** Redis Streams for async events
- **Monitoring:** Structured logging + health checks

### **API Design**

- RESTful endpoints with consistent patterns
- Metadata endpoints for UI configuration
- Bulk operations for performance
- Pagination with cursor-based navigation
- Real-time updates via WebSocket

---

## 🌐 **INTERNATIONALIZATION**

### **Language Support**

- **Primary:** English (en_US) - International platform
- **Secondary:** Greek (el_GR) - Business compliance features
- **Framework:** i18next with namespace organization
- **Loading:** Dynamic translation loading per route
- **Fallback:** English → Greek → Key display

### **Translation Management**

- Database-stored translations per tenant
- Global defaults with tenant overrides
- Context-aware translations
- RTL support preparation
- Number/date/currency formatting per locale

### **Greek Business Compliance**

- AADE integration for tax compliance
- Greek VAT system implementation
- AFM validation and DOY selection
- Greek address and postal code validation
- Greek phone number formatting

---

## 🎭 **THEMING SYSTEM**

### **Theme Variant Architecture** 🎨

**NEW: Enterprise Theme + Variant System**

- **Base Themes**: Professional, Corporate, Modern (marketplace items)
- **Standard Variants**: Light & Dark only (Tailwind compatible)
- **Marketplace Ready**: Creator attribution, ratings, versioning
- **CSS Custom Properties**: Generated per variant
- **Tenant Isolation**: Global + tenant-specific themes

### **Theme Variant Structure**

```typescript
// Base Theme (marketplace item)
interface BaseTheme {
  base_theme_id: string;
  name: string; // "professional", "corporate", "modern"
  display_name: string; // "Professional Business Theme"
  creator_id?: string; // Theme creator
  category: string; // "business", "creative", "minimal"
  is_featured: boolean;
  price?: number; // For paid themes
  rating?: number; // 0.00 to 5.00
  variants: ThemeVariant[]; // Light + Dark variants
}

// Theme Variant (light/dark)
interface ThemeVariant {
  variant_id: string;
  base_theme_id: string;
  variant_name: string; // "light" | "dark"
  display_name: string; // "Light Mode" | "Dark Mode"
  is_default: boolean;
  css_class_prefix?: string; // "dark" or null
  media_query?: string; // CSS media query
  properties: ThemeVariantProperty[];
}

// CSS Properties per variant
interface ThemeVariantProperty {
  property_key: string; // "--primary-color"
  property_value: string; // "#3182ce"
  property_type: string; // "color", "size", "font"
  category: string; // "colors", "typography", "spacing"
}
```

### **API Usage**

```typescript
// Frontend calls:
GET /themes/professional/dark    // Specific variant
GET /themes/professional         // Default variant

// Returns CSS properties:
{
  "base_theme": { "name": "professional", "display_name": "Professional Theme" },
  "variant": { "variant_name": "dark", "display_name": "Dark Mode" },
  "css_properties": {
    "--primary-color": "#4A9EFF",
    "--background-color": "#1A1A1A"
  }
}
```

---

## 🔐 **SECURITY & AUTHENTICATION**

### **Authentication Methods**

1. **Email/Password** - Standard login with bcrypt hashing
2. **Magic Link** - Passwordless email authentication
3. **2FA** - TOTP with authenticator apps
4. **SSO** - OAuth 2.0 for enterprise clients

### **Authorization Model**

- **Levels:** System → Tenant → User → Role
- **Permissions:** Feature-based with inheritance
- **Isolation:** Complete tenant data separation
- **Audit:** Full audit trail for compliance

### **Security Measures**

- JWT with short expiry + refresh tokens
- Rate limiting per endpoint
- CSRF protection
- SQL injection prevention
- XSS protection with CSP headers

---

## 🤖 **AI & AUTOMATION**

### **AI Services**

- **Voice Service:** Speech-to-text with Greek support
- **Support Service:** AI-powered customer support
- **Document Processing:** Greek document recognition
- **Predictive Analytics:** Business intelligence

### **Widget & Bot System**

- WordPress-inspired plugin architecture
- Marketplace for widgets and bots
- Custom widget development framework
- Bot builder with visual flow designer
- Revenue sharing for creators

---

## 📦 **PACKAGE MANAGEMENT**

### **Shared Packages**

- **@erp/shared-ui** - Reusable UI components
- **@erp/shared-api** - API client utilities
- **@erp/shared-auth** - Authentication utilities
- **@erp/dynamic-entities** - Metadata management
- **@erp/utils** - Common utilities
- **@erp/voice** - Voice integration

### **Module Dependencies**

```
auth → core
crm → auth, core
erp → crm, auth, core
payments → auth, core
integrations → auth, core
ai-services → auth, core
```

---

## 🚀 **DEVELOPMENT WORKFLOW**

### **Hybrid Docker Environment**

**Architecture:** Backend in Docker + Frontend locally for optimal development speed

### **Daily Startup (MANDATORY)**

```powershell
# 1. Morning routine (fresh backend start)
npm run morning

# 2. Start frontend development
npm run dev:legal        # Legal app on port 3006
npm run dev:client       # Client app on port 3000 (if needed)
npm run watch:shared-ui  # When editing shared components
```

### **Docker Backend Management**

```powershell
# Backend services (Docker)
npm run start            # Quick start existing backend
npm run docker:up        # Start all backend services
npm run docker:down      # Stop all services
npm run docker:restart   # Restart all services
npm run docker:status    # Check service health

# Debugging
npm run docker:logs      # All service logs
npm run docker:logs:auth # Auth service logs only
npm run docker:logs:api  # API service logs only
```

### **Development Rules (MANDATORY)**

- ✅ **Backend:** Always run in Docker for consistency
- ✅ **Frontend:** Always run locally for hot reload speed
- ✅ **Manual Control:** Never use Docker auto-restart (prevents conflicts)
- ✅ **Morning Routine:** Always start with `npm run morning` for clean state
- ✅ **Data Persistence:** Database persists across Docker restarts

### **Code Standards**

- **Formatting:** Prettier for JS/TS, Black for Python
- **Linting:** ESLint + TypeScript strict, Flake8 + mypy
- **Testing:** Jest for frontend, pytest for backend
- **Pre-commit:** Automated formatting and linting

---

## 📊 **MONITORING & LOGGING**

### **Logging Strategy**

- **Format:** Structured JSON logging
- **Levels:** DEBUG, INFO, WARN, ERROR, CRITICAL
- **Context:** Request ID, Tenant ID, User ID
- **Storage:** Local files + centralized logging

### **Health Monitoring**

- Service health endpoints
- Database connection monitoring
- Redis connectivity checks
- AI service availability
- Performance metrics collection

---

## 🔄 **DEPLOYMENT**

### **Environments**

- **Development:** Docker Compose locally
- **Staging:** Kubernetes cluster
- **Production:** Kubernetes with auto-scaling
- **DR:** Multi-region deployment

### **CI/CD Pipeline**

1. Code commit triggers pipeline
2. Run tests and linting
3. Build Docker images
4. Deploy to staging
5. Run integration tests
6. Deploy to production
7. Monitor deployment health

---

## 📈 **PERFORMANCE**

### **Optimization Strategies**

- Metadata caching with Redis
- Database query optimization
- CDN for static assets
- Image optimization and lazy loading
- Code splitting and tree shaking

### **Scalability**

- Horizontal service scaling
- Database read replicas
- Redis clustering
- AI model load balancing
- Tenant-based sharding

---

## 🎛️ **FEATURE FLAGS**

### **Configuration**

```python
ENABLE_METADATA_CACHE = True
ENABLE_FIELD_VALIDATION = True
ENABLE_LAYOUT_PREVIEW = True
ENABLE_AI_FEATURES = True
ENABLE_VOICE_INTEGRATION = True
```

### **Tenant-Level Features**

- Per-tenant feature enablement
- A/B testing capabilities
- Gradual rollout mechanisms
- Feature usage analytics

---

## ⚠️ **CRITICAL RULES**

### **DO**

✅ Use metadata for all UI generation
✅ Plan before implementing, reflect after
✅ Use tools to verify code, don't guess
✅ Follow SOLID principles
✅ Implement comprehensive error handling
✅ Write production-ready code
✅ Test thoroughly before deployment
✅ Document architecture decisions

### **DON'T**

❌ Hardcode schemas or layouts
❌ Use shared database architecture
❌ Skip error handling
❌ Use fallback solutions
❌ Implement without planning
❌ Guess implementation details
❌ Skip testing and verification
❌ Create code without documentation

---

## 🏗️ **PLATFORM ENGINES**

This platform provides complete vertical solutions through **SAP-style metadata-driven engines** that power industry-specific features. Each engine is responsible for a specific domain and can be configured via metadata.

---

### **🔧 BACKEND ENGINES** (FastAPI Services)

#### **🔐 Authentication & Security Engines**

**Auth Engine** (`services/auth/`)

- Multi-method authentication (email/password, magic links, passkeys, 2FA)
- Tenant-specific auth flows and compliance rules
- Session management with JWT + refresh tokens
- Account security (lockout, rate limiting, password policies)

**Permission Engine** (`services/auth/`)

- SAP-style role-based access control (RBAC)
- Dynamic permission definitions from metadata
- Fine-grained entity and field-level permissions
- Hierarchical role inheritance and delegation

**Compliance Engine** (`services/auth/`)

- Industry-specific compliance rules (KYC, HIPAA, SOX, GDPR)
- Automated compliance validation and reporting
- Risk assessment and management workflows
- Regulatory requirement tracking per vertical

**Audit Engine** (`services/auth/`)

- Complete audit trail for all system activities
- Tamper-proof audit log storage
- Compliance reporting and data export
- User activity monitoring and analytics

#### **📋 Metadata Management Engines**

**Page Engine** (`services/api/`)

- Runtime page generation from PageDefinitions metadata
- Dynamic routing and page composition
- Layout integration with component placement
- Page versioning and A/B testing support

**Data Engine** (`services/api/`)

- Runtime entity and field definitions
- Dynamic database table generation
- Relationship management and referential integrity
- Custom field types and validation rules

**Component Engine** (`services/api/`)

- Component catalog with JSON schema props
- Module manifests and dependency management
- WordPress-style plugin architecture
- Component versioning and marketplace integration

**Layout Engine** (`services/api/`)

- Section-based layout definitions
- Responsive design templates
- Theme variant integration and CSS custom property generation
- Layout inheritance and customization

#### **🚀 Business Logic Engines**

**Workflow Engine** (`services/api/`)

- Trigger-based automation (create, update, schedule, external events)
- Condition logic with complex business rules
- Action execution with parallel and sequential flows
- Pipeline management for sales, projects, and operations

**Business Rule Engine** (`services/api/`)

- SAP-style decision tables and rule evaluation
- Complex conditional logic and rule chaining
- Priority-based rule execution
- Rule versioning and testing frameworks

**Calculation Engine** (`services/api/`)

- Dynamic pricing calculations with volume discounts
- Multi-jurisdiction tax calculations
- Financial formulas and commission structures
- Real-time calculation with caching optimization

**Process Engine** (`services/api/`)

- End-to-end business process orchestration
- Process state management and persistence
- Human task assignment and escalation
- Process analytics and optimization

#### **🔌 Integration & Communication Engines**

**Integration Engine** (`services/integrations/`)

- External API connectors with rate limiting
- Data transformation and mapping pipelines
- Real-time and batch synchronization
- Error handling and retry mechanisms

**Translation Engine** (`services/api/`)

- Multi-language content management
- Tenant-specific translation overrides
- Dynamic translation loading and caching
- Translation workflow for content creators

**Theme Variant Engine** (`services/api/`)

- **Base Theme Management**: Marketplace theme catalog
- **Variant Processing**: Light/Dark variant generation
- **CSS Property Generation**: Dynamic custom properties per variant
- **Marketplace Integration**: Creator attribution, ratings, pricing
- **Tenant Customization**: Override properties per tenant
- **Performance**: Redis caching of theme variants

**File Engine** (`services/files/`)

- Secure file upload and storage
- Document processing and metadata extraction
- File versioning and access control
- CDN integration and optimization

**Notification Engine** (`services/api/`)

- Multi-channel notifications (email, SMS, push, in-app)
- Template management and personalization
- Delivery tracking and analytics
- Notification preferences and opt-out management

#### **📊 Analytics & Search Engines**

**Search Engine** (`services/api/`)

- Full-text search across all entities
- Advanced filtering and faceted search
- Search analytics and optimization
- Real-time indexing and updates

**Analytics Engine** (`services/api/`)

- Business intelligence and reporting
- KPI calculation and dashboard generation
- Predictive analytics and forecasting
- Data visualization and export capabilities

#### **⚙️ Infrastructure Engines**

**Cache Engine** (`services/api/`)

- Multi-level caching strategies (Redis, in-memory)
- Metadata caching with intelligent invalidation
- Query result caching and optimization
- Cache warming and preloading

**SAP Migration Engine** (`scripts/migrations/`)

- Custom Python-based migration system (NO Alembic)
- Master + Tenant database schema management
- SAP-style transport system (DEV → QAS → PRD)
- Industry package installation and deployment
- Cross-platform compatibility (Windows PowerShell + Linux Bash)
- Schema extraction, comparison, and data transformation
- Parallel execution across multiple tenant databases

**SAP Customizing Engine** (`services/auth/`)

- Read business logic from T*AUTH*\* customizing tables
- IMG-style hierarchical configuration management
- Industry package configuration application
- Runtime rule evaluation from metadata
- Transport object management and versioning

**Deployment Engine** (`services/api/`)

- Automated app deployment from vertical packs
- Infrastructure provisioning and configuration
- Health monitoring and auto-scaling
- Blue-green deployment strategies

---

### **🎨 FRONTEND ENGINES** (React/Next.js)

#### **🖼️ UI Rendering Engines**

**Rendering Engine** (`packages/shared/ui/`)

- Dynamic UI rendering from metadata definitions
- Component lazy loading and code splitting
- Server-side rendering optimization
- Error boundaries and fallback handling

**State Engine** (`packages/shared/ui/`)

- Metadata-driven state management
- Component state bindings from page definitions
- Real-time state synchronization
- State persistence and hydration

**Form Engine** (`packages/shared/ui/`)

- Dynamic form generation from FieldDefinitions
- Multi-step wizards and conditional fields
- Real-time validation and error handling
- Form state management and persistence

**Validation Engine** (`packages/shared/ui/`)

- Client-side validation from metadata rules
- Real-time field validation and feedback
- Server-side validation synchronization
- Custom validation rule execution

#### **🧭 Navigation & Layout Engines**

**Navigation Engine** (`packages/shared/ui/`)

- Dynamic routing from page metadata
- Breadcrumb generation and navigation history
- Permission-based navigation filtering
- Deep linking and URL state management

**Layout Engine FE** (`packages/shared/ui/`)

- Dynamic layout rendering from LayoutDefinitions
- Responsive breakpoint management
- Section-based component placement
- Layout animation and transitions

#### **🎨 Presentation Engines**

**Theme Variant Engine FE** (`packages/shared/ui/`)

- **Theme Selection UI**: Base theme picker + light/dark toggle
- **CSS Property Injection**: Dynamic variant-based custom properties
- **Auto-switching**: System preference detection (light/dark)
- **Performance**: Variant caching and lazy loading
- **Component Integration**: Tailwind class generation from variants
- **User Preferences**: Theme + variant persistence

**Translation Engine FE** (`packages/shared/ui/`)

- Client-side i18n with dynamic loading
- Namespace-based translation organization
- Fallback language handling
- Real-time language switching

#### **🔧 Component & Event Engines**

**Component Engine FE** (`packages/shared/ui/`)

- Dynamic component loading from catalog
- Component prop injection from metadata
- Component lifecycle management
- Component error handling and recovery

**Event Engine** (`packages/shared/ui/`)

- Metadata-driven event handling and callbacks
- Custom event system with type safety
- Event delegation and performance optimization
- Analytics event tracking

#### **⚡ Performance & Error Engines**

**Cache Engine FE** (`packages/shared/ui/`)

- Client-side metadata caching
- API response caching with stale-while-revalidate
- Image and asset caching optimization
- Cache invalidation strategies

**Error Engine** (`packages/shared/ui/`)

- Comprehensive error handling and recovery
- User-friendly error messaging
- Error reporting and analytics
- Graceful degradation strategies

---

### **🔄 ENGINE COMMUNICATION**

Engines communicate through:

- **REST APIs** for synchronous operations
- **Event Streams** for asynchronous notifications
- **Shared Cache** for performance optimization
- **Message Queues** for background processing
- **WebSockets** for real-time updates

### **📊 ENGINE MONITORING**

- Health checks for all engines
- Performance metrics and SLA monitoring
- Error tracking and alerting
- Resource utilization optimization
- Automated scaling based on load

## **CROSS-PLATFORM DEVELOPMENT NOTES**

### **PowerShell Icon Limitations**

- PowerShell terminals may not render Unicode emoji icons correctly
- Use text-based indicators instead: `[OK]`, `[ERROR]`, `[INFO]`, `[WARN]`
- Provides better compatibility across different terminal environments

### **PostgreSQL Path Detection**

- PostgreSQL installations vary by platform and version
- Scripts automatically detect common installation paths:
  - `C:\Program Files\PostgreSQL\17\bin\psql.exe` (Windows)
  - `C:\Program Files\PostgreSQL\16\bin\psql.exe` (Windows)
  - Standard PATH locations (Linux/macOS)
- No manual PATH configuration required for most installations

### **Development Philosophy: Step-by-Step Approach**

**🎯 MANDATORY: One Step at a Time**

- **Complete each phase fully** before moving to the next
- **Test thoroughly** after each step to ensure stability
- **Verify all functionality** before proceeding
- **Document any issues** encountered during testing
- **Fix problems immediately** rather than accumulating technical debt

**Testing Workflow:**

1. ✅ **Implement** - Complete the current step/phase
2. ✅ **Test** - Verify functionality works as expected
3. ✅ **Validate** - Check integration with existing systems
4. ✅ **Document** - Update guides and changelog
5. ✅ **Proceed** - Only then move to next step

---

## 🛠️ **MULTI-DATABASE DEVELOPMENT COMMANDS**

### **Database Management Scripts**

**Master Database Operations:**

```bash
# Initialize master database with SAP customizing tables
npm run db:master:init

# Reset master database (development only)
npm run db:master:reset

# Migrate master database schema
npm run db:master:migrate

# Seed master database with SAP defaults and industry packages
npm run db:master:seed
```

**Tenant Database Operations:**

```bash
# Create new tenant database
npm run db:tenant:create -- --tenant-id=demo-ecommerce --industry=ecommerce

# Migrate all tenant databases
npm run db:tenant:migrate-all

# List all tenant databases
npm run db:tenant:list

# Reset specific tenant database (development only)
npm run db:tenant:reset -- --tenant-id=demo-ecommerce
```

**SAP Industry Package Management:**

```bash
# Install FinTech industry package to tenant
npm run sap:install-fintech -- --tenant-id=demo-fintech

# Install E-commerce industry package to tenant
npm run sap:install-ecommerce -- --tenant-id=demo-ecommerce

# Install Oil & Gas industry package to tenant
npm run sap:install-oilgas -- --tenant-id=demo-oilgas

# List available industry packages
npm run sap:list-packages

# Verify package installation
npm run sap:verify-package -- --tenant-id=demo-fintech --package=IS-FINTECH
```

**SAP Transport System (DEV → QAS → PRD):**

```bash
# Create transport request for configuration changes
npm run sap:create-transport -- --description="Setup FinTech Auth Rules"

# Apply transport to target environment
npm run sap:apply-transport -- --transport-id=TR001 --env=QAS

# Transport from DEV to QAS
npm run sap:transport-dev-qas -- --transport-id=TR001

# Transport from QAS to PRD (production deployment)
npm run sap:transport-qas-prd -- --transport-id=TR001
```

**Cross-Platform Setup Commands:**

```bash
# Complete new environment setup (new laptop/server)
npm run setup:new-environment

# Install all dependencies (Python + JavaScript)
npm run install:python && npm run install:js

# Setup development data with demo tenants
npm run setup:demo-data
```

**Development Services:**

```bash
# Start all services (frontend + backend)
npm run dev:all

# Start authentication service only
npm run dev:auth

# Start with specific tenant context
npm run dev:auth -- --tenant-context=demo-fintech

# Development with full debugging
npm run dev:debug
```

### **Cross-Platform Compatibility**

All database scripts automatically detect and run platform-appropriate commands:

- **Windows Development:** PowerShell scripts (`.ps1`)
- **Linux Production:** Bash scripts (`.sh`)
- **Automatic Detection:** Based on `process.platform`

**Example Usage:**

```bash
# Works on both Windows and Linux
npm run db:master:init

# Windows: Runs scripts/migrations/setup-master-db.ps1
# Linux:   Runs scripts/migrations/setup-master-db.sh
```

### **Environment Setup for New Team Members**

**Complete Setup (One Command):**

```bash
npm run setup:new-environment
```

This command:

1. ✅ Checks prerequisites (PostgreSQL, Python, Node.js)
2. ✅ Creates Master database with SAP customizing tables
3. ✅ Creates demo tenant databases (FinTech, E-commerce)
4. ✅ Installs industry packages (IS-FINTECH, IS-ECOMMERCE)
5. ✅ Seeds demo data and creates test users
6. ✅ Starts all development services

**Ready to code in 5 minutes! 🚀**

---

## 📖 **SETUP GUIDES**

**Step-by-step guides for platform setup are located in:**

📁 **[`docs/setup/`](docs/setup/README.md)** - Complete setup documentation

### **Quick Guide Index:**

1. **[Create Master Database](docs/setup/01-master-database.md)** - SAP customizing tables, component catalog
2. **[Create Tenant Database](docs/setup/02-tenant-database.md)** - Business data tables, authentication
3. **[Create First User](docs/setup/03-first-user.md)** - Admin accounts with authentication methods
4. **[Run Database Migrations](docs/setup/04-migrations.md)** - Custom migration system _(Phase 2)_
5. **[Install Industry Package](docs/setup/05-industry-packages.md)** - FinTech, E-commerce packages _(Phase 2)_
6. **[Complete Development Setup](docs/setup/06-development-setup.md)** - Full environment _(Phase 3)_

**🎯 Follow guides in order, test each step thoroughly before proceeding.**

---

## 📚 **REFERENCE ARCHITECTURE**

This platform enables **industry-specific solutions** through metadata-driven vertical packs:

### **🎯 Vertical Solutions**

- **E-Commerce & Retail:** Complete omni-channel retail management with POS, inventory, and marketplace integrations
- **Automotive:** Dealer management with VIN decoding, F&I workflows, and DMS integration
- **Oil & Gas:** Asset tracking, IoT monitoring, compliance, and procurement management
- **AgTech:** Farm management, crop planning, IoT sensors, and regulatory compliance
- **FinTech:** Multi-currency ledger, KYC/AML, payment rails, and risk management
- **Insurance/MedTech:** Policy management, claims processing, and regulatory reporting

### **🏗️ Platform Capabilities**

- **Metadata-First Architecture:** Everything configurable through database metadata
- **Vertical Pack System:** Industry solutions deployed as metadata modules
- **WordPress-Style Marketplace:** Component ecosystem with revenue sharing
- **Enterprise Scalability:** Multi-tenant with isolated databases per customer
- **Global Compliance:** Country-specific tax engines and regulatory features
- **Rapid Deployment:** Industry solutions in days, not months

### **🚀 Competitive Differentiation**

- **Deeper than Horizontal CRM/ERP:** Industry-specific features out-of-the-box
- **Faster than Custom Development:** Metadata enables rapid configuration
- **More Flexible than Vertical SaaS:** Still fully customizable per tenant
- **Marketplace Ready:** Components can be shared, sold, and extended

For questions or clarifications, refer to the `docs/` folder or system documentation.
