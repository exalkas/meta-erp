#!/usr/bin/env python3
"""Create demo tenant for testing."""

import asyncio
import uuid
from datetime import datetime

from app.core.database import AsyncSessionLocal
from app.models import Tenant

async def create_demo_tenant():
    """Create demo tenant."""
    session = AsyncSessionLocal()
    
    try:
        tenant = Tenant(
            tenant_id=uuid.UUID('89f84fea-b5b9-413c-945b-002c7fd9555d'),
            name='Demo Tenant',
            domain='demo.local',
            subdomain='demo',
            default_locale='en-US',
            supported_locales=['en-US'],
            status='active',
            database_name='demo_db',
            max_users=100,
            subscription_plan='basic',
            subscription_status='active',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        session.add(tenant)
        await session.commit()
        print('✅ Demo tenant created successfully')
        
    except Exception as e:
        print(f'Tenant creation result: {e}')
        
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(create_demo_tenant())
