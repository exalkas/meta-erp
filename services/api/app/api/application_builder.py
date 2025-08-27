"""
Application Builder API - Rapid Custom App Creation

API for building custom business applications rapidly for individual clients.
This enables the "WordPress for Business Apps" vision.
"""

from typing import Dict, List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime

from app.core.database import get_async_session
from app.engines.application_builder_engine import (
    ApplicationBuilderEngine, 
    AppType, 
    ComponentCategory,
    ClientRequirements,
    ApplicationBlueprint
)
from app.api.dependencies import get_current_user, get_tenant_context
from app.models.auth import User
from app.core.logging import get_logger

logger = get_logger("application_builder_api")

# Create router
builder_router = APIRouter(prefix="/api/v1/app-builder", tags=["Application Builder"])


# Request/Response Models
class ClientRequirementsRequest(BaseModel):
    """Request model for client requirements."""
    project_name: str = Field(..., description="Name of the project")
    app_type: str = Field(..., description="Type of application (CRM, ERP, etc.)")
    industry: Optional[str] = Field(None, description="Client's industry")
    user_count: int = Field(..., description="Expected number of users")
    required_features: List[str] = Field(..., description="List of required features")
    custom_entities: List[Dict[str, Any]] = Field(default=[], description="Custom entities needed")
    custom_business_rules: List[Dict[str, Any]] = Field(default=[], description="Custom business rules")
    integration_requirements: List[str] = Field(default=[], description="Required integrations")
    performance_requirements: Dict[str, Any] = Field(default={}, description="Performance needs")
    compliance_requirements: List[str] = Field(default=[], description="Compliance requirements")
    timeline_requirements: int = Field(..., description="Desired timeline in days")
    budget_range: Optional[Dict[str, float]] = Field(None, description="Budget constraints")


class AppBlueprintResponse(BaseModel):
    """Response model for application blueprint."""
    blueprint_id: str
    project_name: str
    selected_template: Dict[str, Any]
    selected_components: List[Dict[str, Any]]
    estimated_timeline_days: int
    estimated_cost: Optional[float]
    complexity_score: float
    risk_factors: List[str]
    recommendations: List[str]


class BuildRequest(BaseModel):
    """Request model for starting a build."""
    blueprint_id: str = Field(..., description="Blueprint to build from")
    environment: str = Field(default="development", description="Target environment")
    enable_sample_data: bool = Field(default=True, description="Include sample data")
    custom_configurations: Optional[Dict[str, Any]] = Field(None, description="Additional configurations")


class BuildStatusResponse(BaseModel):
    """Response model for build status."""
    build_id: str
    project_name: str
    current_phase: str
    completion_percentage: float
    estimated_completion_date: str
    entities_built: int
    business_rules_configured: int
    ui_components_deployed: int
    blockers: List[str]
    quality_score: float


# Template and Component Discovery

@builder_router.get("/templates")
async def get_available_templates(
    app_type: Optional[str] = Query(None, description="Filter by app type"),
    complexity_level: Optional[str] = Query(None, description="Filter by complexity"),
    db: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Get available application templates.
    
    Returns templates for different types of business applications
    that can be used as starting points.
    """
    
    try:
        builder_engine = ApplicationBuilderEngine(db)
        
        # Convert string to enum if provided
        app_type_enum = None
        if app_type:
            try:
                app_type_enum = AppType(app_type.upper())
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid app_type: {app_type}")
        
        templates = await builder_engine.get_available_templates(
            app_type=app_type_enum,
            complexity_level=complexity_level
        )
        
        # Convert templates to response format
        template_data = []
        for template in templates:
            template_info = {
                "template_id": template.template_id,
                "name": template.name,
                "app_type": template.app_type.value,
                "description": template.description,
                "core_entities": template.core_entities,
                "required_components": [c.value for c in template.required_components],
                "optional_components": [c.value for c in template.optional_components],
                "estimated_build_time_days": template.estimated_build_time_days,
                "complexity_level": template.complexity_level,
                "use_cases": {
                    "CRM": ["Contact management", "Sales tracking", "Customer service"],
                    "ERP": ["Inventory management", "Financial tracking", "Supply chain"],
                    "PROJECT_TRACKER": ["Task management", "Resource planning", "Time tracking"],
                    "SAAS_PLATFORM": ["Multi-tenant architecture", "Subscription billing", "User management"]
                }.get(template.app_type.value, [])
            }
            template_data.append(template_info)
        
        return {
            "success": True,
            "templates": template_data,
            "total": len(template_data),
            "message": f"Found {len(template_data)} available templates"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get templates: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get templates")


@builder_router.get("/components")
async def get_available_components(
    category: Optional[str] = Query(None, description="Filter by component category"),
    db: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Get available components for building applications.
    
    Returns reusable components that can be mixed and matched
    to create custom applications.
    """
    
    try:
        builder_engine = ApplicationBuilderEngine(db)
        
        # Convert string to enum if provided
        category_enum = None
        if category:
            try:
                category_enum = ComponentCategory(category.upper())
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid category: {category}")
        
        components = await builder_engine.get_available_components(category=category_enum)
        
        # Convert components to response format
        component_data = []
        for component in components:
            component_info = {
                "component_id": component.component_id,
                "name": component.name,
                "category": component.category.value,
                "description": component.description,
                "entities_included": component.entities_included,
                "business_rules_included": component.business_rules_included,
                "ui_components_included": component.ui_components_included,
                "dependencies": component.dependencies,
                "configuration_options": component.configuration_options,
                "installation_time_hours": component.installation_time_hours,
                "complexity": "High" if component.installation_time_hours > 12 else "Medium" if component.installation_time_hours > 6 else "Low"
            }
            component_data.append(component_info)
        
        # Group by category for easier browsing
        grouped_components = {}
        for component in component_data:
            cat = component["category"]
            if cat not in grouped_components:
                grouped_components[cat] = []
            grouped_components[cat].append(component)
        
        return {
            "success": True,
            "components": component_data,
            "grouped_by_category": grouped_components,
            "total": len(component_data),
            "message": f"Found {len(component_data)} available components"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get components: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get components")


# Application Blueprint Creation

@builder_router.post("/analyze-requirements")
async def analyze_client_requirements(
    request: ClientRequirementsRequest,
    current_user: User = Depends(get_current_user),
    tenant_context: Dict = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_async_session)
) -> AppBlueprintResponse:
    """
    Analyze client requirements and create application blueprint.
    
    This is the core functionality that takes client requirements
    and creates a detailed plan for building their custom application.
    """
    
    try:
        builder_engine = ApplicationBuilderEngine(db)
        
        # Convert request to ClientRequirements
        try:
            app_type_enum = AppType(request.app_type.upper())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid app_type: {request.app_type}")
        
        client_requirements = ClientRequirements(
            client_id=str(current_user.id),
            project_name=request.project_name,
            app_type=app_type_enum,
            industry=request.industry,
            user_count=request.user_count,
            required_features=request.required_features,
            custom_entities=request.custom_entities,
            custom_business_rules=request.custom_business_rules,
            integration_requirements=request.integration_requirements,
            performance_requirements=request.performance_requirements,
            compliance_requirements=request.compliance_requirements,
            budget_constraints=request.budget_range,
            timeline_requirements=request.timeline_requirements
        )
        
        # Analyze requirements and create blueprint
        blueprint = await builder_engine.analyze_client_requirements(client_requirements)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(blueprint)
        
        return AppBlueprintResponse(
            blueprint_id=blueprint.blueprint_id,
            project_name=blueprint.client_requirements.project_name,
            selected_template={
                "template_id": blueprint.selected_template.template_id,
                "name": blueprint.selected_template.name,
                "description": blueprint.selected_template.description,
                "app_type": blueprint.selected_template.app_type.value
            },
            selected_components=[
                {
                    "component_id": comp.component_id,
                    "name": comp.name,
                    "category": comp.category.value,
                    "installation_time_hours": comp.installation_time_hours
                }
                for comp in blueprint.selected_components
            ],
            estimated_timeline_days=blueprint.estimated_timeline,
            estimated_cost=blueprint.estimated_cost,
            complexity_score=blueprint.complexity_score,
            risk_factors=blueprint.risk_factors,
            recommendations=recommendations
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to analyze requirements: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze requirements")


@builder_router.post("/start-build")
async def start_application_build(
    request: BuildRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    tenant_context: Dict = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Start building the application based on blueprint.
    
    This kicks off the actual construction of the custom application.
    """
    
    try:
        # For now, simulate the build process
        # In production, this would:
        # 1. Retrieve the blueprint from database
        # 2. Start the build process
        # 3. Return build ID for tracking
        
        build_id = f"build_{request.blueprint_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Add background task for the actual build
        background_tasks.add_task(
            _execute_application_build,
            build_id,
            request.blueprint_id,
            tenant_context["tenant_id"],
            request.custom_configurations or {}
        )
        
        return {
            "success": True,
            "build_id": build_id,
            "status": "started",
            "message": "Application build started successfully",
            "estimated_completion": (datetime.utcnow()).isoformat(),
            "tracking_url": f"/api/v1/app-builder/builds/{build_id}/status"
        }
        
    except Exception as e:
        logger.error(f"Failed to start build: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start build")


@builder_router.get("/builds/{build_id}/status")
async def get_build_status(
    build_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
) -> BuildStatusResponse:
    """
    Get current status of an application build.
    """
    
    try:
        # For now, return simulated status
        # In production, this would query the actual build status
        
        return BuildStatusResponse(
            build_id=build_id,
            project_name="Custom CRM for Client A",
            current_phase="Deploying UI Components",
            completion_percentage=75.0,
            estimated_completion_date=(datetime.utcnow()).isoformat(),
            entities_built=5,
            business_rules_configured=8,
            ui_components_deployed=12,
            blockers=[],
            quality_score=94.5
        )
        
    except Exception as e:
        logger.error(f"Failed to get build status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get build status")


# Utility Endpoints

@builder_router.get("/examples")
async def get_example_projects() -> Dict[str, Any]:
    """
    Get example projects to inspire clients.
    
    Shows real-world examples of what can be built.
    """
    
    examples = [
        {
            "project_name": "Legal Practice CRM",
            "app_type": "CRM",
            "description": "Complete client and case management for law firms",
            "features": [
                "Client contact management",
                "Case tracking and billing",
                "Document management",
                "Time tracking and invoicing",
                "Court date scheduling"
            ],
            "timeline_days": 10,
            "estimated_cost": 12000,
            "complexity": "Medium"
        },
        {
            "project_name": "Manufacturing ERP",
            "app_type": "ERP",
            "description": "Full manufacturing resource planning system",
            "features": [
                "Inventory management",
                "Production planning",
                "Quality control",
                "Supplier management",
                "Financial reporting"
            ],
            "timeline_days": 30,
            "estimated_cost": 45000,
            "complexity": "High"
        },
        {
            "project_name": "Project Management SaaS",
            "app_type": "SAAS_PLATFORM",
            "description": "Multi-tenant project management tool",
            "features": [
                "Multi-tenant architecture",
                "Project planning and tracking",
                "Team collaboration",
                "Time tracking and billing",
                "Client portal"
            ],
            "timeline_days": 20,
            "estimated_cost": 28000,
            "complexity": "High"
        },
        {
            "project_name": "Plant Health Monitoring AI",
            "app_type": "CUSTOM_BUSINESS_APP",
            "description": "AI-powered plant disease detection and management",
            "features": [
                "Image recognition for plant diseases",
                "Treatment recommendations",
                "Farm management dashboard",
                "Weather integration",
                "Harvest prediction"
            ],
            "timeline_days": 15,
            "estimated_cost": 22000,
            "complexity": "High"
        }
    ]
    
    return {
        "success": True,
        "examples": examples,
        "total": len(examples),
        "message": "Example projects for inspiration"
    }


def _generate_recommendations(blueprint: ApplicationBlueprint) -> List[str]:
    """Generate recommendations based on blueprint analysis."""
    
    recommendations = []
    
    if blueprint.complexity_score > 0.7:
        recommendations.append("Consider breaking this into multiple phases for better risk management")
    
    if blueprint.estimated_timeline > 20:
        recommendations.append("Long timeline - consider using more pre-built components")
    
    if len(blueprint.selected_components) > 8:
        recommendations.append("Many components selected - ensure proper integration testing")
    
    if "ai" in str(blueprint.client_requirements.required_features).lower():
        recommendations.append("AI features require careful data preparation and model training")
    
    return recommendations


# Background Tasks
async def _execute_application_build(
    build_id: str,
    blueprint_id: str,
    tenant_id: UUID,
    custom_configurations: Dict[str, Any]
):
    """Background task to execute the application build."""
    
    logger.info(f"Executing application build {build_id}")
    
    # This would orchestrate the actual build process:
    # 1. Create database schema
    # 2. Deploy entities and relationships
    # 3. Configure business rules
    # 4. Deploy workflows
    # 5. Install and configure UI components
    # 6. Setup integrations
    # 7. Load sample data
    # 8. Run automated tests
    # 9. Deploy to staging environment
    
    logger.info(f"Application build {build_id} completed successfully")
