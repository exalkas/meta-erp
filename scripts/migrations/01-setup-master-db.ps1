# SAP-Style Master Database Setup Script
# Creates Master database with SAP customizing tables and component catalog
# Compatible with Windows PowerShell - uses text indicators instead of emoji

param(
    [string]$Environment = "development",
    [string]$DatabaseName = "",
    [string]$PostgresUser = "postgres",
    [string]$PostgresPassword = "",
    [switch]$Force
)

# Text-based indicators for PowerShell compatibility
$OK = "[OK]"
$ERR = "[ERROR]"
$INFO = "[INFO]"
$WARN = "[WARN]"

# Set default database name if not provided
if ([string]::IsNullOrWhiteSpace($DatabaseName)) {
    $DatabaseName = "metadata_platform_master_$Environment"
}

Write-Host "SAP-STYLE MASTER DATABASE SETUP" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host "$INFO Database: $DatabaseName" -ForegroundColor Cyan
Write-Host "$INFO Environment: $Environment" -ForegroundColor Cyan
Write-Host ""

# Get PostgreSQL path
function Get-PostgreSQLPath {
    $paths = @(
        "C:\Program Files\PostgreSQL\17\bin\psql.exe",
        "C:\Program Files\PostgreSQL\16\bin\psql.exe",
        "C:\Program Files\PostgreSQL\15\bin\psql.exe", 
        "C:\Program Files\PostgreSQL\14\bin\psql.exe",
        "C:\PostgreSQL\bin\psql.exe"
    )
    
    foreach ($path in $paths) {
        if (Test-Path $path) {
            return $path
        }
    }
    
    # Try from PATH
    $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlCmd) {
        return $psqlCmd.Source
    }
    
    return $null
}

$PSQL_PATH = Get-PostgreSQLPath

if (-not $PSQL_PATH) {
    Write-Host "$ERR PostgreSQL (psql) not found" -ForegroundColor Red
    Write-Host "$INFO Please install PostgreSQL or add it to your PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "$OK Found PostgreSQL: $PSQL_PATH" -ForegroundColor Green

function Test-DatabaseExists {
    param($DbName)
    
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        $result = & $PSQL_PATH -U $PostgresUser -d postgres -c "SELECT 1 FROM pg_database WHERE datname='$DbName';" -t 2>$null
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        return $result.Trim() -eq "1"
    } catch {
        return $false
    }
}

function Test-DatabaseConnection {
    param($DbName)
    
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        & $PSQL_PATH -U $PostgresUser -d $DbName -c "SELECT 1;" -q 2>$null
        $exitCode = $LASTEXITCODE
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        return $exitCode -eq 0
    } catch {
        return $false
    }
}

function Create-MasterDatabase {
    param($DbName)
    
    Write-Host "Creating Master database: $DbName" -ForegroundColor Yellow
    
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        # Create database
        & $PSQL_PATH -U $PostgresUser -d postgres -c "CREATE DATABASE `"$DbName`";" 2>$null
        $exitCode = $LASTEXITCODE
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        if ($exitCode -eq 0 -and (Test-DatabaseConnection $DbName)) {
            Write-Host "$OK Master database created successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "$ERR Failed to create Master database" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "$ERR Error creating Master database: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Apply-SQLFile {
    param($DbName, $SqlFile)
    
    if (-not (Test-Path $SqlFile)) {
        Write-Host "$ERR SQL file not found: $SqlFile" -ForegroundColor Red
        return $false
    }
    
    Write-Host "   Applying: $(Split-Path $SqlFile -Leaf)" -ForegroundColor Gray
    
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        # Run psql with verbose error reporting
        & $PSQL_PATH -U $PostgresUser -d $DbName -f $SqlFile -v ON_ERROR_STOP=1 -q
        $exitCode = $LASTEXITCODE
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        if ($exitCode -eq 0) {
            Write-Host "      $OK Applied successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "      $ERR Failed to apply (exit code: $exitCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "      $ERR Exception: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Apply-MasterSchema {
    param($DbName)
    
    Write-Host "Applying Master database schema..." -ForegroundColor Yellow
    
    $schemaFiles = @(
        "sql\master\01-sap-customizing-tables.sql",
        "sql\master\02-component-catalog.sql"
    )
    
    $allSuccess = $true
    
    foreach ($file in $schemaFiles) {
        if (-not (Apply-SQLFile $DbName $file)) {
            $allSuccess = $false
        }
    }
    
    if ($allSuccess) {
        Write-Host "$OK Master schema applied successfully" -ForegroundColor Green
    } else {
        Write-Host "$ERR Some schema files failed to apply" -ForegroundColor Red
    }
    
    return $allSuccess
}

function Seed-MasterData {
    param($DbName)
    
    if ($SkipSeeding) {
        Write-Host "$WARN Skipping data seeding (--SkipSeeding flag)" -ForegroundColor Yellow
        return $true
    }
    
    Write-Host "$INFO Seeding Master database with basic data..." -ForegroundColor Yellow
    
    # For Phase 1, we only need basic schema - no additional seeding required
    Write-Host "   $INFO Basic schema created - no additional seeding needed for Phase 1" -ForegroundColor Gray
    Write-Host "   $INFO Industry packages and reference data will be added in Phase 2" -ForegroundColor Gray
    
    Write-Host "$OK Master database ready for Phase 1" -ForegroundColor Green
    return $true
}

function Test-MasterDatabase {
    param($DbName)
    
    Write-Host "Testing Master database setup..." -ForegroundColor Yellow
    
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        # Test SAP customizing tables
        $result = & $PSQL_PATH -U $PostgresUser -d $DbName -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'T_AUTH_%';" -t
        $authTables = ($result | Select-Object -First 1).Trim()
        
        if ([int]$authTables -ge 10) {
            Write-Host "   $OK SAP customizing tables: $authTables found" -ForegroundColor Green
        } else {
            Write-Host "   $WARN SAP customizing tables: Only $authTables found (expected 10+)" -ForegroundColor Yellow
        }
        
        # Test component catalog
        $result = & $PSQL_PATH -U $PostgresUser -d $DbName -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'component_definitions';" -t
        $componentTables = ($result | Select-Object -First 1).Trim()
        
        if ([int]$componentTables -eq 1) {
            Write-Host "   $OK Component catalog ready" -ForegroundColor Green
        } else {
            Write-Host "   $WARN Component catalog not found" -ForegroundColor Yellow
        }
        
        # Test tenant registry
        $result = & $PSQL_PATH -U $PostgresUser -d $DbName -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'tenant_registry';" -t
        $tenantTables = ($result | Select-Object -First 1).Trim()
        
        if ([int]$tenantTables -eq 1) {
            Write-Host "   $OK Tenant registry ready" -ForegroundColor Green
        } else {
            Write-Host "   $WARN Tenant registry not found" -ForegroundColor Yellow
        }
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        return $true
        
    } catch {
        Write-Host "$ERR Failed to test database: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution flow
Write-Host "Checking prerequisites..." -ForegroundColor Cyan

# Check if Master database already exists
if (Test-DatabaseExists $DatabaseName) {
    if ($Force) {
        Write-Host "$WARN Master database exists. Force flag provided - dropping and recreating..." -ForegroundColor Yellow
        
        try {
            # Set PostgreSQL password if provided
            if ($PostgresPassword) {
                $env:PGPASSWORD = $PostgresPassword
            }
            
            & $PSQL_PATH -U $PostgresUser -d postgres -c "DROP DATABASE IF EXISTS `"$DatabaseName`";"
            
            # Clear password from environment
            if ($PostgresPassword) {
                $env:PGPASSWORD = $null
            }
            
            Write-Host "$OK Existing database dropped" -ForegroundColor Green
        } catch {
            Write-Host "$ERR Failed to drop existing database" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "$WARN Master database already exists: $DatabaseName" -ForegroundColor Yellow
        Write-Host "Use -Force to recreate, or choose a different name with -DatabaseName" -ForegroundColor Yellow
        exit 1
    }
}

# Step 1: Create Master database
Write-Host ""
Write-Host "Step 1: Creating Master database" -ForegroundColor Cyan
if (-not (Create-MasterDatabase $DatabaseName)) {
    exit 1
}

# Step 2: Apply Master schema
Write-Host ""
Write-Host "Step 2: Applying Master schema" -ForegroundColor Cyan
if (-not (Apply-MasterSchema $DatabaseName)) {
    exit 1
}

# Step 3: Seed Master data
Write-Host ""
Write-Host "Step 3: Seeding Master data" -ForegroundColor Cyan
Seed-MasterData $DatabaseName

# Step 4: Test Master database
Write-Host ""
Write-Host "Step 4: Testing Master database" -ForegroundColor Cyan
if (-not (Test-MasterDatabase $DatabaseName)) {
    Write-Host "$WARN Master database created but tests failed" -ForegroundColor Yellow
}

# Success!
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "SAP-STYLE MASTER DATABASE SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "$INFO Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Create tenant databases:    .\scripts\migrations\02-setup-tenant-db.ps1" -ForegroundColor White
Write-Host "   2. Install industry packages:  npm run sap:install-fintech" -ForegroundColor White
Write-Host "   3. Start authentication service: npm run dev:auth" -ForegroundColor White
Write-Host ""
Write-Host "$INFO Database Information:" -ForegroundColor Cyan
Write-Host "   Database Name: $DatabaseName" -ForegroundColor White
Write-Host "   Environment:   $Environment" -ForegroundColor White
Write-Host "   PostgreSQL:    $PSQL_PATH" -ForegroundColor White
Write-Host ""
Write-Host "$INFO Connection Details:" -ForegroundColor Cyan
Write-Host "   Host: localhost" -ForegroundColor White
Write-Host "   Port: 5432" -ForegroundColor White
Write-Host "   Database: $DatabaseName" -ForegroundColor White
Write-Host "   User: $PostgresUser" -ForegroundColor White
Write-Host ""
Write-Host "$OK Ready for SAP-style multi-database platform!" -ForegroundColor Green 