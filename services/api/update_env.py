#!/usr/bin/env python3
"""
Update .env file with correct database name
"""
import os

def update_env_file():
    env_file = '.env'
    
    # Read current content
    with open(env_file, 'r') as f:
        content = f.read()
    
    # Replace the database URL
    old_url = os.environ["OLD_DATABASE_URL"]
    new_url = os.environ["DATABASE_URL"]
    
    updated_content = content.replace(old_url, new_url)
    
    # Write back
    with open(env_file, 'w') as f:
        f.write(updated_content)
    
    print("Updated .env file with correct database name")

if __name__ == "__main__":
    update_env_file()

