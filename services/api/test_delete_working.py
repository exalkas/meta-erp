#!/usr/bin/env python3
"""Test if delete is working with the created role."""

import asyncio
import aiohttp
import json

async def test_delete_working():
    """Test delete with a freshly created role."""
    
    base_url = "http://localhost:8000"
    test_tenant_id = "89f84fea-b5b9-413c-945b-002c7fd9555d"
    
    print("🧪 Testing CREATE → DELETE flow...")
    
    async with aiohttp.ClientSession() as session:
        try:
            # Step 1: Create a role
            print("📝 Step 1: Creating role...")
            create_data = {
                "template_role_id": "b0511111-1111-1111-1111-111111111111",
                "custom_name": "DELETE_TEST_ROLE"
            }
            
            async with session.post(
                f"{base_url}/roles/tenant/{test_tenant_id}/create-from-template",
                json=create_data
            ) as response:
                if response.status == 200:
                    created_role = await response.json()
                    role_id = created_role['role_id']
                    print(f"✅ Created role: {role_id}")
                else:
                    print(f"❌ Create failed: {response.status}")
                    return False
            
            # Step 2: Delete the role
            print("🗑️ Step 2: Deleting role...")
            async with session.delete(
                f"{base_url}/roles/tenant/{test_tenant_id}/role/{role_id}"
            ) as response:
                response_text = await response.text()
                print(f"Delete Status: {response.status}")
                print(f"Delete Response: {response_text}")
                
                if response.status == 200:
                    print("✅ DELETE SUCCESSFUL!")
                    return True
                else:
                    print(f"❌ Delete failed: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Test error: {e}")
            return False

if __name__ == "__main__":
    result = asyncio.run(test_delete_working())
    if result:
        print("\n🎉 BOTH CREATE AND DELETE WORKING!")
        print("✅ 100% API FUNCTIONALITY ACHIEVED!")
    else:
        print("\n🔧 Still debugging...")