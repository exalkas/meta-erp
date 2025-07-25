#!/usr/bin/env python3
"""
Master Seed Script
Seeds all backed up data in correct order
Generated on 2025-07-20 23:00:25
"""

import sys
import os
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Import all seed functions


def seed_all_data(session):
    """Seed all data in correct order"""
    
    print("Starting comprehensive data seeding...")
    
    # Seed in dependency order

    
    print("All data seeding completed!")

def main():
    """Main function"""
    print("COMPREHENSIVE DATA SEEDING")
    print("=========================")
    print("")
    
    try:
        engine = create_engine(settings.DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        try:
            seed_all_data(session)
            session.commit()
            print("SUCCESS: All data seeded successfully!")
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
            
    except Exception as e:
        print(f"ERROR: {e}")
        raise

if __name__ == "__main__":
    main()
