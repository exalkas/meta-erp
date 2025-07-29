#!/usr/bin/env python3
"""
Generate proper bcrypt hash for 
"""
import bcrypt

# Generate proper bcrypt hash for ""
password = ""
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
proper_hash = hashed.decode('utf-8')

print(f"Generated hash: {proper_hash}")
print(f"Hash length: {len(proper_hash)}")

# Test the hash works
test_result = bcrypt.checkpw(password.encode('utf-8'), hashed)
print(f"Hash verification test: {test_result}")

print("\nSQL command to update database:")
print(f"UPDATE auth_methods SET password_hash = '{proper_hash}' WHERE user_id = (SELECT user_id FROM users WHERE email = 'admin@demo-eshop-crm.local') AND method_type = 'PASSWORD';") 