"""
Locale Fallback Configuration Manager

Handles loading and managing locale fallback rules from configuration files.
Provides metadata-driven locale resolution without hardcoded values.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from functools import lru_cache

logger = logging.getLogger(__name__)

class LocaleFallbackConfig:
    """Manages locale fallback configuration for the translation system."""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize with optional custom config path."""
        if config_path:
            self.config_path = Path(config_path)
        else:
            # Default to config file in project
            self.config_path = Path(__file__).parent.parent.parent / "config" / "locale_fallback_config.json"
        
        self._config: Optional[Dict[str, Any]] = None
        self._load_config()
    
    def _load_config(self) -> None:
        """Load configuration from JSON file."""
        try:
            if not self.config_path.exists():
                logger.warning(f"Locale config file not found: {self.config_path}. Using minimal defaults.")
                self._config = self._get_default_config()
                return
            
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self._config = json.load(f)
                
            logger.info(f"Loaded locale fallback config from: {self.config_path}")
            
        except Exception as e:
            logger.error(f"Failed to load locale config: {e}. Using defaults.")
            self._config = self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Provide minimal default configuration if file is missing."""
        logger.error("❌ CRITICAL: No locale config file found, using emergency minimal config")
        logger.error("❌ This should never happen in production - locale config file is mandatory!")
        return {
            "default_fallback_chain": [],  # NO hardcoded fallbacks!
            "vertical_specific_fallbacks": {}  # NO hardcoded verticals!
        }
    
    def get_fallback_chain(self, 
                          requested_locale: str, 
                          vertical: Optional[str] = None) -> List[str]:
        """
        Get the fallback chain for a locale and vertical context.
        
        Args:
            requested_locale: The originally requested locale (e.g., 'el', 'en-US')
            vertical: The vertical context (e.g., 'legal', 'admin')
            
        Returns:
            List of locales to try in order of preference
        """
        if not self._config:
            # If no config file, just use the requested locale - no hardcoded fallbacks!
            logger.error(f"❌ CRITICAL: No locale config found and no fallback allowed. Requested: {requested_locale}")
            raise RuntimeError(f"Locale configuration missing and fallbacks are forbidden. Requested locale: {requested_locale}")
        
        # Check for vertical-specific fallback
        if vertical and vertical in self._config.get("vertical_specific_fallbacks", {}):
            vertical_config = self._config["vertical_specific_fallbacks"][vertical]
            fallback_chain = vertical_config.get("fallback_chain", [])
            
            # IMPORTANT: Always put requested locale first if it's not already
            if requested_locale not in fallback_chain:
                fallback_chain = [requested_locale] + fallback_chain
            else:
                # Move requested locale to the front
                fallback_chain = [requested_locale] + [loc for loc in fallback_chain if loc != requested_locale]
            
            logger.info(f"Using vertical '{vertical}' fallback chain (requested '{requested_locale}' first): {fallback_chain}")
            return fallback_chain
        
        # Use default fallback chain - but NO hardcoded fallbacks allowed!
        default_chain = self._config.get("default_fallback_chain", [])
        if not default_chain:
            logger.error(f"❌ CRITICAL: No default fallback chain configured and hardcoded fallbacks forbidden")
            raise RuntimeError("Default fallback chain is missing from configuration and hardcoded fallbacks are forbidden")
        
        # Include requested locale at the beginning if not already present
        if requested_locale not in default_chain:
            fallback_chain = [requested_locale] + default_chain
        else:
            fallback_chain = default_chain
            
        logger.info(f"Using default fallback chain for locale '{requested_locale}': {fallback_chain}")
        return fallback_chain
    
    def get_supported_verticals(self) -> List[str]:
        """Get list of supported verticals."""
        if not self._config:
            logger.error("❌ CRITICAL: No locale config found, cannot return default verticals")
            raise RuntimeError("Locale configuration missing - no default verticals available")
            
        return list(self._config.get("vertical_specific_fallbacks", {}).keys())
    
    def get_vertical_info(self, vertical: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a vertical."""
        if not self._config or vertical not in self._config.get("vertical_specific_fallbacks", {}):
            return None
            
        return self._config["vertical_specific_fallbacks"][vertical]
    
    def reload_config(self) -> None:
        """Reload configuration from file."""
        self._load_config()


# Global instance with caching
@lru_cache(maxsize=1)
def get_locale_config() -> LocaleFallbackConfig:
    """Get cached locale configuration instance."""
    return LocaleFallbackConfig()


def get_locale_fallback_chain(requested_locale: str, 
                             vertical: Optional[str] = None) -> List[str]:
    """
    Convenience function to get locale fallback chain.
    
    Args:
        requested_locale: The originally requested locale
        vertical: The vertical context
        
    Returns:
        List of locales to try in fallback order
    """
    config = get_locale_config()
    return config.get_fallback_chain(requested_locale, vertical)
