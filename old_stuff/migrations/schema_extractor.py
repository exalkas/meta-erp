#!/usr/bin/env python3
"""
Schema Extractor
Extracts schema information from database and SQLAlchemy models
"""

import sys
import os
from pathlib import Path
from typing import Dict, List, Any
import inspect

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text, inspect as sqlalchemy_inspect
from sqlalchemy.types import String, Integer, Boolean, DateTime, Float, Text, CHAR, VARCHAR
from app.core.config import settings
from app.core.database import Base
from app.models import *  # Import all models

class ColumnInfo:
    """Information about a database column"""
    def __init__(self, name: str, type_name: str, nullable: bool = True, 
                 default=None, primary_key: bool = False, foreign_key: str = None):
        self.name = name
        self.type_name = type_name
        self.nullable = nullable
        self.default = default
        self.primary_key = primary_key
        self.foreign_key = foreign_key
    
    def __repr__(self):
        return f"ColumnInfo({self.name}, {self.type_name}, nullable={self.nullable})"

class TableInfo:
    """Information about a database table"""
    def __init__(self, name: str):
        self.name = name
        self.columns: Dict[str, ColumnInfo] = {}
        self.primary_keys: List[str] = []
        self.foreign_keys: Dict[str, str] = {}
    
    def add_column(self, col_info: ColumnInfo):
        """Add column information"""
        self.columns[col_info.name] = col_info
        if col_info.primary_key:
            self.primary_keys.append(col_info.name)
        if col_info.foreign_key:
            self.foreign_keys[col_info.name] = col_info.foreign_key

class SchemaExtractor:
    """Extract schema information from various sources"""
    
    def __init__(self):
        self.engine = create_engine(settings.DATABASE_URL)
    
    def extract_current_db_schema(self) -> Dict[str, TableInfo]:
        """Extract schema from current database"""
        print("Extracting current database schema...")
        
        inspector = sqlalchemy_inspect(self.engine)
        tables = {}
        
        for table_name in inspector.get_table_names():
            print(f"  - {table_name}")
            table_info = TableInfo(table_name)
            
            # Get columns
            for column in inspector.get_columns(table_name):
                col_info = ColumnInfo(
                    name=column['name'],
                    type_name=str(column['type']),
                    nullable=column['nullable'],
                    default=column.get('default'),
                    primary_key=column.get('primary_key', False)
                )
                table_info.add_column(col_info)
            
            # Get primary keys
            pk_constraint = inspector.get_pk_constraint(table_name)
            if pk_constraint:
                table_info.primary_keys = pk_constraint['constrained_columns']
            
            # Get foreign keys
            for fk in inspector.get_foreign_keys(table_name):
                for col, ref_col in zip(fk['constrained_columns'], fk['referred_columns']):
                    ref_table = fk['referred_table']
                    table_info.foreign_keys[col] = f"{ref_table}.{ref_col}"
            
            tables[table_name] = table_info
        
        print(f"Found {len(tables)} tables in current database")
        return tables
    
    def extract_sqlalchemy_schema(self) -> Dict[str, TableInfo]:
        """Extract schema from SQLAlchemy models"""
        print("Extracting SQLAlchemy model schema...")
        
        tables = {}
        
        for table_name, table in Base.metadata.tables.items():
            print(f"  - {table_name}")
            table_info = TableInfo(table_name)
            
            # Get columns
            for column in table.columns:
                # Map SQLAlchemy types to string representations
                type_name = self._get_type_name(column.type)
                
                col_info = ColumnInfo(
                    name=column.name,
                    type_name=type_name,
                    nullable=column.nullable,
                    default=self._get_default_value(column.default),
                    primary_key=column.primary_key
                )
                
                # Check for foreign keys
                if column.foreign_keys:
                    fk = next(iter(column.foreign_keys))
                    col_info.foreign_key = str(fk.target_fullname)
                
                table_info.add_column(col_info)
            
            tables[table_name] = table_info
        
        print(f"Found {len(tables)} tables in SQLAlchemy models")
        return tables
    
    def _get_type_name(self, sqlalchemy_type) -> str:
        """Convert SQLAlchemy type to string representation"""
        type_str = str(sqlalchemy_type)
        
        # Normalize common types
        if 'VARCHAR' in type_str or 'STRING' in type_str:
            return 'VARCHAR'
        elif 'TEXT' in type_str:
            return 'TEXT'
        elif 'INTEGER' in type_str:
            return 'INTEGER'
        elif 'BOOLEAN' in type_str:
            return 'BOOLEAN'
        elif 'DATETIME' in type_str or 'TIMESTAMP' in type_str:
            return 'TIMESTAMP'
        elif 'FLOAT' in type_str or 'NUMERIC' in type_str:
            return 'NUMERIC'
        elif 'UUID' in type_str:
            return 'UUID'
        else:
            return type_str.upper()
    
    def _get_default_value(self, default):
        """Extract default value from SQLAlchemy column default"""
        if default is None:
            return None
        
        if hasattr(default, 'arg'):
            if callable(default.arg):
                return f"function:{default.arg.__name__}"
            else:
                return str(default.arg)
        
        return str(default)

def main():
    """Test the schema extractor"""
    print("SCHEMA EXTRACTOR TEST")
    print("====================")
    print("")
    
    extractor = SchemaExtractor()
    
    # Extract current database schema
    current_schema = extractor.extract_current_db_schema()
    
    print("")
    
    # Extract SQLAlchemy schema  
    model_schema = extractor.extract_sqlalchemy_schema()
    
    print("")
    print("SCHEMA COMPARISON SUMMARY")
    print("========================")
    
    current_tables = set(current_schema.keys())
    model_tables = set(model_schema.keys())
    
    print(f"Current DB tables: {len(current_tables)}")
    print(f"Model tables: {len(model_tables)}")
    print(f"Common tables: {len(current_tables & model_tables)}")
    print(f"DB-only tables: {len(current_tables - model_tables)}")
    print(f"Model-only tables: {len(model_tables - current_tables)}")
    
    if current_tables - model_tables:
        print(f"\nTables only in DB: {sorted(current_tables - model_tables)}")
    
    if model_tables - current_tables:
        print(f"\nTables only in models: {sorted(model_tables - current_tables)}")

if __name__ == "__main__":
    main() 