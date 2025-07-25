# Greek ERP/CRM Database Schema Initialization
# Creates all tables, indexes, and functions

Write-Host "Greek ERP/CRM Schema Initialization" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# PostgreSQL path and credentials
$PSQL_PATH = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
$DB_NAME = "erp_maritime_hellenic_4007"
$DB_USER = "erp_admin_315"
$DB_PASSWORD = ""

# Check if PostgreSQL is installed
if (-not (Test-Path $PSQL_PATH)) {
    Write-Host "PostgreSQL 17 not found. Please run setup-database-windows.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "Initializing database schema..." -ForegroundColor Blue
Write-Host "Database: $DB_NAME" -ForegroundColor Gray

# Set password environment variable
$env:PGPASSWORD = $DB_PASSWORD

try {
    # Initialize database schema
    & $PSQL_PATH -U $DB_USER -d $DB_NAME -f scripts/database-init.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS! Database schema initialized!" -ForegroundColor Green
        Write-Host "====================================" -ForegroundColor Green
        Write-Host "Created:" -ForegroundColor Blue
        Write-Host "- Company management tables" -ForegroundColor Gray
        Write-Host "- User and authentication tables" -ForegroundColor Gray
        Write-Host "- Customer and product tables" -ForegroundColor Gray
        Write-Host "- Invoice and Greek tax tables" -ForegroundColor Gray
        Write-Host "- AADE integration tables" -ForegroundColor Gray
        Write-Host "- Audit logging system" -ForegroundColor Gray
        Write-Host "- Greek business validation functions" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Next step: scripts\create-admin-user.ps1" -ForegroundColor Blue
    } else {
        throw "Schema initialization failed"
    }
} catch {
    Write-Host "Failed to initialize schema: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Clean up environment variable
    $env:PGPASSWORD = $null
} 