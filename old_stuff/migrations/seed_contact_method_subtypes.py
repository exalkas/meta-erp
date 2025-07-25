#!/usr/bin/env python3
"""
Contact Method Subtypes Seeding Script
Seeds default contact method subtypes for all companies
"""

import sys
import os
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import enum

class ContactMethodType(enum.Enum):
    PHONE = "phone"
    EMAIL = "email"
    ADDRESS = "address"

# Default contact method subtypes for all companies
SYSTEM_DEFAULT_SUBTYPES = [
    # Phone subtypes
    {
        "method_type": ContactMethodType.PHONE,
        "code": "mobile",
        "name": "Mobile Phone",
        "name_greek": "Κινητό Τηλέφωνο",
        "description": "Mobile phone number",
        "description_greek": "Αριθμός κινητού τηλεφώνου",
        "icon": "smartphone",
        "color": "#10B981",
        "is_default": True,
        "is_system": True,
        "display_order": 1,
        "requires_verification": True,
        "format_template": "+30 6XX XXX XXXX"
    },
    {
        "method_type": ContactMethodType.PHONE,
        "code": "work",
        "name": "Work Phone",
        "name_greek": "Τηλέφωνο Εργασίας",
        "description": "Work or office phone number",
        "description_greek": "Τηλέφωνο εργασίας ή γραφείου",
        "icon": "briefcase",
        "color": "#3B82F6",
        "is_default": False,
        "is_system": True,
        "display_order": 2,
        "business_hours_only": True,
        "format_template": "+30 2X XXXX XXXX"
    },
    {
        "method_type": ContactMethodType.PHONE,
        "code": "home",
        "name": "Home Phone",
        "name_greek": "Τηλέφωνο Οικίας",
        "description": "Home phone number",
        "description_greek": "Τηλέφωνο οικίας",
        "icon": "home",
        "color": "#8B5CF6",
        "is_default": False,
        "is_system": True,
        "display_order": 3,
        "format_template": "+30 2X XXXX XXXX"
    },
    {
        "method_type": ContactMethodType.PHONE,
        "code": "fax",
        "name": "Fax",
        "name_greek": "Φαξ",
        "description": "Fax number",
        "description_greek": "Αριθμός φαξ",
        "icon": "printer",
        "color": "#6B7280",
        "is_default": False,
        "is_system": True,
        "display_order": 4,
        "format_template": "+30 2X XXXX XXXX"
    },
    
    # Email subtypes
    {
        "method_type": ContactMethodType.EMAIL,
        "code": "personal",
        "name": "Personal Email",
        "name_greek": "Προσωπικό Email",
        "description": "Personal email address",
        "description_greek": "Προσωπική διεύθυνση ηλεκτρονικού ταχυδρομείου",
        "icon": "mail",
        "color": "#10B981",
        "is_default": True,
        "is_system": True,
        "display_order": 1,
        "requires_verification": True,
        "allows_marketing": True
    },
    {
        "method_type": ContactMethodType.EMAIL,
        "code": "work",
        "name": "Work Email",
        "name_greek": "Email Εργασίας",
        "description": "Work or business email address",
        "description_greek": "Email εργασίας ή επιχείρησης",
        "icon": "briefcase",
        "color": "#3B82F6",
        "is_default": False,
        "is_system": True,
        "display_order": 2,
        "allows_marketing": True
    },
    {
        "method_type": ContactMethodType.EMAIL,
        "code": "billing",
        "name": "Billing Email",
        "name_greek": "Email Χρέωσης",
        "description": "Email for billing and invoicing",
        "description_greek": "Email για χρεώσεις και τιμολόγηση",
        "icon": "credit-card",
        "color": "#F59E0B",
        "is_default": False,
        "is_system": True,
        "display_order": 3,
        "greek_compliance_required": True
    },
    {
        "method_type": ContactMethodType.EMAIL,
        "code": "support",
        "name": "Support Email",
        "name_greek": "Email Υποστήριξης",
        "description": "Email for technical support",
        "description_greek": "Email για τεχνική υποστήριξη",
        "icon": "help-circle",
        "color": "#EF4444",
        "is_default": False,
        "is_system": True,
        "display_order": 4
    },
    
    # Address subtypes
    {
        "method_type": ContactMethodType.ADDRESS,
        "code": "business",
        "name": "Business Address",
        "name_greek": "Διεύθυνση Επιχείρησης",
        "description": "Primary business address",
        "description_greek": "Κύρια διεύθυνση επιχείρησης",
        "icon": "building",
        "color": "#10B981",
        "is_default": True,
        "is_system": True,
        "display_order": 1,
        "greek_compliance_required": True,
        "aade_field_mapping": "business_address"
    },
    {
        "method_type": ContactMethodType.ADDRESS,
        "code": "billing",
        "name": "Billing Address",
        "name_greek": "Διεύθυνση Χρέωσης",
        "description": "Billing and invoicing address",
        "description_greek": "Διεύθυνση χρέωσης και τιμολόγησης",
        "icon": "credit-card",
        "color": "#3B82F6",
        "is_default": False,
        "is_system": True,
        "display_order": 2,
        "greek_compliance_required": True,
        "aade_field_mapping": "billing_address"
    },
    {
        "method_type": ContactMethodType.ADDRESS,
        "code": "shipping",
        "name": "Shipping Address",
        "name_greek": "Διεύθυνση Αποστολής",
        "description": "Delivery and shipping address",
        "description_greek": "Διεύθυνση παράδοσης και αποστολής",
        "icon": "truck",
        "color": "#F59E0B",
        "is_default": False,
        "is_system": True,
        "display_order": 3,
        "aade_field_mapping": "shipping_address"
    },
    {
        "method_type": ContactMethodType.ADDRESS,
        "code": "warehouse",
        "name": "Warehouse Address",
        "name_greek": "Διεύθυνση Αποθήκης",
        "description": "Warehouse or storage facility address",
        "description_greek": "Διεύθυνση αποθήκης ή εγκατάστασης αποθήκευσης",
        "icon": "package",
        "color": "#8B5CF6",
        "is_default": False,
        "is_system": True,
        "display_order": 4,
    },
    {
        "method_type": ContactMethodType.ADDRESS,
        "code": "branch",
        "name": "Branch Office",
        "name_greek": "Υποκατάστημα",
        "description": "Branch office or subsidiary address",
        "description_greek": "Διεύθυνση υποκαταστήματος ή θυγατρικής",
        "icon": "git-branch",
        "color": "#6B7280",
        "is_default": False,
        "is_system": True,
        "display_order": 5,
    },
    {
        "method_type": ContactMethodType.ADDRESS,
        "code": "home",
        "name": "Home Address",
        "name_greek": "Διεύθυνση Κατοικίας",
        "description": "Personal home address",
        "description_greek": "Προσωπική διεύθυνση κατοικίας",
        "icon": "home",
        "color": "#EF4444",
        "is_default": False,
        "is_system": True,
        "display_order": 6,
    }
]

def seed_contact_method_subtypes(session):
    """Seed contact method subtypes for all companies"""
    
    try:
        # Check if the table exists
        result = session.execute(text("SELECT to_regclass('contact_method_subtypes')"))
        if not result.scalar():
            print("WARNING: contact_method_subtypes table not found, skipping seeding")
            return
        
        print("SUCCESS: contact_method_subtypes table found")
        
        # Get all companies
        companies = session.execute(text("SELECT id FROM companies")).fetchall()
        total_companies = len(companies)
        print(f"Found {total_companies} companies")
        
        total_created = 0
        total_skipped = 0
        
        for company_row in companies:
            company_id = str(company_row[0])
            print(f"   Processing company: {company_id}")
            
            company_created = 0
            company_skipped = 0
            
            for subtype_data in SYSTEM_DEFAULT_SUBTYPES:
                # Check if subtype already exists
                existing = session.execute(text("""
                    SELECT id FROM contact_method_subtypes 
                    WHERE company_id = :company_id 
                    AND method_type = :method_type 
                    AND code = :code
                """), {
                    'company_id': company_id,
                    'method_type': subtype_data['method_type'].value,
                    'code': subtype_data['code']
                }).fetchone()
                
                if existing:
                    company_skipped += 1
                    continue
                
                # Insert new subtype
                session.execute(text("""
                    INSERT INTO contact_method_subtypes (
                        id, company_id, method_type, code, name, name_greek,
                        description, description_greek, icon, color, is_default,
                        is_system, is_active, display_order, validation_rules,
                        format_template, auto_suggestions, requires_verification,
                        allows_marketing, business_hours_only, greek_compliance_required,
                        aade_field_mapping, tags, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), :company_id, :method_type, :code, :name, :name_greek,
                        :description, :description_greek, :icon, :color, :is_default,
                        :is_system, :is_active, :display_order, :validation_rules,
                        :format_template, :auto_suggestions, :requires_verification,
                        :allows_marketing, :business_hours_only, :greek_compliance_required,
                        :aade_field_mapping, :tags, NOW(), NOW()
                    )
                """), {
                    'company_id': company_id,
                    'method_type': subtype_data['method_type'].value,
                    'code': subtype_data['code'],
                    'name': subtype_data['name'],
                    'name_greek': subtype_data['name_greek'],
                    'description': subtype_data.get('description'),
                    'description_greek': subtype_data.get('description_greek'),
                    'icon': subtype_data.get('icon'),
                    'color': subtype_data.get('color'),
                    'is_default': subtype_data.get('is_default', False),
                    'is_system': subtype_data.get('is_system', True),
                    'is_active': subtype_data.get('is_active', True),
                    'display_order': subtype_data.get('display_order', 0),
                    'validation_rules': '{}',
                    'format_template': subtype_data.get('format_template'),
                    'auto_suggestions': '[]',
                    'requires_verification': subtype_data.get('requires_verification', False),
                    'allows_marketing': subtype_data.get('allows_marketing', True),
                    'business_hours_only': subtype_data.get('business_hours_only', False),
                    'greek_compliance_required': subtype_data.get('greek_compliance_required', False),
                    'aade_field_mapping': subtype_data.get('aade_field_mapping'),
                    'tags': '[]'
                })
                
                company_created += 1
            
            print(f"     SUCCESS: Created: {company_created}, Skipped: {company_skipped}")
            total_created += company_created
            total_skipped += company_skipped
        
        print("")
        print("SUCCESS: Seeding completed successfully!")
        print(f"   Total created: {total_created}")
        print(f"   Total skipped: {total_skipped}")
        print(f"   Companies processed: {total_companies}")
        
        # Count by type
        phone_count = len([s for s in SYSTEM_DEFAULT_SUBTYPES if s['method_type'] == ContactMethodType.PHONE])
        email_count = len([s for s in SYSTEM_DEFAULT_SUBTYPES if s['method_type'] == ContactMethodType.EMAIL])
        address_count = len([s for s in SYSTEM_DEFAULT_SUBTYPES if s['method_type'] == ContactMethodType.ADDRESS])
        
        print(f"   Phone subtypes: {phone_count}")
        print(f"   Email subtypes: {email_count}")
        print(f"   Address subtypes: {address_count}")
        print(f"   Multilingual: Greek + English names")
        
    except Exception as e:
        print(f"ERROR: Failed to seed contact method subtypes: {e}")
        raise

def main():
    """Main function for standalone execution"""
    print("Starting Contact Method Subtypes Seeding...")
    
    try:
        # Create database session
        engine = create_engine(settings.DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        try:
            seed_contact_method_subtypes(session)
            session.commit()
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