"""System information API endpoints."""

from fastapi import APIRouter
from typing import Dict, Any

from app.core.version import get_version_info, format_version_string

router = APIRouter(prefix="/system", tags=["system"])

@router.get("/version")
async def get_version() -> Dict[str, Any]:
    """Get system version information."""
    return get_version_info()

@router.get("/version/string")
async def get_version_string() -> Dict[str, str]:
    """Get formatted version string."""
    version_info = get_version_info()
    return {
        "version": format_version_string(version_info),
        "full_version": version_info.get("version", "1.0.0")
    }

@router.get("/health")
async def health_check() -> Dict[str, str]:
    """Basic health check endpoint."""
    return {"status": "healthy", "service": "metadata-erp-api"}
