"""
Metadata-Driven Platform Engines

Core engines that power the metadata-driven platform:
- PageEngine: Serves PageDefinitions and page structure
- DataEngine: Manages EntityDefinitions and FieldDefinitions  
- ComponentEngine: Handles ComponentDefinitions catalog
- BusinessRuleEngine: SAP-style configurable business rule execution
- ConfigurationEngine: Business configuration management
- UIEngine: Manages LayoutDefinitions and form structure
- WorkflowEngine: Processes WorkflowDefinitions and automation
"""

from .page_engine import PageEngine
from .data_engine import DataEngine
from .component_engine import ComponentEngine
from .business_rule_engine import BusinessRuleEngine, ConfigurationEngine
from .vertical_deployment_engine import VerticalDeploymentEngine
from .workflow_trigger_engine import WorkflowTriggerEngine
from .application_builder_engine import ApplicationBuilderEngine

__all__ = [
    "PageEngine",
    "DataEngine", 
    "ComponentEngine",
    "BusinessRuleEngine",
    "ConfigurationEngine",
    "VerticalDeploymentEngine",
    "WorkflowTriggerEngine",
    "ApplicationBuilderEngine"
] 