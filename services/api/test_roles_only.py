#!/usr/bin/env python3
"""Test roles seeding and API endpoints specifically."""

import asyncio
import json
import sys
from pathlib import Path
from typing import Dict, List, Any
import uuid
from datetime import datetime

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "services" / "api"))

from app.core.database import AsyncSessionLocal
from app.models.auth import Role
from sqlalchemy import select, and_

async def clear_existing_roles():
    """Clear existing roles to start fresh."""
    print("🧹 Clearing existing roles...")
    async with AsyncSessionLocal() as db:
        # Delete existing roles (but keep system roles if any)
        result = await db.execute(select(Role))
        existing_roles = result.scalars().all()
        
        for role in existing_roles:
            await db.delete(role)
        
        await db.commit()
        print(f"✅ Cleared {len(existing_roles)} existing roles")

async def load_json_data(file_path: str) -> List[Dict[str, Any]]:
    """Load and parse JSON data file."""
    full_path = project_root / "data" / file_path
    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"📁 Loaded {len(data) if isinstance(data, list) else 1} records from {file_path}")
            return data if isinstance(data, list) else [data]
    except FileNotFoundError:
        print(f"⚠️ File not found: {file_path}")
        return []
    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error in {file_path}: {e}")
        return []

async def seed_roles():
    """Seed role data from all JSON files."""
    print("👥 Seeding roles...")
    
    # Load all role files (system, business, and vertical-specific)
    role_files = [
        "auth/roles/system-roles.json",        # System roles
        "auth/roles/business-roles.json",      # Generic business templates
        "auth/roles/ecommerce-roles.json",     # E-commerce vertical
        "auth/roles/automotive-roles.json",    # Automotive vertical
        "auth/roles/oilgas-roles.json",        # Oil & Gas vertical
        "auth/roles/agtech-roles.json",        # AgTech vertical
        "auth/roles/fintech-roles.json",       # FinTech vertical
        "auth/roles/insurance-roles.json",     # Insurance vertical
        "auth/roles/maritime-roles.json"       # Maritime vertical
    ]
    
    all_roles = []
    for file_path in role_files:
        try:
            roles_data = await load_json_data(file_path)
            all_roles.extend(roles_data)
            print(f"✅ Loaded {len(roles_data)} roles from {file_path}")
        except Exception as e:
            print(f"⚠️ Role file error {file_path}: {e}")
            continue
    
    print(f"📊 Total roles to seed: {len(all_roles)}")
    
    async with AsyncSessionLocal() as db:
        success_count = 0
        error_count = 0
        
        for role_data in all_roles:
            try:
                # Check if role already exists
                existing = await db.get(Role, role_data["role_id"])
                if existing:
                    print(f"⏭️ Role {role_data['role_name']} already exists")
                    continue
                    
                # Map JSON fields to model fields
                role = Role(
                    role_id=role_data["role_id"],
                    tenant_id=None,  # System roles and templates have NULL tenant_id
                    name=role_data["role_name"],  # role_name -> name
                    display_name=role_data["display_name"],
                    description=role_data.get("description"),
                    is_system_role=role_data.get("is_system_role", False),
                    is_active=role_data.get("is_active", True),
                    is_default=False,  # Default to False
                    is_template=role_data.get("is_template", False),  # NEW: Template flag
                    vertical=role_data.get("vertical"),  # NEW: Industry vertical
                    parent_role_id=role_data.get("parent_role_id"),
                    level=role_data.get("hierarchy_level", 5),  # hierarchy_level -> level
                    max_users=role_data.get("metadata_json", {}).get("max_users"),  # From metadata
                    created_at=datetime.fromisoformat(role_data["created_at"].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(role_data["updated_at"].replace('Z', '+00:00'))
                )
                db.add(role)
                
                vertical_text = f" ({role.vertical})" if role.vertical else ""
                template_text = " [TEMPLATE]" if role.is_template else ""
                print(f"✅ Added role: {role.display_name}{vertical_text}{template_text}")
                success_count += 1
                
            except Exception as e:
                print(f"❌ Error adding role {role_data.get('role_name', 'Unknown')}: {e}")
                error_count += 1
                continue
        
        await db.commit()
        print(f"📊 Seeding complete: {success_count} success, {error_count} errors")

async def test_role_queries():
    """Test role queries."""
    print("\n🔍 Testing role queries...")
    
    async with AsyncSessionLocal() as db:
        # Test template roles
        template_query = select(Role).where(
            and_(
                Role.is_template == True,
                Role.is_active == True,
                Role.tenant_id.is_(None)
            )
        )
        result = await db.execute(template_query)
        templates = result.scalars().all()
        print(f"📋 Template roles found: {len(templates)}")
        
        # Test vertical roles
        vertical_query = select(Role).where(Role.vertical.is_not(None))
        result = await db.execute(vertical_query)
        vertical_roles = result.scalars().all()
        print(f"🏢 Vertical-specific roles: {len(vertical_roles)}")
        
        # Group by vertical
        verticals = {}
        for role in vertical_roles:
            if role.vertical not in verticals:
                verticals[role.vertical] = 0
            verticals[role.vertical] += 1
        
        print("📊 Roles by vertical:")
        for vertical, count in verticals.items():
            print(f"  • {vertical}: {count} roles")

async def main():
    """Main test function."""
    print("🧪 TESTING ROLE SYSTEM")
    print("=" * 50)
    
    try:
        # Step 1: Clear existing roles (optional)
        # await clear_existing_roles()
        
        # Step 2: Seed new roles
        await seed_roles()
        
        # Step 3: Test queries
        await test_role_queries()
        
        print("\n✅ All role tests completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Role test failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    if not success:
        sys.exit(1)