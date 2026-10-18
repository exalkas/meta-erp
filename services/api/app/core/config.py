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
    environment: str = Field(default="development", env="ENVIRONMENT")
    
    # Database
    database_url: str = Field(min_length=1, env='DATABASE_URL')
    create_tables_on_startup: bool = Field(default=False, env="CREATE_TABLES_ON_STARTUP")
    
    # Redis
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # Security
    secret_key: str = Field(min_length=1, env='SECRET_KEY')
    jwt_secret_key: str = Field(min_length=1, env='JWT_SECRET_KEY')
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(default=30, env="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    jwt_refresh_token_expire_days: int = Field(default=30, env="JWT_REFRESH_TOKEN_EXPIRE_DAYS")
    
    # Session Management
    default_session_timeout_minutes: int = Field(default=480, env="DEFAULT_SESSION_TIMEOUT_MINUTES")
    max_concurrent_sessions: int = Field(default=5, env="MAX_CONCURRENT_SESSIONS")
    max_login_attempts: int = Field(default=5, env="MAX_LOGIN_ATTEMPTS")
    account_lockout_duration_minutes: int = Field(default=15, env="ACCOUNT_LOCKOUT_DURATION_MINUTES")
    
    # Service URLs
    auth_service_url: str = Field(default="http://localhost:8001", env="AUTH_SERVICE_URL")
    files_service_url: str = Field(default="http://localhost:8002", env="FILES_SERVICE_URL")
    integrations_service_url: str = Field(default="http://localhost:8003", env="INTEGRATIONS_SERVICE_URL")
    ai_voice_service_url: str = Field(default="http://localhost:8004", env="AI_VOICE_SERVICE_URL")
    ai_support_service_url: str = Field(default="http://localhost:8005", env="AI_SUPPORT_SERVICE_URL")
    
    # CORS
    allowed_origins: List[str] = Field(default=["http://localhost:3000", "http://localhost:3001", "http://localhost:3006"])
    cors_origins: List[str] = Field(default=["http://localhost:3000", "http://localhost:3001", "http://localhost:3006"], env="CORS_ORIGINS")
    
    # SMTP Configuration
    smtp_host: str = Field(default="localhost", env="SMTP_HOST")
    smtp_port: int = Field(default=587, env="SMTP_PORT")
    smtp_username: str = Field(default="", env="SMTP_USERNAME")
    smtp_password: str = Field(default="", env="SMTP_PASSWORD")
    smtp_use_tls: bool = Field(default=True, env="SMTP_USE_TLS")
    smtp_from_email: str = Field(default="noreply@localhost", env="SMTP_FROM_EMAIL")
    smtp_from_name: str = Field(default="Metadata ERP", env="SMTP_FROM_NAME")
    
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

    @validator("cors_origins", pre=True)
    def parse_cors_origins_field(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    class Config:
        extra = "ignore"
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings() 