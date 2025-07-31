#!/bin/bash
# Theme Variant Migration Script - Linux Bash
# Migrates from old Theme/ThemeProperty model to new BaseTheme/ThemeVariant/ThemeVariantProperty model

set -e  # Exit on any error

# Script configuration
SCRIPT_NAME="Theme Variant Migration"
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/theme-variant-migration-$(date +%Y%m%d-%H%M%S).log"

# Ensure logs directory exists
mkdir -p "$LOG_DIR"

# Logging function
log() {
    local level=${2:-INFO}
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local message="[$timestamp] [$level] $1"
    echo "$message"
    echo "$message" >> "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if we're in the project root
    if [[ ! -f "services/api/app/models/platform.py" ]]; then
        log "ERROR: Must run from project root directory" "ERROR"
        exit 1
    fi
    
    # Check Python environment
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        log "Python: $PYTHON_VERSION"
    elif command -v python &> /dev/null; then
        PYTHON_VERSION=$(python --version)
        log "Python: $PYTHON_VERSION"
    else
        log "ERROR: Python not found. Please install Python 3.11+" "ERROR"
        exit 1
    fi
    
    # Check Poetry
    if command -v poetry &> /dev/null; then
        POETRY_VERSION=$(poetry --version)
        log "Poetry: $POETRY_VERSION"
    else
        log "ERROR: Poetry not found. Please install Poetry" "ERROR"
        exit 1
    fi
    
    # Check PostgreSQL password
    if [[ -z "$POSTGRES_PASSWORD" ]]; then
        log "ERROR: POSTGRES_PASSWORD environment variable required" "ERROR"
        exit 1
    fi
    
    log "✅ Prerequisites check passed"
}

# Test database connectivity
test_database_connectivity() {
    log "Testing database connectivity..."
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        log "ERROR: PostgreSQL psql not found. Please install PostgreSQL client" "ERROR"
        exit 1
    fi
    
    PSQL_VERSION=$(psql --version)
    log "Found PostgreSQL: $PSQL_VERSION"
    
    # Test connection to master database
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    if psql -h localhost -U postgres -d metadata_platform_master_development -c "SELECT COUNT(*) FROM tenants;" &> /dev/null; then
        log "✅ Master database connection successful"
    else
        log "ERROR: Failed to connect to master database" "ERROR"
        exit 1
    fi
    
    unset PGPASSWORD
}

# Run the migration
run_migration() {
    log "Starting theme variant migration..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN MODE - No changes will be made" "WARN"
    fi
    
    # Set environment variables
    export POSTGRES_PASSWORD="$POSTGRES_PASSWORD"
    export PYTHONPATH="$(pwd)"
    
    # Navigate to API directory for Poetry environment
    cd services/api
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "Would run: poetry run python ../../scripts/migrations/migrate-to-theme-variants.py" "INFO"
    else
        log "Running migration script..."
        if poetry run python "../../scripts/migrations/migrate-to-theme-variants.py"; then
            log "✅ Migration completed successfully"
        else
            log "ERROR: Migration failed" "ERROR"
            exit 1
        fi
    fi
    
    # Return to project root
    cd ../..
    
    unset POSTGRES_PASSWORD
    unset PYTHONPATH
}

# Verify migration results
verify_migration_results() {
    log "Verifying migration results..."
    
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    # Check that new tables exist
    TABLES=("base_themes" "theme_variants" "theme_variant_properties")
    
    for table in "${TABLES[@]}"; do
        if psql -h localhost -U postgres -d metadata_tenant_demo_eshop_crm -c "SELECT COUNT(*) FROM $table;" &> /dev/null; then
            log "✅ Table $table exists and accessible"
        else
            log "ERROR: Table $table not found or not accessible" "ERROR"
            exit 1
        fi
    done
    
    # Check data migration
    BASE_THEME_COUNT=$(psql -h localhost -U postgres -d metadata_tenant_demo_eshop_crm -c "SELECT COUNT(*) FROM base_themes;" -t -A 2>/dev/null | tr -d ' ')
    VARIANT_COUNT=$(psql -h localhost -U postgres -d metadata_tenant_demo_eshop_crm -c "SELECT COUNT(*) FROM theme_variants;" -t -A 2>/dev/null | tr -d ' ')
    PROPERTY_COUNT=$(psql -h localhost -U postgres -d metadata_tenant_demo_eshop_crm -c "SELECT COUNT(*) FROM theme_variant_properties;" -t -A 2>/dev/null | tr -d ' ')
    
    log "Migration Results:"
    log "- Base Themes: $BASE_THEME_COUNT"
    log "- Theme Variants: $VARIANT_COUNT"
    log "- Variant Properties: $PROPERTY_COUNT"
    
    if [[ "$BASE_THEME_COUNT" -gt 0 && "$VARIANT_COUNT" -gt 0 ]]; then
        log "✅ Migration verification passed"
    else
        log "WARN: Migration may not have completed properly - no data found" "WARN"
    fi
    
    unset PGPASSWORD
}

# Print usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  --verify      Run verification only (don't migrate)"
    echo "  --dry-run     Show what would be done without making changes"
    echo "  --help        Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  POSTGRES_PASSWORD    PostgreSQL password (required)"
    echo ""
    echo "Examples:"
    echo "  POSTGRES_PASSWORD=mypass $0"
    echo "  POSTGRES_PASSWORD=mypass $0 --verify"
    echo "  POSTGRES_PASSWORD=mypass $0 --dry-run"
}

# Parse command line arguments
VERIFY_ONLY=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --verify)
            VERIFY_ONLY=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            log "ERROR: Unknown option $1" "ERROR"
            usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    log "🚀 $SCRIPT_NAME Started"
    log "Log file: $LOG_FILE"
    
    # Run checks and migration
    check_prerequisites
    test_database_connectivity
    
    if [[ "$VERIFY_ONLY" == "true" ]]; then
        log "Running verification only..."
        verify_migration_results
    else
        run_migration
        verify_migration_results
    fi
    
    log "✅ $SCRIPT_NAME completed successfully!"
    log ""
    log "NEXT STEPS:"
    log "1. Update theme engine to use new variant lookup"
    log "2. Update frontend to handle theme variants"
    log "3. Test theme switching functionality"
}

# Run the script
main "$@"