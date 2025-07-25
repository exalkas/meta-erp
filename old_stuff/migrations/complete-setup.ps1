# Complete Database Setup Script for Greek ERP/CRM System
# Handles both database creation and table setup

param(
    [switch]$CreateDatabase,
    [switch]$Force,
    [string]$PostgresUser = "postgres"
)

Write-Host "COMPLETE DATABASE SETUP" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "services\api")) {
    Write-Host "ERROR: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
    exit 1
}

# Database configuration
$DB_NAME = "erp_maritime_hellenic_4007"
$DB_USER = "erp_admin_315"
$PSQL_PATH = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

# Check if PostgreSQL is installed
if (-not (Test-Path $PSQL_PATH)) {
    Write-Host "ERROR: PostgreSQL 17 not found at: $PSQL_PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL 17 or update the path in this script" -ForegroundColor Yellow
    exit 1
}

function Test-DatabaseExists {
    try {
        $result = & $PSQL_PATH -U $PostgresUser -d postgres -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" -t 2>$null
        return $result.Trim() -eq "1"
    } catch {
        return $false
    }
}

function Test-DatabaseConnection {
    try {
        $result = & $PSQL_PATH -U $DB_USER -d $DB_NAME -c "SELECT 1;" -t 2>$null
        return $result.Trim() -eq "1"
    } catch {
        return $false
    }
}

try {
    # Step 1: Check database status
    Write-Host "Checking database status..." -ForegroundColor Blue
    
    $dbExists = Test-DatabaseExists
    $canConnect = Test-DatabaseConnection
    
    if ($dbExists -and $canConnect) {
        Write-Host "SUCCESS: Database '$DB_NAME' exists and is accessible" -ForegroundColor Green
        
        if (-not $CreateDatabase) {
            Write-Host "Proceeding with table reset only..." -ForegroundColor Blue
        } else {
            Write-Host "WARNING: Database exists but -CreateDatabase was specified" -ForegroundColor Yellow
            if (-not $Force) {
                $confirm = Read-Host "Do you want to DROP and recreate the entire database? Type 'yes' to confirm"
                if ($confirm.ToLower() -ne "yes") {
                    Write-Host "Operation cancelled" -ForegroundColor Yellow
                    exit 0
                }
            }
        }
    } elseif ($dbExists -and -not $canConnect) {
        Write-Host "WARNING: Database exists but connection failed" -ForegroundColor Yellow
        Write-Host "This might be a permissions issue or wrong credentials" -ForegroundColor Gray
        $CreateDatabase = $true
    } else {
        Write-Host "Database '$DB_NAME' does not exist" -ForegroundColor Yellow
        $CreateDatabase = $true
    }
    
    # Step 2: Create database if needed
    if ($CreateDatabase) {
        Write-Host ""
        Write-Host "Creating database and user..." -ForegroundColor Blue
        
        # Check if create-db-user.sql exists
        if (-not (Test-Path "scripts\create-db-user.sql")) {
            Write-Host "ERROR: scripts\create-db-user.sql not found" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "Running database creation script..." -ForegroundColor Gray
        & $PSQL_PATH -U $PostgresUser -f "scripts\create-db-user.sql"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Database creation failed" -ForegroundColor Red
            Write-Host ""
            Write-Host "Common issues:" -ForegroundColor Yellow
            Write-Host "1. PostgreSQL service not running" -ForegroundColor Gray
            Write-Host "2. Wrong postgres user password" -ForegroundColor Gray
            Write-Host "3. Insufficient permissions" -ForegroundColor Gray
            Write-Host ""
            Write-Host "Try running: psql -U postgres" -ForegroundColor Blue
            exit 1
        }
        
        Write-Host "SUCCESS: Database and user created" -ForegroundColor Green
    }
    
    # Step 3: Reset tables and seed data
    Write-Host ""
    Write-Host "Setting up tables and initial data..." -ForegroundColor Blue
    
    # Navigate to API directory
    Push-Location "services\api"
    
    try {
                 # Run the complete migration system
         if ($Force) {
             Write-Host "Running: poetry run python scripts\complete_migration.py --confirm" -ForegroundColor Gray
             poetry run python scripts\complete_migration.py --confirm
         } else {
             Write-Host "Running: poetry run python scripts\complete_migration.py" -ForegroundColor Gray
             poetry run python scripts\complete_migration.py
         }
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Table setup failed" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "SUCCESS: Tables and data setup completed" -ForegroundColor Green
        
    } finally {
        Pop-Location
    }
    
    # Step 4: Success summary
    Write-Host ""
    Write-Host "SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "============================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database Information:" -ForegroundColor Blue
    Write-Host "- Name: $DB_NAME" -ForegroundColor Gray
    Write-Host "- User: $DB_USER" -ForegroundColor Gray
    Write-Host "- Host: localhost" -ForegroundColor Gray
    Write-Host "- Port: 5432" -ForegroundColor Gray
    Write-Host ""
    Write-Host "What was created:" -ForegroundColor Blue
    Write-Host "- Database with Greek locale support" -ForegroundColor Gray
    Write-Host "- User with proper permissions" -ForegroundColor Gray
    Write-Host "- All tables from current models" -ForegroundColor Gray
    Write-Host "- Contact method subtypes (Greek + English)" -ForegroundColor Gray
    Write-Host "- Greek tax configuration" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Blue
    Write-Host "1. Create your first company and admin user" -ForegroundColor Gray
    Write-Host "2. Start the development server: npm run dev:all" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Connection string for your .env:" -ForegroundColor Blue
    Write-Host "DATABASE_URL=postgresql://$DB_USER@$($env:@localhost:5432/$DB_NAME" -ForegroundColor Gray
    
} catch {
    Write-Host ""
    Write-Host "ERROR: Setup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Usage examples
Write-Host ""
Write-Host "Usage examples:" -ForegroundColor Blue
Write-Host "  scripts\complete-setup.ps1                    # Reset tables only" -ForegroundColor Gray
Write-Host "  scripts\complete-setup.ps1 -CreateDatabase    # Create DB + tables" -ForegroundColor Gray
Write-Host "  scripts\complete-setup.ps1 -Force             # Skip confirmations" -ForegroundColor Gray 