# Development Environment Setup Script for Metadata ERP
# This script sets up the development environment for the metadata-driven CRM+ERP system

Write-Host "🚀 Setting up Metadata ERP Development Environment..." -ForegroundColor Green

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Error "npm is not installed. Please install npm and try again."
    exit 1
}

if (-not (Test-Command "python")) {
    Write-Error "Python is not installed. Please install Python 3.11+ and try again."
    exit 1
}

if (-not (Test-Command "poetry")) {
    Write-Error "Poetry is not installed. Please install Poetry and try again."
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Set up environment variables
Write-Host "🔧 Setting up environment variables..." -ForegroundColor Yellow

$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env file from example..." -ForegroundColor Blue
    Copy-Item "env.example" $envFile
    
    # Generate secret keys
    $secretKey = [System.Web.Security.Membership]::GeneratePassword(32, 0)
    $jwtSecret = [System.Web.Security.Membership]::GeneratePassword(64, 0)
    
    # Update .env file with generated secrets
    (Get-Content $envFile) | 
        ForEach-Object { $_ -replace "your-secret-key-here", $secretKey } |
        ForEach-Object { $_ -replace "your-jwt-secret-here", $jwtSecret } |
        Set-Content $envFile
    
    Write-Host "✅ Environment file created with generated secrets" -ForegroundColor Green
} else {
    Write-Host "✅ Environment file already exists" -ForegroundColor Green
}

# Install JavaScript dependencies
Write-Host "📦 Installing JavaScript dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install JavaScript dependencies"
    exit 1
}

Write-Host "✅ JavaScript dependencies installed" -ForegroundColor Green

# Install Python dependencies for each service
Write-Host "🐍 Installing Python dependencies..." -ForegroundColor Yellow

$services = @("api", "auth", "files", "integrations")
$aiServices = @("ai-support-service", "voice-service")

foreach ($service in $services) {
    $servicePath = "services/$service"
    if (Test-Path $servicePath) {
        Write-Host "Installing dependencies for $service..." -ForegroundColor Blue
        Push-Location $servicePath
        poetry install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install dependencies for $service"
            Pop-Location
            exit 1
        }
        Pop-Location
    }
}

foreach ($aiService in $aiServices) {
    $servicePath = "packages/ai-services/$aiService"
    if (Test-Path $servicePath) {
        Write-Host "Installing dependencies for $aiService..." -ForegroundColor Blue
        Push-Location $servicePath
        poetry install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install dependencies for $aiService"
            Pop-Location
            exit 1
        }
        Pop-Location
    }
}

Write-Host "✅ Python dependencies installed" -ForegroundColor Green

# Build shared packages
Write-Host "🔨 Building shared packages..." -ForegroundColor Yellow
npm run build:packages

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build shared packages"
    exit 1
}

Write-Host "✅ Shared packages built" -ForegroundColor Green

# Copy shared assets
Write-Host "📄 Copying shared assets..." -ForegroundColor Yellow
npm run copy-assets

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to copy shared assets"
    exit 1
}

Write-Host "✅ Shared assets copied" -ForegroundColor Green

# Start PostgreSQL and Redis (if using Docker)
Write-Host "🐳 Starting database services..." -ForegroundColor Yellow

if (Test-Command "docker-compose") {
    # Start only the database services
    docker-compose up -d postgres redis
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database services started" -ForegroundColor Green
        
        # Wait for services to be ready
        Write-Host "⏳ Waiting for database services to be ready..." -ForegroundColor Blue
        Start-Sleep -Seconds 10
    } else {
        Write-Warning "Failed to start database services with docker-compose"
        Write-Host "Please ensure PostgreSQL and Redis are running manually" -ForegroundColor Yellow
    }
} else {
    Write-Warning "Docker Compose not found"
    Write-Host "Please ensure PostgreSQL and Redis are running manually" -ForegroundColor Yellow
}

# Initialize database with development data
Write-Host "🗄️ Initializing database with development data..." -ForegroundColor Yellow
Push-Location "services/api"
poetry run python app/scripts/dev_setup.py

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to initialize database"
    Pop-Location
    exit 1
}

Pop-Location
Write-Host "✅ Database initialized with development data" -ForegroundColor Green

# Display setup completion information
Write-Host ""
Write-Host "🎉 Development environment setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Setup Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Dependencies installed" -ForegroundColor White
Write-Host "  ✅ Environment configured" -ForegroundColor White
Write-Host "  ✅ Database initialized" -ForegroundColor White
Write-Host "  ✅ Development data created" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready to start development!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Quick Start:" -ForegroundColor Cyan
Write-Host "  1. Start all services:     npm run dev:all" -ForegroundColor White
Write-Host "  2. Start specific service: npm run dev:api" -ForegroundColor White
Write-Host "  3. Start frontend only:   npm run dev:client" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Default Development Accounts:" -ForegroundColor Cyan
Write-Host "  Admin:  admin@dev.local / " -ForegroundColor White
Write-Host "  Demo:   demo@dev.local / demo123!" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  API:       http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🎯" -ForegroundColor Green 