import asyncio
import asyncpg

async def create_database():
    try:
        # Connect to postgres database to create new database
        conn = await asyncpg.connect('postgresql://postgres:@localhost:5432/postgres')
        
        # Check if database exists
        result = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = 'metadata_erp'"
        )
        
        if result:
            print("Database 'metadata_erp' already exists")
        else:
            # Create database (must be done outside a transaction)
            await conn.execute('CREATE DATABASE metadata_erp')
            print("Database 'metadata_erp' created successfully")
        
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(create_database())

