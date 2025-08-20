#!/usr/bin/env python3
"""
Check Admin Pages in Database
"""

import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal

async def check_admin_pages():
    print("🔄 Connecting to database...")
    session = AsyncSessionLocal()
    try:
        print("🔍 Checking for admin pages...")
        result = await session.execute(text("""
            SELECT page_name, route, title 
            FROM page_definitions 
            WHERE page_name LIKE '%admin%'
            ORDER BY page_name
        """))
        pages = result.fetchall()
        print(f'🔍 ADMIN PAGES IN DATABASE ({len(pages)} found):')
        for page in pages:
            print(f'  📄 {page[0]} -> route: "{page[1]}" (title: {page[2]})')
        
        # Also check all pages to see what's available
        print('\n🔍 ALL PAGES IN DATABASE:')
        result2 = await session.execute(text("""
            SELECT page_name, route, title 
            FROM page_definitions 
            ORDER BY page_name
        """))
        all_pages = result2.fetchall()
        print(f'Total pages found: {len(all_pages)}')
        for page in all_pages:
            print(f'  📄 {page[0]} -> route: "{page[1]}" (title: {page[2]})')
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await session.close()
        print("🔚 Database connection closed")

if __name__ == "__main__":
    asyncio.run(check_admin_pages())
