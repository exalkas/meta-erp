#!/usr/bin/env python3
"""Final status check - test each endpoint individually."""

import asyncio
import aiohttp
import json

async def final_status_check():
    """Check status of each endpoint individually."""
    
    base_url = "http://localhost:8000"
    test_tenant_id = "89f84fea-b5b9-413c-945b-002c7fd9555d"
    results = {}
    
    print("🎯 FINAL API STATUS CHECK")
    print("=" * 50)
    
    async with aiohttp.ClientSession() as session:
        
        # Test 1: Health Check
        try:
            async with session.get(f"{base_url}/roles/health") as response:
                results["health"] = response.status == 200
                print(f"1. Health Check: {'✅ PASS' if results['health'] else '❌ FAIL'} ({response.status})")
        except Exception as e:
            results["health"] = False
            print(f"1. Health Check: ❌ FAIL (Exception: {e})")
        
        # Test 2: Get Templates
        try:
            async with session.get(f"{base_url}/roles/templates") as response:
                results["templates"] = response.status == 200
                if results["templates"]:
                    data = await response.json()
                    print(f"2. Get Templates: ✅ PASS ({len(data)} templates)")
                else:
                    print(f"2. Get Templates: ❌ FAIL ({response.status})")
        except Exception as e:
            results["templates"] = False
            print(f"2. Get Templates: ❌ FAIL (Exception: {e})")
        
        # Test 3: Get by Vertical
        try:
            async with session.get(f"{base_url}/roles/templates?vertical=ecommerce") as response:
                results["vertical"] = response.status == 200
                print(f"3. Get by Vertical: {'✅ PASS' if results['vertical'] else '❌ FAIL'} ({response.status})")
        except Exception as e:
            results["vertical"] = False
            print(f"3. Get by Vertical: ❌ FAIL (Exception: {e})")
        
        # Test 4: Grouped Templates
        try:
            async with session.get(f"{base_url}/roles/templates/by-vertical") as response:
                results["grouped"] = response.status == 200
                print(f"4. Grouped Templates: {'✅ PASS' if results['grouped'] else '❌ FAIL'} ({response.status})")
        except Exception as e:
            results["grouped"] = False
            print(f"4. Grouped Templates: ❌ FAIL (Exception: {e})")
        
        # Test 5: Create Role (Simple)
        try:
            create_data = {"template_role_id": "b0511111-1111-1111-1111-111111111111", "custom_name": "FINAL_TEST"}
            async with session.post(f"{base_url}/roles/tenant/{test_tenant_id}/create-from-template", json=create_data) as response:
                results["create"] = response.status == 200
                if results["create"]:
                    created_role = await response.json()
                    test_role_id = created_role["role_id"]
                    print(f"5. Create Role: ✅ PASS (Created: {test_role_id})")
                else:
                    print(f"5. Create Role: ❌ FAIL ({response.status})")
                    text = await response.text()
                    print(f"   Error: {text[:100]}...")
        except Exception as e:
            results["create"] = False
            print(f"5. Create Role: ❌ FAIL (Exception: {e})")
        
        # Test 6: List Tenant Roles
        try:
            async with session.get(f"{base_url}/roles/tenant/{test_tenant_id}") as response:
                results["list"] = response.status == 200
                if results["list"]:
                    data = await response.json()
                    print(f"6. List Roles: ✅ PASS ({len(data)} roles)")
                else:
                    print(f"6. List Roles: ❌ FAIL ({response.status})")
        except Exception as e:
            results["list"] = False
            print(f"6. List Roles: ❌ FAIL (Exception: {e})")
        
        # Test 7: Delete Role (only if create worked)
        if results.get("create") and 'test_role_id' in locals():
            try:
                async with session.delete(f"{base_url}/roles/tenant/{test_tenant_id}/role/{test_role_id}") as response:
                    results["delete"] = response.status == 200
                    print(f"7. Delete Role: {'✅ PASS' if results['delete'] else '❌ FAIL'} ({response.status})")
            except Exception as e:
                results["delete"] = False
                print(f"7. Delete Role: ❌ FAIL (Exception: {e})")
        else:
            results["delete"] = False
            print("7. Delete Role: ⏭️ SKIP (Create failed)")
    
    # Final Summary
    print("\n" + "=" * 50)
    passed = sum(1 for r in results.values() if r)
    total = len(results)
    percentage = (passed / total) * 100
    
    print(f"🏆 FINAL RESULTS: {passed}/{total} endpoints working ({percentage:.1f}%)")
    
    if percentage >= 85:
        print("🎉 EXCELLENT! Ready for Phase 5 UI development!")
    elif percentage >= 70:
        print("👍 GOOD! Most functionality working!")
    else:
        print("🔧 More debugging needed")
    
    return results

if __name__ == "__main__":
    asyncio.run(final_status_check())