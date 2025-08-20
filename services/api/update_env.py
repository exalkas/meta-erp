#!/usr/bin/env python3
"""
Update .env file with correct database name
"""

def update_env_file():
    env_file = '.env'
    
    # Read current content
    with open(env_file, 'r') as f:
        content = f.read()
    
    # Replace the database URL
    old_url = 'postgresql+asyncpg://postgres:@localhost:5432/metadata_tenant_demo_eshop_crm'
    new_url = 'postgresql+asyncpg://postgres:@localhost:5432/metadata_erp'
    
    updated_content = content.replace(old_url, new_url)
    
    # Write back
    with open(env_file, 'w') as f:
        f.write(updated_content)
    
    print("Updated .env file with correct database name")

if __name__ == "__main__":
    update_env_file()

