#!/usr/bin/env python3
"""
Reset database - Drop and recreate with clean schema
"""

import asyncio
import asyncpg

async def reset_database():
    try:
        # Connect to postgres database to manage the metadata_erp database
        conn = await asyncpg.connect('postgresql://postgres:@localhost:5432/postgres')
        
        # Terminate any existing connections to the database
        await conn.execute("""
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = 'metadata_erp' AND pid <> pg_backend_pid()
        """)
        
        # Drop database if exists
        await conn.execute('DROP DATABASE IF EXISTS metadata_erp')
        print("✅ Dropped existing database")
        
        # Create fresh database
        await conn.execute('CREATE DATABASE metadata_erp')
        print("✅ Created fresh database: metadata_erp")
        
        await conn.close()
        
        # Test connection to new database
        test_conn = await asyncpg.connect('postgresql://postgres:@localhost:5432/metadata_erp')
        await test_conn.close()
        print("✅ Database connection test successful")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(reset_database())

