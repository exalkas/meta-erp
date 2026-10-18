#!/usr/bin/env pwsh
# Docker Setup Script for Metadata ERP Platform
# Comprehensive setup for development environment

param(
    [switch]$Reset,
    [switch]$Build,
    [switch]$Logs,
    [switch]$Status
)

Write-Host "🐳 Metadata ERP Platform - Docker Setup" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

function Show-Status {
    Write-Host "`n📊 Container Status:" -ForegroundColor Yellow
    docker-compose ps
}

function Show-Logs {
    Write-Host "`n📋 Service Logs:" -ForegroundColor Yellow
    docker-compose logs --tail=50 -f
}

function Reset-Environment {
    Write-Host "`n🔄 Resetting Docker Environment..." -ForegroundColor Yellow
    
    # Stop and remove containers, volumes, and networks
    docker-compose down -v
    
    # Remove unused Docker resources
    docker system prune -f
    
    Write-Host "✅ Environment reset complete!" -ForegroundColor Green
}

function Build-Services {
    Write-Host "`n🔨 Building Docker Services..." -ForegroundColor Yellow
    docker-compose build --no-cache
    Write-Host "✅ Build complete!" -ForegroundColor Green
}

function Start-Services {
    Write-Host "`n🚀 Starting Services..." -ForegroundColor Yellow
    
    # Start services in background
    docker-compose up -d
    
    Write-Host "`n⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Check service health
    Write-Host "`n🏥 Checking Service Health:" -ForegroundColor Yellow
    $maxRetries = 30
    $retryCount = 0
    
    do {
        $authHealth = $false
        $apiHealth = $false
        $clientHealth = $false
        
        try {
            $authResponse = Invoke-WebRequest -Uri "http://localhost:8001/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($authResponse.StatusCode -eq 200) { $authHealth = $true }
        } catch { }
        
        try {
            $apiResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($apiResponse.StatusCode -eq 200) { $apiHealth = $true }
        } catch { }
        
        try {
            $clientResponse = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($clientResponse.StatusCode -eq 200) { $clientHealth = $true }
        } catch { }
        
        if ($authHealth -and $apiHealth -and $clientHealth) {
            Write-Host "✅ All services are healthy!" -ForegroundColor Green
            break
        }
        
        Write-Host "⏳ Services starting... (Auth: $authHealth, API: $apiHealth, Client: $clientHealth)" -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        $retryCount++
        
    } while ($retryCount -lt $maxRetries)
    
    if ($retryCount -eq $maxRetries) {
        Write-Host "⚠️  Some services may not be ready yet. Check logs with: npm run docker:logs" -ForegroundColor Yellow
    }
}

# Main execution logic
if ($Reset) {
    Reset-Environment
    Build-Services
    Start-Services
} elseif ($Build) {
    Build-Services
} elseif ($Logs) {
    Show-Logs
} elseif ($Status) {
    Show-Status
} else {
    # Default: Start services
    Start-Services
}

Write-Host "`n🎯 Docker Setup Complete!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host "🌐 Frontend:        http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔐 Auth Service:    http://localhost:8001" -ForegroundColor Cyan
Write-Host "📡 API Service:     http://localhost:8000" -ForegroundColor Cyan
Write-Host "🗄️  PostgreSQL:     localhost:5432" -ForegroundColor Cyan
Write-Host "🔴 Redis:           localhost:6379" -ForegroundColor Cyan
Write-Host "`n📋 Useful Commands:" -ForegroundColor Yellow
Write-Host "   npm run docker:logs        # View all logs" -ForegroundColor White
Write-Host "   npm run docker:status      # Check status" -ForegroundColor White
Write-Host "   npm run docker:down        # Stop services" -ForegroundColor White
Write-Host "   npm run docker:reset       # Reset everything" -ForegroundColor White
Write-Host "===========================================" -ForegroundColor Green
