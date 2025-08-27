import asyncio
import asyncpg

async def check_databases():
    try:
        conn = await asyncpg.connect('postgresql://postgres:@localhost:5432/postgres')
        result = await conn.fetch('SELECT datname FROM pg_database WHERE datistemplate = false')
        databases = [r['datname'] for r in result]
        print("Available databases:")
        for db in databases:
            print(f"  - {db}")
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_databases())

