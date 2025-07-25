"""
Metadata-Driven Platform Engines

Core engines that power the metadata-driven platform:
- PageEngine: Serves PageDefinitions and page structure
- DataEngine: Manages EntityDefinitions and FieldDefinitions  
- ComponentEngine: Handles ComponentDefinitions catalog
- UIEngine: Manages LayoutDefinitions and form structure
- WorkflowEngine: Processes WorkflowDefinitions and automation
"""

from .page_engine import PageEngine
from .data_engine import DataEngine
from .component_engine import ComponentEngine

__all__ = [
    "PageEngine",
    "DataEngine", 
    "ComponentEngine"
] 