# 🏗️ **PROJECT RULES & GUIDELINES**

## Metadata-Driven No-Code/Low-Code Application Platform

> **Version:** 1.2.0  
> **Last Updated:** July 24, 2025  
> **Target:** Vertical-First Industry Solutions Platform

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
- **Infrastructure:** Docker Compose for development, Kubernetes for production

### **Applications**

1. **client** - Main application interface (dynamically configured per tenant)
2. **admin** - System administration (global platform management)
3. **marketing** - Marketing website and public landing pages
4. **setup** - Data migration tool for users migrating from other systems (e.g., Salesforce)
5. **staff-support** - Internal support tools (admin-side support)
6. **user-support** - Customer support portal (customer-facing support)

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

## 🏛️ **DATABASE ARCHITECTURE**

### **Master Database Schema**

```sql
-- Global system tables
tenants (tenant_id, name, domain, default_locale, default_theme_id, status)
field_definitions (tenant_id, entity_name, field_name, label_key, data_type, is_required)
entity_definitions (tenant_id, entity_name, display_label, plural_label)
layout_definitions (tenant_id, entity_name, layout_name, sections_json)
picklist_values (picklist_name, value, sort_order)
translations (tenant_id, locale, key, text)
themes (theme_id, tenant_id, name, parent_theme_id)
theme_properties (theme_id, property_key, property_value)
```

### **Tenant Database Schema**

```sql
-- Tenant-specific business data
accounts (id, tenant_id, name, type, custom_fields_json)
contacts (id, tenant_id, account_id, name, custom_fields_json)
opportunities (id, tenant_id, account_id, amount, custom_fields_json)
invoices (id, tenant_id, account_id, amount, custom_fields_json)
-- ... all business entities
```

### **Migration Strategy**

- Custom migration system (no Alembic)
- PowerShell scripts for Windows development
- Schema comparison and data transformation
- Automated backup/restore during migrations

---

## 🎨 **FRONTEND ARCHITECTURE**

### **Technology Stack**

- **Framework:** Next.js 15+ with App Router and dynamic page rendering
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS with custom design system
- **State:** React Context + Custom hooks
- **Forms:** React Hook Form + Zod validation
- **Internationalization:** i18next with dynamic loading
- **Themes:** CSS custom properties with context switching

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

### **Theme Architecture**

- CSS Custom Properties for dynamic theming
- Theme inheritance (tenant → global)
- Dark/Light mode support
- Component-level theme overrides
- Runtime theme switching

### **Theme Definition**

```typescript
interface Theme {
  id: string;
  name: string;
  parentThemeId?: string;
  properties: {
    "--primary-color": string;
    "--secondary-color": string;
    "--background-color": string;
    // ... theme properties
  };
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

### **Environment Setup**

1. Clone repository
2. Install dependencies (`npm run install:both`)
3. Set up environment files
4. Run migration scripts
5. Start development servers

### **Development Commands**

```powershell
# Start all services
npm run dev:all

# Start specific services
npm run dev:client     # Main client app
npm run dev:api        # Core API
npm run dev:auth       # Auth service

# Database management
npm run migrate        # Run migrations
npm run seed          # Seed reference data
npm run reset-db      # Reset database
```

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

This platform provides complete vertical solutions through metadata-driven engines that power industry-specific features:

### **🔐 Authentication Engine**

- Multi-method auth (email/password, magic links, 2FA)
- Role-based access control with fine-grained permissions
- Session management and audit logging

### **📱 Dynamic Page Engine**

- Runtime page generation from metadata
- Component catalog with JSON schema props
- Module manifests for plugin architecture

### **🏗️ Dynamic Data Engine**

- Runtime entity and field definitions
- Relationship management and validation
- Picklist and lookup management

### **🎨 Dynamic UI Engine**

- Layout definitions with section-based arrangements
- Form builder with component integration
- Dashboard and list view configurations

### **🚀 Workflow Engine**

- Trigger-based automation (create, update, schedule)
- Condition logic and action definitions
- Pipeline management for sales/projects

### **💰 Billing Engine** (Payment Processing)

- Multi-provider payment processing (Stripe, PayPal, Square)
- Subscription and usage-based billing
- Revenue management and reporting

### **📊 Tax Engine** (Country-Specific Invoicing)

- Multi-jurisdiction tax calculations
- Country-specific tax rules (VAT, GST, Sales Tax)
- Compliance with local regulations (Greek AADE, etc.)

### **🔌 Integration Engine**

- External API connectors and webhooks
- Data transformation and mapping
- Real-time and batch synchronization

### **🏪 Marketplace Engine**

- Component and module marketplace
- Revenue sharing for creators
- Installation and dependency management

### **🤖 AI Engine**

- Predictive insights and recommendations
- AI-powered assistants and automation
- Document processing and data extraction

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
