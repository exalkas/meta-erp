#!/usr/bin/env python3
"""Simple debug test for 404 issue."""

import requests
import json

def test_endpoints():
    """Test endpoints to find 404 issue."""
    
    base_url = "http://localhost:8000"
    
    # Test 1: Health endpoint (should work)
    print("🧪 Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/roles/health")
        print(f"Health Status: {response.status_code}")
        if response.status_code == 200:
            print(f"✅ Health Response: {response.json()}")
        else:
            print(f"❌ Health Error: {response.text}")
    except Exception as e:
        print(f"❌ Health Connection Error: {e}")
        return
    
    # Test 2: Templates endpoint (should work) 
    print("\n🧪 Testing templates endpoint...")
    try:
        response = requests.get(f"{base_url}/roles/templates")
        print(f"Templates Status: {response.status_code}")
        if response.status_code == 200:
            templates = response.json()
            print(f"✅ Found {len(templates)} templates")
        else:
            print(f"❌ Templates Error: {response.text}")
    except Exception as e:
        print(f"❌ Templates Error: {e}")
    
    # Test 3: Problematic create endpoint
    print("\n🧪 Testing create endpoint...")
    test_data = {
        "template_role_id": "b0511111-1111-1111-1111-111111111111",
        "custom_name": "TEST_ROLE"
    }
    test_tenant_id = "12345678-1234-5678-9123-123456789abc"
    
    try:
        url = f"{base_url}/roles/tenant/{test_tenant_id}/create-from-template"
        print(f"URL: {url}")
        print(f"Data: {json.dumps(test_data, indent=2)}")
        
        response = requests.post(url, json=test_data)
        print(f"Create Status: {response.status_code}")
        print(f"Create Response: {response.text}")
        
    except Exception as e:
        print(f"❌ Create Error: {e}")

if __name__ == "__main__":
    test_endpoints()