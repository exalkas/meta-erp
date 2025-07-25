# Database Reset Script for Greek ERP/CRM System
# Drops all tables and recreates them from current models

Write-Host "DATABASE RESET SCRIPT" -ForegroundColor Yellow
Write-Host "====================" -ForegroundColor Yellow
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "services\api")) {
    Write-Host "ERROR: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
    exit 1
}

# Navigate to the API directory
Push-Location "services\api"

try {
    Write-Host "WARNING: This will DROP ALL TABLES and recreate them!" -ForegroundColor Red
    Write-Host "WARNING: ALL DATA WILL BE LOST!" -ForegroundColor Red
    Write-Host ""
    
    # Check for --force parameter
    if ($args -contains "--force") {
        Write-Host "Force mode enabled, skipping confirmation..." -ForegroundColor Yellow
        $confirm = "yes"
    } else {
        $confirm = Read-Host "Are you sure you want to continue? Type 'yes' to confirm"
    }
    
    if ($confirm.ToLower() -eq "yes") {
        Write-Host ""
        Write-Host "Starting database reset..." -ForegroundColor Green
        
        # Run the complete migration system
        Write-Host "Running: poetry run python scripts\complete_migration.py --confirm" -ForegroundColor Gray
        poetry run python scripts\complete_migration.py --confirm
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "SUCCESS: Database reset completed!" -ForegroundColor Green
            Write-Host ""
            Write-Host "What was done:" -ForegroundColor Blue
            Write-Host "- Dropped all existing tables" -ForegroundColor Gray
            Write-Host "- Created fresh tables from current models" -ForegroundColor Gray
            Write-Host "- Seeded contact method subtypes" -ForegroundColor Gray
            Write-Host "- Applied Greek tax configuration" -ForegroundColor Gray
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Blue
            Write-Host "1. Create a company: scripts\create-admin-user.ps1" -ForegroundColor Gray
            Write-Host "2. Start the development server: npm run dev:all" -ForegroundColor Gray
        } else {
            Write-Host ""
            Write-Host "ERROR: Database reset failed!" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host ""
        Write-Host "Database reset cancelled" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to reset database: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Return to original directory
    Pop-Location
} 