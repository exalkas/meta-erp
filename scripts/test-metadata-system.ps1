#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Test Metadata-Driven Authentication System
    
.DESCRIPTION
    Sets up and tests the complete metadata-driven authentication system:
    1. Starts database services
    2. Creates fresh database with all tables and development data
    3. Starts API and Auth services
    4. Tests metadata endpoints
    5. Provides testing instructions
#>

Write-Host "🚀 Testing Metadata-Driven Authentication System" -ForegroundColor Cyan
Write-Host "=" * 60

# Check if required tools are available
$required_tools = @("docker", "python", "node", "npm")
foreach ($tool in $required_tools) {
    if (!(Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "❌ $tool is not installed or not in PATH" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ All required tools are available" -ForegroundColor Green

# Start database services
Write-Host "`n📦 Starting database services..." -ForegroundColor Yellow
try {
    docker-compose up -d postgres redis
    Start-Sleep -Seconds 5
    Write-Host "✅ Database services started" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start database services: $_" -ForegroundColor Red
    exit 1
}

# Create fresh database from scratch
Write-Host "`n🏗️ Creating fresh database from scratch..." -ForegroundColor Yellow
try {
    Set-Location "services/api"
    
    # Install Python dependencies if needed
    if (!(Test-Path "pyproject.toml")) {
        Write-Host "❌ API service pyproject.toml not found" -ForegroundColor Red
        exit 1
    }
    
    # Create fresh database (drops existing tables and recreates everything)
    python app/scripts/create_fresh_database.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Fresh database creation completed" -ForegroundColor Green
    } else {
        Write-Host "❌ Fresh database creation failed" -ForegroundColor Red
        exit 1
    }
    
    Set-Location "../.."
} catch {
    Write-Host "❌ Failed to create fresh database: $_" -ForegroundColor Red
    Set-Location "../.."
    exit 1
}

# Start API service
Write-Host "`n🌐 Starting API service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd services/api; python main.py" -WindowStyle Minimized

# Start Auth service  
Write-Host "🔐 Starting Auth service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd services/auth; python main.py" -WindowStyle Minimized

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test API endpoints
Write-Host "`n🧪 Testing metadata endpoints..." -ForegroundColor Yellow

# Test API service health
try {
    $api_health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
    Write-Host "✅ API Service: $($api_health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ API Service: Not responding" -ForegroundColor Red
}

# Test Auth service health
try {
    $auth_health = Invoke-RestMethod -Uri "http://localhost:8001/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Auth Service: $($auth_health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Auth Service: Not responding" -ForegroundColor Red
}

# Test metadata endpoint
try {
    $login_page = Invoke-RestMethod -Uri "http://localhost:8000/api/metadata/pages/login" -Method Get -TimeoutSec 5
    Write-Host "✅ Metadata API: Login page found (ID: $($login_page.page_id.Substring(0,8)))" -ForegroundColor Green
    Write-Host "   Components: $($login_page.components.Count)" -ForegroundColor Gray
    Write-Host "   Route: $($login_page.route)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Metadata API: Failed to fetch login page" -ForegroundColor Red
}

# Test auth endpoint
try {
    $login_data = @{
        email = "admin@dev.local"
        password = ""
        remember_me = $false
    } | ConvertTo-Json

    $auth_response = Invoke-RestMethod -Uri "http://localhost:8001/auth/login" -Method Post -Body $login_data -ContentType "application/json" -TimeoutSec 5
    Write-Host "✅ Authentication: Admin login successful" -ForegroundColor Green
    Write-Host "   Token Type: $($auth_response.token_type)" -ForegroundColor Gray
    Write-Host "   User: $($auth_response.user.first_name) $($auth_response.user.last_name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Authentication: Login failed" -ForegroundColor Red
}

# Display results
Write-Host "`n" + "=" * 60
Write-Host "🎉 METADATA SYSTEM TEST COMPLETE!" -ForegroundColor Cyan
Write-Host "=" * 60

Write-Host "`n📊 SERVICES STATUS:" -ForegroundColor White
Write-Host "   🗄️  Database: http://localhost:5432 (PostgreSQL)" -ForegroundColor Gray
Write-Host "   📦  Cache: http://localhost:6379 (Redis)" -ForegroundColor Gray  
Write-Host "   🌐  API Service: http://localhost:8000" -ForegroundColor Gray
Write-Host "   🔐  Auth Service: http://localhost:8001" -ForegroundColor Gray

Write-Host "`n🧪 TEST THE SYSTEM:" -ForegroundColor White
Write-Host "   1. Test Metadata API: http://localhost:8000/api/metadata/pages/login" -ForegroundColor Gray
Write-Host "   2. Test Component API: http://localhost:8000/api/metadata/components" -ForegroundColor Gray
Write-Host "   3. Test Entity API: http://localhost:8000/api/metadata/entities/LoginForm" -ForegroundColor Gray
Write-Host "   4. Login as admin: admin@dev.local / " -ForegroundColor Gray
Write-Host "   5. Login as demo: demo@dev.local / demo123!" -ForegroundColor Gray

Write-Host "`n🎯 WHAT TO VERIFY:" -ForegroundColor White
Write-Host "   ✅ Login page structure loaded from database metadata" -ForegroundColor Gray
Write-Host "   ✅ ThemeSelector and LanguageSelector positioned correctly" -ForegroundColor Gray
Write-Host "   ✅ Form fields generated from FieldDefinitions" -ForegroundColor Gray
Write-Host "   ✅ Components loaded from ComponentDefinitions catalog" -ForegroundColor Gray
Write-Host "   ✅ One-user-one-session policy working" -ForegroundColor Gray
Write-Host "   ✅ JWT tokens with proper expiration" -ForegroundColor Gray

Write-Host "`n🔄 NEXT STEPS:" -ForegroundColor White
Write-Host "   1. Start frontend: npm run dev (from root)" -ForegroundColor Gray
Write-Host "   2. Create login page using MetadataLoginPage component" -ForegroundColor Gray
Write-Host "   3. Test complete metadata-driven login flow" -ForegroundColor Gray
Write-Host "   4. Build additional pages using metadata system" -ForegroundColor Gray

Write-Host "`n💡 TO STOP SERVICES:" -ForegroundColor White
Write-Host "   docker-compose down" -ForegroundColor Gray
Write-Host "   Get-Process python | Stop-Process -Force" -ForegroundColor Gray

Write-Host "`n🚀 The metadata-driven platform is ready for testing!" -ForegroundColor Green 