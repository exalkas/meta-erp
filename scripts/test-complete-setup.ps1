# 🧪 Test Complete Setup - SAP-Style Metadata Platform
#
# Tests the complete authentication + metadata system
# to verify everything is working properly.

param(
    [string]$AuthServiceUrl = "http://localhost:8001",
    [string]$ApiServiceUrl = "http://localhost:8000",
    [string]$TestUser = "admin@demo-eshop-crm.local",
    [string]$TestPassword = ""
)

Write-Host "🧪 Testing Complete SAP-Style Platform Setup..." -ForegroundColor Green
Write-Host "Auth Service: $AuthServiceUrl" -ForegroundColor Cyan
Write-Host "API Service: $ApiServiceUrl" -ForegroundColor Cyan
Write-Host ""

$testResults = @()

# Test 1: Auth Service Health Check
Write-Host "1️⃣ Testing Auth Service Health..." -ForegroundColor Yellow
try {
    $authHealth = Invoke-RestMethod -Uri "$AuthServiceUrl/health" -Method GET
    Write-Host "✅ Auth Service: $($authHealth.status)" -ForegroundColor Green
    $testResults += "Auth Health: PASS"
}
catch {
    Write-Host "❌ Auth Service Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Auth Health: FAIL"
}

# Test 2: API Service Health Check  
Write-Host "2️⃣ Testing API Service Health..." -ForegroundColor Yellow
try {
    $apiHealth = Invoke-RestMethod -Uri "$ApiServiceUrl/health" -Method GET
    Write-Host "✅ API Service: $($apiHealth.status)" -ForegroundColor Green
    $testResults += "API Health: PASS"
}
catch {
    Write-Host "❌ API Service Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "API Health: FAIL"
}

# Test 3: Authentication Flow
Write-Host "3️⃣ Testing Authentication Flow..." -ForegroundColor Yellow
try {
    $loginPayload = @{
        tenant_id = "89f84fea-b5b9-413c-945b-002c7fd9555d"
        email = $TestUser
        password = $TestPassword
        device_name = "Test Device"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$AuthServiceUrl/auth/login/password" -Method POST -Body $loginPayload -ContentType "application/json"
    
    if ($loginResponse.access_token) {
        Write-Host "✅ Authentication: Login successful" -ForegroundColor Green
        $testResults += "Authentication: PASS"
        $accessToken = $loginResponse.access_token
    } else {
        Write-Host "❌ Authentication: No access token received" -ForegroundColor Red
        $testResults += "Authentication: FAIL"
        $accessToken = $null
    }
}
catch {
    Write-Host "❌ Authentication Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Authentication: FAIL"
    $accessToken = $null
}

# Test 4: Metadata API - Login Page
Write-Host "4️⃣ Testing Metadata API - Login Page..." -ForegroundColor Yellow
try {
    $loginPageResponse = Invoke-RestMethod -Uri "$ApiServiceUrl/metadata/pages/login" -Method GET
    
    if ($loginPageResponse.page_id) {
        Write-Host "✅ Metadata: Login page definition loaded" -ForegroundColor Green
        Write-Host "   Page: $($loginPageResponse.page_name)" -ForegroundColor Gray
        Write-Host "   Layout: $($loginPageResponse.layout_id)" -ForegroundColor Gray
        $testResults += "Metadata Pages: PASS"
    } else {
        Write-Host "❌ Metadata: Invalid login page response" -ForegroundColor Red
        $testResults += "Metadata Pages: FAIL"
    }
}
catch {
    Write-Host "❌ Metadata Pages Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Metadata Pages: FAIL"
}

# Test 5: Metadata API - Layout Definition
Write-Host "5️⃣ Testing Metadata API - Layout Definition..." -ForegroundColor Yellow
try {
    $layoutResponse = Invoke-RestMethod -Uri "$ApiServiceUrl/metadata/layouts/centered-auth-layout" -Method GET
    
    if ($layoutResponse.layout_id) {
        Write-Host "✅ Metadata: Layout definition loaded" -ForegroundColor Green
        Write-Host "   Layout: $($layoutResponse.display_name)" -ForegroundColor Gray
        $testResults += "Metadata Layouts: PASS"
    } else {
        Write-Host "❌ Metadata: Invalid layout response" -ForegroundColor Red
        $testResults += "Metadata Layouts: FAIL"
    }
}
catch {
    Write-Host "❌ Metadata Layouts Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Metadata Layouts: FAIL"
}

# Test 6: Metadata API - Themes
Write-Host "6️⃣ Testing Metadata API - Themes..." -ForegroundColor Yellow
try {
    $themesResponse = Invoke-RestMethod -Uri "$ApiServiceUrl/metadata/themes" -Method GET
    
    if ($themesResponse.Count -gt 0) {
        Write-Host "✅ Metadata: Themes loaded ($($themesResponse.Count) themes)" -ForegroundColor Green
        foreach ($theme in $themesResponse) {
            Write-Host "   Theme: $($theme.display_name)" -ForegroundColor Gray
        }
        $testResults += "Metadata Themes: PASS"
    } else {
        Write-Host "❌ Metadata: No themes found" -ForegroundColor Red
        $testResults += "Metadata Themes: FAIL"
    }
}
catch {
    Write-Host "❌ Metadata Themes Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Metadata Themes: FAIL"
}

# Test 7: Metadata API - Translations
Write-Host "7️⃣ Testing Metadata API - Translations..." -ForegroundColor Yellow
try {
    $translationsResponse = Invoke-RestMethod -Uri "$ApiServiceUrl/metadata/translations/en" -Method GET
    
    if ($translationsResponse.Count -gt 0) {
        Write-Host "✅ Metadata: English translations loaded ($($translationsResponse.Count) translations)" -ForegroundColor Green
        $testResults += "Metadata Translations: PASS"
    } else {
        Write-Host "❌ Metadata: No translations found" -ForegroundColor Red
        $testResults += "Metadata Translations: FAIL"
    }
}
catch {
    Write-Host "❌ Metadata Translations Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Metadata Translations: FAIL"
}

# Test 8: Protected API with Authentication (if token available)
if ($accessToken) {
    Write-Host "8️⃣ Testing Protected API Access..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $accessToken"
        }
        
        $dashboardResponse = Invoke-RestMethod -Uri "$ApiServiceUrl/metadata/pages/dashboard" -Method GET -Headers $headers
        
        if ($dashboardResponse.page_id) {
            Write-Host "✅ Protected API: Dashboard page loaded with authentication" -ForegroundColor Green
            $testResults += "Protected API: PASS"
        } else {
            Write-Host "❌ Protected API: Invalid dashboard response" -ForegroundColor Red
            $testResults += "Protected API: FAIL"
        }
    }
    catch {
        Write-Host "❌ Protected API Failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += "Protected API: FAIL"
    }
} else {
    Write-Host "8️⃣ Skipping Protected API Test (no access token)" -ForegroundColor Yellow
    $testResults += "Protected API: SKIPPED"
}

# Test Summary
Write-Host ""
Write-Host "📊 TEST SUMMARY" -ForegroundColor Magenta
Write-Host "===============" -ForegroundColor Magenta

$passCount = ($testResults | Where-Object { $_ -like "*PASS*" }).Count
$failCount = ($testResults | Where-Object { $_ -like "*FAIL*" }).Count
$skipCount = ($testResults | Where-Object { $_ -like "*SKIPPED*" }).Count

foreach ($result in $testResults) {
    if ($result -like "*PASS*") {
        Write-Host "✅ $result" -ForegroundColor Green
    } elseif ($result -like "*FAIL*") {
        Write-Host "❌ $result" -ForegroundColor Red
    } else {
        Write-Host "⏭️ $result" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Results: $passCount passed, $failCount failed, $skipCount skipped" -ForegroundColor Cyan

if ($failCount -eq 0) {
    Write-Host ""
    Write-Host "🎉 ALL TESTS PASSED! The SAP-style platform is working correctly!" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "⚠️ Some tests failed. Check the logs above for details." -ForegroundColor Yellow
    exit 1
}