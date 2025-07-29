#!/bin/bash

# SAP-Style Master Database Setup Script
# Creates Master database with SAP customizing tables and component catalog
# Compatible with Linux/macOS - uses text indicators for better compatibility

set -e  # Exit on any error

# Default values
DATABASE_NAME="metadata_platform_master_development"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD=""
ENVIRONMENT="development"
FORCE=false
SKIP_SEEDING=false

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
        --database-name)
            DATABASE_NAME="$2"
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
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --skip-seeding)
            SKIP_SEEDING=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --database-name    Master database name (default: metadata_platform_master_development)"
            echo "  --postgres-user    PostgreSQL user (default: postgres)"
            echo "  --postgres-password    PostgreSQL password (default: empty)"
            echo "  --environment      Environment (default: development)"
            echo "  --force           Drop existing database if it exists"
            echo "  --skip-seeding    Skip data seeding step"
            echo "  -h, --help        Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}SAP-STYLE MASTER DATABASE SETUP${NC}"
echo -e "${GREEN}===============================${NC}"
echo -e "${CYAN}$INFO Database: $DATABASE_NAME${NC}"
echo -e "${CYAN}$INFO Environment: $ENVIRONMENT${NC}"
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

create_master_database() {
    local db_name="$1"
    
    echo -e "${YELLOW}Creating Master database: $db_name${NC}"
    
    setup_postgres_password
    if $PSQL_PATH -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$db_name\";" &>/dev/null; then
        clear_postgres_password
        if test_database_connection "$db_name"; then
            echo -e "${GREEN}$OK Master database created successfully${NC}"
            return 0
        else
            echo -e "${RED}$ERR Failed to create Master database${NC}"
            return 1
        fi
    else
        clear_postgres_password
        echo -e "${RED}$ERR Error creating Master database${NC}"
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

apply_master_schema() {
    local db_name="$1"
    
    echo -e "${YELLOW}Applying Master database schema...${NC}"
    
    local schema_files=(
        "sql/master/01-sap-customizing-tables.sql"
        "sql/master/02-component-catalog.sql"
    )
    
    local all_success=true
    
    for file in "${schema_files[@]}"; do
        if ! apply_sql_file "$db_name" "$file"; then
            all_success=false
        fi
    done
    
    if $all_success; then
        echo -e "${GREEN}$OK Master schema applied successfully${NC}"
    else
        echo -e "${RED}$ERR Some schema files failed to apply${NC}"
    fi
    
    $all_success
}

seed_master_data() {
    local db_name="$1"
    
    if $SKIP_SEEDING; then
        echo -e "${YELLOW}$WARN Skipping data seeding (--skip-seeding flag)${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}$INFO Seeding Master database with basic data...${NC}"
    
    # For Phase 1, we only need basic schema - no additional seeding required
    echo -e "${GRAY}   $INFO Basic schema created - no additional seeding needed for Phase 1${NC}"
    echo -e "${GRAY}   $INFO Industry packages and reference data will be added in Phase 2${NC}"
    
    echo -e "${GREEN}$OK Master database ready for Phase 1${NC}"
    return 0
}

test_master_database() {
    local db_name="$1"
    
    echo -e "${YELLOW}Testing Master database setup...${NC}"
    
    setup_postgres_password
    
    # Test SAP customizing tables
    local auth_tables
    auth_tables=$($PSQL_PATH -U "$POSTGRES_USER" -d "$db_name" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'T_AUTH_%';" -t 2>/dev/null | xargs)
    
    if [[ "$auth_tables" -ge 10 ]]; then
        echo -e "${GREEN}   $OK SAP customizing tables: $auth_tables found${NC}"
    else
        echo -e "${YELLOW}   $WARN SAP customizing tables: Only $auth_tables found (expected 10+)${NC}"
    fi
    
    # Test component catalog
    local component_tables
    component_tables=$($PSQL_PATH -U "$POSTGRES_USER" -d "$db_name" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'component_definitions';" -t 2>/dev/null | xargs)
    
    if [[ "$component_tables" -eq 1 ]]; then
        echo -e "${GREEN}   $OK Component catalog ready${NC}"
    else
        echo -e "${YELLOW}   $WARN Component catalog not found${NC}"
    fi
    
    # Test tenant registry
    local tenant_tables
    tenant_tables=$($PSQL_PATH -U "$POSTGRES_USER" -d "$db_name" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'tenant_registry';" -t 2>/dev/null | xargs)
    
    if [[ "$tenant_tables" -eq 1 ]]; then
        echo -e "${GREEN}   $OK Tenant registry ready${NC}"
    else
        echo -e "${YELLOW}   $WARN Tenant registry not found${NC}"
    fi
    
    clear_postgres_password
    
    return 0
}

# Main execution flow
echo -e "${CYAN}Checking prerequisites...${NC}"

# Check if Master database already exists
if test_database_exists "$DATABASE_NAME"; then
    if $FORCE; then
        echo -e "${YELLOW}$WARN Master database exists. Force flag provided - dropping and recreating...${NC}"
        
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
        echo -e "${YELLOW}$WARN Master database already exists: $DATABASE_NAME${NC}"
        echo -e "${YELLOW}Use --force to recreate, or choose a different name with --database-name${NC}"
        exit 1
    fi
fi

# Step 1: Create Master database
echo ""
echo -e "${CYAN}Step 1: Creating Master database${NC}"
if ! create_master_database "$DATABASE_NAME"; then
    exit 1
fi

# Step 2: Apply Master schema
echo ""
echo -e "${CYAN}Step 2: Applying Master schema${NC}"
if ! apply_master_schema "$DATABASE_NAME"; then
    exit 1
fi

# Step 3: Seed Master data
echo ""
echo -e "${CYAN}Step 3: Seeding Master data${NC}"
seed_master_data "$DATABASE_NAME"

# Step 4: Test Master database
echo ""
echo -e "${CYAN}Step 4: Testing Master database${NC}"
if ! test_master_database "$DATABASE_NAME"; then
    echo -e "${YELLOW}$WARN Master database created but tests failed${NC}"
fi

# Success!
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}SAP-STYLE MASTER DATABASE SETUP COMPLETE!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${CYAN}$INFO Next Steps:${NC}"
echo -e "${WHITE}   1. Create tenant databases:    npm run db:tenant:create${NC}"
echo -e "${WHITE}   2. Install industry packages:  npm run sap:install-fintech${NC}"
echo -e "${WHITE}   3. Start authentication service: npm run dev:auth${NC}"
echo ""
echo -e "${CYAN}$INFO Database Information:${NC}"
echo -e "${WHITE}   Database Name: $DATABASE_NAME${NC}"
echo -e "${WHITE}   Environment:   $ENVIRONMENT${NC}"
echo -e "${WHITE}   PostgreSQL:    $PSQL_PATH${NC}"
echo ""
echo -e "${CYAN}$INFO Connection Details:${NC}"
echo -e "${WHITE}   Host: localhost${NC}"
echo -e "${WHITE}   Port: 5432${NC}"
echo -e "${WHITE}   Database: $DATABASE_NAME${NC}"
echo -e "${WHITE}   User: $POSTGRES_USER${NC}"
echo ""
echo -e "${GREEN}$OK Ready for SAP-style multi-database platform!${NC}" 