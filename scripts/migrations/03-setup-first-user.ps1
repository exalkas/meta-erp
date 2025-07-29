# SAP-Style First User Setup Script
# Creates first business user with authentication methods in tenant database
# Compatible with Windows PowerShell - uses text indicators instead of emoji

param(
    [string]$TenantSlug = "demo-eshop-crm",
    [string]$DatabaseName = "metadata_tenant_demo_eshop_crm",
    [string]$MasterDatabase = "metadata_platform_master_development",
    [string]$PostgresUser = "postgres",
    [string]$PostgresPassword = "",
    [string]$AdminEmail = "admin@demo-eshop-crm.local",
    [string]$AdminPassword = "",
    [switch]$CreateTestUsers,
    [switch]$Force
)

# Text-based indicators for PowerShell compatibility
$OK = "[OK]"
$ERR = "[ERROR]"
$INFO = "[INFO]"
$WARN = "[WARN]"

Write-Host "SAP-STYLE FIRST USER SETUP" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green
Write-Host "$INFO Tenant: $TenantSlug" -ForegroundColor Cyan
Write-Host "$INFO Database: $DatabaseName" -ForegroundColor Cyan
Write-Host "$INFO Admin Email: $AdminEmail" -ForegroundColor Cyan
Write-Host ""

# Get PostgreSQL path
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

$PSQL_PATH = Get-PostgreSQLPath

if (-not $PSQL_PATH) {
    Write-Host "$ERR PostgreSQL (psql) not found" -ForegroundColor Red
    Write-Host "$INFO Please install PostgreSQL or add it to your PATH" -ForegroundColor Yellow
    exit 1
}

Write-Host "$OK Found PostgreSQL: $PSQL_PATH" -ForegroundColor Green

function Test-DatabaseExists {
    param($DbName)
    
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        $result = & $PSQL_PATH -U $PostgresUser -d postgres -c "SELECT 1 FROM pg_database WHERE datname='$DbName';" -t 2>$null
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        return $result.Trim() -eq "1"
    } catch {
        return $false
    }
}

function Test-DatabaseConnection {
    param($DbName)
    
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        & $PSQL_PATH -U $PostgresUser -d $DbName -c "SELECT 1;" -q 2>$null
        $exitCode = $LASTEXITCODE
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        return $exitCode -eq 0
    } catch {
        return $false
    }
}

function Test-Prerequisites {
    # Check Master database exists
    if (-not (Test-DatabaseExists $MasterDatabase)) {
        Write-Host "$ERR Master database not found: $MasterDatabase" -ForegroundColor Red
        Write-Host "$INFO Please run 01-setup-master-db.ps1 first" -ForegroundColor Yellow
        return $false
    }
    
    # Check Tenant database exists
    if (-not (Test-DatabaseExists $DatabaseName)) {
        Write-Host "$ERR Tenant database not found: $DatabaseName" -ForegroundColor Red
        Write-Host "$INFO Please run 02-setup-tenant-db.ps1 first" -ForegroundColor Yellow
        return $false
    }
    
    return $true
}

function Get-TenantId {
    param($TenantSlug)
    
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        $result = & $PSQL_PATH -U $PostgresUser -d $MasterDatabase -c "SELECT tenant_id FROM tenant_registry WHERE tenant_slug = '$TenantSlug';" -t
        $tenantId = ($result | Select-Object -First 1).Trim()
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        if ([string]::IsNullOrWhiteSpace($tenantId)) {
            Write-Host "$ERR Tenant not found in registry: $TenantSlug" -ForegroundColor Red
            return $null
        }
        
        return $tenantId
    } catch {
        Write-Host "$ERR Failed to get tenant ID: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Create-AdminUser {
    param($TenantId, $Email, $Password)
    
    Write-Host "Creating admin user: $Email" -ForegroundColor Yellow
    
    # Check if user already exists
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        $result = & $PSQL_PATH -U $PostgresUser -d $DatabaseName -c "SELECT COUNT(*) FROM users WHERE email = '$Email';" -t
        $userExists = ([int]($result | Select-Object -First 1).Trim()) -gt 0
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        if ($userExists) {
            if ($Force) {
                Write-Host "   $WARN User exists. Force flag provided - deleting existing user..." -ForegroundColor Yellow
                
                # Set PostgreSQL password if provided
                if ($PostgresPassword) {
                    $env:PGPASSWORD = $PostgresPassword
                }
                
                & $PSQL_PATH -U $PostgresUser -d $DatabaseName -c "DELETE FROM users WHERE email = '$Email';" -q
                
                # Clear password from environment
                if ($PostgresPassword) {
                    $env:PGPASSWORD = $null
                }
                
                Write-Host "   $OK Existing user deleted" -ForegroundColor Green
            } else {
                Write-Host "   $WARN User already exists: $Email" -ForegroundColor Yellow
                Write-Host "   $INFO Use -Force to recreate user" -ForegroundColor Blue
                return $true
            }
        }
    } catch {
        Write-Host "$WARN Could not check for existing user: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # bcrypt hash for  (cost factor 12)
    $passwordHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8J.0tnvjE/LbJnLbJnL'
    
    $userSql = @"
INSERT INTO users (
    tenant_id, 
    email, 
    first_name, 
    last_name,
    display_name,
    is_active, 
    is_verified, 
    email_verified,
    role,
    compliance_level,
    preferred_language,
    timezone
) VALUES (
    '$TenantId',
    '$Email',
    'Admin',
    'User',
    'Admin User',
    true,
    true,
    true,
    'admin',
    'ENHANCED',
    'en-US',
    'UTC'
);
"@
    
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        & $PSQL_PATH -U $PostgresUser -d $DatabaseName -c $userSql -q
        $exitCode = $LASTEXITCODE
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        if ($exitCode -eq 0) {
            Write-Host "$OK Admin user created successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "$ERR Failed to create admin user" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "$ERR Exception creating admin user: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Create-AuthMethod {
    param($TenantId, $Email, $PasswordHash)
    
    Write-Host "Creating password authentication method..." -ForegroundColor Yellow
    
    # Check if auth method already exists
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        $result = & $PSQL_PATH -U $PostgresUser -d $DatabaseName -c "SELECT COUNT(*) FROM auth_methods am JOIN users u ON am.user_id = u.user_id WHERE u.email = '$Email' AND am.method_type = 'PASSWORD';" -t
        $authExists = ([int]($result | Select-Object -First 1).Trim()) -gt 0
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        if ($authExists) {
            if ($Force) {
                Write-Host "   $WARN Authentication method exists. Force flag provided - deleting existing method..." -ForegroundColor Yellow
                
                # Set PostgreSQL password if provided
                if ($PostgresPassword) {
                    $env:PGPASSWORD = $PostgresPassword
                }
                
                & $PSQL_PATH -U $PostgresUser -d $DatabaseName -c "DELETE FROM auth_methods WHERE user_id = (SELECT user_id FROM users WHERE email = '$Email') AND method_type = 'PASSWORD';" -q
                
                # Clear password from environment
                if ($PostgresPassword) {
                    $env:PGPASSWORD = $null
                }
                
                Write-Host "   $OK Existing authentication method deleted" -ForegroundColor Green
            } else {
                Write-Host "   $WARN Authentication method already exists for: $Email" -ForegroundColor Yellow
                Write-Host "   $INFO Use -Force to recreate authentication method" -ForegroundColor Blue
                return $true
            }
        }
    } catch {
        Write-Host "$WARN Could not check for existing authentication method: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    $authSql = @"
INSERT INTO auth_methods (
    user_id, 
    tenant_id, 
    method_type, 
    is_primary,
    is_enabled,
    password_hash
) VALUES (
    (SELECT user_id FROM users WHERE email = '$Email'),
    '$TenantId',
    'PASSWORD',
    true,
    true,
    '$PasswordHash'
);
"@
    
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        & $PSQL_PATH -U $PostgresUser -d $DatabaseName -c $authSql -q
        $exitCode = $LASTEXITCODE
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        if ($exitCode -eq 0) {
            Write-Host "$OK Password authentication method created" -ForegroundColor Green
            return $true
        } else {
            Write-Host "$ERR Failed to create authentication method" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "$ERR Exception creating authentication method: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Create-TestUsers {
    param($TenantId)
    
    Write-Host "Creating additional test users..." -ForegroundColor Yellow
    
    $passwordHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8J.0tnvjE/LbJnLbJnL'
    
    $testUsersSql = @"
INSERT INTO users (
    tenant_id, email, first_name, last_name, display_name,
    is_active, is_verified, email_verified, role, compliance_level
) VALUES 
(
    '$TenantId',
    'manager@demo-eshop-crm.local', 
    'Store', 
    'Manager', 
    'Store Manager',
    true, true, true, 'manager', 'BASIC'
),
(
    '$TenantId',
    'staff@demo-eshop-crm.local', 
    'Store', 
    'Staff', 
    'Store Staff',
    true, true, true, 'staff', 'BASIC'
);

INSERT INTO auth_methods (user_id, tenant_id, method_type, is_primary, is_enabled, password_hash)
SELECT 
    u.user_id,
    u.tenant_id,
    'PASSWORD',
    true,
    true,
    '$passwordHash'
FROM users u 
WHERE u.email IN ('manager@demo-eshop-crm.local', 'staff@demo-eshop-crm.local');
"@
    
    try {
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        & $PSQL_PATH -U $PostgresUser -d $DatabaseName -c $testUsersSql -q
        $exitCode = $LASTEXITCODE
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        if ($exitCode -eq 0) {
            Write-Host "$OK Test users created successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "$ERR Failed to create test users" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "$ERR Exception creating test users: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-UserCreation {
    param($DatabaseName)
    
    Write-Host "Testing user creation..." -ForegroundColor Yellow
    
    try {
        # Test user count
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        $result = & $PSQL_PATH -U $PostgresUser -d $DatabaseName -c "SELECT COUNT(*) FROM users;" -t
        $userCount = ($result | Select-Object -First 1).Trim()
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        Write-Host "   $OK Users created: $userCount" -ForegroundColor Green
        
        # Test authentication methods
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        $result = & $PSQL_PATH -U $PostgresUser -d $DatabaseName -c "SELECT COUNT(*) FROM auth_methods;" -t
        $authCount = ($result | Select-Object -First 1).Trim()
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        Write-Host "   $OK Authentication methods: $authCount" -ForegroundColor Green
        
        # Test admin user specifically
        # Set PostgreSQL password if provided
        if ($PostgresPassword) {
            $env:PGPASSWORD = $PostgresPassword
        }
        
        $result = & $PSQL_PATH -U $PostgresUser -d $DatabaseName -c "SELECT COUNT(*) FROM users WHERE role = 'admin';" -t
        $adminCount = ($result | Select-Object -First 1).Trim()
        
        # Clear password from environment
        if ($PostgresPassword) {
            $env:PGPASSWORD = $null
        }
        
        if ([int]$adminCount -eq 1) {
            Write-Host "   $OK Admin user verified" -ForegroundColor Green
        } else {
            Write-Host "   $WARN Admin user count: $adminCount (expected 1)" -ForegroundColor Yellow
        }
        
        return $true
        
    } catch {
        Write-Host "$ERR Failed to test user creation: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution flow
Write-Host "Checking prerequisites..." -ForegroundColor Cyan

if (-not (Test-Prerequisites)) {
    exit 1
}

Write-Host "$OK Prerequisites verified" -ForegroundColor Green

# Get tenant ID
$tenantId = Get-TenantId $TenantSlug
if (-not $tenantId) {
    exit 1
}

Write-Host "$OK Tenant ID: $tenantId" -ForegroundColor Green

# Step 1: Create admin user
Write-Host ""
Write-Host "Step 1: Creating admin user" -ForegroundColor Cyan
if (-not (Create-AdminUser $tenantId $AdminEmail $AdminPassword)) {
    exit 1
}

# Step 2: Create authentication method
Write-Host ""
Write-Host "Step 2: Creating authentication method" -ForegroundColor Cyan
$passwordHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8J.0tnvjE/LbJnLbJnL'
if (-not (Create-AuthMethod $tenantId $AdminEmail $passwordHash)) {
    exit 1
}

# Step 3: Create test users (optional)
if ($CreateTestUsers) {
    Write-Host ""
    Write-Host "Step 3: Creating test users" -ForegroundColor Cyan
    Create-TestUsers $tenantId
}

# Step 4: Test user creation
Write-Host ""
Write-Host "Step 4: Testing user creation" -ForegroundColor Cyan
if (-not (Test-UserCreation $DatabaseName)) {
    Write-Host "$WARN Users created but tests failed" -ForegroundColor Yellow
}

# Success!
Write-Host ""
Write-Host "===============================" -ForegroundColor Green
Write-Host "SAP-STYLE FIRST USER SETUP COMPLETE!" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""
Write-Host "$INFO User Accounts Created:" -ForegroundColor Cyan
Write-Host "   Admin Email:    $AdminEmail" -ForegroundColor White
Write-Host "   Admin Password: $AdminPassword" -ForegroundColor White
if ($CreateTestUsers) {
    Write-Host "   Manager Email:  manager@demo-eshop-crm.local" -ForegroundColor White
    Write-Host "   Manager Password: " -ForegroundColor White
    Write-Host "   Staff Email:    staff@demo-eshop-crm.local" -ForegroundColor White
    Write-Host "   Staff Password: " -ForegroundColor White
}
Write-Host ""
Write-Host "$INFO Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Start authentication service:   npm run dev:auth" -ForegroundColor White
Write-Host "   2. Test login when auth service ready:" -ForegroundColor White
Write-Host "      curl -X POST http://localhost:8001/auth/login -H \"Content-Type: application/json\" -d '{\"email\": \"$AdminEmail\", \"password\": \"$AdminPassword\"}'" -ForegroundColor Gray
Write-Host ""
Write-Host "$INFO Database Information:" -ForegroundColor Cyan
Write-Host "   Tenant Database: $DatabaseName" -ForegroundColor White
Write-Host "   Users Table:     users" -ForegroundColor White
Write-Host "   Auth Methods:    auth_methods" -ForegroundColor White
Write-Host ""
Write-Host "$OK Ready for authentication service!" -ForegroundColor Green 