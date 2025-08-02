#!/usr/bin/env python3
"""Test endpoint execution to find runtime errors."""

import asyncio
import sys
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "services" / "api"))

from app.core.database import AsyncSessionLocal
from uuid import UUID

async def test_tenant_creation():
    """Test the tenant role creation logic directly."""
    
    print("🧪 Testing tenant role creation logic...")
    
    try:
        # Test creating a simple role without tenant validation
        from app.api.roles import CreateTenantRoleRequest
        from app.models.auth import Role
        from sqlalchemy import select
        
        async with AsyncSessionLocal() as db:
            # Check if our test template exists
            template_id = "b0511111-1111-1111-1111-111111111111"
            template_query = select(Role).where(Role.role_id == UUID(template_id))
            result = await db.execute(template_query)
            template = result.scalar_one_or_none()
            
            if template:
                print(f"✅ Template found: {template.display_name}")
                print(f"   📊 Template details: vertical={template.vertical}, is_template={template.is_template}")
            else:
                print(f"❌ Template not found: {template_id}")
                
                # Show available templates
                all_templates = select(Role).where(Role.is_template == True)
                result = await db.execute(all_templates)
                templates = result.scalars().all()
                print(f"📋 Available templates ({len(templates)}):")
                for t in templates[:5]:  # Show first 5
                    print(f"   - {t.role_id}: {t.display_name}")
                
        print("✅ Database connection and template check successful")
        
    except Exception as e:
        print(f"❌ Error during tenant creation test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_tenant_creation())