"""
Legal Vertical JSON Data Loader

Loads Legal vertical configuration from organized JSON files.
This demonstrates proper data organization and maintainability.
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.metadata import EntityDefinition, FieldDefinition, PageDefinition, LayoutDefinition
from app.models.business_config import BusinessRuleDefinition, ProcessConfigMaster
from app.core.logging import get_logger

logger = get_logger("legal_json_loader")


class LegalJSONLoader:
    """Loads Legal vertical data from organized JSON files."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.base_path = Path(__file__).parent.parent / "verticals" / "legal"
    
    def load_json_file(self, file_path: Path) -> Dict[str, Any]:
        """Load and parse JSON file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load {file_path}: {str(e)}")
            return {}
    
    def load_all_json_files(self, directory: Path) -> List[Dict[str, Any]]:
        """Load all JSON files from a directory."""
        if not directory.exists():
            logger.warning(f"Directory does not exist: {directory}")
            return []
        
        data = []
        for file_path in directory.glob("*.json"):
            file_data = self.load_json_file(file_path)
            if file_data:
                data.append(file_data)
                logger.info(f"Loaded: {file_path.name}")
        
        return data
    
    async def seed_entities_from_json(self):
        """Load Legal entities from JSON files."""
        logger.info("📄 Loading Legal entities from JSON files...")
        
        entities_dir = self.base_path / "entities"
        entities_data = self.load_all_json_files(entities_dir)
        
        for entity_data in entities_data:
            if not entity_data:
                continue
                
            # Check if entity already exists
            existing = await self.session.execute(
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
            
            self.session.add(entity)
            await self.session.commit()
            await self.session.refresh(entity)
            
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
                self.session.add(field)
            
            await self.session.commit()
            logger.info(f"✅ Added Legal entity: {entity.display_label} with {len(entity_data['fields'])} fields")
    
    async def seed_business_rules_from_json(self):
        """Load Legal business rules from JSON files."""
        logger.info("⚖️ Loading Legal business rules from JSON files...")
        
        rules_dir = self.base_path / "business-rules"
        rules_data = self.load_all_json_files(rules_dir)
        
        for rule_data in rules_data:
            if not rule_data:
                continue
                
            # Check if rule already exists
            existing = await self.session.execute(
                select(BusinessRuleDefinition).where(
                    BusinessRuleDefinition.rule_name == rule_data["rule_name"]
                )
            )
            if existing.scalar_one_or_none():
                logger.info(f"⏭️ Business rule {rule_data['rule_name']} already exists")
                continue
                
            rule = BusinessRuleDefinition(
                rule_name=rule_data["rule_name"],
                rule_category=rule_data["rule_category"],
                entity_context=rule_data["entity_context"],
                priority=rule_data["priority"],
                condition_logic=rule_data["condition_logic"],
                action_definition=rule_data["action_definition"],
                context_filters=rule_data["context_filters"],
                rule_description=rule_data["rule_description"],
                is_active=rule_data["is_active"]
            )
            self.session.add(rule)
            logger.info(f"✅ Added Legal business rule: {rule.rule_name}")
        
        await self.session.commit()
    
    async def seed_workflows_from_json(self):
        """Load Legal workflows from JSON files."""
        logger.info("🔄 Loading Legal workflows from JSON files...")
        
        workflows_dir = self.base_path / "workflows"
        workflows_data = self.load_all_json_files(workflows_dir)
        
        for workflow_data in workflows_data:
            if not workflow_data:
                continue
                
            # Check if workflow already exists
            existing = await self.session.execute(
                select(ProcessConfigMaster).where(
                    ProcessConfigMaster.process_code == workflow_data["process_code"]
                )
            )
            if existing.scalar_one_or_none():
                logger.info(f"⏭️ Workflow {workflow_data['process_code']} already exists")
                continue
                
            workflow = ProcessConfigMaster(
                process_code=workflow_data["process_code"],
                process_name=workflow_data["process_name"],
                process_category=workflow_data["process_category"],
                description=workflow_data["description"],
                process_steps=workflow_data["process_steps"],
                trigger_conditions=workflow_data["trigger_conditions"],
                automation_level=workflow_data["automation_level"],
                approval_required=workflow_data["approval_required"],
                context_filters=workflow_data["context_filters"],
                is_active=workflow_data["is_active"]
            )
            self.session.add(workflow)
            logger.info(f"✅ Added Legal workflow: {workflow.process_name}")
        
        await self.session.commit()
    
    async def seed_pages_from_json(self):
        """Load Legal pages from JSON files."""
        logger.info("📄 Loading Legal pages from JSON files...")
        
        pages_dir = self.base_path / "pages"
        pages_data = self.load_all_json_files(pages_dir)
        
        for page_data in pages_data:
            if not page_data:
                continue
                
            # Check if page already exists
            existing = await self.session.execute(
                select(PageDefinition).where(
                    PageDefinition.page_name == page_data["page_name"]
                )
            )
            if existing.scalar_one_or_none():
                logger.info(f"⏭️ Page {page_data['page_name']} already exists")
                continue
                
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
                is_published=page_data["is_published"]
            )
            
            self.session.add(page)
            logger.info(f"✅ Added Legal page: {page.page_title}")
        
        await self.session.commit()
    
    async def seed_layouts_from_json(self):
        """Load Legal layouts from JSON files."""
        logger.info("🎨 Loading Legal layouts from JSON files...")
        
        layouts_dir = self.base_path / "layouts"
        layouts_data = self.load_all_json_files(layouts_dir)
        
        for layout_data in layouts_data:
            if not layout_data:
                continue
                
            # Check if layout already exists
            existing = await self.session.execute(
                select(LayoutDefinition).where(
                    LayoutDefinition.layout_name == layout_data["layout_name"]
                )
            )
            if existing.scalar_one_or_none():
                logger.info(f"⏭️ Layout {layout_data['layout_name']} already exists")
                continue
                
            layout = LayoutDefinition(
                layout_name=layout_data["layout_name"],
                layout_title=layout_data["layout_title"],
                layout_type=layout_data["layout_type"],
                vertical=layout_data["vertical"],
                layout_config=layout_data["layout_config"],
                responsive_config=layout_data.get("responsive_config"),
                is_published=layout_data["is_published"]
            )
            
            self.session.add(layout)
            logger.info(f"✅ Added Legal layout: {layout.layout_title}")
        
        await self.session.commit()
    
    async def seed_all_legal_data(self):
        """Load all Legal vertical data from JSON files."""
        logger.info("🏛️ Loading complete Legal vertical from JSON files...")
        
        try:
            await self.seed_entities_from_json()
            await self.seed_business_rules_from_json()
            await self.seed_workflows_from_json()
            await self.seed_pages_from_json()
            await self.seed_layouts_from_json()
            
            logger.info("🎉 Legal vertical loaded successfully from JSON files!")
            
        except Exception as e:
            logger.error(f"Failed to load Legal vertical: {str(e)}")
            await self.session.rollback()
            raise


async def seed_legal_from_json(session: AsyncSession):
    """Main function to seed Legal vertical from JSON files."""
    loader = LegalJSONLoader(session)
    await loader.seed_all_legal_data()