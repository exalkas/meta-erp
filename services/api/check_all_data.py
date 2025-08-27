#!/usr/bin/env python3
"""
Check All Seeded Data
"""

import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal

async def check_all_data():
    print("🔄 Checking all database tables...")
    session = AsyncSessionLocal()
    try:
        # Check tenants
        result = await session.execute(text('SELECT COUNT(*) FROM tenants'))
        tenant_count = result.scalar()
        print(f'🏢 Tenants: {tenant_count}')
        
        # Check users  
        result = await session.execute(text('SELECT COUNT(*) FROM users'))
        user_count = result.scalar()
        print(f'👤 Users: {user_count}')
        
        # Check pages
        result = await session.execute(text('SELECT COUNT(*) FROM page_definitions'))
        page_count = result.scalar()
        print(f'📄 Pages: {page_count}')
        
        # Check layouts
        result = await session.execute(text('SELECT COUNT(*) FROM layout_definitions'))
        layout_count = result.scalar()
        print(f'🎨 Layouts: {layout_count}')
        
        # Check themes
        result = await session.execute(text('SELECT COUNT(*) FROM base_themes'))
        theme_count = result.scalar()
        print(f'🎨 Base Themes: {theme_count}')
        
        # Check translations
        result = await session.execute(text('SELECT COUNT(*) FROM translations'))
        translation_count = result.scalar()
        print(f'🌐 Translations: {translation_count}')
        
        print(f'\n📊 SUMMARY: {tenant_count + user_count + page_count + layout_count + theme_count + translation_count} total records')
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(check_all_data())
