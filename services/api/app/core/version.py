"""Version management utilities for the API service."""

import json
import os
from pathlib import Path
from typing import Dict, Any

def get_version_info() -> Dict[str, Any]:
    """Get version information from package.json and system info."""
    try:
        # Navigate to project root from services/api
        project_root = Path(__file__).parent.parent.parent.parent
        package_json_path = project_root / "package.json"
        
        version_info = {
            "version": "1.0.0",  # fallback
            "name": "metadata-erp",
            "api_service": "running",
            "build_date": None,
            "git_commit": None
        }
        
        # Read version from package.json
        if package_json_path.exists():
            with open(package_json_path, "r", encoding="utf-8") as f:
                package_data = json.load(f)
                version_info["version"] = package_data.get("version", "1.0.0")
                version_info["name"] = package_data.get("name", "metadata-erp")
        
        # Try to get git commit hash if available
        try:
            git_dir = project_root / ".git"
            if git_dir.exists():
                head_file = git_dir / "HEAD"
                if head_file.exists():
                    with open(head_file, "r") as f:
                        head_content = f.read().strip()
                        if head_content.startswith("ref: "):
                            # Get commit hash from ref
                            ref_path = git_dir / head_content[5:]
                            if ref_path.exists():
                                with open(ref_path, "r") as ref_f:
                                    version_info["git_commit"] = ref_f.read().strip()[:8]
                        else:
                            # Direct commit hash
                            version_info["git_commit"] = head_content[:8]
        except Exception:
            pass  # Git info is optional
        
        return version_info
        
    except Exception as e:
        # Return fallback info if anything fails
        return {
            "version": "1.0.0",
            "name": "metadata-erp",
            "api_service": "running",
            "error": str(e)
        }

def format_version_string(version_info: Dict[str, Any]) -> str:
    """Format version info into a display string."""
    version = version_info.get("version", "1.0.0")
    git_commit = version_info.get("git_commit")
    
    if git_commit:
        return f"{version}-{git_commit}"
    return version
