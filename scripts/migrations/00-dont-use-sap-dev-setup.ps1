# SAP-Style Development Environment Setup
# Complete setup for new team members - follows step-by-step approach
# This script is used to setup the development environment for the SAP-Style project.
# Better use the other scripts 01, 02, 03 for more control.

param(
    [string]$Environment = "development",
    [string]$PostgresPassword = "",
    [switch]$SkipDependencies,
    [switch]$SkipDatabase,
    [switch]$Force
)

# Text-based indicators for PowerShell compatibility
$OK = "[OK]"
$ERR = "[ERROR]"
$INFO = "[INFO]"
$WARN = "[WARN]"

Write-Host "SAP-STYLE DEVELOPMENT ENVIRONMENT SETUP" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host "$INFO Environment: $Environment" -ForegroundColor Cyan
Write-Host "$INFO Following step-by-step approach for safety" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to find PostgreSQL installation
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

function Write-Step($stepNumber, $stepName) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "STEP $stepNumber`: $stepName" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "$OK $message" -ForegroundColor Green
}

function Write-Error($message) {
    Write-Host "$ERR $message" -ForegroundColor Red
}

function Write-Warning($message) {
    Write-Host "$WARN $message" -ForegroundColor Yellow
}

function Write-Info($message) {
    Write-Host "$INFO $message" -ForegroundColor Blue
}

function Test-Prerequisite($name, $command, $installUrl, $customTest = $null) {
    if ($customTest) {
        $result = & $customTest
        if ($result) {
            Write-Success "$name is installed at: $result"
            return $true
        } else {
            Write-Error "$name is not installed"
            Write-Info "Install from: $installUrl"
            return $false
        }
    } elseif (Test-Command $command) {
        Write-Success "$name is installed"
        return $true
    } else {
        Write-Error "$name is not installed"
        Write-Info "Install from: $installUrl"
        return $false
    }
}

function Confirm-Continue($message) {
    if ($Force) {
        return $true
    }
    
    Write-Host ""
    Write-Host "$message" -ForegroundColor Yellow
    $response = Read-Host "Continue? [y/N]"
    return $response.ToLower() -eq 'y'
}

# Check if we're in the right directory
if (-not (Test-Path "scripts\migrations")) {
    Write-Error "Please run this script from the project root directory"
    Write-Info "Current directory: $(Get-Location)"
    exit 1
}

Write-Step 1 "Check Prerequisites"

$prerequisites = @(
    @{name="Node.js 20+"; command="node"; url="https://nodejs.org/"},
    @{name="npm"; command="npm"; url="https://nodejs.org/"},
    @{name="Python 3.11+"; command="python"; url="https://python.org/"},
    @{name="Poetry"; command="poetry"; url="https://python-poetry.org/"},
    @{name="PostgreSQL 17+"; command="psql"; url="https://postgresql.org/"; customTest={Get-PostgreSQLPath}}
)

$allPrerequisitesOk = $true

foreach ($prereq in $prerequisites) {
    if ($prereq.customTest) {
        if (-not (Test-Prerequisite $prereq.name $prereq.command $prereq.url $prereq.customTest)) {
            $allPrerequisitesOk = $false
        }
    } else {
        if (-not (Test-Prerequisite $prereq.name $prereq.command $prereq.url)) {
            $allPrerequisitesOk = $false
        }
    }
}

if (-not $allPrerequisitesOk) {
    Write-Error "Missing prerequisites. Please install them and try again."
    exit 1
}

Write-Success "All prerequisites are installed"

if (-not (Confirm-Continue "Step 1 complete. Proceed to Step 2?")) {
    Write-Info "Setup cancelled by user"
    exit 0
}

# Step 2: Install Dependencies
Write-Step 2 "Install Dependencies"

if ($SkipDependencies) {
    Write-Warning "Skipping dependency installation (--SkipDependencies flag)"
} else {
    Write-Info "Installing Python dependencies..."
    try {
        poetry install --no-root
        Write-Success "Python dependencies installed"
    } catch {
        Write-Error "Failed to install Python dependencies: $_"
        exit 1
    }
    
    Write-Info "Installing JavaScript dependencies..."
    try {
        npm install
        Write-Success "JavaScript dependencies installed"
    } catch {
        Write-Error "Failed to install JavaScript dependencies: $_"
        exit 1
    }
}

if (-not (Confirm-Continue "Step 2 complete. Proceed to Step 3?")) {
    Write-Info "Setup cancelled by user"
    exit 0
}

# Step 3: Setup Environment Variables
Write-Step 3 "Setup Environment Variables"

$envFile = ".env"
if (-not (Test-Path $envFile)) {
    if (Test-Path "env.example") {
        Write-Info "Creating .env file from env.example..."
        Copy-Item "env.example" $envFile
        Write-Success ".env file created"
    } else {
        Write-Warning "No env.example file found - you may need to create .env manually"
    }
} else {
    Write-Info ".env file already exists"
}

if (-not (Confirm-Continue "Step 3 complete. Proceed to Step 4?")) {
    Write-Info "Setup cancelled by user"
    exit 0
}

# Step 4: Setup Master Database
Write-Step 4 "Setup Master Database (SAP-Style)"

if ($SkipDatabase) {
    Write-Warning "Skipping database setup (--SkipDatabase flag)"
} else {
    Write-Info "Creating SAP-style Master database..."
    
    $setupScript = "scripts\migrations\01-setup-master-db.ps1"
    if (Test-Path $setupScript) {
        try {
            $params = @()
            if ($Force) { $params += "-Force" }
            if ($PostgresPassword) { $params += "-PostgresPassword $PostgresPassword" }
            
            & $setupScript @params
            Write-Success "Master database setup completed"
        } catch {
            Write-Error "Master database setup failed: $_"
            Write-Info "You can run this manually later: $setupScript"
        }
    } else {
        Write-Warning "Master database setup script not found: $setupScript"
        Write-Info "Database setup will need to be done manually"
    }
}

if (-not (Confirm-Continue "Step 4 complete. Proceed to Step 5?")) {
    Write-Info "Setup cancelled by user"
    exit 0
}

# Step 5: Create Demo Tenant Database
Write-Step 5 "Create Demo Tenant Database (E-shop CRM & ERP)"

if ($SkipDatabase) {
    Write-Warning "Skipping tenant database setup (--SkipDatabase flag)"
} else {
    Write-Info "Creating demo e-shop CRM & ERP tenant database..."
    
    $tenantScript = "scripts\migrations\02-setup-tenant-db.ps1"
    if (Test-Path $tenantScript) {
        try {
            $params = @()
            if ($Force) { $params += "-Force" }
            if ($PostgresPassword) { $params += "-PostgresPassword $PostgresPassword" }
            
            & $tenantScript @params
            Write-Success "Demo tenant database setup completed"
        } catch {
            Write-Error "Tenant database setup failed: $_"
            Write-Info "You can run this manually later: $tenantScript"
        }
    } else {
        Write-Warning "Tenant database setup script not found: $tenantScript"
        Write-Info "Tenant database setup will need to be done manually"
    }
}

if (-not (Confirm-Continue "Step 5 complete. Proceed to final verification?")) {
    Write-Info "Setup cancelled by user"
    exit 0
}

# Step 6: Verification
Write-Step 6 "Verify Setup"

# Get PostgreSQL path for verification
$PSQL_PATH = Get-PostgreSQLPath
if (-not $PSQL_PATH) {
    Write-Warning "PostgreSQL not found for verification tests"
} else {
    Write-Info "Using PostgreSQL: $PSQL_PATH"
    
    Write-Info "Testing Master database connection..."
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        $result = & $PSQL_PATH -U postgres -d "metadata_platform_master_$Environment" -c "SELECT COUNT(*) FROM T_AUTH_IMG_ACTIVITY;" -t
        $exitCode = $LASTEXITCODE
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        if ($exitCode -eq 0) {
            Write-Success "Master database is accessible"
        } else {
            Write-Warning "Master database test failed"
        }
    } catch {
        Write-Warning "Could not test Master database: $_"
    }

    Write-Info "Testing Tenant database connection..."
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        $result = & $PSQL_PATH -U postgres -d "metadata_tenant_demo_eshop_crm" -c "SELECT COUNT(*) FROM users;" -t
        $exitCode = $LASTEXITCODE
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        if ($exitCode -eq 0) {
            Write-Success "Tenant database is accessible"
        } else {
            Write-Warning "Tenant database test failed"
        }
    } catch {
        Write-Warning "Could not test Tenant database: $_"
    }
}

# Success!
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "SAP-STYLE SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "$INFO Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Create first user:         .\scripts\migrations\03-setup-first-user.ps1" -ForegroundColor White
Write-Host "   2. Start auth service:        npm run dev:auth" -ForegroundColor White
Write-Host "   3. Start client app:          npm run dev:client" -ForegroundColor White
Write-Host "   4. Test authentication:       curl http://localhost:8001/health" -ForegroundColor White
Write-Host ""
Write-Host "$INFO Database Information:" -ForegroundColor Cyan
Write-Host "   Master DB:  metadata_platform_master_$Environment" -ForegroundColor White
Write-Host "   Tenant DB:  metadata_tenant_demo_eshop_crm" -ForegroundColor White
Write-Host "   PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "$OK Ready for SAP-style development!" -ForegroundColor Green 