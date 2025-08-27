"""
Legal Pages and Layouts Seeding Data

Complete page definitions for Legal Practice CRM + ERP vertical.
This demonstrates our WordPress-like frontend by creating pages as pure metadata
configuration - no hardcoded components or layouts.
"""

from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.metadata import PageDefinition, LayoutDefinition
from app.core.logging import get_logger

logger = get_logger("legal_pages_seed")


async def seed_legal_pages(session: AsyncSession):
    """Seed Legal Practice CRM + ERP page definitions."""
    logger.info("📄 Seeding Legal vertical pages...")
    
    legal_pages = [
        {
            "page_name": "clients_list",
            "page_title": "Clients",
            "page_type": "LIST",
            "entity_name": "Client",
            "route_path": "/clients",
            "vertical": "LEGAL",
            "page_config": {
                "list_view": {
                    "columns": [
                        {
                            "field": "client_name",
                            "label": "Client Name",
                            "sortable": True,
                            "searchable": True,
                            "width": "200px"
                        },
                        {
                            "field": "client_type",
                            "label": "Type",
                            "sortable": True,
                            "filterable": True,
                            "width": "120px"
                        },
                        {
                            "field": "contact_email",
                            "label": "Email",
                            "sortable": True,
                            "searchable": True,
                            "width": "200px"
                        },
                        {
                            "field": "phone",
                            "label": "Phone",
                            "width": "140px"
                        },
                        {
                            "field": "client_status",
                            "label": "Status",
                            "sortable": True,
                            "filterable": True,
                            "width": "100px",
                            "render_type": "badge"
                        },
                        {
                            "field": "intake_date",
                            "label": "Intake Date",
                            "sortable": True,
                            "width": "120px",
                            "render_type": "date"
                        }
                    ],
                    "filters": [
                        {
                            "field": "client_status",
                            "type": "select",
                            "options": ["Prospect", "Active", "Inactive", "Archived"]
                        },
                        {
                            "field": "client_type",
                            "type": "select",
                            "options": ["Individual", "Corporation", "Partnership", "LLC", "Trust", "Government", "Non-Profit"]
                        },
                        {
                            "field": "intake_date",
                            "type": "date_range"
                        }
                    ],
                    "actions": [
                        {
                            "name": "create",
                            "label": "New Client",
                            "icon": "plus",
                            "route": "/clients/new",
                            "permission": "client.create"
                        },
                        {
                            "name": "export",
                            "label": "Export",
                            "icon": "download",
                            "permission": "client.export"
                        }
                    ],
                    "row_actions": [
                        {
                            "name": "view",
                            "label": "View",
                            "icon": "eye",
                            "route": "/clients/{id}",
                            "permission": "client.read"
                        },
                        {
                            "name": "edit",
                            "label": "Edit",
                            "icon": "edit",
                            "route": "/clients/{id}/edit",
                            "permission": "client.update"
                        },
                        {
                            "name": "create_matter",
                            "label": "New Matter",
                            "icon": "briefcase",
                            "route": "/matters/new?client_id={id}",
                            "permission": "matter.create"
                        }
                    ],
                    "pagination": {
                        "page_size": 25,
                        "show_size_selector": True,
                        "size_options": [10, 25, 50, 100]
                    }
                },
                "search_config": {
                    "global_search": True,
                    "search_fields": ["client_name", "contact_email", "phone"],
                    "advanced_search": True
                }
            },
            "permissions": ["client.read"],
            "menu_config": {
                "menu_group": "Client Management",
                "menu_order": 1,
                "icon": "users",
                "show_in_nav": True
            }
        },
        {
            "page_name": "client_detail",
            "page_title": "Client Details",
            "page_type": "DETAIL",
            "entity_name": "Client",
            "route_path": "/clients/{id}",
            "vertical": "LEGAL",
            "page_config": {
                "detail_view": {
                    "sections": [
                        {
                            "title": "Client Information",
                            "layout": "two_column",
                            "fields": [
                                {
                                    "field": "client_name",
                                    "label": "Client Name",
                                    "render_type": "text",
                                    "column": "left"
                                },
                                {
                                    "field": "client_type",
                                    "label": "Client Type",
                                    "render_type": "badge",
                                    "column": "right"
                                },
                                {
                                    "field": "contact_email",
                                    "label": "Email",
                                    "render_type": "email",
                                    "column": "left"
                                },
                                {
                                    "field": "phone",
                                    "label": "Phone",
                                    "render_type": "phone",
                                    "column": "right"
                                },
                                {
                                    "field": "address",
                                    "label": "Address",
                                    "render_type": "text",
                                    "column": "full"
                                },
                                {
                                    "field": "tax_id",
                                    "label": "Tax ID",
                                    "render_type": "masked",
                                    "column": "left"
                                },
                                {
                                    "field": "client_status",
                                    "label": "Status",
                                    "render_type": "status_badge",
                                    "column": "right"
                                }
                            ]
                        },
                        {
                            "title": "Billing Information",
                            "layout": "two_column",
                            "fields": [
                                {
                                    "field": "billing_rate_override",
                                    "label": "Special Billing Rate",
                                    "render_type": "currency",
                                    "column": "left"
                                },
                                {
                                    "field": "intake_date",
                                    "label": "Client Since",
                                    "render_type": "date",
                                    "column": "right"
                                },
                                {
                                    "field": "referral_source",
                                    "label": "Referral Source",
                                    "render_type": "text",
                                    "column": "full"
                                }
                            ]
                        }
                    ],
                    "tabs": [
                        {
                            "tab_id": "matters",
                            "title": "Matters",
                            "component": "related_list",
                            "config": {
                                "entity": "Matter",
                                "filter_field": "client_id",
                                "columns": ["matter_name", "practice_area", "matter_status", "responsible_attorney", "open_date"],
                                "actions": ["view", "edit", "create"]
                            }
                        },
                        {
                            "tab_id": "invoices",
                            "title": "Invoices",
                            "component": "related_list",
                            "config": {
                                "entity": "Invoice",
                                "filter_field": "client_id",
                                "columns": ["invoice_number", "invoice_date", "total_amount", "invoice_status"],
                                "actions": ["view", "edit", "download"]
                            }
                        },
                        {
                            "tab_id": "documents",
                            "title": "Documents",
                            "component": "related_list",
                            "config": {
                                "entity": "Document",
                                "filter_field": "client_id",
                                "filter_through": "matter",
                                "columns": ["document_title", "document_type", "privilege_level", "document_date"],
                                "actions": ["view", "download"]
                            }
                        },
                        {
                            "tab_id": "activity",
                            "title": "Activity Log",
                            "component": "activity_timeline",
                            "config": {
                                "entity": "Client",
                                "show_system_events": True,
                                "show_user_actions": True,
                                "show_workflow_events": True
                            }
                        }
                    ]
                },
                "actions": [
                    {
                        "name": "edit",
                        "label": "Edit Client",
                        "icon": "edit",
                        "route": "/clients/{id}/edit",
                        "permission": "client.update"
                    },
                    {
                        "name": "create_matter",
                        "label": "New Matter",
                        "icon": "briefcase",
                        "route": "/matters/new?client_id={id}",
                        "permission": "matter.create"
                    },
                    {
                        "name": "create_invoice",
                        "label": "Create Invoice",
                        "icon": "receipt",
                        "route": "/invoices/new?client_id={id}",
                        "permission": "invoice.create"
                    }
                ]
            },
            "permissions": ["client.read"],
            "menu_config": {
                "show_in_nav": False
            }
        },
        {
            "page_name": "client_form",
            "page_title": "Client Form",
            "page_type": "FORM",
            "entity_name": "Client",
            "route_path": "/clients/{id?}/edit",
            "vertical": "LEGAL",
            "page_config": {
                "form_view": {
                    "sections": [
                        {
                            "title": "Basic Information",
                            "layout": "two_column",
                            "fields": [
                                {
                                    "field": "client_name",
                                    "label": "Client Name",
                                    "required": True,
                                    "column": "full",
                                    "validation": ["required", "max_length:255"]
                                },
                                {
                                    "field": "client_type",
                                    "label": "Client Type",
                                    "required": True,
                                    "input_type": "select",
                                    "options": ["Individual", "Corporation", "Partnership", "LLC", "Trust", "Government", "Non-Profit"],
                                    "column": "left"
                                },
                                {
                                    "field": "client_status",
                                    "label": "Status",
                                    "required": True,
                                    "input_type": "select",
                                    "options": ["Prospect", "Active", "Inactive", "Archived"],
                                    "column": "right"
                                }
                            ]
                        },
                        {
                            "title": "Contact Information",
                            "layout": "two_column",
                            "fields": [
                                {
                                    "field": "contact_email",
                                    "label": "Email Address",
                                    "required": True,
                                    "input_type": "email",
                                    "validation": ["required", "email", "unique"],
                                    "column": "left"
                                },
                                {
                                    "field": "phone",
                                    "label": "Phone Number",
                                    "input_type": "phone",
                                    "validation": ["phone_us"],
                                    "column": "right"
                                },
                                {
                                    "field": "address",
                                    "label": "Address",
                                    "input_type": "textarea",
                                    "rows": 3,
                                    "column": "full"
                                }
                            ]
                        },
                        {
                            "title": "Legal & Billing",
                            "layout": "two_column",
                            "fields": [
                                {
                                    "field": "tax_id",
                                    "label": "Tax ID (SSN/EIN)",
                                    "input_type": "masked",
                                    "mask": "business_tax_id",
                                    "help_text": "SSN for individuals, EIN for businesses",
                                    "column": "left"
                                },
                                {
                                    "field": "billing_rate_override",
                                    "label": "Special Billing Rate",
                                    "input_type": "currency",
                                    "help_text": "Override default billing rate for this client",
                                    "column": "right"
                                },
                                {
                                    "field": "intake_date",
                                    "label": "Intake Date",
                                    "required": True,
                                    "input_type": "date",
                                    "default_value": "today",
                                    "column": "left"
                                },
                                {
                                    "field": "referral_source",
                                    "label": "Referral Source",
                                    "input_type": "text",
                                    "column": "right"
                                }
                            ]
                        }
                    ],
                    "validation_rules": [
                        {
                            "rule": "conflict_check",
                            "trigger": "before_save",
                            "blocking": True,
                            "message": "Potential conflict of interest detected"
                        }
                    ],
                    "workflow_triggers": [
                        {
                            "workflow": "CLIENT_INTAKE",
                            "trigger": "after_create",
                            "condition": "client_status == 'Prospect'"
                        }
                    ]
                },
                "submit_actions": [
                    {
                        "name": "save_and_continue",
                        "label": "Save & Continue",
                        "redirect": "/clients/{id}",
                        "primary": True
                    },
                    {
                        "name": "save_and_new_matter",
                        "label": "Save & Create Matter",
                        "redirect": "/matters/new?client_id={id}",
                        "condition": "client_status == 'Active'"
                    },
                    {
                        "name": "save_and_close",
                        "label": "Save & Close",
                        "redirect": "/clients"
                    }
                ]
            },
            "permissions": ["client.create", "client.update"],
            "menu_config": {
                "show_in_nav": False
            }
        },
        {
            "page_name": "matters_list",
            "page_title": "Matters",
            "page_type": "LIST",
            "entity_name": "Matter",
            "route_path": "/matters",
            "vertical": "LEGAL",
            "page_config": {
                "list_view": {
                    "columns": [
                        {
                            "field": "matter_number",
                            "label": "Matter #",
                            "sortable": True,
                            "searchable": True,
                            "width": "120px",
                            "pinned": "left"
                        },
                        {
                            "field": "matter_name",
                            "label": "Matter Name",
                            "sortable": True,
                            "searchable": True,
                            "width": "200px"
                        },
                        {
                            "field": "client_name",
                            "label": "Client",
                            "sortable": True,
                            "searchable": True,
                            "width": "150px",
                            "relation_field": "client_id",
                            "relation_display": "client_name"
                        },
                        {
                            "field": "practice_area",
                            "label": "Practice Area",
                            "sortable": True,
                            "filterable": True,
                            "width": "140px"
                        },
                        {
                            "field": "matter_status",
                            "label": "Status",
                            "sortable": True,
                            "filterable": True,
                            "width": "100px",
                            "render_type": "status_badge"
                        },
                        {
                            "field": "responsible_attorney",
                            "label": "Attorney",
                            "sortable": True,
                            "filterable": True,
                            "width": "130px",
                            "relation_field": "responsible_attorney",
                            "relation_display": "full_name"
                        },
                        {
                            "field": "budget_amount",
                            "label": "Budget",
                            "sortable": True,
                            "width": "100px",
                            "render_type": "currency"
                        },
                        {
                            "field": "open_date",
                            "label": "Opened",
                            "sortable": True,
                            "width": "100px",
                            "render_type": "date"
                        }
                    ],
                    "filters": [
                        {
                            "field": "matter_status",
                            "type": "select",
                            "options": ["Open", "Active", "On Hold", "Closed", "Archived"]
                        },
                        {
                            "field": "practice_area",
                            "type": "select",
                            "options": ["Corporate Law", "Litigation", "Real Estate", "Family Law", "Criminal Law", "Immigration", "Intellectual Property", "Employment Law", "Tax Law", "Estate Planning"]
                        },
                        {
                            "field": "responsible_attorney",
                            "type": "user_select",
                            "role_filter": "Attorney"
                        },
                        {
                            "field": "open_date",
                            "type": "date_range"
                        }
                    ],
                    "actions": [
                        {
                            "name": "create",
                            "label": "New Matter",
                            "icon": "plus",
                            "route": "/matters/new",
                            "permission": "matter.create"
                        },
                        {
                            "name": "bulk_update_status",
                            "label": "Bulk Update Status",
                            "icon": "edit",
                            "permission": "matter.bulk_update"
                        }
                    ],
                    "row_actions": [
                        {
                            "name": "view",
                            "label": "View",
                            "icon": "eye",
                            "route": "/matters/{id}",
                            "permission": "matter.read"
                        },
                        {
                            "name": "edit",
                            "label": "Edit",
                            "icon": "edit",
                            "route": "/matters/{id}/edit",
                            "permission": "matter.update"
                        },
                        {
                            "name": "time_entry",
                            "label": "Log Time",
                            "icon": "clock",
                            "route": "/time-entries/new?matter_id={id}",
                            "permission": "time_entry.create"
                        }
                    ]
                }
            },
            "permissions": ["matter.read"],
            "menu_config": {
                "menu_group": "Case Management",
                "menu_order": 1,
                "icon": "briefcase",
                "show_in_nav": True
            }
        },
        {
            "page_name": "time_entries_list",
            "page_title": "Time Entries",
            "page_type": "LIST",
            "entity_name": "TimeEntry",
            "route_path": "/time-entries",
            "vertical": "LEGAL",
            "page_config": {
                "list_view": {
                    "columns": [
                        {
                            "field": "entry_date",
                            "label": "Date",
                            "sortable": True,
                            "width": "100px",
                            "render_type": "date"
                        },
                        {
                            "field": "matter_name",
                            "label": "Matter",
                            "sortable": True,
                            "searchable": True,
                            "width": "180px",
                            "relation_field": "matter_id",
                            "relation_display": "matter_name"
                        },
                        {
                            "field": "attorney_name",
                            "label": "Attorney",
                            "sortable": True,
                            "width": "120px",
                            "relation_field": "attorney_id",
                            "relation_display": "full_name"
                        },
                        {
                            "field": "task_code",
                            "label": "Task",
                            "sortable": True,
                            "filterable": True,
                            "width": "100px"
                        },
                        {
                            "field": "hours",
                            "label": "Hours",
                            "sortable": True,
                            "width": "80px",
                            "render_type": "decimal",
                            "precision": 2
                        },
                        {
                            "field": "description",
                            "label": "Description",
                            "width": "200px",
                            "truncate": 50
                        },
                        {
                            "field": "billable_rate",
                            "label": "Rate",
                            "sortable": True,
                            "width": "80px",
                            "render_type": "currency"
                        },
                        {
                            "field": "billing_status",
                            "label": "Status",
                            "sortable": True,
                            "filterable": True,
                            "width": "100px",
                            "render_type": "status_badge"
                        }
                    ],
                    "filters": [
                        {
                            "field": "entry_date",
                            "type": "date_range",
                            "default": "current_month"
                        },
                        {
                            "field": "billing_status",
                            "type": "select",
                            "options": ["Draft", "Ready to Bill", "Billed", "Paid", "Write-off"]
                        },
                        {
                            "field": "task_code",
                            "type": "select",
                            "options": ["Research", "Document Review", "Client Meeting", "Court Appearance", "Legal Writing", "Phone Call", "Email", "Travel", "Administrative", "Other"]
                        },
                        {
                            "field": "attorney_id",
                            "type": "user_select",
                            "role_filter": "Attorney"
                        }
                    ],
                    "summary_row": {
                        "show": True,
                        "fields": ["hours", "billable_amount"],
                        "calculations": {
                            "hours": "sum",
                            "billable_amount": "sum"
                        }
                    }
                }
            },
            "permissions": ["time_entry.read"],
            "menu_config": {
                "menu_group": "Time & Billing",
                "menu_order": 1,
                "icon": "clock",
                "show_in_nav": True
            }
        },
        {
            "page_name": "dashboard",
            "page_title": "Legal Practice Dashboard",
            "page_type": "DASHBOARD",
            "route_path": "/dashboard",
            "vertical": "LEGAL",
            "page_config": {
                "dashboard_view": {
                    "widgets": [
                        {
                            "widget_id": "client_stats",
                            "title": "Client Overview",
                            "type": "stats_cards",
                            "size": "medium",
                            "position": {"row": 1, "col": 1, "span": 3},
                            "config": {
                                "cards": [
                                    {
                                        "title": "Total Clients",
                                        "entity": "Client",
                                        "calculation": "count",
                                        "icon": "users",
                                        "color": "blue"
                                    },
                                    {
                                        "title": "Active Matters",
                                        "entity": "Matter",
                                        "calculation": "count",
                                        "filter": {"matter_status": ["Open", "Active"]},
                                        "icon": "briefcase",
                                        "color": "green"
                                    },
                                    {
                                        "title": "This Month Hours",
                                        "entity": "TimeEntry",
                                        "calculation": "sum",
                                        "field": "hours",
                                        "filter": {"entry_date": "current_month"},
                                        "icon": "clock",
                                        "color": "orange"
                                    }
                                ]
                            }
                        },
                        {
                            "widget_id": "revenue_chart",
                            "title": "Monthly Revenue",
                            "type": "line_chart",
                            "size": "large",
                            "position": {"row": 1, "col": 4, "span": 6},
                            "config": {
                                "entity": "Invoice",
                                "x_axis": "invoice_date",
                                "y_axis": "total_amount",
                                "aggregation": "sum",
                                "period": "month",
                                "duration": "12_months"
                            }
                        },
                        {
                            "widget_id": "recent_matters",
                            "title": "Recent Matters",
                            "type": "data_table",
                            "size": "medium",
                            "position": {"row": 2, "col": 1, "span": 5},
                            "config": {
                                "entity": "Matter",
                                "limit": 10,
                                "sort": {"field": "open_date", "direction": "desc"},
                                "columns": ["matter_name", "client_name", "practice_area", "matter_status", "open_date"]
                            }
                        },
                        {
                            "widget_id": "statute_alerts",
                            "title": "Statute of Limitations Alerts",
                            "type": "alert_list",
                            "size": "medium",
                            "position": {"row": 2, "col": 6, "span": 4},
                            "config": {
                                "entity": "Matter",
                                "filter": {
                                    "statute_of_limitations": {"within_days": 90},
                                    "matter_status": ["Open", "Active"]
                                },
                                "sort": {"field": "statute_of_limitations", "direction": "asc"},
                                "alert_levels": {
                                    "critical": {"within_days": 7, "color": "red"},
                                    "warning": {"within_days": 30, "color": "orange"},
                                    "info": {"within_days": 90, "color": "yellow"}
                                }
                            }
                        }
                    ],
                    "refresh_interval": 300,
                    "auto_refresh": True
                }
            },
            "permissions": ["dashboard.read"],
            "menu_config": {
                "menu_group": "Overview",
                "menu_order": 1,
                "icon": "dashboard",
                "show_in_nav": True,
                "is_home": True
            }
        }
    ]
    
    for page_data in legal_pages:
        # Check if page already exists
        existing = await session.execute(
            select(PageDefinition).where(
                PageDefinition.page_name == page_data["page_name"]
            )
        )
        if existing.scalar_one_or_none():
            logger.info(f"⏭️ Page {page_data['page_name']} already exists")
            continue
            
        # Create page definition
        page = PageDefinition(
            page_name=page_data["page_name"],
            page_title=page_data["page_title"],
            page_type=page_data["page_type"],
            entity_name=page_data.get("entity_name"),
            route_path=page_data["route_path"],
            vertical=page_data["vertical"],
            page_config=page_data["page_config"],
            permissions=page_data["permissions"],
            menu_config=page_data["menu_config"],
            is_published=True
        )
        
        session.add(page)
        await session.commit()
        await session.refresh(page)
        
        logger.info(f"✅ Added Legal page: {page.page_title} ({page.page_type})")
    
    logger.info("🎉 Legal vertical pages seeded successfully!")


async def seed_legal_layouts(session: AsyncSession):
    """Seed Legal vertical layout definitions."""
    logger.info("🎨 Seeding Legal vertical layouts...")
    
    legal_layouts = [
        {
            "layout_name": "legal_main_layout",
            "layout_title": "Legal Practice Main Layout",
            "layout_type": "MAIN",
            "vertical": "LEGAL",
            "layout_config": {
                "header": {
                    "component": "AppHeader",
                    "config": {
                        "logo": {
                            "text": "LegalPro",
                            "show_icon": True,
                            "icon": "scales"
                        },
                        "navigation": {
                            "type": "horizontal",
                            "show_breadcrumbs": True
                        },
                        "user_menu": {
                            "show_profile": True,
                            "show_settings": True,
                            "show_logout": True
                        }
                    }
                },
                "sidebar": {
                    "component": "NavigationSidebar",
                    "config": {
                        "width": "280px",
                        "collapsible": True,
                        "default_collapsed": False,
                        "theme": "dark",
                        "menu_groups": [
                            {
                                "title": "Overview",
                                "items": [
                                    {
                                        "label": "Dashboard",
                                        "route": "/dashboard",
                                        "icon": "dashboard",
                                        "permission": "dashboard.read"
                                    }
                                ]
                            },
                            {
                                "title": "Client Management",
                                "items": [
                                    {
                                        "label": "Clients",
                                        "route": "/clients",
                                        "icon": "users",
                                        "permission": "client.read"
                                    },
                                    {
                                        "label": "New Client",
                                        "route": "/clients/new",
                                        "icon": "user-plus",
                                        "permission": "client.create"
                                    }
                                ]
                            },
                            {
                                "title": "Case Management",
                                "items": [
                                    {
                                        "label": "Matters",
                                        "route": "/matters",
                                        "icon": "briefcase",
                                        "permission": "matter.read"
                                    },
                                    {
                                        "label": "New Matter",
                                        "route": "/matters/new",
                                        "icon": "plus",
                                        "permission": "matter.create"
                                    },
                                    {
                                        "label": "Documents",
                                        "route": "/documents",
                                        "icon": "file-text",
                                        "permission": "document.read"
                                    }
                                ]
                            },
                            {
                                "title": "Time & Billing",
                                "items": [
                                    {
                                        "label": "Time Entries",
                                        "route": "/time-entries",
                                        "icon": "clock",
                                        "permission": "time_entry.read"
                                    },
                                    {
                                        "label": "Log Time",
                                        "route": "/time-entries/new",
                                        "icon": "play",
                                        "permission": "time_entry.create"
                                    },
                                    {
                                        "label": "Invoices",
                                        "route": "/invoices",
                                        "icon": "receipt",
                                        "permission": "invoice.read"
                                    }
                                ]
                            },
                            {
                                "title": "Reports",
                                "items": [
                                    {
                                        "label": "Billing Reports",
                                        "route": "/reports/billing",
                                        "icon": "bar-chart",
                                        "permission": "reports.billing"
                                    },
                                    {
                                        "label": "Matter Reports",
                                        "route": "/reports/matters",
                                        "icon": "pie-chart",
                                        "permission": "reports.matters"
                                    }
                                ]
                            }
                        ]
                    }
                },
                "main_content": {
                    "component": "PageRenderer",
                    "config": {
                        "padding": "24px",
                        "max_width": "100%",
                        "background": "white"
                    }
                },
                "footer": {
                    "component": "AppFooter",
                    "config": {
                        "show_version": True,
                        "show_support_link": True,
                        "copyright": "© 2024 LegalPro Platform"
                    }
                }
            },
            "responsive_config": {
                "mobile": {
                    "sidebar": {
                        "type": "overlay",
                        "default_collapsed": True
                    },
                    "header": {
                        "compact": True
                    }
                },
                "tablet": {
                    "sidebar": {
                        "width": "240px"
                    }
                }
            }
        },
        {
            "layout_name": "legal_form_layout",
            "layout_title": "Legal Form Layout",
            "layout_type": "FORM",
            "vertical": "LEGAL",
            "layout_config": {
                "form_container": {
                    "max_width": "800px",
                    "padding": "32px",
                    "background": "white",
                    "border_radius": "8px",
                    "shadow": "medium"
                },
                "field_layout": {
                    "label_position": "top",
                    "field_spacing": "16px",
                    "section_spacing": "32px",
                    "required_indicator": "*",
                    "help_text_position": "below"
                },
                "validation": {
                    "inline_validation": True,
                    "show_errors_on_blur": True,
                    "highlight_required": True
                },
                "actions": {
                    "position": "bottom",
                    "alignment": "right",
                    "spacing": "12px",
                    "sticky": True
                }
            }
        }
    ]
    
    for layout_data in legal_layouts:
        # Check if layout already exists
        existing = await session.execute(
            select(LayoutDefinition).where(
                LayoutDefinition.layout_name == layout_data["layout_name"]
            )
        )
        if existing.scalar_one_or_none():
            logger.info(f"⏭️ Layout {layout_data['layout_name']} already exists")
            continue
            
        # Create layout definition
        layout = LayoutDefinition(
            layout_name=layout_data["layout_name"],
            layout_title=layout_data["layout_title"],
            layout_type=layout_data["layout_type"],
            vertical=layout_data["vertical"],
            layout_config=layout_data["layout_config"],
            responsive_config=layout_data.get("responsive_config"),
            is_published=True
        )
        
        session.add(layout)
        logger.info(f"✅ Added Legal layout: {layout.layout_title}")
    
    await session.commit()
    logger.info("🎉 Legal vertical layouts seeded successfully!")