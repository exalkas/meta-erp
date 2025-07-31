# Theme Variant Migration Script - Windows PowerShell
# Migrates from old Theme/ThemeProperty model to new BaseTheme/ThemeVariant/ThemeVariantProperty model

param(
    [string]$PostgresPassword = $env:POSTGRES_PASSWORD,
    [switch]$Verify = $false,
    [switch]$DryRun = $false
)

# Script configuration
$ScriptName = "Theme Variant Migration"
$LogFile = "logs/theme-variant-migration-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Ensure logs directory exists
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# Logging function
function Write-Log {
    param($Message, $Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check if we're in the project root
    if (-not (Test-Path "services/api/app/models/platform.py")) {
        Write-Log "ERROR: Must run from project root directory" "ERROR"
        exit 1
    }
    
    # Check Python environment
    try {
        $PythonVersion = python --version 2>&1
        Write-Log "Python: $PythonVersion"
    }
    catch {
        Write-Log "ERROR: Python not found. Please install Python 3.11+" "ERROR"
        exit 1
    }
    
    # Check Poetry
    try {
        $PoetryVersion = poetry --version 2>&1
        Write-Log "Poetry: $PoetryVersion"
    }
    catch {
        Write-Log "ERROR: Poetry not found. Please install Poetry" "ERROR"
        exit 1
    }
    
    # Check PostgreSQL connection
    if (-not $PostgresPassword) {
        Write-Log "ERROR: POSTGRES_PASSWORD environment variable or parameter required" "ERROR"
        exit 1
    }
    
    Write-Log "✅ Prerequisites check passed"
}

# Test database connectivity
function Test-DatabaseConnectivity {
    Write-Log "Testing database connectivity..."
    
    # Find PostgreSQL installation
    $PsqlPaths = @(
        "C:\Program Files\PostgreSQL\17\bin\psql.exe",
        "C:\Program Files\PostgreSQL\16\bin\psql.exe",
        "C:\Program Files\PostgreSQL\15\bin\psql.exe"
    )
    
    $PsqlPath = $null
    foreach ($Path in $PsqlPaths) {
        if (Test-Path $Path) {
            $PsqlPath = $Path
            break
        }
    }
    
    if (-not $PsqlPath) {
        # Try PATH
        try {
            $PsqlVersion = psql --version 2>&1
            $PsqlPath = "psql"
            Write-Log "Found psql in PATH: $PsqlVersion"
        }
        catch {
            Write-Log "ERROR: PostgreSQL psql not found. Please install PostgreSQL" "ERROR"
            exit 1
        }
    }
    else {
        Write-Log "Found PostgreSQL: $PsqlPath"
    }
    
    # Test connection to master database
    $env:PGPASSWORD = $PostgresPassword
    try {
        $TestResult = & $PsqlPath -h localhost -U postgres -d metadata_platform_master_development -c "SELECT COUNT(*) FROM tenants;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Master database connection successful"
        }
        else {
            Write-Log "ERROR: Failed to connect to master database: $TestResult" "ERROR"
            exit 1
        }
    }
    catch {
        Write-Log "ERROR: Database connection failed: $_" "ERROR"
        exit 1
    }
    finally {
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Run the migration
function Start-Migration {
    Write-Log "Starting theme variant migration..."
    
    if ($DryRun) {
        Write-Log "DRY RUN MODE - No changes will be made" "WARN"
    }
    
    # Set environment variables
    $env:POSTGRES_PASSWORD = $PostgresPassword
    $env:PYTHONPATH = Get-Location
    
    try {
        # Navigate to API directory for Poetry environment
        Push-Location "services/api"
        
        if ($DryRun) {
            Write-Log "Would run: poetry run python ../../scripts/migrations/migrate-to-theme-variants.py" "INFO"
        }
        else {
            Write-Log "Running migration script..."
            $MigrationResult = poetry run python "../../scripts/migrations/migrate-to-theme-variants.py" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ Migration completed successfully"
                Write-Log "Migration output: $MigrationResult"
            }
            else {
                Write-Log "ERROR: Migration failed: $MigrationResult" "ERROR"
                exit 1
            }
        }
    }
    catch {
        Write-Log "ERROR: Failed to run migration: $_" "ERROR"
        exit 1
    }
    finally {
        Pop-Location
        Remove-Item env:POSTGRES_PASSWORD -ErrorAction SilentlyContinue
        Remove-Item env:PYTHONPATH -ErrorAction SilentlyContinue
    }
}

# Verify migration results
function Test-MigrationResults {
    Write-Log "Verifying migration results..."
    
    $env:PGPASSWORD = $PostgresPassword
    
    try {
        # Check that new tables exist
        $Tables = @("base_themes", "theme_variants", "theme_variant_properties")
        
        foreach ($Table in $Tables) {
            $TableCheck = psql -h localhost -U postgres -d metadata_tenant_demo_eshop_crm -c "SELECT COUNT(*) FROM $Table;" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ Table $Table exists and accessible"
            }
            else {
                Write-Log "ERROR: Table $Table not found or not accessible" "ERROR"
                exit 1
            }
        }
        
        # Check data migration
        $BaseThemeCount = psql -h localhost -U postgres -d metadata_tenant_demo_eshop_crm -c "SELECT COUNT(*) FROM base_themes;" -t -A 2>&1
        $VariantCount = psql -h localhost -U postgres -d metadata_tenant_demo_eshop_crm -c "SELECT COUNT(*) FROM theme_variants;" -t -A 2>&1
        $PropertyCount = psql -h localhost -U postgres -d metadata_tenant_demo_eshop_crm -c "SELECT COUNT(*) FROM theme_variant_properties;" -t -A 2>&1
        
        Write-Log "Migration Results:"
        Write-Log "- Base Themes: $BaseThemeCount"
        Write-Log "- Theme Variants: $VariantCount"
        Write-Log "- Variant Properties: $PropertyCount"
        
        if ([int]$BaseThemeCount -gt 0 -and [int]$VariantCount -gt 0) {
            Write-Log "✅ Migration verification passed"
        }
        else {
            Write-Log "WARN: Migration may not have completed properly - no data found" "WARN"
        }
    }
    catch {
        Write-Log "ERROR: Verification failed: $_" "ERROR"
        exit 1
    }
    finally {
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Main execution
function Main {
    Write-Log "🚀 $ScriptName Started"
    Write-Log "Log file: $LogFile"
    
    try {
        # Run checks and migration
        Test-Prerequisites
        Test-DatabaseConnectivity
        
        if ($Verify) {
            Write-Log "Running verification only..."
            Test-MigrationResults
        }
        else {
            Start-Migration
            Test-MigrationResults
        }
        
        Write-Log "✅ $ScriptName completed successfully!"
        Write-Log ""
        Write-Log "NEXT STEPS:"
        Write-Log "1. Update theme engine to use new variant lookup"
        Write-Log "2. Update frontend to handle theme variants"
        Write-Log "3. Test theme switching functionality"
        
    }
    catch {
        Write-Log "❌ $ScriptName failed: $_" "ERROR"
        exit 1
    }
}

# Run the script
Main