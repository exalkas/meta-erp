# Laptop Setup Automation Script
# Run this script after manual prerequisites installation

param(
    [string]$PostgresPassword = "",
    [string]$JwtSecret = $null,
    [string]$SecretKey = $null
)

Write-Host "🚀 Starting Laptop Setup for Legal Practice CRM + ERP Platform" -ForegroundColor Green
Write-Host "=" * 70

# Generate secrets if not provided
if (-not $JwtSecret) {
    $JwtSecret = [System.Web.Security.Membership]::GeneratePassword(64, 0)
}
if (-not $SecretKey) {
    $SecretKey = [System.Web.Security.Membership]::GeneratePassword(64, 0)
}

# Function to create environment file
function New-EnvFile {
    param(
        [string]$Path,
        [string]$Content
    )
    
    Write-Host "📝 Creating environment file: $Path" -ForegroundColor Yellow
    $Content | Out-File -FilePath $Path -Encoding UTF8
}

# Function to run SQL commands
function Invoke-PostgresCommand {
    param(
        [string]$Command,
        [string]$Database = "postgres"
    )
    
    Write-Host "🗄️ Running SQL: $Command" -ForegroundColor Blue
    $env:PGPASSWORD = $PostgresPassword
    psql -U postgres -d $Database -c $Command
}

Write-Host "`n1. Creating PostgreSQL Databases and User..." -ForegroundColor Cyan

# Create databases and user
$sqlCommands = @(
    "CREATE DATABASE metadata_erp_master;",
    "CREATE DATABASE metadata_erp_tenant_demo;",
    "CREATE USER erp_user WITH PASSWORD '$PostgresPassword';",
    "GRANT ALL PRIVILEGES ON DATABASE metadata_erp_master TO erp_user;",
    "GRANT ALL PRIVILEGES ON DATABASE metadata_erp_tenant_demo TO erp_user;"
)

foreach ($cmd in $sqlCommands) {
    try {
        Invoke-PostgresCommand -Command $cmd
    }
    catch {
        Write-Host "⚠️ SQL command may have failed (possibly already exists): $cmd" -ForegroundColor Yellow
    }
}

Write-Host "`n2. Creating Environment Files..." -ForegroundColor Cyan

# Auth Service .env
$authEnvContent = @"
# Database
DATABASE_URL=postgresql://erp_user:$PostgresPassword@localhost:5432/metadata_erp_master

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT Settings
JWT_SECRET_KEY=$JwtSecret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Security
SECRET_KEY=$SecretKey

# Environment
ENVIRONMENT=development
DEBUG=true

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]

# Port
PORT=8001
"@

New-EnvFile -Path "services/auth/.env" -Content $authEnvContent

# API Service .env
$apiEnvContent = @"
# Database - Master DB for metadata
DATABASE_URL=postgresql://erp_user:$PostgresPassword@localhost:5432/metadata_erp_master

# Tenant Database Template
TENANT_DB_TEMPLATE=postgresql://erp_user:$PostgresPassword@localhost:5432/metadata_erp_tenant_{tenant_id}

# Redis
REDIS_URL=redis://localhost:6379/1

# Auth Service
AUTH_SERVICE_URL=http://localhost:8001

# Environment
ENVIRONMENT=development
DEBUG=true

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]

# Port
PORT=8000

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
"@

New-EnvFile -Path "services/api/.env" -Content $apiEnvContent

# Frontend .env.local
$frontendEnvContent = @"
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AUTH_URL=http://localhost:8001

# Environment
NODE_ENV=development
NEXT_PUBLIC_ENV=development

# Default tenant for development
NEXT_PUBLIC_DEFAULT_TENANT_ID=demo-eshop-crm
"@

New-EnvFile -Path "apps/client/.env.local" -Content $frontendEnvContent

Write-Host "`n3. Installing Dependencies..." -ForegroundColor Cyan

# Install Python dependencies
Write-Host "📦 Installing Auth Service dependencies..." -ForegroundColor Yellow
Set-Location "services/auth"
poetry install
Set-Location "../.."

Write-Host "📦 Installing API Service dependencies..." -ForegroundColor Yellow
Set-Location "services/api"
poetry install
Set-Location "../.."

# Install Node.js dependencies
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
npm install

# Build shared UI
Write-Host "📦 Building shared UI package..." -ForegroundColor Yellow
Set-Location "packages/shared/ui"
npm run build
Set-Location "../../.."

Write-Host "`n4. Setting up Database Schema..." -ForegroundColor Cyan

# Run migrations
Write-Host "🗄️ Running database migrations..." -ForegroundColor Yellow
Set-Location "services/api"
poetry run alembic upgrade head

# Seed data
Write-Host "🌱 Seeding initial data..." -ForegroundColor Yellow
poetry run python data/seed-scripts/seed_all.py
Set-Location "../.."

Write-Host "`n5. Creating Quick Start Scripts..." -ForegroundColor Cyan

# Create start-dev.ps1 script
$startDevScript = @"
# Quick Development Startup Script

Write-Host "🚀 Starting Development Environment..." -ForegroundColor Green

# Check if Redis is running (WSL)
Write-Host "📡 Starting Redis..." -ForegroundColor Yellow
try {
    wsl sudo service redis-server start
    Write-Host "✅ Redis started" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not start Redis via WSL. Make sure Redis is running." -ForegroundColor Yellow
}

Write-Host "`n🔧 Starting Services..." -ForegroundColor Cyan
Write-Host "Auth Service will start on: http://localhost:8001" -ForegroundColor Blue
Write-Host "API Service will start on: http://localhost:8000" -ForegroundColor Blue  
Write-Host "Frontend will start on: http://localhost:3000" -ForegroundColor Blue

Write-Host "`nRun these commands in separate terminals:" -ForegroundColor Yellow
Write-Host "1. npm run dev:auth" -ForegroundColor White
Write-Host "2. npm run dev:api" -ForegroundColor White
Write-Host "3. npm run dev:client" -ForegroundColor White
Write-Host ""
Write-Host "API Documentation:" -ForegroundColor Cyan
Write-Host "- Auth: http://localhost:8001/docs" -ForegroundColor White
Write-Host "- API: http://localhost:8000/docs" -ForegroundColor White
"@

$startDevScript | Out-File -FilePath "scripts/start-dev.ps1" -Encoding UTF8

# Create verification script
$verifyScript = @"
# Development Environment Verification Script

Write-Host "🔍 Verifying Development Environment..." -ForegroundColor Green

# Test Redis
Write-Host "`n📡 Testing Redis connection..." -ForegroundColor Cyan
try {
    redis-cli ping
    Write-Host "✅ Redis is working" -ForegroundColor Green
} catch {
    Write-Host "❌ Redis not accessible" -ForegroundColor Red
}

# Test PostgreSQL
Write-Host "`n🗄️ Testing PostgreSQL connection..." -ForegroundColor Cyan
try {
    `$env:PGPASSWORD = "$PostgresPassword"
    psql -U erp_user -d metadata_erp_master -c "SELECT COUNT(*) FROM tenants;"
    Write-Host "✅ PostgreSQL is working" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL connection failed" -ForegroundColor Red
}

# Test if services respond
Write-Host "`n🌐 Testing service endpoints..." -ForegroundColor Cyan
`$services = @(
    @{Name="Auth Service"; Url="http://localhost:8001/health"},
    @{Name="API Service"; Url="http://localhost:8000/health"},
    @{Name="Frontend"; Url="http://localhost:3000"}
)

foreach (`$service in `$services) {
    try {
        `$response = Invoke-WebRequest -Uri `$service.Url -TimeoutSec 5
        if (`$response.StatusCode -eq 200) {
            Write-Host "✅ `$(`$service.Name) is responding" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️ `$(`$service.Name) not responding (may not be started)" -ForegroundColor Yellow
    }
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run: ./scripts/start-dev.ps1" -ForegroundColor White
Write-Host "2. Start services in separate terminals" -ForegroundColor White
Write-Host "3. Open http://localhost:3000 in your browser" -ForegroundColor White
"@

$verifyScript | Out-File -FilePath "scripts/verify-setup.ps1" -Encoding UTF8

Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "=" * 70

Write-Host "`n📋 What was created:" -ForegroundColor Cyan
Write-Host "• PostgreSQL databases: metadata_erp_master, metadata_erp_tenant_demo" -ForegroundColor White
Write-Host "• Database user: erp_user" -ForegroundColor White
Write-Host "• Environment files for all services" -ForegroundColor White
Write-Host "• Installed all dependencies" -ForegroundColor White
Write-Host "• Applied database migrations" -ForegroundColor White
Write-Host "• Seeded initial data" -ForegroundColor White
Write-Host "• Created quick start scripts" -ForegroundColor White

Write-Host "`n🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run: ./scripts/verify-setup.ps1" -ForegroundColor Yellow
Write-Host "2. Start development with: ./scripts/start-dev.ps1" -ForegroundColor Yellow
Write-Host "3. Open separate terminals and run:" -ForegroundColor Yellow
Write-Host "   • npm run dev:auth" -ForegroundColor White
Write-Host "   • npm run dev:api" -ForegroundColor White
Write-Host "   • npm run dev:client" -ForegroundColor White

Write-Host "`n🌐 Development URLs:" -ForegroundColor Cyan
Write-Host "• Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "• API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "• Auth Docs: http://localhost:8001/docs" -ForegroundColor White

Write-Host "`n💡 Important Notes:" -ForegroundColor Yellow
Write-Host "• Generated JWT Secret: $JwtSecret" -ForegroundColor Gray
Write-Host "• Database Password: $PostgresPassword" -ForegroundColor Gray
Write-Host "• Save these credentials securely!" -ForegroundColor Red

Write-Host "`n🎯 Ready to start development!" -ForegroundColor Green