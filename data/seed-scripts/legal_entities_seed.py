"""
Legal Entities Seeding Data

Complete entity definitions for Legal Practice CRM + ERP vertical.
This demonstrates our SAP-style platform by configuring a real-world 
vertical as pure metadata - no hardcoded business logic.
"""

from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.metadata import EntityDefinition, FieldDefinition
from app.core.logging import get_logger

logger = get_logger("legal_entities_seed")


async def seed_legal_entities(session: AsyncSession):
    """Seed Legal Practice CRM + ERP entities using metadata framework."""
    logger.info("🏛️ Seeding Legal vertical entities...")
    
    legal_entities = [
        {
            "entity_name": "Client",
            "display_label": "Client",
            "plural_label": "Clients", 
            "description": "Legal clients and prospects",
            "category": "CORE",
            "is_system_entity": False,
            "vertical": "LEGAL",
            "fields": [
                {
                    "field_name": "client_name",
                    "label_key": "client.client_name",
                    "data_type": "string",
                    "is_required": True,
                    "max_length": 255,
                    "validation_rules": ["required", "max_length:255"],
                    "display_order": 1
                },
                {
                    "field_name": "client_type",
                    "label_key": "client.client_type", 
                    "data_type": "select",
                    "is_required": True,
                    "options": ["Individual", "Corporation", "Partnership", "LLC", "Trust", "Government", "Non-Profit"],
                    "default_value": "Individual",
                    "validation_rules": ["required", "in:Individual,Corporation,Partnership,LLC,Trust,Government,Non-Profit"],
                    "display_order": 2
                },
                {
                    "field_name": "contact_email", 
                    "label_key": "client.contact_email",
                    "data_type": "email",
                    "is_required": True,
                    "validation_rules": ["required", "email", "unique"],
                    "display_order": 3
                },
                {
                    "field_name": "phone",
                    "label_key": "client.phone",
                    "data_type": "phone",
                    "is_required": False,
                    "validation_rules": ["phone_us"],
                    "display_order": 4
                },
                {
                    "field_name": "address",
                    "label_key": "client.address",
                    "data_type": "text",
                    "is_required": False,
                    "max_length": 500,
                    "display_order": 5
                },
                {
                    "field_name": "tax_id",
                    "label_key": "client.tax_id",
                    "data_type": "string",
                    "is_required": False,
                    "max_length": 20,
                    "validation_rules": ["tax_id_us"],
                    "help_text": "SSN for individuals, EIN for businesses",
                    "display_order": 6
                },
                {
                    "field_name": "intake_date",
                    "label_key": "client.intake_date",
                    "data_type": "date",
                    "is_required": True,
                    "default_value": "today",
                    "validation_rules": ["required", "date"],
                    "display_order": 7
                },
                {
                    "field_name": "client_status",
                    "label_key": "client.client_status",
                    "data_type": "select",
                    "is_required": True,
                    "options": ["Prospect", "Active", "Inactive", "Archived"],
                    "default_value": "Prospect",
                    "validation_rules": ["required", "in:Prospect,Active,Inactive,Archived"],
                    "display_order": 8
                },
                {
                    "field_name": "billing_rate_override",
                    "label_key": "client.billing_rate_override", 
                    "data_type": "decimal",
                    "is_required": False,
                    "precision": 10,
                    "scale": 2,
                    "validation_rules": ["numeric", "min:0"],
                    "help_text": "Override default billing rate for this client",
                    "display_order": 9
                },
                {
                    "field_name": "referral_source",
                    "label_key": "client.referral_source",
                    "data_type": "string",
                    "is_required": False,
                    "max_length": 255,
                    "display_order": 10
                }
            ],
            "business_rules": ["conflict_checking", "client_intake_workflow", "billing_validation"],
            "validation_rules": ["unique_email", "required_fields"],
            "workflow_triggers": ["client_created", "status_changed", "contact_updated"],
            "audit_enabled": True,
            "soft_delete": True
        },
        {
            "entity_name": "Matter",
            "display_label": "Matter", 
            "plural_label": "Matters",
            "description": "Legal matters and cases",
            "category": "CORE",
            "is_system_entity": False,
            "vertical": "LEGAL",
            "fields": [
                {
                    "field_name": "matter_name",
                    "label_key": "matter.matter_name",
                    "data_type": "string",
                    "is_required": True,
                    "max_length": 255,
                    "validation_rules": ["required", "max_length:255"],
                    "display_order": 1
                },
                {
                    "field_name": "matter_number",
                    "label_key": "matter.matter_number",
                    "data_type": "string",
                    "is_required": True,
                    "max_length": 50,
                    "validation_rules": ["required", "unique", "max_length:50"],
                    "auto_generate": True,
                    "display_order": 2
                },
                {
                    "field_name": "client_id",
                    "label_key": "matter.client_id",
                    "data_type": "foreign_key",
                    "is_required": True,
                    "related_entity": "Client",
                    "validation_rules": ["required", "exists:Client,id"],
                    "display_order": 3
                },
                {
                    "field_name": "practice_area",
                    "label_key": "matter.practice_area",
                    "data_type": "select",
                    "is_required": True,
                    "options": ["Corporate Law", "Litigation", "Real Estate", "Family Law", "Criminal Law", "Immigration", "Intellectual Property", "Employment Law", "Tax Law", "Estate Planning"],
                    "validation_rules": ["required"],
                    "display_order": 4
                },
                {
                    "field_name": "matter_type",
                    "label_key": "matter.matter_type",
                    "data_type": "select",
                    "is_required": True,
                    "options": ["Case", "Transaction", "Advisory", "Compliance", "Other"],
                    "default_value": "Case",
                    "validation_rules": ["required"],
                    "display_order": 5
                },
                {
                    "field_name": "responsible_attorney",
                    "label_key": "matter.responsible_attorney",
                    "data_type": "foreign_key",
                    "is_required": True,
                    "related_entity": "User",
                    "validation_rules": ["required", "exists:User,id"],
                    "display_order": 6
                },
                {
                    "field_name": "matter_status",
                    "label_key": "matter.matter_status",
                    "data_type": "select",
                    "is_required": True,
                    "options": ["Open", "Active", "On Hold", "Closed", "Archived"],
                    "default_value": "Open",
                    "validation_rules": ["required"],
                    "display_order": 7
                },
                {
                    "field_name": "billing_arrangement",
                    "label_key": "matter.billing_arrangement",
                    "data_type": "select",
                    "is_required": True,
                    "options": ["Hourly", "Fixed Fee", "Contingency", "Retainer", "Pro Bono"],
                    "default_value": "Hourly",
                    "validation_rules": ["required"],
                    "display_order": 8
                },
                {
                    "field_name": "billing_rate",
                    "label_key": "matter.billing_rate",
                    "data_type": "decimal",
                    "is_required": False,
                    "precision": 10,
                    "scale": 2,
                    "validation_rules": ["numeric", "min:0"],
                    "display_order": 9
                },
                {
                    "field_name": "estimated_hours",
                    "label_key": "matter.estimated_hours",
                    "data_type": "integer",
                    "is_required": False,
                    "validation_rules": ["integer", "min:0"],
                    "display_order": 10
                },
                {
                    "field_name": "budget_amount",
                    "label_key": "matter.budget_amount", 
                    "data_type": "decimal",
                    "is_required": False,
                    "precision": 12,
                    "scale": 2,
                    "validation_rules": ["numeric", "min:0"],
                    "display_order": 11
                },
                {
                    "field_name": "open_date",
                    "label_key": "matter.open_date",
                    "data_type": "date",
                    "is_required": True,
                    "default_value": "today",
                    "validation_rules": ["required", "date"],
                    "display_order": 12
                },
                {
                    "field_name": "statute_of_limitations",
                    "label_key": "matter.statute_of_limitations",
                    "data_type": "date",
                    "is_required": False,
                    "validation_rules": ["date", "after:open_date"],
                    "display_order": 13
                }
            ],
            "business_rules": ["matter_conflict_check", "budget_tracking", "statute_monitoring", "billing_validation"],
            "validation_rules": ["unique_matter_number", "required_fields", "valid_dates"],
            "workflow_triggers": ["matter_opened", "status_changed", "attorney_assigned", "budget_exceeded"],
            "audit_enabled": True,
            "soft_delete": True
        },
        {
            "entity_name": "TimeEntry",
            "display_label": "Time Entry",
            "plural_label": "Time Entries",
            "description": "Billable and non-billable time tracking",
            "category": "BILLING",
            "is_system_entity": False,
            "vertical": "LEGAL",
            "fields": [
                {
                    "field_name": "matter_id",
                    "label_key": "time_entry.matter_id",
                    "data_type": "foreign_key",
                    "is_required": True,
                    "related_entity": "Matter",
                    "validation_rules": ["required", "exists:Matter,id"],
                    "display_order": 1
                },
                {
                    "field_name": "attorney_id",
                    "label_key": "time_entry.attorney_id",
                    "data_type": "foreign_key", 
                    "is_required": True,
                    "related_entity": "User",
                    "validation_rules": ["required", "exists:User,id"],
                    "display_order": 2
                },
                {
                    "field_name": "entry_date",
                    "label_key": "time_entry.entry_date",
                    "data_type": "date",
                    "is_required": True,
                    "validation_rules": ["required", "date", "before_or_equal:today"],
                    "display_order": 3
                },
                {
                    "field_name": "start_time",
                    "label_key": "time_entry.start_time",
                    "data_type": "time",
                    "is_required": False,
                    "validation_rules": ["time"],
                    "display_order": 4
                },
                {
                    "field_name": "end_time",
                    "label_key": "time_entry.end_time",
                    "data_type": "time",
                    "is_required": False,
                    "validation_rules": ["time", "after:start_time"],
                    "display_order": 5
                },
                {
                    "field_name": "hours",
                    "label_key": "time_entry.hours",
                    "data_type": "decimal",
                    "is_required": True,
                    "precision": 4,
                    "scale": 2,
                    "validation_rules": ["required", "numeric", "min:0.01", "max:24"],
                    "display_order": 6
                },
                {
                    "field_name": "description",
                    "label_key": "time_entry.description",
                    "data_type": "text",
                    "is_required": True,
                    "max_length": 1000,
                    "validation_rules": ["required", "min_length:10", "max_length:1000"],
                    "display_order": 7
                },
                {
                    "field_name": "task_code",
                    "label_key": "time_entry.task_code",
                    "data_type": "select",
                    "is_required": True,
                    "options": ["Research", "Document Review", "Client Meeting", "Court Appearance", "Legal Writing", "Phone Call", "Email", "Travel", "Administrative", "Other"],
                    "validation_rules": ["required"],
                    "display_order": 8
                },
                {
                    "field_name": "is_billable",
                    "label_key": "time_entry.is_billable",
                    "data_type": "boolean",
                    "is_required": True,
                    "default_value": True,
                    "validation_rules": ["required", "boolean"],
                    "display_order": 9
                },
                {
                    "field_name": "billable_rate",
                    "label_key": "time_entry.billable_rate",
                    "data_type": "decimal",
                    "is_required": False,
                    "precision": 10,
                    "scale": 2,
                    "validation_rules": ["numeric", "min:0"],
                    "display_order": 10
                },
                {
                    "field_name": "billing_status",
                    "label_key": "time_entry.billing_status",
                    "data_type": "select",
                    "is_required": True,
                    "options": ["Draft", "Ready to Bill", "Billed", "Paid", "Write-off"],
                    "default_value": "Draft",
                    "validation_rules": ["required"],
                    "display_order": 11
                }
            ],
            "business_rules": ["reasonable_hours_validation", "billing_rate_calculation", "budget_impact_check"],
            "validation_rules": ["required_fields", "reasonable_time_ranges", "billable_logic"],
            "workflow_triggers": ["time_entered", "status_changed", "billing_ready"],
            "audit_enabled": True,
            "soft_delete": True
        },
        {
            "entity_name": "Document",
            "display_label": "Document",
            "plural_label": "Documents",
            "description": "Legal documents and files",
            "category": "DOCUMENT",
            "is_system_entity": False,
            "vertical": "LEGAL",
            "fields": [
                {
                    "field_name": "matter_id",
                    "label_key": "document.matter_id",
                    "data_type": "foreign_key",
                    "is_required": True,
                    "related_entity": "Matter",
                    "validation_rules": ["required", "exists:Matter,id"],
                    "display_order": 1
                },
                {
                    "field_name": "document_title",
                    "label_key": "document.document_title",
                    "data_type": "string",
                    "is_required": True,
                    "max_length": 255,
                    "validation_rules": ["required", "max_length:255"],
                    "display_order": 2
                },
                {
                    "field_name": "document_type",
                    "label_key": "document.document_type",
                    "data_type": "select",
                    "is_required": True,
                    "options": ["Pleading", "Motion", "Contract", "Agreement", "Letter", "Email", "Research", "Evidence", "Discovery", "Other"],
                    "validation_rules": ["required"],
                    "display_order": 3
                },
                {
                    "field_name": "file_path",
                    "label_key": "document.file_path",
                    "data_type": "file",
                    "is_required": False,
                    "validation_rules": ["file", "max_size:50MB"],
                    "allowed_types": ["pdf", "doc", "docx", "txt", "jpg", "png"],
                    "display_order": 4
                },
                {
                    "field_name": "document_version",
                    "label_key": "document.document_version",
                    "data_type": "string",
                    "is_required": True,
                    "max_length": 20,
                    "default_value": "1.0",
                    "validation_rules": ["required", "version_format"],
                    "display_order": 5
                },
                {
                    "field_name": "privilege_level",
                    "label_key": "document.privilege_level",
                    "data_type": "select",
                    "is_required": True,
                    "options": ["Public", "Client Confidential", "Attorney-Client Privileged", "Work Product", "Highly Confidential"],
                    "default_value": "Client Confidential",
                    "validation_rules": ["required"],
                    "display_order": 6
                },
                {
                    "field_name": "created_by",
                    "label_key": "document.created_by",
                    "data_type": "foreign_key",
                    "is_required": True,
                    "related_entity": "User",
                    "validation_rules": ["required", "exists:User,id"],
                    "display_order": 7
                },
                {
                    "field_name": "reviewed_by",
                    "label_key": "document.reviewed_by",
                    "data_type": "foreign_key",
                    "is_required": False,
                    "related_entity": "User",
                    "validation_rules": ["exists:User,id"],
                    "display_order": 8
                },
                {
                    "field_name": "document_date",
                    "label_key": "document.document_date",
                    "data_type": "date",
                    "is_required": True,
                    "default_value": "today",
                    "validation_rules": ["required", "date"],
                    "display_order": 9
                },
                {
                    "field_name": "tags",
                    "label_key": "document.tags",
                    "data_type": "json",
                    "is_required": False,
                    "validation_rules": ["json"],
                    "help_text": "Searchable tags for document organization",
                    "display_order": 10
                }
            ],
            "business_rules": ["privilege_protection", "version_control", "access_logging"],
            "validation_rules": ["required_fields", "privilege_validation", "file_validation"],
            "workflow_triggers": ["document_created", "document_reviewed", "privilege_changed"],
            "audit_enabled": True,
            "soft_delete": True
        },
        {
            "entity_name": "Invoice",
            "display_label": "Invoice",
            "plural_label": "Invoices",
            "description": "Client invoices and billing",
            "category": "BILLING",
            "is_system_entity": False,
            "vertical": "LEGAL",
            "fields": [
                {
                    "field_name": "invoice_number",
                    "label_key": "invoice.invoice_number",
                    "data_type": "string",
                    "is_required": True,
                    "max_length": 50,
                    "validation_rules": ["required", "unique", "max_length:50"],
                    "auto_generate": True,
                    "display_order": 1
                },
                {
                    "field_name": "client_id",
                    "label_key": "invoice.client_id",
                    "data_type": "foreign_key",
                    "is_required": True,
                    "related_entity": "Client",
                    "validation_rules": ["required", "exists:Client,id"],
                    "display_order": 2
                },
                {
                    "field_name": "matter_id",
                    "label_key": "invoice.matter_id",
                    "data_type": "foreign_key",
                    "is_required": False,
                    "related_entity": "Matter",
                    "validation_rules": ["exists:Matter,id"],
                    "display_order": 3
                },
                {
                    "field_name": "invoice_date",
                    "label_key": "invoice.invoice_date",
                    "data_type": "date",
                    "is_required": True,
                    "default_value": "today",
                    "validation_rules": ["required", "date"],
                    "display_order": 4
                },
                {
                    "field_name": "due_date",
                    "label_key": "invoice.due_date",
                    "data_type": "date",
                    "is_required": True,
                    "validation_rules": ["required", "date", "after:invoice_date"],
                    "display_order": 5
                },
                {
                    "field_name": "subtotal",
                    "label_key": "invoice.subtotal",
                    "data_type": "decimal",
                    "is_required": True,
                    "precision": 12,
                    "scale": 2,
                    "validation_rules": ["required", "numeric", "min:0"],
                    "display_order": 6
                },
                {
                    "field_name": "tax_amount",
                    "label_key": "invoice.tax_amount",
                    "data_type": "decimal",
                    "is_required": False,
                    "precision": 12,
                    "scale": 2,
                    "validation_rules": ["numeric", "min:0"],
                    "display_order": 7
                },
                {
                    "field_name": "total_amount",
                    "label_key": "invoice.total_amount",
                    "data_type": "decimal",
                    "is_required": True,
                    "precision": 12,
                    "scale": 2,
                    "validation_rules": ["required", "numeric", "min:0"],
                    "display_order": 8
                },
                {
                    "field_name": "invoice_status",
                    "label_key": "invoice.invoice_status",
                    "data_type": "select",
                    "is_required": True,
                    "options": ["Draft", "Sent", "Paid", "Overdue", "Cancelled", "Refunded"],
                    "default_value": "Draft",
                    "validation_rules": ["required"],
                    "display_order": 9
                },
                {
                    "field_name": "payment_terms",
                    "label_key": "invoice.payment_terms",
                    "data_type": "select",
                    "is_required": True,
                    "options": ["Net 15", "Net 30", "Net 45", "Net 60", "Due on Receipt", "Custom"],
                    "default_value": "Net 30",
                    "validation_rules": ["required"],
                    "display_order": 10
                },
                {
                    "field_name": "notes",
                    "label_key": "invoice.notes",
                    "data_type": "text",
                    "is_required": False,
                    "max_length": 1000,
                    "validation_rules": ["max_length:1000"],
                    "display_order": 11
                }
            ],
            "business_rules": ["tax_calculation", "payment_tracking", "overdue_monitoring"],
            "validation_rules": ["required_fields", "amount_validation", "date_validation"],
            "workflow_triggers": ["invoice_created", "invoice_sent", "payment_received", "invoice_overdue"],
            "audit_enabled": True,
            "soft_delete": True
        }
    ]
    
    for entity_data in legal_entities:
        # Check if entity already exists
        existing = await session.execute(
            select(EntityDefinition).where(
                EntityDefinition.entity_name == entity_data["entity_name"]
            )
        )
        if existing.scalar_one_or_none():
            logger.info(f"⏭️ Entity {entity_data['entity_name']} already exists")
            continue
            
        # Create entity definition
        entity = EntityDefinition(
            entity_name=entity_data["entity_name"],
            display_label=entity_data["display_label"],
            plural_label=entity_data["plural_label"],
            description=entity_data["description"],
            category=entity_data["category"],
            is_system_entity=entity_data["is_system_entity"],
            vertical=entity_data["vertical"],
            business_rules=entity_data["business_rules"],
            validation_rules=entity_data["validation_rules"],
            workflow_triggers=entity_data["workflow_triggers"],
            audit_enabled=entity_data["audit_enabled"],
            soft_delete=entity_data["soft_delete"]
        )
        
        session.add(entity)
        await session.commit()
        await session.refresh(entity)
        
        # Create field definitions
        for field_data in entity_data["fields"]:
            field = FieldDefinition(
                entity_id=entity.id,
                field_name=field_data["field_name"],
                label_key=field_data["label_key"],
                data_type=field_data["data_type"],
                is_required=field_data["is_required"],
                max_length=field_data.get("max_length"),
                precision=field_data.get("precision"),
                scale=field_data.get("scale"),
                default_value=field_data.get("default_value"),
                validation_rules=field_data["validation_rules"],
                display_order=field_data["display_order"],
                help_text=field_data.get("help_text"),
                options=field_data.get("options"),
                related_entity=field_data.get("related_entity"),
                auto_generate=field_data.get("auto_generate", False),
                allowed_types=field_data.get("allowed_types")
            )
            session.add(field)
        
        await session.commit()
        logger.info(f"✅ Added Legal entity: {entity.display_label} with {len(entity_data['fields'])} fields")
    
    logger.info("🎉 Legal vertical entities seeded successfully!")