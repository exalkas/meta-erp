# Quick Environment Verification Script
# Run this to check if everything is set up correctly

Write-Host "🔍 Quick Development Environment Check" -ForegroundColor Green
Write-Host "=" * 50

$issues = @()

# Check if required tools are installed
Write-Host "`n🛠️ Checking Prerequisites..." -ForegroundColor Cyan

$tools = @(
    @{Name="Node.js"; Command="node --version"; MinVersion="18"},
    @{Name="npm"; Command="npm --version"; MinVersion="9"},
    @{Name="Python"; Command="python --version"; MinVersion="3.11"},
    @{Name="Poetry"; Command="poetry --version"; MinVersion="1.0"},
    @{Name="PostgreSQL"; Command="psql --version"; MinVersion="16"},
    @{Name="Git"; Command="git --version"; MinVersion="2.0"}
)

foreach ($tool in $tools) {
    try {
        $version = Invoke-Expression $tool.Command
        Write-Host "✅ $($tool.Name): $version" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ $($tool.Name): Not found or not in PATH" -ForegroundColor Red
        $issues += "$($tool.Name) not installed or not in PATH"
    }
}

# Check if Redis is accessible
Write-Host "`n📡 Checking Redis..." -ForegroundColor Cyan
try {
    $redisTest = redis-cli ping 2>&1
    if ($redisTest -eq "PONG") {
        Write-Host "✅ Redis: Connected and responding" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Redis: Running but not responding correctly" -ForegroundColor Yellow
        $issues += "Redis not responding properly"
    }
}
catch {
    Write-Host "❌ Redis: Not accessible" -ForegroundColor Red
    $issues += "Redis not running or not accessible"
}

# Check PostgreSQL connection
Write-Host "`n🗄️ Checking PostgreSQL..." -ForegroundColor Cyan
try {
    $env:PGPASSWORD = ""  # Default password
    psql -U postgres -d postgres -c "SELECT version();" | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL: Connected successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL: Connection failed" -ForegroundColor Red
        $issues += "PostgreSQL connection failed"
    }
}
catch {
    Write-Host "❌ PostgreSQL: Not accessible" -ForegroundColor Red
    $issues += "PostgreSQL not running or not accessible"
}

# Check if project files exist
Write-Host "`n📁 Checking Project Structure..." -ForegroundColor Cyan

$requiredDirs = @(
    "services/auth",
    "services/api", 
    "apps/client",
    "packages/shared/ui",
    "data",
    "docs"
)

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ Directory: $dir" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing: $dir" -ForegroundColor Red
        $issues += "Missing directory: $dir"
    }
}

# Check environment files
Write-Host "`n🔧 Checking Environment Files..." -ForegroundColor Cyan

$envFiles = @(
    "services/auth/.env",
    "services/api/.env",
    "apps/client/.env.local"
)

foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        Write-Host "✅ Environment file: $envFile" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing: $envFile" -ForegroundColor Red
        $issues += "Missing environment file: $envFile"
    }
}

# Check if dependencies are installed
Write-Host "`n📦 Checking Dependencies..." -ForegroundColor Cyan

# Check node_modules
if (Test-Path "node_modules") {
    Write-Host "✅ Node.js dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js dependencies not installed" -ForegroundColor Red
    $issues += "Run 'npm install' from project root"
}

# Check Poetry virtual environments
if (Test-Path "services/auth/pyproject.toml") {
    Set-Location "services/auth"
    try {
        poetry check | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Auth service dependencies OK" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Auth service dependencies may need updating" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ Auth service Poetry environment not set up" -ForegroundColor Red
        $issues += "Run 'poetry install' in services/auth/"
    }
    Set-Location "../.."
}

if (Test-Path "services/api/pyproject.toml") {
    Set-Location "services/api"
    try {
        poetry check | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ API service dependencies OK" -ForegroundColor Green
        } else {
            Write-Host "⚠️ API service dependencies may need updating" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ API service Poetry environment not set up" -ForegroundColor Red
        $issues += "Run 'poetry install' in services/api/"
    }
    Set-Location "../.."
}

# Summary
Write-Host "`n📊 Summary" -ForegroundColor Cyan
Write-Host "=" * 50

if ($issues.Count -eq 0) {
    Write-Host "🎉 Everything looks good! You're ready to start development." -ForegroundColor Green
    
    Write-Host "`n🚀 To start development:" -ForegroundColor Yellow
    Write-Host "1. npm run dev:auth     # Terminal 1" -ForegroundColor White
    Write-Host "2. npm run dev:api      # Terminal 2" -ForegroundColor White
    Write-Host "3. npm run dev:client   # Terminal 3" -ForegroundColor White
    
    Write-Host "`n🌐 Then open:" -ForegroundColor Yellow
    Write-Host "• Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "• API Docs: http://localhost:8000/docs" -ForegroundColor White
    Write-Host "• Auth Docs: http://localhost:8001/docs" -ForegroundColor White
    
} else {
    Write-Host "⚠️ Found $($issues.Count) issue(s) that need attention:" -ForegroundColor Yellow
    
    for ($i = 0; $i -lt $issues.Count; $i++) {
        Write-Host "$($i + 1). $($issues[$i])" -ForegroundColor Red
    }
    
    Write-Host "`n💡 To fix these issues:" -ForegroundColor Cyan
    Write-Host "1. Follow the setup guide: docs/LAPTOP_SETUP_GUIDE.md" -ForegroundColor White
    Write-Host "2. Or run the automated setup: ./scripts/setup/laptop_setup.ps1" -ForegroundColor White
}

Write-Host "`n📚 Helpful Commands:" -ForegroundColor Cyan
Write-Host "• ./scripts/quick-verify.ps1     # Run this verification again" -ForegroundColor White
Write-Host "• npm run build                  # Build all packages" -ForegroundColor White
Write-Host "• npm run test                   # Run all tests" -ForegroundColor White

Write-Host ""