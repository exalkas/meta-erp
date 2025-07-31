# 🚀 Start API Server - SAP-Style Metadata Platform
# 
# Starts the main API service with proper environment variables
# and database seeding if needed.

param(
    [switch]$SeedData,     # Seed database with initial data
    [switch]$FreshStart,   # Drop and recreate database
    [string]$Environment = "development"
)

Write-Host "🚀 Starting API Server..." -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Cyan

# Navigate to API service directory
Set-Location "services/api"

# Set environment variables
$env:DATABASE_URL = "postgresql+asyncpg://postgres:@localhost:5432/metadata_tenant_demo_eshop_crm"
$env:SECRET_KEY = "api-secret-metadata-erp-2025"
$env:JWT_SECRET_KEY = "jwt-secret-metadata-erp-2025" 
$env:DEBUG = "true"
$env:SERVICE_PORT = "8000"
$env:ENVIRONMENT = $Environment

Write-Host "📊 Database: $env:DATABASE_URL" -ForegroundColor Yellow
Write-Host "🔧 Debug Mode: $env:DEBUG" -ForegroundColor Yellow
Write-Host "🌐 Port: $env:SERVICE_PORT" -ForegroundColor Yellow

# Fresh start option
if ($FreshStart) {
    Write-Host "🗑️ Fresh start requested - this would recreate database..." -ForegroundColor Red
    Write-Host "⚠️ Fresh start not implemented yet" -ForegroundColor Yellow
}

# Seed data option
if ($SeedData) {
    Write-Host "🌱 Seeding database with initial data..." -ForegroundColor Green
    
    try {
        poetry run python ../../data/seed-scripts/seed_all.py
        Write-Host "✅ Database seeding completed" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Database seeding failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "🔄 Continuing with server start..." -ForegroundColor Yellow
    }
}

# Start the server
Write-Host "🎯 Starting uvicorn server..." -ForegroundColor Green
Write-Host "📍 API will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📖 API docs will be available at: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "" 
Write-Host "⏹️ Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

try {
    poetry run python -m uvicorn main:app --reload --port 8000
}
catch {
    Write-Host "❌ Server failed to start: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Return to project root
Set-Location "../.."