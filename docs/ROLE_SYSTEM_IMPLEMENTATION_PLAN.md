# 🎯 **ROLE SYSTEM IMPLEMENTATION PLAN**

## **Generic Metadata-Driven Platform with Flexible Role Management**

**Version:** 1.0
**Date:** August 1, 2025
**Goal:** Create a flexible role system supporting both single-user and multi-user clients with tenant-specific customization

---

## 📊 **CURRENT ARCHITECTURE ANALYSIS**

### **✅ What Currently Works:**

- **System Roles:** Defined in `data/auth/roles/system-roles.json` with SAP-style hierarchy
- **Business Roles:** Defined in `data/auth/roles/business-roles.json` (currently maritime-specific)
- **Permissions:** System and business permissions in separate JSON files
- **Seeding System:** `seed_all.py` processes all JSON files with `tenant_id=NULL` for system roles
- **Database Model:** Support for both global (`tenant_id=NULL`) and tenant-specific roles

### **🔧 What Needs Fixing:**

- **Maritime References:** Business roles are maritime-specific, need to be generic
- **Tenant Custom Roles:** No mechanism for tenants to create custom roles
- **Client Flexibility:** Need to handle 1-user clients vs multi-user clients
- **Role Templates:** Need generic business role templates that any tenant can customize

---

## 🏗️ **NEW ROLE ARCHITECTURE DESIGN**

### **Four-Tier Role System:**

```
┌─ SYSTEM ROLES (Global, tenant_id=NULL)
│  ├─ SAP_SYSTEM_ADMIN
│  ├─ SAP_TENANT_ADMIN
│  ├─ SAP_BUSINESS_ADMIN
│  └─ SAP_POWER_USER
│
├─ GENERIC BUSINESS ROLE TEMPLATES (Global, tenant_id=NULL, is_template=true)
│  ├─ BUSINESS_OWNER
│  ├─ MANAGER
│  ├─ EMPLOYEE
│  ├─ ACCOUNTANT
│  └─ READ_ONLY_USER
│
├─ VERTICAL-SPECIFIC ROLE TEMPLATES (Global, tenant_id=NULL, is_template=true, vertical=specific)
│  ├─ E-COMMERCE: Store Manager, Inventory Clerk, Customer Service, Marketing Manager
│  ├─ AUTOMOTIVE: Sales Manager, Service Advisor, Parts Manager, Finance Manager
│  ├─ OIL & GAS: Operations Manager, Safety Officer, Field Technician, Compliance Officer
│  ├─ AGTECH: Farm Manager, Field Worker, Agronomist, Equipment Operator
│  ├─ FINTECH: Risk Manager, Compliance Officer, Customer Success, Product Manager
│  └─ INSURANCE: Underwriter, Claims Adjuster, Broker, Actuary
│
└─ TENANT CUSTOM ROLES (Tenant-specific, tenant_id=specific_uuid)
   ├─ Created by tenant admins
   ├─ Can inherit from any template (generic or vertical)
   └─ Fully customizable per tenant
```

---

## 📋 **IMPLEMENTATION PLAN**

### **Phase 1: Clean Up Business Roles (15 minutes)**

**🎯 Goal:** Remove maritime references, create generic business role templates

**Files to Modify:**

- `data/auth/roles/business-roles.json` (generic business templates)
- `data/auth/roles/ecommerce-roles.json` (new - e-commerce specific)
- `data/auth/roles/automotive-roles.json` (new - automotive specific)
- `data/auth/roles/oilgas-roles.json` (new - oil & gas specific)
- `data/auth/roles/agtech-roles.json` (new - agtech specific)
- `data/auth/roles/fintech-roles.json` (new - fintech specific)
- `data/auth/roles/insurance-roles.json` (new - insurance specific)
- `data/auth/permissions/business-permissions.json`

**Changes:**

1. **Replace Maritime Roles:**

```json
// OLD (Maritime-specific)
{
  "role_name": "MARITIME_OPERATIONS_MANAGER",
  "display_name": "Maritime Operations Manager",
  "description": "Manages maritime operations, shipping, and logistics",
  "category": "maritime"
}

// NEW (Generic Business)
{
  "role_name": "OPERATIONS_MANAGER",
  "display_name": "Operations Manager",
  "description": "Manages day-to-day business operations and workflows",
  "category": "business",
  "is_template": true
}
```

2. **Generic Business Role Templates:**

```json
// data/auth/roles/business-roles.json
[
  {
    "role_id": "aaaa1111-1111-1111-1111-111111111111",
    "role_name": "BUSINESS_OWNER",
    "display_name": "Business Owner",
    "description": "Full access to business operations and settings",
    "category": "business",
    "is_system_role": false,
    "is_template": true,
    "hierarchy_level": 3,
    "metadata_json": {
      "can_create_users": true,
      "can_modify_settings": true,
      "max_approval_amount": 1000000
    }
  },
  {
    "role_id": "bbbb2222-2222-2222-2222-222222222222",
    "role_name": "MANAGER",
    "display_name": "Manager",
    "description": "Supervises team operations and approves transactions",
    "category": "business",
    "is_system_role": false,
    "is_template": true,
    "hierarchy_level": 4,
    "metadata_json": {
      "can_approve_transactions": true,
      "max_approval_amount": 50000,
      "can_manage_team": true
    }
  },
  {
    "role_id": "cccc3333-3333-3333-3333-333333333333",
    "role_name": "EMPLOYEE",
    "display_name": "Employee",
    "description": "Standard employee access to business applications",
    "category": "business",
    "is_system_role": false,
    "is_template": true,
    "hierarchy_level": 5,
    "metadata_json": {
      "can_create_records": true,
      "can_edit_own_records": true
    }
  },
  {
    "role_id": "dddd4444-4444-4444-4444-444444444444",
    "role_name": "ACCOUNTANT",
    "display_name": "Accountant",
    "description": "Financial data access and reporting",
    "category": "finance",
    "is_system_role": false,
    "is_template": true,
    "hierarchy_level": 4,
    "metadata_json": {
      "can_access_financial_data": true,
      "can_generate_reports": true
    }
  },
  {
    "role_id": "eeee5555-5555-5555-5555-555555555555",
    "role_name": "READ_ONLY_USER",
    "display_name": "Read Only User",
    "description": "View-only access to business data",
    "category": "business",
    "is_system_role": false,
    "is_template": true,
    "hierarchy_level": 6,
    "metadata_json": {
      "read_only": true
    }
  }
]
```

3. **Vertical-Specific Role Templates:**

**E-Commerce Roles** (`data/auth/roles/ecommerce-roles.json`):

```json
[
  {
    "role_id": "ec001111-1111-1111-1111-111111111111",
    "role_name": "STORE_MANAGER",
    "display_name": "Store Manager",
    "description": "Manages all store operations, inventory, and staff",
    "category": "ecommerce",
    "vertical": "ecommerce",
    "is_system_role": false,
    "is_template": true,
    "hierarchy_level": 3,
    "metadata_json": {
      "can_manage_inventory": true,
      "can_process_refunds": true,
      "can_manage_staff": true,
      "max_refund_amount": 10000
    }
  },
  {
    "role_id": "ec002222-2222-2222-2222-222222222222",
    "role_name": "INVENTORY_CLERK",
    "display_name": "Inventory Clerk",
    "description": "Manages stock levels, receives shipments, processes orders",
    "category": "ecommerce",
    "vertical": "ecommerce",
    "is_system_role": false,
    "is_template": true,
    "hierarchy_level": 5,
    "metadata_json": {
      "can_update_inventory": true,
      "can_receive_shipments": true,
      "can_fulfill_orders": true
    }
  },
  {
    "role_id": "ec003333-3333-3333-3333-333333333333",
    "role_name": "CUSTOMER_SERVICE",
    "display_name": "Customer Service Representative",
    "description": "Handles customer inquiries, returns, and support tickets",
    "category": "ecommerce",
    "vertical": "ecommerce",
    "is_system_role": false,
    "is_template": true,
    "hierarchy_level": 5,
    "metadata_json": {
      "can_view_customer_data": true,
      "can_process_returns": true,
      "max_refund_amount": 500
    }
  }
]
```

**Automotive Roles** (`data/auth/roles/automotive-roles.json`):

```json
[
  {
    "role_id": "au001111-1111-1111-1111-111111111111",
    "role_name": "SALES_MANAGER",
    "display_name": "Sales Manager",
    "description": "Manages vehicle sales team and customer relationships",
    "category": "automotive",
    "vertical": "automotive",
    "is_system_role": false,
    "is_template": true,
    "hierarchy_level": 3,
    "metadata_json": {
      "can_approve_deals": true,
      "can_manage_inventory": true,
      "max_discount_percentage": 15
    }
  },
  {
    "role_id": "au002222-2222-2222-2222-222222222222",
    "role_name": "SERVICE_ADVISOR",
    "display_name": "Service Advisor",
    "description": "Schedules service appointments and manages customer service needs",
    "category": "automotive",
    "vertical": "automotive",
    "is_system_role": false,
    "is_template": true,
    "hierarchy_level": 4,
    "metadata_json": {
      "can_schedule_service": true,
      "can_create_estimates": true,
      "can_order_parts": true
    }
  }
]
```

**Oil & Gas Roles** (`data/auth/roles/oilgas-roles.json`):

```json
[
  {
    "role_id": "og001111-1111-1111-1111-111111111111",
    "role_name": "OPERATIONS_MANAGER",
    "display_name": "Operations Manager",
    "description": "Oversees field operations and safety compliance",
    "category": "oilgas",
    "vertical": "oilgas",
    "is_system_role": false,
    "is_template": true,
    "hierarchy_level": 3,
    "metadata_json": {
      "can_approve_permits": true,
      "can_manage_safety": true,
      "can_approve_maintenance": true
    }
  },
  {
    "role_id": "og002222-2222-2222-2222-222222222222",
    "role_name": "SAFETY_OFFICER",
    "display_name": "Safety Officer",
    "description": "Ensures safety compliance and manages safety protocols",
    "category": "oilgas",
    "vertical": "oilgas",
    "is_system_role": false,
    "is_template": true,
    "hierarchy_level": 4,
    "metadata_json": {
      "can_conduct_inspections": true,
      "can_issue_safety_orders": true,
      "can_stop_operations": true
    }
  }
]
```

### **Phase 2: Update Database Model (10 minutes)**

**🎯 Goal:** Add `is_template` and `vertical` fields to Role model

**File to Modify:**

- `services/api/app/models/auth.py` (or wherever Role model is defined)

**Changes:**

```python
class Role(Base):
    __tablename__ = "roles"

    # ... existing fields ...
    is_template = Column(Boolean, default=False)  # NEW: Mark role as template
    vertical = Column(String(50), nullable=True)  # NEW: Vertical industry (ecommerce, automotive, etc.)
    # ... rest of fields ...
```

### **Phase 3: Update Seeder for Templates (10 minutes)**

**🎯 Goal:** Handle `is_template` and `vertical` fields, load all vertical role files

**File to Modify:**

- `data/seed-scripts/seed_all.py`

**Changes:**

```python
# In seed_roles method, around line 147
async def seed_roles(self):
    """Seed role data."""
    logger.info("👥 Seeding roles...")

    # Load all role files (system, business, and vertical-specific)
    role_files = [
        "auth/roles/system-roles.json",          # System roles
        "auth/roles/business-roles.json",        # Generic business templates
        "auth/roles/ecommerce-roles.json",       # E-commerce vertical
        "auth/roles/automotive-roles.json",      # Automotive vertical
        "auth/roles/oilgas-roles.json",          # Oil & Gas vertical
        "auth/roles/agtech-roles.json",          # AgTech vertical
        "auth/roles/fintech-roles.json",         # FinTech vertical
        "auth/roles/insurance-roles.json"        # Insurance vertical
    ]

    all_roles = []
    for file_path in role_files:
        try:
            roles_data = self.load_json_data(file_path)
            all_roles.extend(roles_data)
            logger.info(f"✅ Loaded {len(roles_data)} roles from {file_path}")
        except FileNotFoundError:
            logger.warning(f"⚠️ Role file not found: {file_path} (skipping)")
            continue

    for role_data in all_roles:
        # Check if role already exists
        existing = await self.session.get(Role, role_data["role_id"])
        if existing:
            logger.info(f"⏭️ Role {role_data['role_name']} already exists")
            continue

        # Map JSON fields to model fields
        role = Role(
            role_id=role_data["role_id"],
            tenant_id=None,  # System roles and templates have NULL tenant_id
            name=role_data["role_name"],
            display_name=role_data["display_name"],
            description=role_data.get("description"),
            is_system_role=role_data.get("is_system_role", False),
            is_template=role_data.get("is_template", False),  # NEW: Handle templates
            vertical=role_data.get("vertical"),               # NEW: Handle vertical
            is_active=role_data.get("is_active", True),
            # ... rest of fields ...
        )
        self.session.add(role)
        logger.info(f"✅ Added role: {role.display_name}")
```

### **Phase 4: Create Tenant Role Management API (30 minutes)**

**🎯 Goal:** API endpoints for tenants to create custom roles

**Files to Create/Modify:**

- `services/api/app/api/tenant_roles.py` (new file)

**New API Endpoints:**

```python
@router.get("/tenant/{tenant_id}/roles")
async def get_tenant_roles(tenant_id: str):
    """Get all roles available to a tenant (system + custom)"""

@router.post("/tenant/{tenant_id}/roles")
async def create_tenant_role(tenant_id: str, role_data: CreateRoleRequest):
    """Create custom role for tenant (based on template or from scratch)"""

@router.post("/tenant/{tenant_id}/roles/from-template/{template_role_id}")
async def create_role_from_template(tenant_id: str, template_role_id: str):
    """Create tenant role based on a template"""

@router.put("/tenant/{tenant_id}/roles/{role_id}")
async def update_tenant_role(tenant_id: str, role_id: str, role_data: UpdateRoleRequest):
    """Update tenant-specific role"""

@router.delete("/tenant/{tenant_id}/roles/{role_id}")
async def delete_tenant_role(tenant_id: str, role_id: str):
    """Delete tenant-specific role (only non-system roles)"""
```

### **Phase 5: Frontend Role Management UI (45 minutes)**

**🎯 Goal:** UI for tenant admins to manage roles

**Components to Create:**

```typescript
// Role management components
-RoleManagementPage.tsx - // Main role management interface
  RoleTemplateSelector.tsx - // Choose from available templates
  CustomRoleEditor.tsx - // Create/edit custom roles
  RolePermissionMatrix.tsx - // Visual permission assignment
  UserRoleAssignment.tsx; // Assign roles to users
```

---

## 🎯 **CLIENT USAGE PATTERNS**

### **Vertical-Specific Onboarding:**

```typescript
// Client selects their vertical during signup
const verticalOnboarding = {
  step1: "Select Your Industry",
  options: [
    "ecommerce",
    "automotive",
    "oilgas",
    "agtech",
    "fintech",
    "insurance",
  ],

  step2: "Pre-configured Roles Available",
  selectedVertical: "ecommerce",
  availableRoles: [
    "STORE_MANAGER", // Vertical-specific
    "INVENTORY_CLERK", // Vertical-specific
    "CUSTOMER_SERVICE", // Vertical-specific
    "BUSINESS_OWNER", // Generic business
    "ACCOUNTANT", // Generic business
    "READ_ONLY_USER", // Generic business
  ],
};
```

### **Single-User E-Commerce Client:**

```typescript
// Simple setup - assign relevant roles for their vertical
const singleUserEcommerce = {
  vertical: "ecommerce",
  users: [
    {
      email: "owner@onlinestore.com",
      roles: ["BUSINESS_OWNER", "STORE_MANAGER"], // Combined permissions
    },
  ],
  // Gets all e-commerce permissions immediately
};
```

### **Multi-User Automotive Dealership:**

```typescript
// Complex setup - use vertical-specific roles + custom roles
const multiUserAutomotive = {
  vertical: "automotive",
  preConfiguredRoles: [
    "SALES_MANAGER", // From automotive-roles.json
    "SERVICE_ADVISOR", // From automotive-roles.json
    "ACCOUNTANT", // From business-roles.json
  ],
  customRoles: [
    {
      name: "PARTS_SPECIALIST",
      basedOnTemplate: "SERVICE_ADVISOR",
      customPermissions: ["manage_parts_inventory", "order_special_parts"],
    },
  ],
  users: [
    { email: "manager@dealership.com", roles: ["SALES_MANAGER"] },
    { email: "service@dealership.com", roles: ["SERVICE_ADVISOR"] },
    { email: "parts@dealership.com", roles: ["PARTS_SPECIALIST"] },
    { email: "finance@dealership.com", roles: ["ACCOUNTANT"] },
  ],
};
```

### **Oil & Gas Company (Safety-Critical):**

```typescript
// Industry-specific roles with strict hierarchy
const oilGasCompany = {
  vertical: "oilgas",
  users: [
    {
      email: "ops@oilco.com",
      roles: ["OPERATIONS_MANAGER"],
      metadata: { can_stop_operations: true },
    },
    {
      email: "safety@oilco.com",
      roles: ["SAFETY_OFFICER"],
      metadata: { safety_certification_required: true },
    },
  ],
  // Inherits safety compliance requirements from vertical
};
```

---

## 🔍 **SEED_ALL.PY COMPATIBILITY**

### **Current Behavior (No Changes Needed):**

- ✅ Loads `system-roles.json` and `business-roles.json`
- ✅ Creates roles with `tenant_id=NULL` (global/system roles)
- ✅ Maps JSON fields to database fields correctly

### **New Behavior (With Changes):**

- ✅ Will process `is_template` field from JSON
- ✅ Templates saved as `tenant_id=NULL, is_template=true`
- ✅ System roles saved as `tenant_id=NULL, is_system_role=true`
- ✅ Tenant-specific roles created via API (not JSON seeding)

### **JSON Structure Compatibility:**

```json
// Existing structure (no breaking changes)
{
  "role_id": "uuid",
  "role_name": "ROLE_NAME",
  "display_name": "Display Name",
  "description": "Description",
  "category": "business",
  "is_system_role": false,
  "is_template": true, // NEW: Optional field
  "is_active": true,
  "hierarchy_level": 4,
  "parent_role_id": null,
  "compliance_level": "standard",
  "metadata_json": {},
  "created_at": "2025-01-30T00:00:00Z",
  "updated_at": "2025-01-30T00:00:00Z"
}
```

---

## ✅ **TESTING CHECKLIST**

### **Phase 1 Testing:**

- [ ] `seed_all.py` runs without errors
- [ ] Generic business roles appear in database
- [ ] No maritime references remain
- [ ] Role hierarchy maintains proper levels

### **Phase 2-3 Testing:**

- [ ] Database migration adds `is_template` column
- [ ] Templates seeded correctly with `is_template=true`
- [ ] System roles unchanged

### **Phase 4-5 Testing:**

- [ ] Tenant can create custom role from template
- [ ] Tenant can create role from scratch
- [ ] Role permissions work correctly
- [ ] Users can be assigned custom roles
- [ ] Single-user and multi-user patterns work

---

## 🚀 **IMPLEMENTATION ORDER**

### **Immediate (Today):**

1. **Phase 1:** Clean business-roles.json (15 min)
2. **Phase 2:** Add is_template to Role model (10 min)
3. **Phase 3:** Update seed_all.py (5 min)
4. **Test:** Run seeder and verify generic roles work

### **Next Session:**

5. **Phase 4:** Build tenant role management API (30 min)
6. **Phase 5:** Create basic role management UI (45 min)
7. **Integration Testing:** End-to-end role creation and assignment

---

## 📋 **SUCCESS CRITERIA**

### **Generic Platform:**

- ✅ No hardcoded industry dependencies
- ✅ Works for any business type
- ✅ Configurable role templates (generic + vertical)

### **Vertical-Specific Value:**

- ✅ **Immediate Domain Expertise:** Pre-configured roles show industry knowledge
- ✅ **Faster Onboarding:** Clients get relevant roles out-of-the-box
- ✅ **Competitive Advantage:** Industry-specific vs generic platforms
- ✅ **Scalable:** Easy to add new verticals without code changes

### **Client Flexibility:**

- ✅ **Small Clients:** Simple role assignment (1-2 roles)
- ✅ **Medium Clients:** Mix of pre-configured + custom roles
- ✅ **Enterprise Clients:** Complex hierarchies with vertical expertise
- ✅ **Any Vertical:** E-commerce, automotive, oil & gas, agtech, fintech, insurance

### **Maintainability:**

- ✅ **seed_all.py compatibility** maintained
- ✅ **Clear separation:** system vs generic vs vertical vs custom roles
- ✅ **Easy expansion:** Add new verticals by creating JSON files
- ✅ **No code changes:** New roles added via data, not code

### **Business Value:**

- ✅ **Sales Advantage:** "We have pre-built automotive roles" vs "generic platform"
- ✅ **Customer Success:** Faster time-to-value for new clients
- ✅ **Market Positioning:** Industry expert vs generalist platform
- ✅ **Expansion Ready:** Simple to add manufacturing, healthcare, etc.

---

**🎯 Ready to start with Phase 1? This enhanced plan gives you both generic flexibility AND vertical expertise - the best of both worlds! Your platform will demonstrate industry knowledge while remaining completely adaptable to any business need.**
