"""
Authentication Service Configuration

Pydantic settings for the authentication service.
"""

import os
from typing import List, Optional
from pydantic import BaseSettings, Field


class AuthSettings(BaseSettings):
    """Authentication service settings."""
    
    # Service info
    service_name: str = "Authentication Service"
    app_version: str = "1.0.0"
    env: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=True, env="DEBUG")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/metadata_erp",
        env="DATABASE_URL"
    )
    
    # JWT Settings
    jwt_secret_key: str = Field(
        default="your-secret-key-change-in-production",
        env="JWT_SECRET_KEY"
    )
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=15, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, env="REFRESH_TOKEN_EXPIRE_DAYS")
    
    # Security
    password_min_length: int = Field(default=8, env="PASSWORD_MIN_LENGTH")
    max_login_attempts: int = Field(default=5, env="MAX_LOGIN_ATTEMPTS")
    account_lockout_minutes: int = Field(default=30, env="ACCOUNT_LOCKOUT_MINUTES")
    
    # Session Management (One-User-One-Session)
    enable_single_session: bool = Field(default=True, env="ENABLE_SINGLE_SESSION")
    session_cleanup_interval_minutes: int = Field(default=60, env="SESSION_CLEANUP_INTERVAL_MINUTES")
    
    # CORS
    allowed_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3001", 
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:3004",
            "http://localhost:3005",
            "http://localhost:3006",
            "http://localhost:3007",
            "http://localhost:8000",
        ],
        env="ALLOWED_ORIGINS"
    )
    
    # Feature flags
    enable_magic_link: bool = Field(default=True, env="ENABLE_MAGIC_LINK")
    enable_2fa: bool = Field(default=True, env="ENABLE_2FA")
    enable_registration: bool = Field(default=True, env="ENABLE_REGISTRATION")
    
    # API Service URLs (for validation and user data)
    api_service_url: str = Field(
        default="http://localhost:8000",
        env="API_SERVICE_URL"
    )
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
_auth_settings: Optional[AuthSettings] = None


def get_auth_settings() -> AuthSettings:
    """Get authentication service settings (singleton)."""
    global _auth_settings
    if _auth_settings is None:
        _auth_settings = AuthSettings()
    return _auth_settings 