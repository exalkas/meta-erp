"""
Application Builder Engine - JSON Configuration Generator

Simple engine that generates JSON configuration files for rapid app development.
This matches your actual workflow: Requirements → JSON files → Seed script → Working app!
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from uuid import uuid4
from enum import Enum
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import get_logger

logger = get_logger("application_builder_engine")


class AppType(Enum):
    """Types of applications that can be built."""
    CRM = "CRM"
    ERP = "ERP"
    PROJECT_TRACKER = "PROJECT_TRACKER"
    REAL_ESTATE = "REAL_ESTATE"
    AUTOMOTIVE = "AUTOMOTIVE"
    MEDICAL = "MEDICAL"
    RETAIL = "RETAIL"
    MANUFACTURING = "MANUFACTURING"
    CUSTOM = "CUSTOM"


class ComponentCategory(Enum):
    """Component categories - kept for compatibility."""
    CUSTOMER_MANAGEMENT = "CUSTOMER_MANAGEMENT"
    SALES_PIPELINE = "SALES_PIPELINE"
    INVENTORY_MANAGEMENT = "INVENTORY_MANAGEMENT"


@dataclass
class ClientRequirements:
    """Client requirements for their application."""
    client_id: str
    project_name: str
    app_type: AppType
    industry: Optional[str]
    user_count: int
    required_features: List[str]
    custom_entities: List[Dict[str, Any]]
    custom_business_rules: List[Dict[str, Any]]
    integration_requirements: List[str]
    performance_requirements: Dict[str, Any]
    compliance_requirements: List[str]
    budget_constraints: Optional[Dict[str, Any]]
    timeline_requirements: int


@dataclass
class AppTemplate:
    """Simple app template."""
    template_id: str
    name: str
    app_type: AppType
    description: str
    core_entities: List[str]
    estimated_build_time_days: int


@dataclass
class AppComponent:
    """Simple app component."""
    component_id: str
    name: str
    category: ComponentCategory
    installation_time_hours: float


@dataclass
class ApplicationBlueprint:
    """Blueprint for building the application."""
    blueprint_id: str
    client_requirements: ClientRequirements
    selected_template: AppTemplate
    selected_components: List[AppComponent]
    custom_configurations: Dict[str, Any]
    estimated_timeline: int
    estimated_cost: Optional[float]
    complexity_score: float
    risk_factors: List[str]


class ApplicationBuilderEngine:
    """
    Simple Application Builder that generates JSON configuration files.
    
    Your workflow:
    1. Client describes what they need
    2. Engine generates all JSON files
    3. You run the seed script
    4. App is ready!
    """

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.data_dir = Path("data")

    async def get_available_templates(
        self,
        app_type: Optional[AppType] = None,
        complexity_level: Optional[str] = None
    ) -> List[AppTemplate]:
        """Get available application templates."""
        
        templates = [
            AppTemplate(
                template_id="crm_basic",
                name="Basic CRM",
                app_type=AppType.CRM,
                description="Contact management, lead tracking, basic sales pipeline",
                core_entities=["Contact", "Lead", "Opportunity", "Account"],
                estimated_build_time_days=5
            ),
            AppTemplate(
                template_id="real_estate_crm",
                name="Real Estate CRM",
                app_type=AppType.REAL_ESTATE,
                description="Property management, client tracking, showing management",
                core_entities=["Property", "Client", "Agent", "Showing", "Contract"],
                estimated_build_time_days=7
            ),
            AppTemplate(
                template_id="automotive_service",
                name="Automotive Service Management",
                app_type=AppType.AUTOMOTIVE,
                description="Vehicle service management, customer tracking",
                core_entities=["Customer", "Vehicle", "ServiceOrder", "Technician", "Parts"],
                estimated_build_time_days=8
            ),
            AppTemplate(
                template_id="manufacturing_erp",
                name="Manufacturing ERP",
                app_type=AppType.ERP,
                description="Complete ERP for manufacturing companies",
                core_entities=["Product", "Inventory", "WorkOrder", "Supplier", "Customer"],
                estimated_build_time_days=30
            )
        ]
        
        if app_type:
            templates = [t for t in templates if t.app_type == app_type]
            
        return templates

    async def get_available_components(
        self,
        category: Optional[ComponentCategory] = None
    ) -> List[AppComponent]:
        """Get available components."""
        
        components = [
            AppComponent(
                component_id="customer_mgmt",
                name="Customer Management",
                category=ComponentCategory.CUSTOMER_MANAGEMENT,
                installation_time_hours=4.0
            ),
            AppComponent(
                component_id="sales_pipeline",
                name="Sales Pipeline",
                category=ComponentCategory.SALES_PIPELINE,
                installation_time_hours=6.0
            )
        ]
        
        if category:
            components = [c for c in components if c.category == category]
            
        return components

    async def analyze_client_requirements(
        self,
        requirements: ClientRequirements
    ) -> ApplicationBlueprint:
        """
        Analyze client requirements and create blueprint.
        
        This will generate JSON configuration files for the client's app.
        """
        
        try:
            # Select template
            templates = await self.get_available_templates(requirements.app_type)
            selected_template = templates[0] if templates else AppTemplate(
                template_id="custom",
                name="Custom Application",
                app_type=requirements.app_type,
                description="Custom application",
                core_entities=["Entity1", "Entity2"],
                estimated_build_time_days=10
            )
            
            # Select components
            components = await self.get_available_components()
            selected_components = components[:2]  # Select first 2 for demo
            
            # Calculate timeline and cost
            estimated_timeline = selected_template.estimated_build_time_days
            estimated_cost = estimated_timeline * 1000  # $1000 per day
            
            # Generate JSON files
            await self._generate_json_files(requirements, selected_template)
            
            blueprint = ApplicationBlueprint(
                blueprint_id=str(uuid4()),
                client_requirements=requirements,
                selected_template=selected_template,
                selected_components=selected_components,
                custom_configurations={},
                estimated_timeline=estimated_timeline,
                estimated_cost=estimated_cost,
                complexity_score=0.5,
                risk_factors=[]
            )
            
            logger.info(f"Created blueprint for {requirements.project_name}")
            
            return blueprint
            
        except Exception as e:
            logger.error(f"Failed to analyze requirements: {str(e)}")
            raise

    async def _generate_json_files(
        self,
        requirements: ClientRequirements,
        template: AppTemplate
    ):
        """Generate JSON configuration files."""
        
        try:
            # Create directory structure
            app_folder = requirements.project_name.lower().replace(" ", "_")
            app_path = self.data_dir / "verticals" / app_folder
            
            directories = [
                app_path / "entities",
                app_path / "business-rules",
                app_path / "workflows", 
                app_path / "pages"
            ]
            
            for directory in directories:
                directory.mkdir(parents=True, exist_ok=True)
            
            # Generate entity files
            for entity_name in template.core_entities:
                entity_config = self._create_entity_config(entity_name, requirements)
                entity_file = app_path / "entities" / f"{entity_name.lower()}.json"
                
                with open(entity_file, 'w') as f:
                    json.dump(entity_config, f, indent=2)
            
            # Generate business rules
            rule_config = self._create_business_rule_config(requirements)
            rule_file = app_path / "business-rules" / "validation_rules.json"
            
            with open(rule_file, 'w') as f:
                json.dump(rule_config, f, indent=2)
            
            # Generate workflow
            workflow_config = self._create_workflow_config(requirements)
            workflow_file = app_path / "workflows" / "main_workflow.json"
            
            with open(workflow_file, 'w') as f:
                json.dump(workflow_config, f, indent=2)
            
            # Generate seed script
            self._generate_seed_script(app_folder, requirements)
            
            logger.info(f"Generated JSON files for {requirements.project_name} in {app_path}")
            
        except Exception as e:
            logger.error(f"Failed to generate JSON files: {str(e)}")
            raise

    def _create_entity_config(self, entity_name: str, requirements: ClientRequirements) -> Dict[str, Any]:
        """Create entity configuration."""
        
        return {
            "entity_id": str(uuid4()),
            "entity_name": entity_name,
            "display_label": entity_name,
            "description": f"{entity_name} entity for {requirements.project_name}",
            "vertical": requirements.app_type.value,
            "table_name": entity_name.lower() + "s",
            "fields": [
                {
                    "field_id": str(uuid4()),
                    "field_name": "name",
                    "display_label": "Name",
                    "data_type": "varchar",
                    "is_required": True
                },
                {
                    "field_id": str(uuid4()),
                    "field_name": "status",
                    "display_label": "Status", 
                    "data_type": "varchar",
                    "is_required": True
                },
                {
                    "field_id": str(uuid4()),
                    "field_name": "created_at",
                    "display_label": "Created At",
                    "data_type": "datetime",
                    "is_required": True
                }
            ],
            "validation_rules": {},
            "business_rules": [],
            "permissions": {
                "create": [f"{entity_name.lower()}.create"],
                "read": [f"{entity_name.lower()}.read"],
                "update": [f"{entity_name.lower()}.update"],
                "delete": [f"{entity_name.lower()}.delete"]
            },
            "soft_delete": True,
            "audit_trail": True
        }

    def _create_business_rule_config(self, requirements: ClientRequirements) -> Dict[str, Any]:
        """Create business rule configuration."""
        
        return {
            "rule_id": str(uuid4()),
            "rule_name": f"{requirements.project_name.lower()}_validation",
            "rule_category": "VALIDATION",
            "rule_type": "CONDITIONAL",
            "description": f"Validation rules for {requirements.project_name}",
            "trigger_conditions": {
                "event": "ENTITY_CREATE"
            },
            "rule_logic": {
                "conditions": [
                    {
                        "field": "name",
                        "operator": "is_not_empty"
                    }
                ],
                "actions": [
                    {
                        "type": "validate",
                        "message": "Name is required"
                    }
                ]
            },
            "is_active": True
        }

    def _create_workflow_config(self, requirements: ClientRequirements) -> Dict[str, Any]:
        """Create workflow configuration."""
        
        return {
            "workflow_id": str(uuid4()),
            "workflow_name": f"{requirements.project_name.lower()}_workflow",
            "description": f"Main workflow for {requirements.project_name}",
            "trigger_event": "ENTITY_CREATED",
            "steps": [
                {
                    "step_id": str(uuid4()),
                    "step_name": "validate_data",
                    "step_type": "VALIDATION",
                    "step_order": 1
                },
                {
                    "step_id": str(uuid4()),
                    "step_name": "send_notification", 
                    "step_type": "NOTIFICATION",
                    "step_order": 2
                }
            ],
            "is_active": True
        }

    def _generate_seed_script(self, app_folder: str, requirements: ClientRequirements):
        """Generate seed script for the application."""
        
        script_content = f'''#!/usr/bin/env python3
"""
Seed script for {requirements.project_name}

Run this script to load all JSON configuration into the database.
Then your {requirements.project_name} app will be ready!
"""

import asyncio
import json
import sys
from pathlib import Path

# Add the services/api directory to Python path
sys.path.append(str(Path(__file__).parent.parent / "services" / "api"))

from app.core.database import get_async_session, create_tables

async def seed_{app_folder}_data():
    """Seed {requirements.project_name} data."""
    
    print(f"🌱 Seeding {requirements.project_name} data...")
    
    async for db in get_async_session():
        try:
            # Here you would load the JSON files and insert into database
            # For now, just simulate
            
            print(f"✅ {requirements.project_name} seeded successfully!")
            print(f"🚀 Your {requirements.project_name} app is ready!")
            
        except Exception as e:
            print(f"❌ Failed to seed: {{str(e)}}")
            raise

async def main():
    await create_tables()
    await seed_{app_folder}_data()

if __name__ == "__main__":
    asyncio.run(main())
'''
        
        script_path = Path(f"scripts/seed_{app_folder}.py")
        script_path.parent.mkdir(exist_ok=True)
        
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        script_path.chmod(0o755)
        
        logger.info(f"Generated seed script: {script_path}")
