#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Create Fresh Database - Metadata-Driven Platform
    
.DESCRIPTION
    Creates a completely fresh database from scratch:
    1. Starts database services (PostgreSQL + Redis)
    2. Drops existing tables and creates new ones
    3. Sets up development data and accounts
    4. Provides connection info and test accounts
#>

Write-Host "🏗️ Creating Fresh Database - Metadata-Driven Platform" -ForegroundColor Cyan
Write-Host "=" * 60

# Check if required tools are available
$required_tools = @("docker", "python")
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

# Create fresh database
Write-Host "`n🏗️ Creating fresh database from scratch..." -ForegroundColor Yellow
try {
    Set-Location "services/api"
    
    # Check if API service exists
    if (!(Test-Path "pyproject.toml")) {
        Write-Host "❌ API service not found" -ForegroundColor Red
        exit 1
    }
    
    # Create fresh database (drops all existing tables and creates new ones)
    python app/scripts/create_fresh_database.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Fresh database created successfully" -ForegroundColor Green
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

# Display results
Write-Host "`n" + "=" * 60
Write-Host "🎉 FRESH DATABASE CREATED!" -ForegroundColor Cyan
Write-Host "=" * 60

Write-Host "`n📊 DATABASE STATUS:" -ForegroundColor White
Write-Host "   🗄️  PostgreSQL: localhost:5432 (running)" -ForegroundColor Gray
Write-Host "   📦  Redis: localhost:6379 (running)" -ForegroundColor Gray
Write-Host "   🏗️  All tables: Created from scratch" -ForegroundColor Gray
Write-Host "   📊  Sample data: Loaded" -ForegroundColor Gray

Write-Host "`n👥 DEFAULT ACCOUNTS:" -ForegroundColor White
Write-Host "   🔑 Admin: admin@dev.local / " -ForegroundColor Gray
Write-Host "   🔑 Demo:  demo@dev.local / demo123!" -ForegroundColor Gray
Write-Host "   🏢 Company: Development Corp (dev.local)" -ForegroundColor Gray

Write-Host "`n🌐 READY TO TEST:" -ForegroundColor White
Write-Host "   1. Start API: cd services/api && python main.py" -ForegroundColor Gray
Write-Host "   2. Start Auth: cd services/auth && python main.py" -ForegroundColor Gray
Write-Host "   3. Test Metadata: http://localhost:8000/api/metadata/pages/login" -ForegroundColor Gray
Write-Host "   4. Test Authentication: Use accounts above" -ForegroundColor Gray

Write-Host "`n📋 WHAT'S INCLUDED:" -ForegroundColor White
Write-Host "   ✅ 28 Database tables (metadata, auth, platform)" -ForegroundColor Gray
Write-Host "   ✅ Development tenant with admin/demo users" -ForegroundColor Gray
Write-Host "   ✅ Component catalog with UI components" -ForegroundColor Gray
Write-Host "   ✅ Login page metadata with language/theme selectors" -ForegroundColor Gray
Write-Host "   ✅ Field definitions and entity metadata" -ForegroundColor Gray
Write-Host "   ✅ Default translations (English/Greek)" -ForegroundColor Gray
Write-Host "   ✅ Security settings and permissions" -ForegroundColor Gray

Write-Host "`n🚀 Next: Run the full test suite with ./scripts/test-metadata-system.ps1" -ForegroundColor Green 