#!/bin/bash

# SAP-Style Tenant Database Setup Script
# Creates Tenant database with business tables and authentication schema
# Compatible with Linux/macOS - uses text indicators for better compatibility

set -e  # Exit on any error

# Default values
TENANT_NAME="Demo E-shop CRM & ERP"
TENANT_SLUG="demo-eshop-crm"
DATABASE_NAME="metadata_tenant_demo_eshop_crm"
INDUSTRY_VERTICAL="ECOMMERCE"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD=""
MASTER_DATABASE="metadata_platform_master_development"
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
        --tenant-name)
            TENANT_NAME="$2"
            shift 2
            ;;
        --tenant-slug)
            TENANT_SLUG="$2"
            shift 2
            ;;
        --database-name)
            DATABASE_NAME="$2"
            shift 2
            ;;
        --industry-vertical)
            INDUSTRY_VERTICAL="$2"
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
        --master-database)
            MASTER_DATABASE="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --tenant-name         Display name for tenant (default: Demo E-shop CRM & ERP)"
            echo "  --tenant-slug         URL-safe tenant identifier (default: demo-eshop-crm)"
            echo "  --database-name       Tenant database name (default: metadata_tenant_demo_eshop_crm)"
            echo "  --industry-vertical   Industry type (default: ECOMMERCE)"
            echo "  --postgres-user       PostgreSQL user (default: postgres)"
            echo "  --postgres-password   PostgreSQL password (default: empty)"
            echo "  --master-database     Master database name (default: metadata_platform_master_development)"
            echo "  --force              Recreate if database exists"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}SAP-STYLE TENANT DATABASE SETUP${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "${CYAN}$INFO Tenant: $TENANT_NAME${NC}"
echo -e "${CYAN}$INFO Database: $DATABASE_NAME${NC}"
echo -e "${CYAN}$INFO Industry: $INDUSTRY_VERTICAL${NC}"
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

test_master_database() {
    if ! test_database_exists "$MASTER_DATABASE"; then
        echo -e "${RED}$ERR Master database not found: $MASTER_DATABASE${NC}"
        echo -e "${YELLOW}$INFO Please run 01-setup-master-db.sh first${NC}"
        return 1
    fi
    return 0
}

create_tenant_database() {
    local db_name="$1"
    
    echo -e "${YELLOW}Creating Tenant database: $db_name${NC}"
    
    setup_postgres_password
    if $PSQL_PATH -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$db_name\";" &>/dev/null; then
        clear_postgres_password
        if test_database_connection "$db_name"; then
            echo -e "${GREEN}$OK Tenant database created successfully${NC}"
            return 0
        else
            echo -e "${RED}$ERR Failed to create Tenant database${NC}"
            return 1
        fi
    else
        clear_postgres_password
        echo -e "${RED}$ERR Error creating Tenant database${NC}"
        return 1
    fi
}

apply_sql_file() {
    local db_name="$1"
    local sql_file="$2"
    
    if [[ ! -f "$sql_file" ]]; then
        echo -e "${RED}$ERR SQL file not found: $sql_file${NC}"
        return 1
    fi
    
    echo -e "${GRAY}   Applying: $(basename "$sql_file")${NC}"
    
    setup_postgres_password
    if $PSQL_PATH -U "$POSTGRES_USER" -d "$db_name" -f "$sql_file" -v ON_ERROR_STOP=1 -q &>/dev/null; then
        clear_postgres_password
        echo -e "${GREEN}      $OK Applied successfully${NC}"
        return 0
    else
        clear_postgres_password
        echo -e "${RED}      $ERR Failed to apply${NC}"
        return 1
    fi
}

apply_tenant_schema() {
    local db_name="$1"
    
    echo -e "${YELLOW}Applying Tenant database schema...${NC}"
    
    local schema_files=(
        "sql/tenant/01-business-users.sql"
    )
    
    local all_success=true
    
    for file in "${schema_files[@]}"; do
        if ! apply_sql_file "$db_name" "$file"; then
            all_success=false
        fi
    done
    
    if $all_success; then
        echo -e "${GREEN}$OK Tenant schema applied successfully${NC}"
    else
        echo -e "${RED}$ERR Some schema files failed to apply${NC}"
    fi
    
    $all_success
}

register_tenant_in_master() {
    local tenant_name="$1"
    local tenant_slug="$2"
    local db_name="$3"
    local industry="$4"
    
    echo -e "${YELLOW}Registering tenant in Master database...${NC}"
    
    local sql="INSERT INTO tenant_registry (
    tenant_id, 
    tenant_name, 
    tenant_slug, 
    database_name,
    industry_vertical, 
    status,
    business_name,
    subscription_tier
) VALUES (
    gen_random_uuid(), 
    '$tenant_name', 
    '$tenant_slug',
    '$db_name', 
    '$industry', 
    'active',
    '$tenant_name',
    'starter'
);"
    
    setup_postgres_password
    if $PSQL_PATH -U "$POSTGRES_USER" -d "$MASTER_DATABASE" -c "$sql" -q &>/dev/null; then
        clear_postgres_password
        echo -e "${GREEN}$OK Tenant registered in Master database${NC}"
        return 0
    else
        clear_postgres_password
        echo -e "${RED}$ERR Failed to register tenant${NC}"
        return 1
    fi
}

test_tenant_database() {
    local db_name="$1"
    local tenant_slug="$2"
    
    echo -e "${YELLOW}Testing Tenant database setup...${NC}"
    
    setup_postgres_password
    
    # Test business tables
    local business_tables
    business_tables=$($PSQL_PATH -U "$POSTGRES_USER" -d "$db_name" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('users', 'auth_sessions', 'auth_methods', 'customers', 'products', 'orders');" -t 2>/dev/null | xargs)
    
    if [[ "$business_tables" -ge 6 ]]; then
        echo -e "${GREEN}   $OK Business tables: $business_tables found${NC}"
    else
        echo -e "${YELLOW}   $WARN Business tables: Only $business_tables found (expected 6+)${NC}"
    fi
    
    # Test tenant registration in master
    local tenant_registration
    tenant_registration=$($PSQL_PATH -U "$POSTGRES_USER" -d "$MASTER_DATABASE" -c "SELECT COUNT(*) FROM tenant_registry WHERE tenant_slug = '$tenant_slug';" -t 2>/dev/null | xargs)
    
    if [[ "$tenant_registration" -eq 1 ]]; then
        echo -e "${GREEN}   $OK Tenant registered in Master database${NC}"
    else
        echo -e "${YELLOW}   $WARN Tenant registration not found in Master${NC}"
    fi
    
    clear_postgres_password
    
    return 0
}

# Main execution flow
echo -e "${CYAN}Checking prerequisites...${NC}"

# Check Master database exists
if ! test_master_database; then
    exit 1
fi

echo -e "${GREEN}$OK Master database verified${NC}"

# Check if Tenant database already exists
if test_database_exists "$DATABASE_NAME"; then
    if $FORCE; then
        echo -e "${YELLOW}$WARN Tenant database exists. Force flag provided - dropping and recreating...${NC}"
        
        setup_postgres_password
        if $PSQL_PATH -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DATABASE_NAME\";" &>/dev/null; then
            clear_postgres_password
            echo -e "${GREEN}$OK Existing database dropped${NC}"
        else
            clear_postgres_password
            echo -e "${RED}$ERR Failed to drop existing database${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}$WARN Tenant database already exists: $DATABASE_NAME${NC}"
        echo -e "${YELLOW}Use --force to recreate, or choose a different name with --database-name${NC}"
        exit 1
    fi
fi

# Step 1: Create Tenant database
echo ""
echo -e "${CYAN}Step 1: Creating Tenant database${NC}"
if ! create_tenant_database "$DATABASE_NAME"; then
    exit 1
fi

# Step 2: Apply Tenant schema
echo ""
echo -e "${CYAN}Step 2: Applying Tenant schema${NC}"
if ! apply_tenant_schema "$DATABASE_NAME"; then
    exit 1
fi

# Step 3: Register tenant in Master
echo ""
echo -e "${CYAN}Step 3: Registering tenant in Master database${NC}"
if ! register_tenant_in_master "$TENANT_NAME" "$TENANT_SLUG" "$DATABASE_NAME" "$INDUSTRY_VERTICAL"; then
    exit 1
fi

# Step 4: Test Tenant database
echo ""
echo -e "${CYAN}Step 4: Testing Tenant database${NC}"
if ! test_tenant_database "$DATABASE_NAME" "$TENANT_SLUG"; then
    echo -e "${YELLOW}$WARN Tenant database created but tests failed${NC}"
fi

# Success!
echo ""
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}SAP-STYLE TENANT DATABASE SETUP COMPLETE!${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""
echo -e "${CYAN}$INFO Next Steps:${NC}"
echo -e "${WHITE}   1. Create first user:              ./scripts/migrations/03-setup-first-user.sh${NC}"
echo -e "${WHITE}   2. Start authentication service:   npm run dev:auth${NC}"
echo -e "${WHITE}   3. Install industry packages:      npm run sap:install-ecommerce${NC}"
echo ""
echo -e "${CYAN}$INFO Database Information:${NC}"
echo -e "${WHITE}   Tenant Name:    $TENANT_NAME${NC}"
echo -e "${WHITE}   Tenant Slug:    $TENANT_SLUG${NC}"
echo -e "${WHITE}   Database Name:  $DATABASE_NAME${NC}"
echo -e "${WHITE}   Industry:       $INDUSTRY_VERTICAL${NC}"
echo -e "${WHITE}   PostgreSQL:     $PSQL_PATH${NC}"
echo ""
echo -e "${CYAN}$INFO Connection Details:${NC}"
echo -e "${WHITE}   Host: localhost${NC}"
echo -e "${WHITE}   Port: 5432${NC}"
echo -e "${WHITE}   Database: $DATABASE_NAME${NC}"
echo -e "${WHITE}   User: $POSTGRES_USER${NC}"
echo ""
echo -e "${GREEN}$OK Ready for first user creation!${NC}" 