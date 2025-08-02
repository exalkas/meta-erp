#!/usr/bin/env python3
"""Test single endpoint to debug 404 error."""

import asyncio
import aiohttp
import json

async def test_create_endpoint():
    """Test the create tenant role endpoint specifically."""
    
    test_data = {
        "template_role_id": "b0511111-1111-1111-1111-111111111111",
        "custom_name": "TEST_ROLE",
        "custom_display_name": "Test Role"
    }
    
    test_tenant_id = "12345678-1234-5678-9123-123456789abc"
    url = f"http://localhost:8000/roles/tenant/{test_tenant_id}/create-from-template"
    
    print(f"🧪 Testing URL: {url}")
    print(f"📝 Request data: {json.dumps(test_data, indent=2)}")
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json=test_data) as response:
                print(f"📊 Status: {response.status}")
                print(f"📋 Headers: {dict(response.headers)}")
                
                text = await response.text()
                print(f"📄 Response: {text}")
                
                # Try to parse as JSON
                try:
                    data = await response.json()
                    print(f"🔍 JSON Response: {json.dumps(data, indent=2)}")
                except:
                    print("❌ Response is not JSON")
                    
        except Exception as e:
            print(f"❌ Request error: {e}")

if __name__ == "__main__":
    asyncio.run(test_create_endpoint())