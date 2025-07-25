"""
Check database enum values
"""

import sys
import os

# Add the parent directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine, text
from app.core.config import settings

def main():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Check ContactMethodType enum values
            result = conn.execute(text("SELECT unnest(enum_range(NULL::contactmethodtype))"))
            print("ContactMethodType enum values in database:")
            for row in result:
                print(f"  - '{row[0]}'")
        except Exception as e:
            print(f"Error checking ContactMethodType enum: {e}")
        
        try:
            # Check if contact_method_subtypes table exists and its structure
            result = conn.execute(text("""
                SELECT column_name, data_type, udt_name 
                FROM information_schema.columns 
                WHERE table_name = 'contact_method_subtypes' 
                AND column_name = 'method_type'
            """))
            row = result.fetchone()
            if row:
                print(f"\nmethod_type column: {row[0]}, type: {row[1]}, udt: {row[2]}")
            else:
                print("\nmethod_type column not found")
        except Exception as e:
            print(f"Error checking table structure: {e}")

if __name__ == "__main__":
    main() 