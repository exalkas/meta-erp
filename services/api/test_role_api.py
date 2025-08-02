#!/usr/bin/env python3
"""Test Role Management API endpoints."""

import asyncio
import json
import sys
from pathlib import Path
from typing import Dict, List, Any
import uuid
from datetime import datetime
import aiohttp

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "services" / "api"))

async def test_api_endpoints():
    """Test all Role Management API endpoints."""
    print("🧪 Testing Role Management API Endpoints...")
    
    base_url = "http://localhost:8000"
    test_tenant_id = "89f84fea-b5b9-413c-945b-002c7fd9555d"  # Real tenant ID (demo-eshop-crm)
    
    async with aiohttp.ClientSession() as session:
        try:
            # Test 1: Health Check
            print("\n📋 Test 1: API Health Check")
            async with session.get(f"{base_url}/roles/health") as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Health check passed: {result}")
                else:
                    print(f"❌ Health check failed: {response.status}")
                    return False
            
            # Test 2: Get All Role Templates
            print("\n📋 Test 2: Get All Role Templates")
            async with session.get(f"{base_url}/roles/templates") as response:
                if response.status == 200:
                    templates = await response.json()
                    print(f"✅ Found {len(templates)} role templates")
                    
                    # Show breakdown by type
                    business_templates = [t for t in templates if t.get('vertical') is None]
                    vertical_templates = [t for t in templates if t.get('vertical') is not None]
                    
                    print(f"   📊 {len(business_templates)} Generic Business Templates")
                    print(f"   📊 {len(vertical_templates)} Vertical-Specific Templates")
                    
                    # Show some examples
                    if business_templates:
                        print(f"   🏢 Generic example: {business_templates[0]['display_name']}")
                    if vertical_templates:
                        verticals = set(t['vertical'] for t in vertical_templates)
                        print(f"   🎯 Verticals available: {', '.join(sorted(verticals))}")
                        
                else:
                    print(f"❌ Get templates failed: {response.status}")
                    text = await response.text()
                    print(f"   Error: {text}")
                    return False
            
            # Test 3: Get Templates by Vertical
            print("\n📋 Test 3: Get Templates by Vertical (ecommerce)")
            async with session.get(f"{base_url}/roles/templates?vertical=ecommerce") as response:
                if response.status == 200:
                    ecom_templates = await response.json()
                    print(f"✅ Found {len(ecom_templates)} ecommerce templates")
                    if ecom_templates:
                        print(f"   🛒 Example: {ecom_templates[0]['display_name']}")
                else:
                    print(f"❌ Get ecommerce templates failed: {response.status}")
                    return False
            
            # Test 4: Get Templates Grouped by Vertical
            print("\n📋 Test 4: Get Templates Grouped by Vertical")
            async with session.get(f"{base_url}/roles/templates/by-vertical") as response:
                if response.status == 200:
                    grouped = await response.json()
                    print(f"✅ Templates grouped successfully")
                    for vertical_group in grouped:
                        vertical_name = vertical_group.get('vertical_display_name', 'Unknown')
                        role_count = vertical_group.get('role_count', 0)
                        print(f"   📊 {vertical_name}: {role_count} templates")
                else:
                    print(f"❌ Get grouped templates failed: {response.status}")
                    return False
            
            # Test 5: Create Tenant Role from Template
            print(f"\n📋 Test 5: Create Tenant Role from Template")
            
            # First, get a template to use
            async with session.get(f"{base_url}/roles/templates?vertical=ecommerce&limit=1") as response:
                if response.status == 200:
                    templates = await response.json()
                    if templates:
                        template_id = templates[0]['role_id']
                        
                        # Create tenant role
                        create_data = {
                            "template_role_id": template_id,
                            "custom_name": "CUSTOM_STORE_MANAGER",
                            "custom_display_name": "Custom Store Manager",
                            "custom_description": "Customized store manager role for our business"
                        }
                        
                        async with session.post(
                            f"{base_url}/roles/tenant/{test_tenant_id}/create-from-template",
                            json=create_data
                        ) as create_response:
                            if create_response.status == 200:
                                created_role = await create_response.json()
                                print(f"✅ Created tenant role: {created_role['display_name']}")
                                test_role_id = created_role['role_id']
                            else:
                                print(f"❌ Create tenant role failed: {create_response.status}")
                                text = await create_response.text()
                                print(f"   Error: {text}")
                                return False
                    else:
                        print("❌ No ecommerce templates found")
                        return False
                else:
                    print(f"❌ Failed to get template for testing: {response.status}")
                    return False
            
            # Test 6: Get Tenant Roles
            print(f"\n📋 Test 6: Get Tenant Roles")
            async with session.get(f"{base_url}/roles/tenant/{test_tenant_id}") as response:
                if response.status == 200:
                    tenant_roles = await response.json()
                    print(f"✅ Found {len(tenant_roles)} tenant roles")
                    for role in tenant_roles:
                        print(f"   👤 {role['display_name']} ({role['role_name']})")
                else:
                    print(f"❌ Get tenant roles failed: {response.status}")
                    return False
            
            # Test 7: Delete Tenant Role
            print(f"\n📋 Test 7: Delete Tenant Role")
            async with session.delete(f"{base_url}/roles/tenant/{test_tenant_id}/role/{test_role_id}") as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Deleted tenant role: {result['message']}")
                else:
                    print(f"❌ Delete tenant role failed: {response.status}")
                    text = await response.text()
                    print(f"   Error: {text}")
                    return False
            
            print("\n🎉 ALL API TESTS PASSED! ✅")
            return True
            
        except aiohttp.ClientConnectorError:
            print("❌ Cannot connect to API server. Is it running on http://localhost:8000?")
            print("💡 Start server with: poetry run uvicorn main:app --reload")
            return False
        except Exception as e:
            print(f"❌ API test error: {e}")
            return False

async def main():
    """Main test function."""
    print("🚀 Starting Role Management API Tests...")
    success = await test_api_endpoints()
    
    if success:
        print("\n✅ ALL TESTS PASSED - API IS READY! 🎉")
        print("\n📋 Next Steps:")
        print("   1. ✅ Database structure verified")
        print("   2. ✅ Role templates seeded successfully") 
        print("   3. ✅ API endpoints tested and working")
        print("   4. 🎨 Ready for Phase 5: UI Development")
    else:
        print("\n❌ SOME TESTS FAILED - CHECK API SERVER")

if __name__ == "__main__":
    asyncio.run(main())