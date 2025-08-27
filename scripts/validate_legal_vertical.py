#!/usr/bin/env python3
"""
Legal Vertical Validation & Testing Script

Comprehensive validation and testing of the Legal Practice CRM + ERP vertical
to ensure the SAP-style platform works correctly.
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime, date
import uuid

# Add the services/api directory to the path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / "services" / "api"))

from app.core.database import init_database, AsyncSessionLocal
from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.metadata import EntityDefinition, FieldDefinition, PageDefinition, LayoutDefinition
from app.models.business_config import BusinessRuleDefinition, ProcessConfigMaster
from app.models.vertical_config import VerticalDefinition, VerticalTemplate
from app.engines.data_engine import DataEngine
from app.engines.business_rule_engine import BusinessRuleEngine
from app.engines.vertical_deployment_engine import VerticalDeploymentEngine

logger = get_logger("legal_vertical_validator")


class LegalVerticalValidator:
    """
    Comprehensive validator for Legal vertical implementation.
    
    Tests:
    - Entity metadata configuration
    - Business rules execution
    - Workflow processing
    - Page definitions
    - API endpoints
    - Data integrity
    - Performance metrics
    """

    def __init__(self):
        self.db_session = None
        self.data_engine = None
        self.business_rule_engine = None
        self.deployment_engine = None
        self.validation_results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "errors": [],
            "warnings": [],
            "performance_metrics": {}
        }

    async def initialize(self):
        """Initialize database connection and engines."""
        logger.info("🔧 Initializing Legal vertical validator...")
        
        # Initialize database
        await init_database()
        self.db_session = AsyncSessionLocal()
        
        # Initialize engines
        self.data_engine = DataEngine(self.db_session)
        self.business_rule_engine = BusinessRuleEngine(self.db_session)
        self.deployment_engine = VerticalDeploymentEngine(self.db_session)
        
        logger.info("✅ Validator initialized successfully")

    async def cleanup(self):
        """Clean up resources."""
        if self.db_session:
            await self.db_session.close()

    def add_test_result(self, test_name: str, passed: bool, message: str = "", error: str = ""):
        """Add test result to validation results."""
        self.validation_results["total_tests"] += 1
        
        if passed:
            self.validation_results["passed"] += 1
            logger.info(f"✅ {test_name}: {message}")
        else:
            self.validation_results["failed"] += 1
            self.validation_results["errors"].append(f"{test_name}: {error}")
            logger.error(f"❌ {test_name}: {error}")

    async def test_entity_definitions(self) -> bool:
        """Test Legal entity definitions are properly configured."""
        logger.info("📊 Testing Legal entity definitions...")
        
        try:
            from sqlalchemy import select
            
            # Test that all Legal entities exist
            expected_entities = ["Client", "Matter", "TimeEntry", "Document", "Invoice"]
            
            for entity_name in expected_entities:
                result = await self.db_session.execute(
                    select(EntityDefinition).where(
                        EntityDefinition.entity_name == entity_name,
                        EntityDefinition.vertical == "LEGAL"
                    )
                )
                entity = result.scalar_one_or_none()
                
                if not entity:
                    self.add_test_result(
                        f"Entity {entity_name}",
                        False,
                        error=f"Entity {entity_name} not found in database"
                    )
                    continue
                
                # Test entity has required fields
                if not entity.fields or len(entity.fields) == 0:
                    self.add_test_result(
                        f"Entity {entity_name} fields",
                        False,
                        error=f"Entity {entity_name} has no field definitions"
                    )
                    continue
                
                # Test business rules are configured
                if not entity.business_rules:
                    self.validation_results["warnings"].append(
                        f"Entity {entity_name} has no business rules configured"
                    )
                
                self.add_test_result(
                    f"Entity {entity_name}",
                    True,
                    message=f"Entity configured with {len(entity.fields)} fields"
                )
            
            return True
            
        except Exception as e:
            self.add_test_result(
                "Entity definitions test",
                False,
                error=f"Failed to test entity definitions: {str(e)}"
            )
            return False

    async def test_business_rules(self) -> bool:
        """Test Legal business rules are properly configured and executable."""
        logger.info("⚖️ Testing Legal business rules...")
        
        try:
            from sqlalchemy import select
            
            # Test that Legal business rules exist
            expected_rules = [
                "client_conflict_check",
                "matter_budget_tracking", 
                "billing_rate_validation",
                "document_privilege_protection",
                "statute_limitations_monitoring"
            ]
            
            for rule_name in expected_rules:
                result = await self.db_session.execute(
                    select(BusinessRuleDefinition).where(
                        BusinessRuleDefinition.rule_name == rule_name
                    )
                )
                rule = result.scalar_one_or_none()
                
                if not rule:
                    self.add_test_result(
                        f"Business rule {rule_name}",
                        False,
                        error=f"Business rule {rule_name} not found"
                    )
                    continue
                
                # Test rule has valid configuration
                if not rule.condition_logic or not rule.action_definition:
                    self.add_test_result(
                        f"Business rule {rule_name} config",
                        False,
                        error=f"Business rule {rule_name} missing condition or action"
                    )
                    continue
                
                # Test rule execution (with dummy data)
                try:
                    test_context = {
                        "entity_name": rule.entity_context,
                        "test_mode": True
                    }
                    
                    # This would test the rule execution without side effects
                    execution_valid = await self.business_rule_engine.validate_rule_syntax(
                        rule_name=rule_name,
                        test_context=test_context
                    )
                    
                    if execution_valid:
                        self.add_test_result(
                            f"Business rule {rule_name}",
                            True,
                            message="Rule configuration valid"
                        )
                    else:
                        self.add_test_result(
                            f"Business rule {rule_name} execution",
                            False,
                            error="Rule execution validation failed"
                        )
                        
                except Exception as e:
                    self.add_test_result(
                        f"Business rule {rule_name} execution test",
                        False,
                        error=f"Rule execution test failed: {str(e)}"
                    )
            
            return True
            
        except Exception as e:
            self.add_test_result(
                "Business rules test",
                False,
                error=f"Failed to test business rules: {str(e)}"
            )
            return False

    async def test_workflows(self) -> bool:
        """Test Legal workflows are properly configured."""
        logger.info("🔄 Testing Legal workflows...")
        
        try:
            from sqlalchemy import select
            
            # Test that Legal workflows exist
            expected_workflows = [
                "CLIENT_INTAKE",
                "MATTER_LIFECYCLE",
                "TIME_BILLING"
            ]
            
            for workflow_code in expected_workflows:
                result = await self.db_session.execute(
                    select(ProcessConfigMaster).where(
                        ProcessConfigMaster.process_code == workflow_code
                    )
                )
                workflow = result.scalar_one_or_none()
                
                if not workflow:
                    self.add_test_result(
                        f"Workflow {workflow_code}",
                        False,
                        error=f"Workflow {workflow_code} not found"
                    )
                    continue
                
                # Test workflow has steps
                if not workflow.process_steps or not workflow.process_steps.get("steps"):
                    self.add_test_result(
                        f"Workflow {workflow_code} steps",
                        False,
                        error=f"Workflow {workflow_code} has no steps defined"
                    )
                    continue
                
                steps = workflow.process_steps["steps"]
                step_count = len(steps)
                
                # Test step ordering
                step_orders = [step.get("step_order", 0) for step in steps]
                if len(set(step_orders)) != len(step_orders):
                    self.add_test_result(
                        f"Workflow {workflow_code} step ordering",
                        False,
                        error="Duplicate step orders found"
                    )
                    continue
                
                self.add_test_result(
                    f"Workflow {workflow_code}",
                    True,
                    message=f"Workflow configured with {step_count} steps"
                )
            
            return True
            
        except Exception as e:
            self.add_test_result(
                "Workflows test",
                False,
                error=f"Failed to test workflows: {str(e)}"
            )
            return False

    async def test_page_definitions(self) -> bool:
        """Test Legal page definitions are properly configured."""
        logger.info("📄 Testing Legal page definitions...")
        
        try:
            from sqlalchemy import select
            
            # Test that Legal pages exist
            expected_pages = [
                "dashboard",
                "clients_list",
                "client_detail",
                "client_form",
                "matters_list",
                "time_entries_list"
            ]
            
            for page_name in expected_pages:
                result = await self.db_session.execute(
                    select(PageDefinition).where(
                        PageDefinition.page_name == page_name,
                        PageDefinition.vertical == "LEGAL"
                    )
                )
                page = result.scalar_one_or_none()
                
                if not page:
                    self.add_test_result(
                        f"Page {page_name}",
                        False,
                        error=f"Page {page_name} not found"
                    )
                    continue
                
                # Test page has valid configuration
                if not page.page_config:
                    self.add_test_result(
                        f"Page {page_name} config",
                        False,
                        error=f"Page {page_name} has no configuration"
                    )
                    continue
                
                # Test page has valid route
                if not page.route_path:
                    self.add_test_result(
                        f"Page {page_name} route",
                        False,
                        error=f"Page {page_name} has no route path"
                    )
                    continue
                
                self.add_test_result(
                    f"Page {page_name}",
                    True,
                    message=f"Page configured for route {page.route_path}"
                )
            
            return True
            
        except Exception as e:
            self.add_test_result(
                "Page definitions test",
                False,
                error=f"Failed to test page definitions: {str(e)}"
            )
            return False

    async def test_vertical_deployment(self) -> bool:
        """Test vertical deployment engine functionality."""
        logger.info("🚀 Testing vertical deployment engine...")
        
        try:
            from sqlalchemy import select
            
            # Test that Legal vertical template exists
            result = await self.db_session.execute(
                select(VerticalTemplate).where(
                    VerticalTemplate.template_name.like("%Legal%")
                )
            )
            template = result.scalar_one_or_none()
            
            if not template:
                self.add_test_result(
                    "Vertical template",
                    False,
                    error="No Legal vertical template found"
                )
                return False
            
            # Test deployment engine initialization
            if not self.deployment_engine:
                self.add_test_result(
                    "Deployment engine",
                    False,
                    error="Deployment engine not initialized"
                )
                return False
            
            # Test template validation (dry run)
            try:
                template_valid = template.entity_configurations is not None
                if template_valid:
                    self.add_test_result(
                        "Template validation",
                        True,
                        message="Template has valid entity configurations"
                    )
                else:
                    self.add_test_result(
                        "Template validation",
                        False,
                        error="Template missing entity configurations"
                    )
            except Exception as e:
                self.add_test_result(
                    "Template validation",
                    False,
                    error=f"Template validation failed: {str(e)}"
                )
            
            return True
            
        except Exception as e:
            self.add_test_result(
                "Vertical deployment test",
                False,
                error=f"Failed to test vertical deployment: {str(e)}"
            )
            return False

    async def test_data_integrity(self) -> bool:
        """Test data integrity and relationships."""
        logger.info("🔗 Testing data integrity...")
        
        try:
            from sqlalchemy import select, func
            
            # Test entity-field relationships
            result = await self.db_session.execute(
                select(func.count(FieldDefinition.id)).where(
                    FieldDefinition.entity_id.in_(
                        select(EntityDefinition.id).where(
                            EntityDefinition.vertical == "LEGAL"
                        )
                    )
                )
            )
            field_count = result.scalar()
            
            if field_count == 0:
                self.add_test_result(
                    "Entity-field relationships",
                    False,
                    error="No fields found for Legal entities"
                )
                return False
            
            self.add_test_result(
                "Entity-field relationships",
                True,
                message=f"Found {field_count} fields across Legal entities"
            )
            
            # Test foreign key field configurations
            result = await self.db_session.execute(
                select(FieldDefinition).where(
                    FieldDefinition.data_type == "foreign_key",
                    FieldDefinition.entity_id.in_(
                        select(EntityDefinition.id).where(
                            EntityDefinition.vertical == "LEGAL"
                        )
                    )
                )
            )
            fk_fields = result.scalars().all()
            
            for fk_field in fk_fields:
                if not fk_field.related_entity:
                    self.add_test_result(
                        f"Foreign key {fk_field.field_name}",
                        False,
                        error=f"Foreign key field {fk_field.field_name} missing related_entity"
                    )
                else:
                    self.add_test_result(
                        f"Foreign key {fk_field.field_name}",
                        True,
                        message=f"References {fk_field.related_entity}"
                    )
            
            return True
            
        except Exception as e:
            self.add_test_result(
                "Data integrity test",
                False,
                error=f"Failed to test data integrity: {str(e)}"
            )
            return False

    async def test_json_data_loading(self) -> bool:
        """Test JSON data files can be loaded correctly."""
        logger.info("📄 Testing JSON data loading...")
        
        try:
            json_base_path = project_root / "data" / "verticals" / "legal"
            
            # Test each JSON directory
            test_dirs = ["entities", "business-rules", "workflows", "pages", "layouts"]
            
            for dir_name in test_dirs:
                dir_path = json_base_path / dir_name
                
                if not dir_path.exists():
                    self.add_test_result(
                        f"JSON directory {dir_name}",
                        False,
                        error=f"Directory {dir_path} does not exist"
                    )
                    continue
                
                json_files = list(dir_path.glob("*.json"))
                if len(json_files) == 0:
                    self.add_test_result(
                        f"JSON files in {dir_name}",
                        False,
                        error=f"No JSON files found in {dir_path}"
                    )
                    continue
                
                # Test each JSON file can be parsed
                valid_files = 0
                for json_file in json_files:
                    try:
                        with open(json_file, 'r', encoding='utf-8') as f:
                            json.load(f)
                        valid_files += 1
                    except Exception as e:
                        self.add_test_result(
                            f"JSON file {json_file.name}",
                            False,
                            error=f"Invalid JSON: {str(e)}"
                        )
                
                if valid_files == len(json_files):
                    self.add_test_result(
                        f"JSON directory {dir_name}",
                        True,
                        message=f"All {valid_files} JSON files valid"
                    )
                else:
                    self.add_test_result(
                        f"JSON directory {dir_name}",
                        False,
                        error=f"Only {valid_files}/{len(json_files)} files valid"
                    )
            
            return True
            
        except Exception as e:
            self.add_test_result(
                "JSON data loading test",
                False,
                error=f"Failed to test JSON loading: {str(e)}"
            )
            return False

    async def test_performance_metrics(self) -> bool:
        """Test basic performance metrics."""
        logger.info("⚡ Testing performance metrics...")
        
        try:
            start_time = datetime.now()
            
            # Test database query performance
            from sqlalchemy import select
            
            query_start = datetime.now()
            result = await self.db_session.execute(
                select(EntityDefinition).where(
                    EntityDefinition.vertical == "LEGAL"
                )
            )
            entities = result.scalars().all()
            query_time = (datetime.now() - query_start).total_seconds()
            
            self.validation_results["performance_metrics"]["entity_query_time"] = query_time
            
            if query_time > 1.0:  # > 1 second is slow
                self.validation_results["warnings"].append(
                    f"Entity query took {query_time:.2f}s (slow)"
                )
            
            # Test JSON loading performance
            json_start = datetime.now()
            json_base_path = project_root / "data" / "verticals" / "legal"
            
            total_files = 0
            for dir_path in json_base_path.glob("*/"):
                if dir_path.is_dir():
                    total_files += len(list(dir_path.glob("*.json")))
            
            json_time = (datetime.now() - json_start).total_seconds()
            self.validation_results["performance_metrics"]["json_scan_time"] = json_time
            self.validation_results["performance_metrics"]["total_json_files"] = total_files
            
            total_time = (datetime.now() - start_time).total_seconds()
            self.validation_results["performance_metrics"]["total_validation_time"] = total_time
            
            self.add_test_result(
                "Performance metrics",
                True,
                message=f"Entity query: {query_time:.3f}s, JSON scan: {json_time:.3f}s"
            )
            
            return True
            
        except Exception as e:
            self.add_test_result(
                "Performance metrics test",
                False,
                error=f"Failed to collect performance metrics: {str(e)}"
            )
            return False

    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all validation tests."""
        logger.info("🚀 Starting Legal vertical validation...")
        
        start_time = datetime.now()
        
        try:
            await self.initialize()
            
            # Run all test suites
            test_suites = [
                ("JSON Data Loading", self.test_json_data_loading),
                ("Entity Definitions", self.test_entity_definitions),
                ("Business Rules", self.test_business_rules),
                ("Workflows", self.test_workflows),
                ("Page Definitions", self.test_page_definitions),
                ("Data Integrity", self.test_data_integrity),
                ("Vertical Deployment", self.test_vertical_deployment),
                ("Performance Metrics", self.test_performance_metrics),
            ]
            
            for suite_name, test_func in test_suites:
                logger.info(f"🧪 Running {suite_name} tests...")
                try:
                    await test_func()
                except Exception as e:
                    self.add_test_result(
                        f"{suite_name} test suite",
                        False,
                        error=f"Test suite failed: {str(e)}"
                    )
            
            # Calculate final metrics
            total_time = (datetime.now() - start_time).total_seconds()
            self.validation_results["total_validation_time"] = total_time
            
            success_rate = (
                self.validation_results["passed"] / 
                max(self.validation_results["total_tests"], 1)
            ) * 100
            
            self.validation_results["success_rate"] = success_rate
            
            # Log summary
            logger.info("📊 Validation Summary:")
            logger.info(f"  Total Tests: {self.validation_results['total_tests']}")
            logger.info(f"  Passed: {self.validation_results['passed']}")
            logger.info(f"  Failed: {self.validation_results['failed']}")
            logger.info(f"  Success Rate: {success_rate:.1f}%")
            logger.info(f"  Warnings: {len(self.validation_results['warnings'])}")
            logger.info(f"  Total Time: {total_time:.2f}s")
            
            if self.validation_results["failed"] > 0:
                logger.error("❌ Some tests failed:")
                for error in self.validation_results["errors"]:
                    logger.error(f"  - {error}")
            
            if self.validation_results["warnings"]:
                logger.warning("⚠️ Warnings:")
                for warning in self.validation_results["warnings"]:
                    logger.warning(f"  - {warning}")
            
            if success_rate >= 95:
                logger.info("🎉 Legal vertical validation PASSED!")
            elif success_rate >= 80:
                logger.warning("⚠️ Legal vertical validation passed with warnings")
            else:
                logger.error("❌ Legal vertical validation FAILED!")
            
            return self.validation_results
            
        finally:
            await self.cleanup()

    def generate_report(self) -> str:
        """Generate a detailed validation report."""
        report = []
        report.append("# Legal Vertical Validation Report")
        report.append(f"Generated: {datetime.now().isoformat()}")
        report.append("")
        
        # Summary
        report.append("## Summary")
        report.append(f"- **Total Tests**: {self.validation_results['total_tests']}")
        report.append(f"- **Passed**: {self.validation_results['passed']}")
        report.append(f"- **Failed**: {self.validation_results['failed']}")
        report.append(f"- **Success Rate**: {self.validation_results.get('success_rate', 0):.1f}%")
        report.append(f"- **Warnings**: {len(self.validation_results['warnings'])}")
        report.append("")
        
        # Performance Metrics
        if self.validation_results["performance_metrics"]:
            report.append("## Performance Metrics")
            for metric, value in self.validation_results["performance_metrics"].items():
                if isinstance(value, float):
                    report.append(f"- **{metric.replace('_', ' ').title()}**: {value:.3f}s")
                else:
                    report.append(f"- **{metric.replace('_', ' ').title()}**: {value}")
            report.append("")
        
        # Errors
        if self.validation_results["errors"]:
            report.append("## Errors")
            for error in self.validation_results["errors"]:
                report.append(f"- ❌ {error}")
            report.append("")
        
        # Warnings
        if self.validation_results["warnings"]:
            report.append("## Warnings")
            for warning in self.validation_results["warnings"]:
                report.append(f"- ⚠️ {warning}")
            report.append("")
        
        return "\n".join(report)


async def main():
    """Main validation function."""
    validator = LegalVerticalValidator()
    
    try:
        results = await validator.run_all_tests()
        
        # Generate and save report
        report = validator.generate_report()
        report_path = project_root / "validation_report.md"
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        logger.info(f"📄 Validation report saved to: {report_path}")
        
        # Exit with appropriate code
        if results.get("success_rate", 0) >= 95:
            sys.exit(0)  # Success
        else:
            sys.exit(1)  # Failure
            
    except Exception as e:
        logger.error(f"❌ Validation failed with exception: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())