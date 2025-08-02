#!/usr/bin/env python3
"""Test delete endpoint fix."""

import asyncio
import aiohttp
import json

async def test_delete_directly():
    """Test the delete endpoint with a fresh role."""
    
    base_url = "http://localhost:8000"
    test_tenant_id = "89f84fea-b5b9-413c-945b-002c7fd9555d"
    
    print("🧪 Testing Delete Fix...")
    
    async with aiohttp.ClientSession() as session:
        try:
            # Step 1: Create a role to delete
            print("📝 Step 1: Creating a role to test deletion...")
            create_data = {
                "template_role_id": "b0511111-1111-1111-1111-111111111111",
                "custom_name": "DELETE_TEST_ROLE",
                "custom_display_name": "Delete Test Role"
            }
            
            async with session.post(
                f"{base_url}/roles/tenant/{test_tenant_id}/create-from-template",
                json=create_data
            ) as response:
                if response.status == 200:
                    created_role = await response.json()
                    test_role_id = created_role['role_id']
                    print(f"✅ Created test role: {test_role_id}")
                else:
                    print(f"❌ Failed to create test role: {response.status}")
                    return
            
            # Step 2: Try to delete it
            print("🗑️ Step 2: Attempting to delete the role...")
            async with session.delete(
                f"{base_url}/roles/tenant/{test_tenant_id}/role/{test_role_id}"
            ) as response:
                print(f"Delete Status: {response.status}")
                result = await response.text()
                print(f"Delete Response: {result}")
                
                if response.status == 200:
                    print("✅ Delete successful!")
                    return True
                else:
                    print(f"❌ Delete failed: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Test error: {e}")
            return False

if __name__ == "__main__":
    result = asyncio.run(test_delete_directly())
    if result:
        print("\n🎉 DELETE ENDPOINT WORKING! 100% API SUCCESS!")
    else:
        print("\n🔧 Delete endpoint still needs debugging")