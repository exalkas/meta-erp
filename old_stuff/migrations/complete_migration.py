#!/usr/bin/env python3
"""
Complete Migration System
Orchestrates the complete database migration workflow:
1. Extract current schema and data
2. Compare with target SQLAlchemy schema
3. Generate migration plan
4. Transform data
5. Recreate database with new schema
6. Restore transformed data
7. Clean up temporary files
"""

import sys
import os
from pathlib import Path
import time
import subprocess

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.database import Base

from schema_extractor import SchemaExtractor
from schema_comparator import SchemaComparator
from data_transformer import DataTransformer

class CompleteMigration:
    """Complete migration orchestrator"""
    
    def __init__(self):
        self.engine = create_engine(settings.DATABASE_URL)
        self.extractor = SchemaExtractor()
        self.comparator = SchemaComparator()
        self.transformer = DataTransformer()
    
    def run_complete_migration(self, confirm: bool = False) -> bool:
        """Run the complete migration workflow"""
        
        print("=" * 80)
        print("COMPLETE DATABASE MIGRATION SYSTEM")
        print("=" * 80)
        print("")
        print("This will:")
        print("1. 📊 Extract current database schema and ALL data")
        print("2. 🔄 Compare with SQLAlchemy models")
        print("3. 🛠️ Generate migration plan with data transformations")
        print("4. 💾 Transform data to match new schema")
        print("5. 🗑️ Drop all tables and recreate with new schema")
        print("6. 📥 Restore transformed data")
        print("7. 🧹 Clean up temporary files")
        print("")
        
        if not confirm:
            response = input("Are you sure you want to proceed? Type 'YES' to confirm: ")
            if response.strip().upper() != "YES":
                print("Migration cancelled")
                return False
        
        start_time = time.time()
        
        try:
            # Step 1: Extract current schema and data
            print("\n" + "=" * 50)
            print("STEP 1: EXTRACTING CURRENT DATABASE")
            print("=" * 50)
            
            current_schema = self.extractor.extract_current_db_schema()
            current_data = self.transformer.backup_all_data(current_schema)
            
            if not current_data:
                print("No data found in database - this might be a fresh install")
            
            # Step 2: Extract target schema
            print("\n" + "=" * 50)
            print("STEP 2: EXTRACTING TARGET SCHEMA")
            print("=" * 50)
            
            target_schema = self.extractor.extract_sqlalchemy_schema()
            
            # Step 3: Compare schemas and generate migration plan
            print("\n" + "=" * 50)
            print("STEP 3: GENERATING MIGRATION PLAN")
            print("=" * 50)
            
            migration_plan = self.comparator.compare_schemas(current_schema, target_schema)
            
            # Display migration plan
            self._display_migration_plan(migration_plan)
            
            if not migration_plan.safe_migration:
                print("\n⚠️ WARNING: This migration contains potentially unsafe operations!")
                for warning in migration_plan.warnings:
                    print(f"  - {warning}")
                
                if not confirm:
                    proceed = input("\nDo you want to proceed anyway? Type 'YES' to continue: ")
                    if proceed.strip().upper() != "YES":
                        print("Migration cancelled")
                        return False
            
            # Step 4: Transform data
            print("\n" + "=" * 50)
            print("STEP 4: TRANSFORMING DATA")
            print("=" * 50)
            
            transformed_data = self.transformer.transform_data(
                current_data, migration_plan, target_schema
            )
            
            # Step 5: Recreate database schema
            print("\n" + "=" * 50)
            print("STEP 5: RECREATING DATABASE SCHEMA")
            print("=" * 50)
            
            if not self._recreate_database_schema():
                print("ERROR: Failed to recreate database schema")
                return False
            
            # Step 6: Restore transformed data
            print("\n" + "=" * 50)
            print("STEP 6: RESTORING TRANSFORMED DATA")
            print("=" * 50)
            
            if transformed_data:
                if not self.transformer.restore_transformed_data(transformed_data):
                    print("ERROR: Failed to restore data")
                    return False
            else:
                print("No data to restore")
            
            # Step 7: Seed additional data
            print("\n" + "=" * 50)
            print("STEP 7: SEEDING ADDITIONAL DATA")
            print("=" * 50)
            
            self._seed_additional_data()
            
            # Step 8: Clean up
            print("\n" + "=" * 50)
            print("STEP 8: CLEANING UP")
            print("=" * 50)
            
            self.transformer.cleanup_backup_files()
            
            end_time = time.time()
            
            print("\n" + "=" * 80)
            print("🎉 MIGRATION COMPLETED SUCCESSFULLY!")
            print("=" * 80)
            print(f"Total time: {end_time - start_time:.2f} seconds")
            print("")
            print("What was accomplished:")
            print("✅ Current schema and data extracted")
            print("✅ Migration plan generated and executed")
            print("✅ Data transformed to match new schema")
            print("✅ Database recreated with new schema")
            print("✅ All data restored successfully")
            print("✅ Additional data seeded")
            print("✅ Temporary files cleaned up")
            print("")
            print("Your database is now up to date with the latest schema!")
            print("Ready for development and production use.")
            
            return True
            
        except Exception as e:
            print(f"\n❌ MIGRATION FAILED: {e}")
            print("\nAttempting to clean up...")
            try:
                self.transformer.cleanup_backup_files()
            except:
                pass
            return False
    
    def _display_migration_plan(self, migration_plan):
        """Display the migration plan to the user"""
        
        print("\nMIGRATION PLAN SUMMARY")
        print("======================")
        print(f"Safe migration: {'✅ Yes' if migration_plan.safe_migration else '⚠️ No'}")
        print(f"Schema changes: {len(migration_plan.schema_changes)}")
        print(f"Data transformations: {len(migration_plan.data_transforms)}")
        print(f"Tables to recreate: {len(migration_plan.tables_to_recreate)}")
        
        if migration_plan.warnings:
            print("\nWarnings:")
            for warning in migration_plan.warnings:
                print(f"  ⚠️ {warning}")
        
        if migration_plan.schema_changes:
            print("\nSchema Changes (showing first 10):")
            for i, change in enumerate(migration_plan.schema_changes[:10]):
                icon = "📝"
                if "added" in change.change_type.value:
                    icon = "➕"
                elif "removed" in change.change_type.value:
                    icon = "➖"
                elif "changed" in change.change_type.value:
                    icon = "🔄"
                
                table_col = f"{change.table_name}"
                if change.column_name:
                    table_col += f".{change.column_name}"
                
                print(f"  {icon} {change.change_type.value}: {table_col}")
                if change.details:
                    print(f"      {change.details}")
            
            if len(migration_plan.schema_changes) > 10:
                print(f"  ... and {len(migration_plan.schema_changes) - 10} more changes")
        
        if migration_plan.data_transforms:
            print("\nData Transformations (showing first 10):")
            for i, rule in enumerate(migration_plan.data_transforms[:10]):
                icon = "🔧"
                if rule.rule_type == "add_default":
                    icon = "➕"
                elif rule.rule_type == "drop":
                    icon = "➖"
                elif rule.rule_type == "convert_type":
                    icon = "🔄"
                
                print(f"  {icon} {rule.rule_type}: {rule.table_name}.{rule.column_name}")
                if rule.default_value is not None:
                    print(f"      Default: {rule.default_value}")
                if rule.conversion_func:
                    print(f"      Conversion: {rule.conversion_func}")
            
            if len(migration_plan.data_transforms) > 10:
                print(f"  ... and {len(migration_plan.data_transforms) - 10} more transformations")
    
    def _recreate_database_schema(self) -> bool:
        """Drop all tables and recreate with new schema"""
        
        try:
            print("Dropping all existing tables...")
            
            with self.engine.connect() as connection:
                # Drop all tables using CASCADE
                connection.execute(text("DROP SCHEMA public CASCADE"))
                connection.execute(text("CREATE SCHEMA public"))
                connection.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
                connection.execute(text("GRANT ALL ON SCHEMA public TO public"))
                connection.commit()
            
            print("Creating new tables from SQLAlchemy models...")
            
            # Create all tables from current models
            Base.metadata.create_all(bind=self.engine)
            
            print("Database schema recreated successfully")
            return True
            
        except Exception as e:
            print(f"ERROR recreating schema: {e}")
            return False
    
    def _seed_additional_data(self):
        """Seed additional required data"""
        
        try:
            print("Seeding contact method subtypes...")
            
            # Import and run the contact method subtypes seeder
            from seed_contact_method_subtypes import seed_contact_method_subtypes
            
            Session = sessionmaker(bind=self.engine)
            session = Session()
            
            try:
                seed_contact_method_subtypes(session)
                session.commit()
                print("Contact method subtypes seeded successfully")
            except Exception as e:
                print(f"Warning: Could not seed contact method subtypes: {e}")
                session.rollback()
            finally:
                session.close()
                
        except ImportError:
            print("Contact method subtypes seeder not found - skipping")
        except Exception as e:
            print(f"Warning: Additional seeding failed: {e}")

def main():
    """Main function"""
    
    # Check command line arguments
    confirm = "--confirm" in sys.argv or "--force" in sys.argv
    
    migration = CompleteMigration()
    success = migration.run_complete_migration(confirm=confirm)
    
    if success:
        print("\n🎉 Migration completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 