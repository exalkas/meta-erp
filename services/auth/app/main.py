"""
SAP-Style Authentication Service

True SAP approach with:
- All logic in customizing tables (IMG-style configuration)
- Transport system for config migration
- Business Object Repository (BOR) style entities
- Industry Solution (IS-*) packages
- No hardcoded business rules
"""

import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, Any

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


from app.core.database import create_tables, check_db_connection
from app.core.logging import setup_logging, get_logger
from app.core.exceptions import (
    AuthenticationException,
    auth_exception_handler,
    general_exception_handler
)
from app.api.auth_routes import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    
    # Setup logging first
    setup_logging()
    logger = get_logger("sap_auth_startup")
    
    # Startup
    logger.info("Starting SAP-Style Authentication Service...")
    
    # Check database connection
    if not await check_db_connection():
        logger.critical("Database connection failed!")
        raise Exception("Database connection failed")
    logger.info("Database connection successful")
    
    # Create customizing tables
    await create_tables()
    logger.info("SAP-style customizing tables initialized")
    
    yield
    
    # Shutdown
    logger.info("SAP-Style Authentication Service shutdown complete")

app = FastAPI(
    title="SAP-Style Authentication Service",
    description="""
    True SAP-style authentication with:
    
    ## SAP Architecture Features
    
    * **IMG Configuration**: Hierarchical Implementation Guide structure
    * **Customizing Tables**: All logic in configuration tables (no hardcoded rules)
    * **Transport System**: Move configurations between DEV → QAS → PRD
    * **Business Object Repository**: Entities defined in metadata
    * **Industry Solutions**: IS-FINTECH, IS-ECOMMERCE, IS-OILGAS packages
    * **Business Rules Framework**: Decision tables and rule evaluation engine
    
    ## True SAP Benefits
    
    * **Zero Code Changes**: All authentication logic configurable via customizing
    * **Transport-Ready**: Configuration changes via transport requests
    * **Industry Packs**: Pre-built authentication for specific industries
    * **Rule-Based**: Decision tables instead of hardcoded business logic
    * **IMG Structure**: Hierarchical configuration like SAP Implementation Guide
    
    ## Customizing Tables (T-* Tables)
    
    * `T_AUTH_METHOD_CONFIG` - Authentication method configuration
    * `T_AUTH_SESSION_CONFIG` - Session management rules
    * `T_AUTH_RULE_CONFIG` - Business rules and decision tables
    * `T_AUTH_COMPLIANCE_CONFIG` - Industry-specific compliance rules
    * `T_AUTH_TRANSPORT_REQUEST` - Transport system for configurations
    """,
    version="1.5.0-SAP",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error handlers
app.add_exception_handler(AuthenticationException, auth_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Include authentication routes
app.include_router(auth_router)

@app.get("/")
async def root():
    """Root endpoint with SAP-style service information"""
    return {
        "service": "SAP-Style Authentication Service",
        "version": "1.5.0-SAP",
        "architecture": "SAP-style with customizing tables",
        "features": [
            "IMG Configuration Structure",
            "Customizing Tables (T_AUTH_*)",
            "Transport System",
            "Business Object Repository",
            "Industry Solution Packages",
            "Rule-Based Configuration"
        ],
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "documentation": "/docs"
    } 