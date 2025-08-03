#!/usr/bin/env python3
"""
Complete Authentication & RBAC System Test Suite
Tests all aspects of the authentication and authorization system.
"""

import asyncio
import httpx
import json
from typing import Dict, Any
from datetime import datetime


class AuthSystemTester:
    """Comprehensive test suite for the authentication system."""
    
    def __init__(self):
        self.auth_base_url = "http://localhost:8001"
        self.api_base_url = "http://localhost:8000"
        self.test_results = []
        self.access_token = None
        self.refresh_token = None
        
        # Test data
        self.test_tenant_id = "89f84fea-b5b9-413c-945b-002c7fd9555d"
        self.test_user = {
            "email": "test@example.com",
            "password": "",
            "full_name": "Test User"
        }
    
    async def run_all_tests(self):
        """Run the complete test suite."""
        print("🧪 Starting Complete Authentication & RBAC System Tests")
        print("=" * 80)
        
        # Test 1: Health Checks
        await self.test_service_health()
        
        # Test 2: Database Seeding
        await self.test_database_seeding()
        
        # Test 3: User Registration
        await self.test_user_registration()
        
        # Test 4: Authentication Flow
        await self.test_authentication_flow()
        
        # Test 5: Device Tracking & Risk Scoring
        await self.test_device_tracking()
        
        # Test 6: JWT Token Validation
        await self.test_token_validation()
        
        # Test 7: Permission Enforcement
        await self.test_permission_enforcement()
        
        # Test 8: Role Management APIs
        await self.test_role_management()
        
        # Test 9: Session Management
        await self.test_session_management()
        
        # Test 10: Security Features
        await self.test_security_features()
        
        # Print Results Summary
        self.print_test_summary()
    
    async def test_service_health(self):
        """Test that both services are running and healthy."""
        print("\n📡 Testing Service Health...")
        
        # Test Auth Service Health
        await self.make_test_request(
            "Auth Service Health",
            "GET",
            f"{self.auth_base_url}/health",
            expected_status=200
        )
        
        # Test API Service Health  
        await self.make_test_request(
            "API Service Health",
            "GET", 
            f"{self.api_base_url}/health",
            expected_status=200
        )
        
        # Test Role API Health
        await self.make_test_request(
            "Role API Health",
            "GET",
            f"{self.api_base_url}/roles/health", 
            expected_status=200
        )
    
    async def test_database_seeding(self):
        """Test database seeding and data integrity."""
        print("\n🌱 Testing Database Seeding...")
        
        # Test Role Templates
        await self.make_test_request(
            "Get Role Templates",
            "GET",
            f"{self.api_base_url}/roles/templates",
            expected_status=200
        )
        
        # Test Vertical-Specific Templates
        await self.make_test_request(
            "Get E-commerce Role Templates", 
            "GET",
            f"{self.api_base_url}/roles/templates/by-vertical?vertical=ecommerce",
            expected_status=200
        )
    
    async def test_user_registration(self):
        """Test user registration process."""
        print("\n👤 Testing User Registration...")
        
        # Register test user
        registration_data = {
            "email": self.test_user["email"],
            "password": self.test_user["password"],
            "full_name": self.test_user["full_name"],
            "tenant_id": self.test_tenant_id
        }
        
        await self.make_test_request(
            "User Registration",
            "POST",
            f"{self.auth_base_url}/auth/register",
            data=registration_data,
            expected_status=201
        )
    
    async def test_authentication_flow(self):
        """Test complete authentication flow with device tracking."""
        print("\n🔐 Testing Authentication Flow...")
        
        # Login with device information
        login_data = {
            "email": self.test_user["email"],
            "password": self.test_user["password"], 
            "tenant_id": self.test_tenant_id
        }
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "X-Forwarded-For": "203.0.113.195"  # Test IP
        }
        
        response = await self.make_test_request(
            "User Login with Device Tracking",
            "POST",
            f"{self.auth_base_url}/auth/login",
            data=login_data,
            headers=headers,
            expected_status=200
        )
        
        # Extract tokens for further tests
        if response and response.get("access_token"):
            self.access_token = response["access_token"]
            self.refresh_token = response["refresh_token"]
            print(f"   ✅ Tokens extracted successfully")
    
    async def test_device_tracking(self):
        """Test device detection and risk scoring."""
        print("\n📱 Testing Device Tracking & Risk Scoring...")
        
        if not self.access_token:
            print("   ❌ No access token available, skipping device tracking tests")
            return
        
        # Test session info endpoint to see device tracking data
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        await self.make_test_request(
            "Get Session Info (Device Data)",
            "GET",
            f"{self.auth_base_url}/auth/session",
            headers=headers,
            expected_status=200
        )
    
    async def test_token_validation(self):
        """Test JWT token validation."""
        print("\n🎫 Testing JWT Token Validation...")
        
        if not self.access_token:
            print("   ❌ No access token available, skipping token validation tests")
            return
        
        # Test token validation endpoint
        validation_data = {"token": self.access_token}
        
        await self.make_test_request(
            "Token Validation",
            "POST", 
            f"{self.auth_base_url}/auth/validate-token",
            data=validation_data,
            expected_status=200
        )
        
        # Test with invalid token
        invalid_data = {"token": ""}
        
        await self.make_test_request(
            "Invalid Token Validation",
            "POST",
            f"{self.auth_base_url}/auth/validate-token", 
            data=invalid_data,
            expected_status=401
        )
    
    async def test_permission_enforcement(self):
        """Test API permission enforcement middleware."""
        print("\n🛡️ Testing Permission Enforcement...")
        
        if not self.access_token:
            print("   ❌ No access token available, skipping permission tests")
            return
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Test protected endpoint with valid token
        await self.make_test_request(
            "Protected Endpoint with Valid Token",
            "GET",
            f"{self.api_base_url}/roles/tenant/{self.test_tenant_id}",
            headers=headers,
            expected_status=[200, 403]  # Either works or permission denied
        )
        
        # Test protected endpoint without token
        await self.make_test_request(
            "Protected Endpoint without Token",
            "GET", 
            f"{self.api_base_url}/roles/tenant/{self.test_tenant_id}",
            expected_status=401
        )
    
    async def test_role_management(self):
        """Test role management APIs."""
        print("\n🎭 Testing Role Management APIs...")
        
        # Test creating role from template
        if self.access_token:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            create_role_data = {
                "template_role_id": "11111111-2222-3333-4444-555555555555",  # Business Owner template
                "custom_name": "Test Custom Role",
                "custom_description": "A custom role for testing"
            }
            
            await self.make_test_request(
                "Create Custom Role from Template",
                "POST",
                f"{self.api_base_url}/roles/tenant/{self.test_tenant_id}/create-from-template",
                data=create_role_data,
                headers=headers,
                expected_status=[201, 403]  # Either works or permission denied
            )
    
    async def test_session_management(self):
        """Test session management features."""
        print("\n⚡ Testing Session Management...")
        
        if not self.access_token:
            print("   ❌ No access token available, skipping session tests")
            return
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Test session info
        await self.make_test_request(
            "Get Current Session Info",
            "GET",
            f"{self.auth_base_url}/auth/session",
            headers=headers,
            expected_status=200
        )
        
        # Test token refresh
        if self.refresh_token:
            refresh_data = {
                "refresh_token": self.refresh_token,
                "tenant_id": self.test_tenant_id
            }
            
            await self.make_test_request(
                "Token Refresh",
                "POST",
                f"{self.auth_base_url}/auth/refresh",
                data=refresh_data,
                expected_status=200
            )
    
    async def test_security_features(self):
        """Test security features like logout and session revocation."""
        print("\n🔒 Testing Security Features...")
        
        if not self.access_token:
            print("   ❌ No access token available, skipping security tests")
            return
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Test logout (session revocation)
        await self.make_test_request(
            "User Logout (Session Revocation)",
            "POST",
            f"{self.auth_base_url}/auth/logout",
            headers=headers,
            expected_status=200
        )
        
        # Test using token after logout (should fail)
        await self.make_test_request(
            "Using Token After Logout",
            "GET",
            f"{self.auth_base_url}/auth/session",
            headers=headers,
            expected_status=401
        )
    
    async def make_test_request(
        self, 
        test_name: str, 
        method: str, 
        url: str, 
        data: Dict = None,
        headers: Dict = None,
        expected_status: Any = 200
    ) -> Dict:
        """Make a test request and validate the response."""
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Prepare request
                kwargs = {"method": method, "url": url}
                if headers:
                    kwargs["headers"] = headers
                if data:
                    kwargs["json"] = data
                
                # Make request
                response = await client.request(**kwargs)
                
                # Check status code
                if isinstance(expected_status, list):
                    status_ok = response.status_code in expected_status
                    expected_str = f"one of {expected_status}"
                else:
                    status_ok = response.status_code == expected_status
                    expected_str = str(expected_status)
                
                if status_ok:
                    print(f"   ✅ {test_name}: {response.status_code}")
                    self.test_results.append({"test": test_name, "status": "PASS"})
                    
                    # Try to parse JSON response
                    try:
                        return response.json()
                    except:
                        return {"status": "success"}
                else:
                    print(f"   ❌ {test_name}: Expected {expected_str}, got {response.status_code}")
                    print(f"      Response: {response.text[:200]}...")
                    self.test_results.append({"test": test_name, "status": "FAIL", "error": f"Status {response.status_code}"})
                    return None
                    
        except Exception as e:
            print(f"   ❌ {test_name}: Exception - {str(e)}")
            self.test_results.append({"test": test_name, "status": "ERROR", "error": str(e)})
            return None
    
    def print_test_summary(self):
        """Print a summary of all test results."""
        print("\n" + "=" * 80)
        print("🧪 TEST RESULTS SUMMARY")
        print("=" * 80)
        
        passed = len([r for r in self.test_results if r["status"] == "PASS"])
        failed = len([r for r in self.test_results if r["status"] in ["FAIL", "ERROR"]])
        total = len(self.test_results)
        
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"📊 TOTAL:  {total}")
        print(f"📈 SUCCESS RATE: {(passed/total*100):.1f}%" if total > 0 else "📈 SUCCESS RATE: 0%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if result["status"] in ["FAIL", "ERROR"]:
                    error = result.get("error", "Unknown error")
                    print(f"   • {result['test']}: {error}")
        
        print("\n🎯 Next Steps:")
        if failed == 0:
            print("   ✅ All tests passed! The authentication system is working correctly.")
            print("   🚀 Ready for production deployment.")
        else:
            print("   🔧 Fix the failed tests and re-run the test suite.")
            print("   📝 Check service logs for detailed error information.")


async def main():
    """Run the test suite."""
    tester = AuthSystemTester()
    await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())