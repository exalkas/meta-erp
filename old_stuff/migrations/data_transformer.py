#!/usr/bin/env python3
"""
Data Transformer
Handles data extraction, transformation, and loading during schema migrations
"""

import sys
import os
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
import uuid
import re

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from schema_extractor import SchemaExtractor, TableInfo
from schema_comparator import MigrationPlan, DataTransformRule

class DataBackup:
    """Represents backed up table data"""
    def __init__(self, table_name: str, schema: TableInfo, data: List[Dict[str, Any]]):
        self.table_name = table_name
        self.schema = schema
        self.data = data
        self.backup_timestamp = datetime.now(timezone.utc)

class DataTransformer:
    """Transform data according to migration plan"""
    
    def __init__(self):
        self.engine = create_engine(settings.DATABASE_URL)
        self.backup_dir = Path("scripts/migration_data")
        self.backup_dir.mkdir(exist_ok=True)
    
    def backup_all_data(self, current_schema: Dict[str, TableInfo]) -> Dict[str, DataBackup]:
        """Backup all data from current database"""
        print("Backing up all data from current database...")
        
        backups = {}
        
        with self.engine.connect() as conn:
            for table_name, table_info in current_schema.items():
                print(f"  - Backing up {table_name}...")
                
                try:
                    # Get all data from table
                    result = conn.execute(text(f'SELECT * FROM "{table_name}"'))
                    columns = list(result.keys())
                    rows = result.fetchall()
                    
                    if not rows:
                        print(f"    No data in {table_name}")
                        continue
                    
                    # Convert to dictionaries
                    data = []
                    for row in rows:
                        row_dict = {}
                        for i, value in enumerate(row):
                            column_name = columns[i]
                            # Convert non-serializable types
                            row_dict[column_name] = self._serialize_value(value)
                        data.append(row_dict)
                    
                    backup = DataBackup(table_name, table_info, data)
                    backups[table_name] = backup
                    
                    # Save to file
                    backup_file = self.backup_dir / f"{table_name}_backup.json"
                    with open(backup_file, 'w', encoding='utf-8') as f:
                        json.dump({
                            'table_name': table_name,
                            'backup_timestamp': backup.backup_timestamp.isoformat(),
                            'record_count': len(data),
                            'columns': columns,
                            'data': data
                        }, f, indent=2, default=str)
                    
                    print(f"    Backed up {len(data)} records to {backup_file.name}")
                    
                except Exception as e:
                    print(f"    ERROR backing up {table_name}: {e}")
                    continue
        
        print(f"Backup completed: {len(backups)} tables backed up")
        return backups
    
    def transform_data(self, backups: Dict[str, DataBackup], 
                      migration_plan: MigrationPlan,
                      target_schema: Dict[str, TableInfo]) -> Dict[str, DataBackup]:
        """Transform backed up data according to migration plan"""
        print("Transforming data according to migration plan...")
        
        transformed_backups = {}
        
        for table_name, backup in backups.items():
            if table_name not in target_schema:
                print(f"  - Skipping {table_name} (table removed)")
                continue
            
            print(f"  - Transforming {table_name}...")
            
            target_table_info = target_schema[table_name]
            transform_rules = [rule for rule in migration_plan.data_transforms 
                             if rule.table_name == table_name]
            
            transformed_data = []
            
            for row in backup.data:
                transformed_row = self._transform_row(row, transform_rules, target_table_info)
                if transformed_row:
                    transformed_data.append(transformed_row)
            
            if transformed_data:
                transformed_backup = DataBackup(table_name, target_table_info, transformed_data)
                transformed_backups[table_name] = transformed_backup
                
                # Save transformed data
                transformed_file = self.backup_dir / f"{table_name}_transformed.json"
                with open(transformed_file, 'w', encoding='utf-8') as f:
                    json.dump({
                        'table_name': table_name,
                        'backup_timestamp': backup.backup_timestamp.isoformat(),
                        'transform_timestamp': datetime.now(timezone.utc).isoformat(),
                        'original_count': len(backup.data),
                        'transformed_count': len(transformed_data),
                        'data': transformed_data
                    }, f, indent=2, default=str)
                
                print(f"    Transformed {len(backup.data)} → {len(transformed_data)} records")
            else:
                print(f"    No data to transform for {table_name}")
        
        print(f"Data transformation completed: {len(transformed_backups)} tables")
        return transformed_backups
    
    def _transform_row(self, row: Dict[str, Any], 
                      transform_rules: List[DataTransformRule],
                      target_schema: TableInfo) -> Optional[Dict[str, Any]]:
        """Transform a single row according to rules"""
        
        transformed_row = {}
        
        # Start with existing data
        for col_name, value in row.items():
            if col_name in target_schema.columns:
                transformed_row[col_name] = value
        
        # Apply transformation rules
        for rule in transform_rules:
            if rule.rule_type == 'add_default':
                # Add new column with default value
                if rule.column_name not in transformed_row:
                    transformed_row[rule.column_name] = self._get_default_value(rule.default_value)
            
            elif rule.rule_type == 'drop':
                # Remove column
                if rule.column_name in transformed_row:
                    del transformed_row[rule.column_name]
            
            elif rule.rule_type == 'rename':
                # Rename column
                if rule.old_column and rule.old_column in transformed_row:
                    transformed_row[rule.column_name] = transformed_row.pop(rule.old_column)
            
            elif rule.rule_type == 'convert_type':
                # Convert column type
                if rule.column_name in transformed_row:
                    old_value = transformed_row[rule.column_name]
                    new_value = self._convert_value(old_value, rule.conversion_func)
                    transformed_row[rule.column_name] = new_value
        
        # Add missing columns with defaults
        for col_name, col_info in target_schema.columns.items():
            if col_name not in transformed_row:
                if col_info.nullable:
                    transformed_row[col_name] = None
                else:
                    default_val = col_info.default or self._get_type_default(col_info.type_name)
                    transformed_row[col_name] = self._get_default_value(default_val)
        
        return transformed_row
    
    def _convert_value(self, value: Any, conversion_func: str) -> Any:
        """Convert a value using the specified conversion function"""
        
        if value is None:
            return None
        
        try:
            if conversion_func == 'cast_to_text':
                return str(value)
            
            elif conversion_func == 'cast_to_integer':
                if isinstance(value, str):
                    # Remove non-numeric characters
                    cleaned = re.sub(r'[^\d.-]', '', value)
                    return int(float(cleaned)) if cleaned else 0
                return int(value)
            
            elif conversion_func == 'safe_cast_to_integer':
                try:
                    if isinstance(value, str):
                        cleaned = re.sub(r'[^\d.-]', '', value)
                        return int(float(cleaned)) if cleaned else 0
                    return int(value)
                except:
                    return 0
            
            elif conversion_func == 'cast_to_numeric':
                if isinstance(value, str):
                    cleaned = re.sub(r'[^\d.-]', '', value)
                    return float(cleaned) if cleaned else 0.0
                return float(value)
            
            elif conversion_func == 'cast_to_boolean':
                if isinstance(value, str):
                    return value.lower() in ('true', '1', 'yes', 'on', 't', 'y')
                return bool(value)
            
            else:
                # Default: return as string
                return str(value)
        
        except Exception as e:
            print(f"    Warning: Could not convert value {value} using {conversion_func}: {e}")
            return str(value)
    
    def _get_default_value(self, default_spec: Any) -> Any:
        """Get actual default value from specification"""
        
        if default_spec is None:
            return None
        
        if isinstance(default_spec, str):
            if default_spec == 'NOW()':
                return datetime.now(timezone.utc).isoformat()
            elif default_spec == 'gen_random_uuid()':
                return str(uuid.uuid4())
            elif default_spec.startswith('function:'):
                func_name = default_spec.split(':', 1)[1]
                if func_name == 'uuid4':
                    return str(uuid.uuid4())
                elif func_name == 'now':
                    return datetime.now(timezone.utc).isoformat()
                else:
                    return None
            else:
                return default_spec
        
        return default_spec
    
    def _get_type_default(self, type_name: str) -> Any:
        """Get default value for a data type"""
        type_name = type_name.upper()
        
        if 'VARCHAR' in type_name or 'TEXT' in type_name:
            return ''
        elif 'INTEGER' in type_name:
            return 0
        elif 'BOOLEAN' in type_name:
            return False
        elif 'TIMESTAMP' in type_name or 'DATETIME' in type_name:
            return datetime.now(timezone.utc).isoformat()
        elif 'NUMERIC' in type_name or 'FLOAT' in type_name:
            return 0.0
        elif 'UUID' in type_name:
            return str(uuid.uuid4())
        else:
            return None
    
    def _serialize_value(self, value: Any) -> Any:
        """Serialize value for JSON storage"""
        
        if value is None:
            return None
        elif isinstance(value, (str, int, float, bool)):
            return value
        elif isinstance(value, datetime):
            return value.isoformat()
        elif isinstance(value, uuid.UUID):
            return str(value)
        else:
            return str(value)
    
    def restore_transformed_data(self, transformed_backups: Dict[str, DataBackup]) -> bool:
        """Restore transformed data to new database schema"""
        print("Restoring transformed data to database...")
        
        Session = sessionmaker(bind=self.engine)
        session = Session()
        
        try:
            # Determine restore order (dependencies first)
            restore_order = self._determine_restore_order(transformed_backups)
            
            for table_name in restore_order:
                if table_name not in transformed_backups:
                    continue
                
                backup = transformed_backups[table_name]
                print(f"  - Restoring {table_name}: {len(backup.data)} records")
                
                if not backup.data:
                    continue
                
                # Restore data in batches
                batch_size = 100
                for i in range(0, len(backup.data), batch_size):
                    batch = backup.data[i:i + batch_size]
                    
                    for row in batch:
                        try:
                            # Build insert query
                            columns = list(row.keys())
                            column_list = ', '.join([f'"{col}"' for col in columns])
                            placeholder_list = ', '.join([f':{col}' for col in columns])
                            
                            query = f'INSERT INTO "{table_name}" ({column_list}) VALUES ({placeholder_list})'
                            
                            session.execute(text(query), row)
                            
                        except Exception as e:
                            print(f"    Error inserting row into {table_name}: {e}")
                            continue
                    
                    # Commit batch
                    session.commit()
                
                print(f"    Successfully restored {table_name}")
            
            print("Data restoration completed successfully")
            return True
            
        except Exception as e:
            print(f"ERROR during data restoration: {e}")
            session.rollback()
            return False
        finally:
            session.close()
    
    def _determine_restore_order(self, backups: Dict[str, DataBackup]) -> List[str]:
        """Determine order to restore tables (considering foreign key dependencies)"""
        
        # For now, use a simple predefined order
        # In a more sophisticated version, we'd analyze foreign key dependencies
        priority_order = [
            'companies',
            'users',
            'contact_method_subtypes',
            'business_entities',
            'contacts',
            'contact_methods',
            'customers',
            'products',
            'invoices',
            'invoice_items'
        ]
        
        ordered_tables = []
        
        # Add tables in priority order
        for table_name in priority_order:
            if table_name in backups:
                ordered_tables.append(table_name)
        
        # Add remaining tables
        for table_name in backups:
            if table_name not in ordered_tables:
                ordered_tables.append(table_name)
        
        return ordered_tables
    
    def cleanup_backup_files(self):
        """Clean up temporary backup files"""
        print("Cleaning up temporary backup files...")
        
        backup_files = list(self.backup_dir.glob("*.json"))
        
        for file_path in backup_files:
            try:
                file_path.unlink()
                print(f"  Deleted: {file_path.name}")
            except Exception as e:
                print(f"  Warning: Could not delete {file_path.name}: {e}")
        
        try:
            self.backup_dir.rmdir()
            print(f"  Removed backup directory: {self.backup_dir}")
        except OSError:
            print(f"  Backup directory not empty, keeping: {self.backup_dir}")

def main():
    """Test the data transformer"""
    print("DATA TRANSFORMER TEST")
    print("====================")
    print("")
    
    extractor = SchemaExtractor()
    transformer = DataTransformer()
    
    # Extract current schema
    current_schema = extractor.extract_current_db_schema()
    
    # Backup data
    backups = transformer.backup_all_data(current_schema)
    
    print(f"\nBacked up {len(backups)} tables")
    for table_name, backup in backups.items():
        print(f"  - {table_name}: {len(backup.data)} records")

if __name__ == "__main__":
    main() 