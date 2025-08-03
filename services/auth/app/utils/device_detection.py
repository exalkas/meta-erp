"""
Device Detection and Fingerprinting Utilities
Advanced device detection from user agents and IP addresses.
"""

import re
import hashlib
import httpx
from typing import Dict, Optional, Tuple
from user_agents import parse as parse_user_agent
from ..core.logging import get_logger

logger = get_logger("device_detection")


class DeviceDetector:
    """Advanced device detection and fingerprinting."""
    
    def __init__(self):
        self.geoip_cache = {}  # Simple in-memory cache
        self.device_cache = {}
    
    def detect_device_info(self, user_agent: str, ip_address: str) -> Dict[str, any]:
        """
        Comprehensive device detection from user agent and IP.
        
        Returns:
            {
                "device_type": "desktop|mobile|tablet|bot|unknown",
                "device_name": "iPhone 14 Pro|Samsung Galaxy|Windows PC",
                "browser": "Chrome|Firefox|Safari|Edge",
                "browser_version": "120.0.0",
                "os": "iOS|Android|Windows|macOS|Linux",
                "os_version": "17.1|13|11",
                "is_mobile": True|False,
                "is_tablet": True|False,
                "is_bot": True|False,
                "country_code": "US|GR|DE",
                "city": "New York|Athens|Berlin",
                "fingerprint": "unique_device_hash"
            }
        """
        
        try:
            # Parse user agent
            ua = parse_user_agent(user_agent) if user_agent else None
            
            # Device detection
            device_info = self._detect_device_details(ua, user_agent)
            
            # Location detection
            location_info = self._detect_location(ip_address)
            
            # Generate device fingerprint
            fingerprint = self._generate_fingerprint(user_agent, device_info, location_info)
            
            return {
                **device_info,
                **location_info,
                "fingerprint": fingerprint,
                "user_agent": user_agent,
                "ip_address": self._anonymize_ip(ip_address)
            }
            
        except Exception as e:
            logger.warning("Device detection failed", error=str(e))
            return self._default_device_info(user_agent, ip_address)
    
    def _detect_device_details(self, ua, user_agent: str) -> Dict[str, any]:
        """Extract detailed device information."""
        
        if not ua:
            return self._detect_from_raw_ua(user_agent)
        
        # Device type detection
        device_type = "unknown"
        device_name = "Unknown Device"
        
        if ua.is_mobile:
            device_type = "mobile"
            device_name = f"{ua.device.brand} {ua.device.model}" if ua.device.brand else "Mobile Device"
        elif ua.is_tablet:
            device_type = "tablet"
            device_name = f"{ua.device.brand} {ua.device.model}" if ua.device.brand else "Tablet"
        elif ua.is_pc:
            device_type = "desktop"
            device_name = f"{ua.os.family} PC"
        elif ua.is_bot:
            device_type = "bot"
            device_name = f"{ua.browser.family} Bot"
        
        # Browser info
        browser = ua.browser.family if ua.browser.family else "Unknown"
        browser_version = ua.browser.version_string if ua.browser.version_string else "Unknown"
        
        # OS info
        os_name = ua.os.family if ua.os.family else "Unknown"
        os_version = ua.os.version_string if ua.os.version_string else "Unknown"
        
        return {
            "device_type": device_type,
            "device_name": device_name,
            "browser": browser,
            "browser_version": browser_version,
            "os": os_name,
            "os_version": os_version,
            "is_mobile": ua.is_mobile,
            "is_tablet": ua.is_tablet,
            "is_bot": ua.is_bot
        }
    
    def _detect_from_raw_ua(self, user_agent: str) -> Dict[str, any]:
        """Fallback device detection from raw user agent string."""
        
        if not user_agent:
            return self._default_device_info()
        
        ua_lower = user_agent.lower()
        
        # Mobile detection
        mobile_patterns = ['mobile', 'android', 'iphone', 'ipad', 'tablet']
        is_mobile = any(pattern in ua_lower for pattern in mobile_patterns)
        
        # Bot detection
        bot_patterns = ['bot', 'crawler', 'spider', 'scraper']
        is_bot = any(pattern in ua_lower for pattern in bot_patterns)
        
        # Browser detection
        browser = "Unknown"
        if 'chrome' in ua_lower:
            browser = "Chrome"
        elif 'firefox' in ua_lower:
            browser = "Firefox"
        elif 'safari' in ua_lower:
            browser = "Safari"
        elif 'edge' in ua_lower:
            browser = "Edge"
        
        # OS detection
        os_name = "Unknown"
        if 'windows' in ua_lower:
            os_name = "Windows"
        elif 'mac' in ua_lower:
            os_name = "macOS"
        elif 'linux' in ua_lower:
            os_name = "Linux"
        elif 'android' in ua_lower:
            os_name = "Android"
        elif 'ios' in ua_lower:
            os_name = "iOS"
        
        device_type = "bot" if is_bot else ("mobile" if is_mobile else "desktop")
        
        return {
            "device_type": device_type,
            "device_name": f"{os_name} Device",
            "browser": browser,
            "browser_version": "Unknown",
            "os": os_name,
            "os_version": "Unknown",
            "is_mobile": is_mobile,
            "is_tablet": 'tablet' in ua_lower or 'ipad' in ua_lower,
            "is_bot": is_bot
        }
    
    def _detect_location(self, ip_address: str) -> Dict[str, str]:
        """Detect location from IP address."""
        
        if not ip_address or ip_address in ['127.0.0.1', 'localhost', '::1']:
            return {"country_code": "LOCAL", "city": "Local"}
        
        # Check cache first
        if ip_address in self.geoip_cache:
            return self.geoip_cache[ip_address]
        
        try:
            # In production, you'd use a proper GeoIP service like:
            # - MaxMind GeoIP2
            # - IP-API.com
            # - ipinfo.io
            
            # For now, return default location
            location_info = {"country_code": "UNKNOWN", "city": "Unknown"}
            
            # Cache the result
            self.geoip_cache[ip_address] = location_info
            return location_info
            
        except Exception as e:
            logger.warning("Location detection failed", error=str(e))
            return {"country_code": "ERROR", "city": "Unknown"}
    
    def _generate_fingerprint(self, user_agent: str, device_info: Dict, location_info: Dict) -> str:
        """Generate unique device fingerprint."""
        
        fingerprint_data = (
            f"{user_agent}|"
            f"{device_info.get('device_type')}|"
            f"{device_info.get('browser')}|"
            f"{device_info.get('os')}|"
            f"{location_info.get('country_code')}"
        )
        
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:16]
    
    def _anonymize_ip(self, ip_address: str) -> str:
        """Anonymize IP address for privacy compliance."""
        
        if not ip_address:
            return "unknown"
        
        # IPv4: Replace last octet with 0
        if '.' in ip_address:
            parts = ip_address.split('.')
            if len(parts) == 4:
                return f"{parts[0]}.{parts[1]}.{parts[2]}.0"
        
        # IPv6: Replace last 64 bits with zeros
        if ':' in ip_address:
            parts = ip_address.split(':')
            if len(parts) >= 4:
                return f"{':'.join(parts[:4])}::0"
        
        return ip_address
    
    def _default_device_info(self, user_agent: str = "", ip_address: str = "") -> Dict[str, any]:
        """Default device info when detection fails."""
        
        return {
            "device_type": "unknown",
            "device_name": "Unknown Device",
            "browser": "Unknown",
            "browser_version": "Unknown",
            "os": "Unknown", 
            "os_version": "Unknown",
            "is_mobile": False,
            "is_tablet": False,
            "is_bot": False,
            "country_code": "UNKNOWN",
            "city": "Unknown",
            "fingerprint": hashlib.sha256(f"{user_agent}|{ip_address}".encode()).hexdigest()[:16],
            "user_agent": user_agent,
            "ip_address": self._anonymize_ip(ip_address)
        }


# Singleton instance
device_detector = DeviceDetector()