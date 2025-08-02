# Role Management API

Complete API documentation for the tenant role management system.

## Overview

The Role Management API provides endpoints for:

- **Role Template Discovery**: Find available role templates by vertical
- **Tenant Role Creation**: Create tenant-specific roles from templates
- **Role Management**: Manage tenant custom roles and permissions

## Base URL

```
http://localhost:8000/roles
```

## Endpoints

### 1. Get Role Templates

Get available role templates for tenant onboarding.

```http
GET /roles/templates?vertical={vertical}&include_generic={boolean}
```

**Parameters:**

- `vertical` (optional): Filter by industry vertical (`ecommerce`, `automotive`, `oilgas`, etc.)
- `include_generic` (optional): Include generic business roles (default: `true`)

**Example Request:**

```bash
curl "http://localhost:8000/roles/templates?vertical=ecommerce&include_generic=true"
```

**Example Response:**

```json
[
  {
    "role_id": "bus11111-1111-1111-1111-111111111111",
    "role_name": "BUSINESS_OWNER",
    "display_name": "Business Owner",
    "description": "Full access to business operations and settings",
    "category": "general",
    "vertical": null,
    "hierarchy_level": 3,
    "compliance_level": "critical",
    "metadata_json": {}
  },
  {
    "role_id": "eco11111-1111-1111-1111-111111111111",
    "role_name": "STORE_MANAGER",
    "display_name": "Store Manager",
    "description": "Manages online store operations, inventory, and team",
    "category": "ecommerce",
    "vertical": "ecommerce",
    "hierarchy_level": 4,
    "compliance_level": "enhanced",
    "metadata_json": {}
  }
]
```

### 2. Get Role Templates by Vertical

Get role templates grouped by industry vertical.

```http
GET /roles/templates/by-vertical?include_generic={boolean}
```

**Parameters:**

- `include_generic` (optional): Include generic business roles (default: `true`)

**Example Request:**

```bash
curl "http://localhost:8000/roles/templates/by-vertical"
```

**Example Response:**

```json
[
  {
    "vertical": null,
    "vertical_display_name": "Generic Business Roles",
    "role_count": 10,
    "roles": [
      {
        "role_id": "bus11111-1111-1111-1111-111111111111",
        "role_name": "BUSINESS_OWNER",
        "display_name": "Business Owner",
        "category": "general",
        "vertical": null,
        "hierarchy_level": 3,
        "compliance_level": "critical"
      }
    ]
  },
  {
    "vertical": "ecommerce",
    "vertical_display_name": "E-commerce & Retail",
    "role_count": 5,
    "roles": [
      {
        "role_id": "eco11111-1111-1111-1111-111111111111",
        "role_name": "STORE_MANAGER",
        "display_name": "Store Manager",
        "category": "ecommerce",
        "vertical": "ecommerce",
        "hierarchy_level": 4,
        "compliance_level": "enhanced"
      }
    ]
  }
]
```

### 3. Create Tenant Role from Template

Create a tenant-specific role from a template.

```http
POST /roles/tenant/{tenant_id}/create-from-template
```

**Request Body:**

```json
{
  "template_role_id": "eco11111-1111-1111-1111-111111111111",
  "custom_name": "STORE_ADMIN",
  "custom_display_name": "Store Administrator",
  "custom_description": "Customized store management role",
  "metadata_overrides": {
    "max_discount_percentage": 10
  }
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:8000/roles/tenant/12345678-1234-1234-1234-123456789012/create-from-template" \
  -H "Content-Type: application/json" \
  -d '{
    "template_role_id": "eco11111-1111-1111-1111-111111111111",
    "custom_name": "STORE_ADMIN"
  }'
```

**Example Response:**

```json
{
  "role_id": "new-role-id-1234-5678-9012",
  "tenant_id": "12345678-1234-1234-1234-123456789012",
  "role_name": "STORE_ADMIN",
  "display_name": "Store Administrator",
  "description": "Customized store management role",
  "category": "ecommerce",
  "vertical": "ecommerce",
  "is_template": false,
  "is_active": true,
  "hierarchy_level": 4,
  "parent_role_id": null,
  "compliance_level": "enhanced",
  "created_at": "2025-01-30T10:00:00Z",
  "updated_at": "2025-01-30T10:00:00Z"
}
```

### 4. Get Tenant Roles

Get all roles for a specific tenant.

```http
GET /roles/tenant/{tenant_id}?include_templates={boolean}
```

**Parameters:**

- `include_templates` (optional): Include template roles in response (default: `false`)

**Example Request:**

```bash
curl "http://localhost:8000/roles/tenant/12345678-1234-1234-1234-123456789012?include_templates=false"
```

**Example Response:**

```json
[
  {
    "role_id": "tenant-role-1234-5678-9012",
    "tenant_id": "12345678-1234-1234-1234-123456789012",
    "role_name": "STORE_ADMIN",
    "display_name": "Store Administrator",
    "description": "Customized store management role",
    "category": "ecommerce",
    "vertical": "ecommerce",
    "is_template": false,
    "is_active": true,
    "hierarchy_level": 4,
    "parent_role_id": null,
    "compliance_level": "enhanced",
    "created_at": "2025-01-30T10:00:00Z",
    "updated_at": "2025-01-30T10:00:00Z"
  }
]
```

### 5. Delete Tenant Role

Delete a tenant-specific role.

```http
DELETE /roles/tenant/{tenant_id}/role/{role_id}
```

**Example Request:**

```bash
curl -X DELETE "http://localhost:8000/roles/tenant/12345678-1234-1234-1234-123456789012/role/tenant-role-1234-5678-9012"
```

**Example Response:**

```json
{
  "message": "Role 'Store Administrator' deleted successfully"
}
```

### 6. API Health Check

Check the health of the role management API.

```http
GET /roles/health
```

**Example Response:**

```json
{
  "service": "Role Management API",
  "status": "healthy",
  "endpoints": [
    "GET /roles/templates",
    "GET /roles/templates/by-vertical",
    "POST /roles/tenant/{tenant_id}/create-from-template",
    "GET /roles/tenant/{tenant_id}",
    "DELETE /roles/tenant/{tenant_id}/role/{role_id}"
  ]
}
```

## Usage Scenarios

### Scenario 1: E-commerce Client Onboarding

```bash
# 1. Get e-commerce role templates
curl "http://localhost:8000/roles/templates?vertical=ecommerce"

# 2. Create tenant roles from templates
curl -X POST "http://localhost:8000/roles/tenant/{tenant_id}/create-from-template" \
  -H "Content-Type: application/json" \
  -d '{"template_role_id": "eco11111-1111-1111-1111-111111111111"}'

# 3. Verify tenant roles
curl "http://localhost:8000/roles/tenant/{tenant_id}"
```

### Scenario 2: Multi-vertical Setup

```bash
# 1. Get all available verticals
curl "http://localhost:8000/roles/templates/by-vertical"

# 2. Create mix of generic + vertical roles
curl -X POST "http://localhost:8000/roles/tenant/{tenant_id}/create-from-template" \
  -d '{"template_role_id": "bus11111-1111-1111-1111-111111111111"}' # Business Owner

curl -X POST "http://localhost:8000/roles/tenant/{tenant_id}/create-from-template" \
  -d '{"template_role_id": "auto1111-1111-1111-1111-111111111111"}' # Automotive Sales
```

### Scenario 3: Custom Role Management

```bash
# 1. Create custom role with overrides
curl -X POST "http://localhost:8000/roles/tenant/{tenant_id}/create-from-template" \
  -H "Content-Type: application/json" \
  -d '{
    "template_role_id": "fin11111-1111-1111-1111-111111111111",
    "custom_name": "SENIOR_RISK_ANALYST",
    "custom_display_name": "Senior Risk Analyst",
    "custom_description": "Enhanced risk management with trading authority"
  }'

# 2. Clean up unused roles
curl -X DELETE "http://localhost:8000/roles/tenant/{tenant_id}/role/{role_id}"
```

## Error Responses

### 404 - Not Found

```json
{
  "detail": "Template role not found"
}
```

### 400 - Bad Request

```json
{
  "detail": "Cannot delete role: 3 users are assigned to this role"
}
```

### 500 - Internal Server Error

```json
{
  "detail": "Failed to create tenant role from template"
}
```

## Integration with Frontend

The API is designed to work seamlessly with frontend onboarding flows:

1. **Vertical Selection**: Use `/templates/by-vertical` to show industry options
2. **Role Preview**: Use `/templates?vertical={selected}` to show available roles
3. **Bulk Setup**: Create multiple roles from templates for complete onboarding
4. **Management UI**: Use tenant-specific endpoints for ongoing role management

This provides a complete foundation for tenant role management in any industry vertical! 🚀
