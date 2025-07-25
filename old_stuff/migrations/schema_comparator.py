#!/usr/bin/env python3
"""
Schema Comparator
Compares current database schema with SQLAlchemy models and generates migration plan
"""

import sys
import os
from pathlib import Path
from typing import Dict, List, Any, NamedTuple
from enum import Enum

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from schema_extractor import SchemaExtractor, TableInfo, ColumnInfo

class ChangeType(Enum):
    """Types of schema changes"""
    TABLE_ADDED = "table_added"
    TABLE_REMOVED = "table_removed"
    COLUMN_ADDED = "column_added"
    COLUMN_REMOVED = "column_removed"
    COLUMN_RENAMED = "column_renamed"
    COLUMN_TYPE_CHANGED = "column_type_changed"
    COLUMN_NULLABLE_CHANGED = "column_nullable_changed"
    COLUMN_DEFAULT_CHANGED = "column_default_changed"

class SchemaChange(NamedTuple):
    """Represents a single schema change"""
    change_type: ChangeType
    table_name: str
    column_name: str = None
    old_value: Any = None
    new_value: Any = None
    details: str = ""

class DataTransformRule(NamedTuple):
    """Rule for transforming data during migration"""
    table_name: str
    column_name: str
    rule_type: str  # 'add_default', 'rename', 'convert_type', 'drop'
    old_column: str = None
    default_value: Any = None
    conversion_func: str = None

class MigrationPlan:
    """Complete migration plan with schema changes and data transformations"""
    
    def __init__(self):
        self.schema_changes: List[SchemaChange] = []
        self.data_transforms: List[DataTransformRule] = []
        self.tables_to_recreate: List[str] = []
        self.safe_migration: bool = True
        self.warnings: List[str] = []

class SchemaComparator:
    """Compare schemas and generate migration plans"""
    
    def __init__(self):
        self.extractor = SchemaExtractor()
    
    def compare_schemas(self, current_schema: Dict[str, TableInfo], 
                       target_schema: Dict[str, TableInfo]) -> MigrationPlan:
        """Compare schemas and generate migration plan"""
        
        print("Comparing schemas...")
        plan = MigrationPlan()
        
        current_tables = set(current_schema.keys())
        target_tables = set(target_schema.keys())
        
        # Find table changes
        added_tables = target_tables - current_tables
        removed_tables = current_tables - target_tables
        common_tables = current_tables & target_tables
        
        # Handle added tables
        for table_name in added_tables:
            plan.schema_changes.append(SchemaChange(
                ChangeType.TABLE_ADDED, table_name,
                details=f"New table with {len(target_schema[table_name].columns)} columns"
            ))
            plan.tables_to_recreate.append(table_name)
        
        # Handle removed tables
        for table_name in removed_tables:
            plan.schema_changes.append(SchemaChange(
                ChangeType.TABLE_REMOVED, table_name,
                details=f"Table will be dropped (had {len(current_schema[table_name].columns)} columns)"
            ))
            plan.warnings.append(f"Table '{table_name}' will be completely removed with all data")
        
        # Compare common tables
        for table_name in common_tables:
            current_table = current_schema[table_name]
            target_table = target_schema[table_name]
            
            table_changes = self._compare_table_columns(current_table, target_table)
            plan.schema_changes.extend(table_changes)
            
            # Generate data transformation rules
            transform_rules = self._generate_transform_rules(current_table, target_table, table_changes)
            plan.data_transforms.extend(transform_rules)
            
            # Check if table needs recreation
            if self._table_needs_recreation(table_changes):
                plan.tables_to_recreate.append(table_name)
        
        # Analyze migration safety
        plan.safe_migration = self._analyze_migration_safety(plan)
        
        print(f"Found {len(plan.schema_changes)} schema changes")
        print(f"Generated {len(plan.data_transforms)} data transformation rules")
        print(f"Tables to recreate: {len(plan.tables_to_recreate)}")
        
        return plan
    
    def _compare_table_columns(self, current_table: TableInfo, 
                              target_table: TableInfo) -> List[SchemaChange]:
        """Compare columns between two table versions"""
        
        changes = []
        current_cols = set(current_table.columns.keys())
        target_cols = set(target_table.columns.keys())
        
        # Added columns
        for col_name in target_cols - current_cols:
            target_col = target_table.columns[col_name]
            changes.append(SchemaChange(
                ChangeType.COLUMN_ADDED, current_table.name, col_name,
                new_value=target_col.type_name,
                details=f"New column: {target_col.type_name}, nullable={target_col.nullable}"
            ))
        
        # Removed columns
        for col_name in current_cols - target_cols:
            current_col = current_table.columns[col_name]
            changes.append(SchemaChange(
                ChangeType.COLUMN_REMOVED, current_table.name, col_name,
                old_value=current_col.type_name,
                details=f"Removed column: {current_col.type_name}"
            ))
        
        # Compare common columns
        for col_name in current_cols & target_cols:
            current_col = current_table.columns[col_name]
            target_col = target_table.columns[col_name]
            
            # Type changes
            if current_col.type_name != target_col.type_name:
                changes.append(SchemaChange(
                    ChangeType.COLUMN_TYPE_CHANGED, current_table.name, col_name,
                    old_value=current_col.type_name,
                    new_value=target_col.type_name,
                    details=f"Type: {current_col.type_name} → {target_col.type_name}"
                ))
            
            # Nullable changes
            if current_col.nullable != target_col.nullable:
                changes.append(SchemaChange(
                    ChangeType.COLUMN_NULLABLE_CHANGED, current_table.name, col_name,
                    old_value=current_col.nullable,
                    new_value=target_col.nullable,
                    details=f"Nullable: {current_col.nullable} → {target_col.nullable}"
                ))
            
            # Default changes
            if current_col.default != target_col.default:
                changes.append(SchemaChange(
                    ChangeType.COLUMN_DEFAULT_CHANGED, current_table.name, col_name,
                    old_value=current_col.default,
                    new_value=target_col.default,
                    details=f"Default: {current_col.default} → {target_col.default}"
                ))
        
        return changes
    
    def _generate_transform_rules(self, current_table: TableInfo, target_table: TableInfo, 
                                 changes: List[SchemaChange]) -> List[DataTransformRule]:
        """Generate data transformation rules based on schema changes"""
        
        rules = []
        
        for change in changes:
            if change.table_name != current_table.name:
                continue
                
            if change.change_type == ChangeType.COLUMN_ADDED:
                # Add column with default value
                target_col = target_table.columns[change.column_name]
                default_val = target_col.default or (None if target_col.nullable else self._get_type_default(target_col.type_name))
                
                rules.append(DataTransformRule(
                    table_name=change.table_name,
                    column_name=change.column_name,
                    rule_type='add_default',
                    default_value=default_val
                ))
            
            elif change.change_type == ChangeType.COLUMN_REMOVED:
                # Drop column data
                rules.append(DataTransformRule(
                    table_name=change.table_name,
                    column_name=change.column_name,
                    rule_type='drop'
                ))
            
            elif change.change_type == ChangeType.COLUMN_TYPE_CHANGED:
                # Convert type if possible
                conversion = self._get_type_conversion(change.old_value, change.new_value)
                
                rules.append(DataTransformRule(
                    table_name=change.table_name,
                    column_name=change.column_name,
                    rule_type='convert_type',
                    conversion_func=conversion
                ))
            
            elif change.change_type == ChangeType.COLUMN_NULLABLE_CHANGED:
                # Handle nullable changes
                if not change.new_value:  # Column becoming NOT NULL
                    target_col = target_table.columns[change.column_name]
                    default_val = target_col.default or self._get_type_default(target_col.type_name)
                    
                    rules.append(DataTransformRule(
                        table_name=change.table_name,
                        column_name=change.column_name,
                        rule_type='add_default',
                        default_value=default_val
                    ))
        
        return rules
    
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
            return 'NOW()'
        elif 'NUMERIC' in type_name or 'FLOAT' in type_name:
            return 0.0
        elif 'UUID' in type_name:
            return 'gen_random_uuid()'
        else:
            return None
    
    def _get_type_conversion(self, old_type: str, new_type: str) -> str:
        """Get conversion function for type changes"""
        old_type = old_type.upper()
        new_type = new_type.upper()
        
        # Same type family - should be safe
        if (('VARCHAR' in old_type or 'TEXT' in old_type) and 
            ('VARCHAR' in new_type or 'TEXT' in new_type)):
            return 'cast_to_text'
        
        if 'INTEGER' in old_type and ('NUMERIC' in new_type or 'FLOAT' in new_type):
            return 'cast_to_numeric'
        
        if ('NUMERIC' in old_type or 'FLOAT' in old_type) and 'INTEGER' in new_type:
            return 'cast_to_integer'
        
        if 'VARCHAR' in old_type and 'INTEGER' in new_type:
            return 'safe_cast_to_integer'
        
        # Default: try to keep data as string
        return 'cast_to_text'
    
    def _table_needs_recreation(self, changes: List[SchemaChange]) -> bool:
        """Check if table needs to be recreated (vs altered)"""
        
        # For simplicity, recreate table if there are any structural changes
        structural_changes = [
            ChangeType.COLUMN_ADDED,
            ChangeType.COLUMN_REMOVED,
            ChangeType.COLUMN_TYPE_CHANGED,
            ChangeType.COLUMN_NULLABLE_CHANGED
        ]
        
        return any(change.change_type in structural_changes for change in changes)
    
    def _analyze_migration_safety(self, plan: MigrationPlan) -> bool:
        """Analyze if migration is safe"""
        
        # Check for potentially unsafe operations
        unsafe_changes = [
            ChangeType.TABLE_REMOVED,
            ChangeType.COLUMN_REMOVED
        ]
        
        has_unsafe_changes = any(
            change.change_type in unsafe_changes 
            for change in plan.schema_changes
        )
        
        if has_unsafe_changes:
            plan.warnings.append("Migration contains destructive operations (data loss possible)")
        
        return not has_unsafe_changes

def main():
    """Test the schema comparator"""
    print("SCHEMA COMPARATOR TEST")
    print("=====================")
    print("")
    
    extractor = SchemaExtractor()
    comparator = SchemaComparator()
    
    # Extract schemas
    current_schema = extractor.extract_current_db_schema()
    target_schema = extractor.extract_sqlalchemy_schema()
    
    print("")
    
    # Compare schemas
    migration_plan = comparator.compare_schemas(current_schema, target_schema)
    
    print("")
    print("MIGRATION PLAN")
    print("==============")
    
    print(f"Safe migration: {migration_plan.safe_migration}")
    print(f"Tables to recreate: {len(migration_plan.tables_to_recreate)}")
    
    if migration_plan.warnings:
        print("\nWarnings:")
        for warning in migration_plan.warnings:
            print(f"  ⚠️ {warning}")
    
    print(f"\nSchema changes: {len(migration_plan.schema_changes)}")
    for change in migration_plan.schema_changes[:10]:  # Show first 10
        print(f"  - {change.change_type.value}: {change.table_name}.{change.column_name} - {change.details}")
    
    print(f"\nData transform rules: {len(migration_plan.data_transforms)}")
    for rule in migration_plan.data_transforms[:10]:  # Show first 10
        print(f"  - {rule.rule_type}: {rule.table_name}.{rule.column_name}")

if __name__ == "__main__":
    main() 