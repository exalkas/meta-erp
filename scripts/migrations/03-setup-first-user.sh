#!/bin/bash

# SAP-Style First User Setup Script
# Creates first business user with authentication methods in tenant database
# Compatible with Linux/macOS - uses text indicators for better compatibility

set -e  # Exit on any error

# Default values
TENANT_SLUG="demo-eshop-crm"
DATABASE_NAME="metadata_tenant_demo_eshop_crm"
MASTER_DATABASE="metadata_platform_master_development"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD=""
ADMIN_EMAIL="admin@demo-eshop-crm.local"
ADMIN_PASSWORD=""
CREATE_TEST_USERS=false
FORCE=false

# Text-based indicators for better compatibility
OK="[OK]"
ERR="[ERROR]"
INFO="[INFO]"
WARN="[WARN]"

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --tenant-slug)
            TENANT_SLUG="$2"
            shift 2
            ;;
        --database-name)
            DATABASE_NAME="$2"
            shift 2
            ;;
        --master-database)
            MASTER_DATABASE="$2"
            shift 2
            ;;
        --postgres-user)
            POSTGRES_USER="$2"
            shift 2
            ;;
        --postgres-password)
            POSTGRES_PASSWORD="$2"
            shift 2
            ;;
        --admin-email)
            ADMIN_EMAIL="$2"
            shift 2
            ;;
        --admin-password)
            ADMIN_PASSWORD="$2"
            shift 2
            ;;
        --create-test-users)
            CREATE_TEST_USERS=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --tenant-slug         Tenant identifier (default: demo-eshop-crm)"
            echo "  --database-name       Tenant database name (default: metadata_tenant_demo_eshop_crm)"
            echo "  --master-database     Master database name (default: metadata_platform_master_development)"
            echo "  --postgres-user       PostgreSQL user (default: postgres)"
            echo "  --postgres-password   PostgreSQL password (default: empty)"
            echo "  --admin-email         Admin user email (default: admin@demo-eshop-crm.local)"
            echo "  --admin-password      Admin user password (default: )"
            echo "  --create-test-users   Create additional test users"
            echo "  --force              Recreate existing users"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}SAP-STYLE FIRST USER SETUP${NC}"
echo -e "${GREEN}===========================${NC}"
echo -e "${CYAN}$INFO Tenant: $TENANT_SLUG${NC}"
echo -e "${CYAN}$INFO Database: $DATABASE_NAME${NC}"
echo -e "${CYAN}$INFO Admin Email: $ADMIN_EMAIL${NC}"
echo ""

# Get PostgreSQL path
get_postgresql_path() {
    local paths=(
        "/usr/bin/psql"
        "/usr/local/bin/psql"
        "/opt/postgresql/bin/psql"
        "/usr/local/pgsql/bin/psql"
    )
    
    for path in "${paths[@]}"; do
        if [[ -f "$path" ]]; then
            echo "$path"
            return
        fi
    done
    
    # Try from PATH
    if command -v psql &> /dev/null; then
        which psql
        return
    fi
    
    echo ""
}

PSQL_PATH=$(get_postgresql_path)

if [[ -z "$PSQL_PATH" ]]; then
    echo -e "${RED}$ERR PostgreSQL (psql) not found${NC}"
    echo -e "${YELLOW}$INFO Please install PostgreSQL or add it to your PATH${NC}"
    exit 1
fi

echo -e "${GREEN}$OK Found PostgreSQL: $PSQL_PATH${NC}"

# Setup PostgreSQL password environment
setup_postgres_password() {
    if [[ -n "$POSTGRES_PASSWORD" ]]; then
        export PGPASSWORD="$POSTGRES_PASSWORD"
    fi
}

# Clear PostgreSQL password environment
clear_postgres_password() {
    if [[ -n "$POSTGRES_PASSWORD" ]]; then
        unset PGPASSWORD
    fi
}

test_database_exists() {
    local db_name="$1"
    local result
    setup_postgres_password
    result=$($PSQL_PATH -U "$POSTGRES_USER" -d postgres -c "SELECT 1 FROM pg_database WHERE datname='$db_name';" -t 2>/dev/null || echo "")
    clear_postgres_password
    [[ "$result" =~ "1" ]]
}

test_database_connection() {
    local db_name="$1"
    setup_postgres_password
    $PSQL_PATH -U "$POSTGRES_USER" -d "$db_name" -c "SELECT 1;" -q &>/dev/null
    local exit_code=$?
    clear_postgres_password
    return $exit_code
}

test_prerequisites() {
    # Check Master database exists
    if ! test_database_exists "$MASTER_DATABASE"; then
        echo -e "${RED}$ERR Master database not found: $MASTER_DATABASE${NC}"
        echo -e "${YELLOW}$INFO Please run 01-setup-master-db.sh first${NC}"
        return 1
    fi
    
    # Check Tenant database exists
    if ! test_database_exists "$DATABASE_NAME"; then
        echo -e "${RED}$ERR Tenant database not found: $DATABASE_NAME${NC}"
        echo -e "${YELLOW}$INFO Please run 02-setup-tenant-db.sh first${NC}"
        return 1
    fi
    
    return 0
}

get_tenant_id() {
    local tenant_slug="$1"
    local result
    
    setup_postgres_password
    result=$($PSQL_PATH -U "$POSTGRES_USER" -d "$MASTER_DATABASE" -c "SELECT tenant_id FROM tenant_registry WHERE tenant_slug = '$tenant_slug';" -t 2>/dev/null | head -1 | xargs)
    clear_postgres_password
    
    if [[ -z "$result" ]]; then
        echo -e "${RED}$ERR Tenant not found in registry: $tenant_slug${NC}"
        return 1
    fi
    
    echo "$result"
}

create_admin_user() {
    local tenant_id="$1"
    local email="$2"
    local password="$3"
    
    echo -e "${YELLOW}Creating admin user: $email${NC}"
    
    # Check if user already exists
    local user_exists
    setup_postgres_password
    user_exists=$($PSQL_PATH -U "$POSTGRES_USER" -d "$DATABASE_NAME" -c "SELECT COUNT(*) FROM users WHERE email = '$email';" -t 2>/dev/null | head -1 | xargs)
    clear_postgres_password
    
    if [[ "$user_exists" -gt 0 ]]; then
        if $FORCE; then
            echo -e "${YELLOW}   $WARN User exists. Force flag provided - deleting existing user...${NC}"
            
            setup_postgres_password
            $PSQL_PATH -U "$POSTGRES_USER" -d "$DATABASE_NAME" -c "DELETE FROM users WHERE email = '$email';" -q &>/dev/null
            clear_postgres_password
            
            echo -e "${GREEN}   $OK Existing user deleted${NC}"
        else
            echo -e "${YELLOW}   $WARN User already exists: $email${NC}"
            echo -e "${BLUE}   $INFO Use --force to recreate user${NC}"
            return 0
        fi
    fi
    
    # bcrypt hash for  (cost factor 12)
    local password_hash='$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8J.0tnvjE/LbJnLbJnL'
    
    local user_sql="INSERT INTO users (
    tenant_id, 
    email, 
    first_name, 
    last_name,
    display_name,
    is_active, 
    is_verified, 
    email_verified,
    role,
    compliance_level,
    preferred_language,
    timezone
) VALUES (
    '$tenant_id',
    '$email',
    'Admin',
    'User',
    'Admin User',
    true,
    true,
    true,
    'admin',
    'ENHANCED',
    'en-US',
    'UTC'
);"
    
    setup_postgres_password
    if $PSQL_PATH -U "$POSTGRES_USER" -d "$DATABASE_NAME" -c "$user_sql" -q &>/dev/null; then
        clear_postgres_password
        echo -e "${GREEN}$OK Admin user created successfully${NC}"
        return 0
    else
        clear_postgres_password
        echo -e "${RED}$ERR Failed to create admin user${NC}"
        return 1
    fi
}

create_auth_method() {
    local tenant_id="$1"
    local email="$2"
    local password_hash="$3"
    
    echo -e "${YELLOW}Creating password authentication method...${NC}"
    
    # Check if auth method already exists
    local auth_exists
    setup_postgres_password
    auth_exists=$($PSQL_PATH -U "$POSTGRES_USER" -d "$DATABASE_NAME" -c "SELECT COUNT(*) FROM auth_methods am JOIN users u ON am.user_id = u.user_id WHERE u.email = '$email' AND am.method_type = 'PASSWORD';" -t 2>/dev/null | head -1 | xargs)
    clear_postgres_password
    
    if [[ "$auth_exists" -gt 0 ]]; then
        if $FORCE; then
            echo -e "${YELLOW}   $WARN Authentication method exists. Force flag provided - deleting existing method...${NC}"
            
            setup_postgres_password
            $PSQL_PATH -U "$POSTGRES_USER" -d "$DATABASE_NAME" -c "DELETE FROM auth_methods WHERE user_id = (SELECT user_id FROM users WHERE email = '$email') AND method_type = 'PASSWORD';" -q &>/dev/null
            clear_postgres_password
            
            echo -e "${GREEN}   $OK Existing authentication method deleted${NC}"
        else
            echo -e "${YELLOW}   $WARN Authentication method already exists for: $email${NC}"
            echo -e "${BLUE}   $INFO Use --force to recreate authentication method${NC}"
            return 0
        fi
    fi
    
    local auth_sql="INSERT INTO auth_methods (
    user_id, 
    tenant_id, 
    method_type, 
    is_primary,
    is_enabled,
    password_hash
) VALUES (
    (SELECT user_id FROM users WHERE email = '$email'),
    '$tenant_id',
    'PASSWORD',
    true,
    true,
    '$password_hash'
);"
    
    setup_postgres_password
    if $PSQL_PATH -U "$POSTGRES_USER" -d "$DATABASE_NAME" -c "$auth_sql" -q &>/dev/null; then
        clear_postgres_password
        echo -e "${GREEN}$OK Password authentication method created${NC}"
        return 0
    else
        clear_postgres_password
        echo -e "${RED}$ERR Failed to create authentication method${NC}"
        return 1
    fi
}

create_test_users() {
    local tenant_id="$1"
    
    echo -e "${YELLOW}Creating additional test users...${NC}"
    
    local password_hash='$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8J.0tnvjE/LbJnLbJnL'
    
    local test_users_sql="INSERT INTO users (
    tenant_id, email, first_name, last_name, display_name,
    is_active, is_verified, email_verified, role, compliance_level
) VALUES 
(
    '$tenant_id',
    'manager@demo-eshop-crm.local', 
    'Store', 
    'Manager', 
    'Store Manager',
    true, true, true, 'manager', 'BASIC'
),
(
    '$tenant_id',
    'staff@demo-eshop-crm.local', 
    'Store', 
    'Staff', 
    'Store Staff',
    true, true, true, 'staff', 'BASIC'
);

INSERT INTO auth_methods (user_id, tenant_id, method_type, is_primary, is_enabled, password_hash)
SELECT 
    u.user_id,
    u.tenant_id,
    'PASSWORD',
    true,
    true,
    '$password_hash'
FROM users u 
WHERE u.email IN ('manager@demo-eshop-crm.local', 'staff@demo-eshop-crm.local');"
    
    setup_postgres_password
    if $PSQL_PATH -U "$POSTGRES_USER" -d "$DATABASE_NAME" -c "$test_users_sql" -q &>/dev/null; then
        clear_postgres_password
        echo -e "${GREEN}$OK Test users created successfully${NC}"
        return 0
    else
        clear_postgres_password
        echo -e "${RED}$ERR Failed to create test users${NC}"
        return 1
    fi
}

test_user_creation() {
    local database_name="$1"
    
    echo -e "${YELLOW}Testing user creation...${NC}"
    
    setup_postgres_password
    
    # Test user count
    local user_count
    user_count=$($PSQL_PATH -U "$POSTGRES_USER" -d "$database_name" -c "SELECT COUNT(*) FROM users;" -t 2>/dev/null | head -1 | xargs)
    
    echo -e "${GREEN}   $OK Users created: $user_count${NC}"
    
    # Test authentication methods
    local auth_count
    auth_count=$($PSQL_PATH -U "$POSTGRES_USER" -d "$database_name" -c "SELECT COUNT(*) FROM auth_methods;" -t 2>/dev/null | head -1 | xargs)
    
    echo -e "${GREEN}   $OK Authentication methods: $auth_count${NC}"
    
    # Test admin user specifically
    local admin_count
    admin_count=$($PSQL_PATH -U "$POSTGRES_USER" -d "$database_name" -c "SELECT COUNT(*) FROM users WHERE role = 'admin';" -t 2>/dev/null | head -1 | xargs)
    
    if [[ "$admin_count" -eq 1 ]]; then
        echo -e "${GREEN}   $OK Admin user verified${NC}"
    else
        echo -e "${YELLOW}   $WARN Admin user count: $admin_count (expected 1)${NC}"
    fi
    
    clear_postgres_password
    
    return 0
}

# Main execution flow
echo -e "${CYAN}Checking prerequisites...${NC}"

if ! test_prerequisites; then
    exit 1
fi

echo -e "${GREEN}$OK Prerequisites verified${NC}"

# Get tenant ID
tenant_id=$(get_tenant_id "$TENANT_SLUG")
if [[ $? -ne 0 ]]; then
    exit 1
fi

echo -e "${GREEN}$OK Tenant ID: $tenant_id${NC}"

# Step 1: Create admin user
echo ""
echo -e "${CYAN}Step 1: Creating admin user${NC}"
if ! create_admin_user "$tenant_id" "$ADMIN_EMAIL" "$ADMIN_PASSWORD"; then
    exit 1
fi

# Step 2: Create authentication method
echo ""
echo -e "${CYAN}Step 2: Creating authentication method${NC}"
password_hash='$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8J.0tnvjE/LbJnLbJnL'
if ! create_auth_method "$tenant_id" "$ADMIN_EMAIL" "$password_hash"; then
    exit 1
fi

# Step 3: Create test users (optional)
if $CREATE_TEST_USERS; then
    echo ""
    echo -e "${CYAN}Step 3: Creating test users${NC}"
    create_test_users "$tenant_id"
fi

# Step 4: Test user creation
echo ""
echo -e "${CYAN}Step 4: Testing user creation${NC}"
if ! test_user_creation "$DATABASE_NAME"; then
    echo -e "${YELLOW}$WARN Users created but tests failed${NC}"
fi

# Success!
echo ""
echo -e "${GREEN}===============================${NC}"
echo -e "${GREEN}SAP-STYLE FIRST USER SETUP COMPLETE!${NC}"
echo -e "${GREEN}===============================${NC}"
echo ""
echo -e "${CYAN}$INFO User Accounts Created:${NC}"
echo -e "${WHITE}   Admin Email:    $ADMIN_EMAIL${NC}"
echo -e "${WHITE}   Admin Password: $ADMIN_PASSWORD${NC}"
if $CREATE_TEST_USERS; then
    echo -e "${WHITE}   Manager Email:  manager@demo-eshop-crm.local${NC}"
    echo -e "${WHITE}   Manager Password: ${NC}"
    echo -e "${WHITE}   Staff Email:    staff@demo-eshop-crm.local${NC}"
    echo -e "${WHITE}   Staff Password: ${NC}"
fi
echo ""
echo -e "${CYAN}$INFO Next Steps:${NC}"
echo -e "${WHITE}   1. Start authentication service:   npm run dev:auth${NC}"
echo -e "${WHITE}   2. Test login when auth service ready:${NC}"
echo -e "${GRAY}      curl -X POST http://localhost:8001/auth/login -H \"Content-Type: application/json\" -d '{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}'${NC}"
echo ""
echo -e "${CYAN}$INFO Database Information:${NC}"
echo -e "${WHITE}   Tenant Database: $DATABASE_NAME${NC}"
echo -e "${WHITE}   Users Table:     users${NC}"
echo -e "${WHITE}   Auth Methods:    auth_methods${NC}"
echo ""
echo -e "${GREEN}$OK Ready for authentication service!${NC}" 