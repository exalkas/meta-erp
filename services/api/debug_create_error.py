#!/usr/bin/env python3
"""Debug the exact create endpoint error."""

import asyncio
import aiohttp
import json

async def debug_create_error():
    """Get detailed error info from create endpoint."""
    
    base_url = "http://localhost:8000"
    test_tenant_id = "89f84fea-b5b9-413c-945b-002c7fd9555d"
    
    # Test with minimal data
    test_data = {
        "template_role_id": "b0511111-1111-1111-1111-111111111111",
        "custom_name": "DEBUG_ROLE"
    }
    
    print("🔍 Debugging create endpoint error...")
    print(f"URL: {base_url}/roles/tenant/{test_tenant_id}/create-from-template")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f"{base_url}/roles/tenant/{test_tenant_id}/create-from-template",
                json=test_data
            ) as response:
                print(f"\nStatus: {response.status}")
                print(f"Headers: {dict(response.headers)}")
                
                # Get full response text
                response_text = await response.text()
                print(f"Raw Response: {response_text}")
                
                # Try to parse as JSON
                try:
                    response_json = json.loads(response_text)
                    print(f"Parsed JSON: {json.dumps(response_json, indent=2)}")
                except:
                    print("❌ Response is not valid JSON")
                    
        except Exception as e:
            print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(debug_create_error())