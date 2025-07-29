# SAP-Style Tenant Database Setup Script
# Creates Tenant database with business tables and authentication schema
# Compatible with Windows PowerShell - uses text indicators instead of emoji

param(
    [string]$TenantName = "Demo E-shop CRM & ERP",
    [string]$TenantSlug = "demo-eshop-crm", 
    [string]$DatabaseName = "metadata_tenant_demo_eshop_crm",
    [string]$IndustryVertical = "ECOMMERCE",
    [string]$PostgresUser = "postgres",
    [string]$PostgresPassword = "",
    [string]$MasterDatabase = "metadata_platform_master_development",
    [switch]$Force
)

# Text-based indicators for PowerShell compatibility
$OK = "[OK]"
$ERR = "[ERROR]"
$INFO = "[INFO]"
$WARN = "[WARN]"

Write-Host "SAP-STYLE TENANT DATABASE SETUP" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "$INFO Tenant: $TenantName" -ForegroundColor Cyan
Write-Host "$INFO Database: $DatabaseName" -ForegroundColor Cyan
Write-Host "$INFO Industry: $IndustryVertical" -ForegroundColor Cyan
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

function Test-MasterDatabase {
    if (-not (Test-DatabaseExists $MasterDatabase)) {
        Write-Host "$ERR Master database not found: $MasterDatabase" -ForegroundColor Red
        Write-Host "$INFO Please run 01-setup-master-db.ps1 first" -ForegroundColor Yellow
        return $false
    }
    return $true
}

function Create-TenantDatabase {
    param($DbName)
    
    Write-Host "Creating Tenant database: $DbName" -ForegroundColor Yellow
    
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
            Write-Host "$OK Tenant database created successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "$ERR Failed to create Tenant database" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "$ERR Error creating Tenant database: $($_.Exception.Message)" -ForegroundColor Red
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

function Apply-TenantSchema {
    param($DbName)
    
    Write-Host "Applying Tenant database schema..." -ForegroundColor Yellow
    
    $schemaFiles = @(
        "sql\tenant\01-business-users.sql"
    )
    
    $allSuccess = $true
    
    foreach ($file in $schemaFiles) {
        if (-not (Apply-SQLFile $DbName $file)) {
            $allSuccess = $false
        }
    }
    
    if ($allSuccess) {
        Write-Host "$OK Tenant schema applied successfully" -ForegroundColor Green
    } else {
        Write-Host "$ERR Some schema files failed to apply" -ForegroundColor Red
    }
    
    return $allSuccess
}

function Register-TenantInMaster {
    param($TenantName, $TenantSlug, $DbName, $Industry)
    
    Write-Host "Registering tenant in Master database..." -ForegroundColor Yellow
    
    $sql = @"
INSERT INTO tenant_registry (
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
    '$TenantName', 
    '$TenantSlug',
    '$DbName', 
    '$Industry', 
    'active',
    '$TenantName',
    'starter'
);
"@
    
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        & $PSQL_PATH -U $PostgresUser -d $MasterDatabase -c $sql -q
        $exitCode = $LASTEXITCODE
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        if ($exitCode -eq 0) {
            Write-Host "$OK Tenant registered in Master database" -ForegroundColor Green
            return $true
        } else {
            Write-Host "$ERR Failed to register tenant" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "$ERR Exception registering tenant: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-TenantDatabase {
    param($DbName, $TenantSlug)
    
    Write-Host "Testing Tenant database setup..." -ForegroundColor Yellow
    
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        # Test business tables
        $result = & $PSQL_PATH -U $PostgresUser -d $DbName -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('users', 'auth_sessions', 'auth_methods', 'customers', 'products', 'orders');" -t
        $businessTables = ($result | Select-Object -First 1).Trim()
        
        if ([int]$businessTables -ge 6) {
            Write-Host "   $OK Business tables: $businessTables found" -ForegroundColor Green
        } else {
            Write-Host "   $WARN Business tables: Only $businessTables found (expected 6+)" -ForegroundColor Yellow
        }
        
        # Test tenant registration in master
        $result = & $PSQL_PATH -U $PostgresUser -d $MasterDatabase -c "SELECT COUNT(*) FROM tenant_registry WHERE tenant_slug = '$TenantSlug';" -t
        $tenantRegistration = ($result | Select-Object -First 1).Trim()
        
        if ([int]$tenantRegistration -eq 1) {
            Write-Host "   $OK Tenant registered in Master database" -ForegroundColor Green
        } else {
            Write-Host "   $WARN Tenant registration not found in Master" -ForegroundColor Yellow
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

# Check Master database exists
if (-not (Test-MasterDatabase)) {
    exit 1
}

Write-Host "$OK Master database verified" -ForegroundColor Green

# Check if Tenant database already exists
if (Test-DatabaseExists $DatabaseName) {
    if ($Force) {
        Write-Host "$WARN Tenant database exists. Force flag provided - dropping and recreating..." -ForegroundColor Yellow
        
        try {
            # Set PostgreSQL password if provided
            if ($PostgresPassword) {
                $env:PGPASSWORD = $PostgresPassword
            }
            
            & $PSQL_PATH -U $PostgresUser -d postgres -c "DROP DATABASE IF EXISTS `"$DatabaseName`";" 
            $exitCode = $LASTEXITCODE
            
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
        Write-Host "$WARN Tenant database already exists: $DatabaseName" -ForegroundColor Yellow
        Write-Host "Use -Force to recreate, or choose a different name with -DatabaseName" -ForegroundColor Yellow
        exit 1
    }
}

# Step 1: Create Tenant database
Write-Host ""
Write-Host "Step 1: Creating Tenant database" -ForegroundColor Cyan
if (-not (Create-TenantDatabase $DatabaseName)) {
    exit 1
}

# Step 2: Apply Tenant schema
Write-Host ""
Write-Host "Step 2: Applying Tenant schema" -ForegroundColor Cyan
if (-not (Apply-TenantSchema $DatabaseName)) {
    exit 1
}

# Step 3: Register tenant in Master
Write-Host ""
Write-Host "Step 3: Registering tenant in Master database" -ForegroundColor Cyan
if (-not (Register-TenantInMaster $TenantName $TenantSlug $DatabaseName $IndustryVertical)) {
    exit 1
}

# Step 4: Test Tenant database
Write-Host ""
Write-Host "Step 4: Testing Tenant database" -ForegroundColor Cyan
if (-not (Test-TenantDatabase $DatabaseName $TenantSlug)) {
    Write-Host "$WARN Tenant database created but tests failed" -ForegroundColor Yellow
}

# Success!
Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "SAP-STYLE TENANT DATABASE SETUP COMPLETE!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "$INFO Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Create first user:              .\scripts\migrations\03-setup-first-user.ps1" -ForegroundColor White
Write-Host "   2. Start authentication service:   npm run dev:auth" -ForegroundColor White
Write-Host "   3. Install industry packages:      npm run sap:install-ecommerce" -ForegroundColor White
Write-Host ""
Write-Host "$INFO Database Information:" -ForegroundColor Cyan
Write-Host "   Tenant Name:    $TenantName" -ForegroundColor White
Write-Host "   Tenant Slug:    $TenantSlug" -ForegroundColor White
Write-Host "   Database Name:  $DatabaseName" -ForegroundColor White
Write-Host "   Industry:       $IndustryVertical" -ForegroundColor White
Write-Host "   PostgreSQL:     $PSQL_PATH" -ForegroundColor White
Write-Host ""
Write-Host "$INFO Connection Details:" -ForegroundColor Cyan
Write-Host "   Host: localhost" -ForegroundColor White
Write-Host "   Port: 5432" -ForegroundColor White
Write-Host "   Database: $DatabaseName" -ForegroundColor White
Write-Host "   User: $PostgresUser" -ForegroundColor White
Write-Host ""
Write-Host "$OK Ready for first user creation!" -ForegroundColor Green 