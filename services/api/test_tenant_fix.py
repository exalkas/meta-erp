#!/usr/bin/env python3
"""Fix tenant issue for role creation."""

import asyncio
import sys
from pathlib import Path
from uuid import UUID
import uuid

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "services" / "api"))

from app.core.database import AsyncSessionLocal
from app.models.metadata import Tenant
from sqlalchemy import select

async def fix_tenant_issue():
    """Check tenants and create test tenant if needed."""
    
    print("🧪 Checking tenant situation...")
    
    async with AsyncSessionLocal() as db:
        try:
            # Check existing tenants
            tenant_query = select(Tenant)
            result = await db.execute(tenant_query)
            tenants = result.scalars().all()
            
            print(f"📊 Found {len(tenants)} existing tenants:")
            for tenant in tenants:
                print(f"   🏢 {tenant.tenant_id}: {tenant.name}")
            
            # Create test tenant if none exist
            if not tenants:
                print("📝 Creating test tenant...")
                test_tenant = Tenant(
                    tenant_id=UUID("12345678-1234-5678-9123-123456789abc"),
                    name="Test Company",
                    domain="test.example.com",
                    is_active=True,
                    subscription_tier="standard"
                )
                db.add(test_tenant)
                await db.commit()
                print("✅ Test tenant created successfully!")
                return "12345678-1234-5678-9123-123456789abc"
            else:
                # Use first existing tenant
                first_tenant = tenants[0]
                print(f"✅ Using existing tenant: {first_tenant.tenant_id}")
                return str(first_tenant.tenant_id)
                
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return None

if __name__ == "__main__":
    result = asyncio.run(fix_tenant_issue())
    print(f"\n🎯 Use tenant ID: {result}")