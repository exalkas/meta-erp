"""API Service configuration management."""

from functools import lru_cache
from typing import List, Optional

from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """API service settings."""

    # Service Info
    service_name: str = Field(default="api", env="SERVICE_NAME")
    service_port: int = Field(default=8000, env="SERVICE_PORT")
    app_name: str = "Metadata ERP API"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    env: str = Field(default="development", env="ENV")
    
    # Database
    database_url: str = Field(env="DATABASE_URL")
    
    # Redis
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # Security
    secret_key: str = Field(env="SECRET_KEY")
    jwt_secret_key: str = Field(env="JWT_SECRET_KEY")
    
    # Service URLs
    auth_service_url: str = Field(default="http://localhost:8001", env="AUTH_SERVICE_URL")
    files_service_url: str = Field(default="http://localhost:8002", env="FILES_SERVICE_URL")
    integrations_service_url: str = Field(default="http://localhost:8003", env="INTEGRATIONS_SERVICE_URL")
    ai_voice_service_url: str = Field(default="http://localhost:8004", env="AI_VOICE_SERVICE_URL")
    ai_support_service_url: str = Field(default="http://localhost:8005", env="AI_SUPPORT_SERVICE_URL")
    
    # CORS
    allowed_origins: List[str] = Field(default=["http://localhost:3000"])
    
    # Features
    enable_metadata_cache: bool = Field(default=True, env="ENABLE_METADATA_CACHE")
    enable_field_validation: bool = Field(default=True, env="ENABLE_FIELD_VALIDATION")
    enable_layout_preview: bool = Field(default=True, env="ENABLE_LAYOUT_PREVIEW")
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")

    @validator("allowed_origins", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings() 