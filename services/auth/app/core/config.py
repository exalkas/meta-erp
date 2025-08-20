"""
SAP-Style Authentication Service Configuration

Environment-based configuration with:
- Database settings
- Security configuration
- Multi-environment support
- Secrets management
"""

import os
from typing import Optional, List
from functools import lru_cache

from pydantic import Field, validator
from pydantic_settings import BaseSettings


class AuthSettings(BaseSettings):
    """Authentication service configuration"""
    
    # =============================================
    # ENVIRONMENT SETTINGS
    # =============================================
    
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=False, env="DEBUG")
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    # =============================================
    # DATABASE SETTINGS
    # =============================================
    
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://auth_user:@localhost:5432/auth_db",
        env="DATABASE_URL"
    )
    DATABASE_ECHO: bool = Field(default=False, env="DATABASE_ECHO")
    CREATE_TABLES_ON_STARTUP: bool = Field(default=True, env="CREATE_TABLES_ON_STARTUP")
    
    # Connection pool settings
    DB_POOL_SIZE: int = Field(default=20, env="DB_POOL_SIZE")
    DB_MAX_OVERFLOW: int = Field(default=30, env="DB_MAX_OVERFLOW")
    DB_POOL_TIMEOUT: int = Field(default=30, env="DB_POOL_TIMEOUT")
    DB_POOL_RECYCLE: int = Field(default=3600, env="DB_POOL_RECYCLE")
    
    # =============================================
    # REDIS SETTINGS (OPTIONAL)
    # =============================================
    
    REDIS_URL: Optional[str] = Field(default=None, env="REDIS_URL")
    REDIS_PASSWORD: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    REDIS_DB: int = Field(default=0, env="REDIS_DB")
    REDIS_MAX_CONNECTIONS: int = Field(default=20, env="REDIS_MAX_CONNECTIONS")
    
    # =============================================
    # JWT & SECURITY SETTINGS
    # =============================================
    
    JWT_SECRET_KEY: str = Field(
        default="super-secret-jwt-key-change-in-production",
        env="JWT_SECRET_KEY"
    )
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=15, env="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, env="JWT_REFRESH_TOKEN_EXPIRE_DAYS")
    
    # Password hashing
    PASSWORD_HASH_ALGORITHM: str = Field(default="bcrypt", env="PASSWORD_HASH_ALGORITHM")
    PASSWORD_HASH_ROUNDS: int = Field(default=12, env="PASSWORD_HASH_ROUNDS")
    
    # Security headers
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001", "http://localhost:3006"],
        env="CORS_ORIGINS"
    )
    TRUSTED_HOSTS: List[str] = Field(default=["localhost"], env="TRUSTED_HOSTS")
    
    # =============================================
    # AUTH SERVICE SETTINGS
    # =============================================
    
    # Magic links
    MAGIC_LINK_EXPIRE_MINUTES: int = Field(default=15, env="MAGIC_LINK_EXPIRE_MINUTES")
    MAGIC_LINK_MAX_ATTEMPTS: int = Field(default=3, env="MAGIC_LINK_MAX_ATTEMPTS")
    
    # Session settings
    DEFAULT_SESSION_TIMEOUT_MINUTES: int = Field(default=480, env="DEFAULT_SESSION_TIMEOUT_MINUTES")  # 8 hours
    MAX_CONCURRENT_SESSIONS: int = Field(default=5, env="MAX_CONCURRENT_SESSIONS")
    SESSION_CLEANUP_INTERVAL_MINUTES: int = Field(default=60, env="SESSION_CLEANUP_INTERVAL_MINUTES")
    
    # Account security
    MAX_LOGIN_ATTEMPTS: int = Field(default=5, env="MAX_LOGIN_ATTEMPTS")
    ACCOUNT_LOCKOUT_DURATION_MINUTES: int = Field(default=15, env="ACCOUNT_LOCKOUT_DURATION_MINUTES")
    
    # Rate limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = Field(default=60, env="RATE_LIMIT_REQUESTS_PER_MINUTE")
    RATE_LIMIT_BURST_SIZE: int = Field(default=10, env="RATE_LIMIT_BURST_SIZE")
    
    # =============================================
    # EMAIL SETTINGS (OPTIONAL)
    # =============================================
    
    SMTP_HOST: Optional[str] = Field(default=None, env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USERNAME: Optional[str] = Field(default=None, env="SMTP_USERNAME")
    SMTP_PASSWORD: Optional[str] = Field(default=None, env="SMTP_PASSWORD")
    SMTP_USE_TLS: bool = Field(default=True, env="SMTP_USE_TLS")
    SMTP_FROM_EMAIL: str = Field(default="noreply@yourplatform.com", env="SMTP_FROM_EMAIL")
    SMTP_FROM_NAME: str = Field(default="Authentication Service", env="SMTP_FROM_NAME")
    
    # =============================================
    # EXTERNAL INTEGRATIONS
    # =============================================
    
    # OAuth providers
    GOOGLE_CLIENT_ID: Optional[str] = Field(default=None, env="GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = Field(default=None, env="GOOGLE_CLIENT_SECRET")
    
    MICROSOFT_CLIENT_ID: Optional[str] = Field(default=None, env="MICROSOFT_CLIENT_ID")
    MICROSOFT_CLIENT_SECRET: Optional[str] = Field(default=None, env="MICROSOFT_CLIENT_SECRET")
    
    # SAML settings
    SAML_ENTITY_ID: Optional[str] = Field(default=None, env="SAML_ENTITY_ID")
    SAML_SSO_URL: Optional[str] = Field(default=None, env="SAML_SSO_URL")
    SAML_X509_CERT: Optional[str] = Field(default=None, env="SAML_X509_CERT")
    
    # =============================================
    # MONITORING & OBSERVABILITY
    # =============================================
    
    # Metrics
    ENABLE_METRICS: bool = Field(default=True, env="ENABLE_METRICS")
    METRICS_PORT: int = Field(default=8002, env="METRICS_PORT")
    
    # Health checks
    HEALTH_CHECK_INTERVAL_SECONDS: int = Field(default=30, env="HEALTH_CHECK_INTERVAL_SECONDS")
    
    # Audit logging
    AUDIT_LOG_RETENTION_DAYS: int = Field(default=2555, env="AUDIT_LOG_RETENTION_DAYS")  # 7 years
    ENABLE_AUDIT_LOG_EXPORT: bool = Field(default=False, env="ENABLE_AUDIT_LOG_EXPORT")
    
    # =============================================
    # COMPLIANCE SETTINGS
    # =============================================
    
    # Data retention
    USER_DATA_RETENTION_DAYS: int = Field(default=2555, env="USER_DATA_RETENTION_DAYS")  # 7 years
    SESSION_LOG_RETENTION_DAYS: int = Field(default=90, env="SESSION_LOG_RETENTION_DAYS")
    
    # Privacy settings
    ENABLE_GDPR_COMPLIANCE: bool = Field(default=True, env="ENABLE_GDPR_COMPLIANCE")
    ENABLE_CCPA_COMPLIANCE: bool = Field(default=True, env="ENABLE_CCPA_COMPLIANCE")
    DATA_PROCESSING_AGREEMENT_URL: Optional[str] = Field(default=None, env="DATA_PROCESSING_AGREEMENT_URL")
    
    # Industry compliance
    ENABLE_SOC2_COMPLIANCE: bool = Field(default=True, env="ENABLE_SOC2_COMPLIANCE")
    ENABLE_HIPAA_COMPLIANCE: bool = Field(default=False, env="ENABLE_HIPAA_COMPLIANCE")
    ENABLE_PCI_COMPLIANCE: bool = Field(default=False, env="ENABLE_PCI_COMPLIANCE")
    
    # =============================================
    # DEVELOPMENT SETTINGS
    # =============================================
    
    # Testing
    TESTING: bool = Field(default=False, env="TESTING")
    TEST_DATABASE_URL: Optional[str] = Field(default=None, env="TEST_DATABASE_URL")
    
    # Development utilities
    ENABLE_TEST_ENDPOINTS: bool = Field(default=False, env="ENABLE_TEST_ENDPOINTS")
    SEED_TEST_DATA: bool = Field(default=False, env="SEED_TEST_DATA")
    RESET_DATABASE_ON_STARTUP: bool = Field(default=False, env="RESET_DATABASE_ON_STARTUP")
    
    # =============================================
    # VALIDATORS
    # =============================================
    
    @validator("ENVIRONMENT")
    def validate_environment(cls, v):
        """Validate environment value"""
        allowed_environments = ["development", "staging", "production", "testing"]
        if v not in allowed_environments:
            raise ValueError(f"Environment must be one of: {allowed_environments}")
        return v
    
    @validator("LOG_LEVEL")
    def validate_log_level(cls, v):
        """Validate log level"""
        allowed_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in allowed_levels:
            raise ValueError(f"Log level must be one of: {allowed_levels}")
        return v.upper()
    
    @validator("JWT_SECRET_KEY")
    def validate_jwt_secret(cls, v, values):
        """Validate JWT secret key"""
        if values.get("ENVIRONMENT") == "production" and v == "super-secret-jwt-key-change-in-production":
            raise ValueError("JWT_SECRET_KEY must be changed in production environment")
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters long")
        return v
    
    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("TRUSTED_HOSTS", pre=True)
    def parse_trusted_hosts(cls, v):
        """Parse trusted hosts from string or list"""
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v
    
    @validator("DATABASE_URL")
    def validate_database_url(cls, v):
        """Validate database URL format"""
        if not v.startswith(("postgresql://", "postgresql+asyncpg://", "sqlite://", "sqlite+aiosqlite://")):
            raise ValueError("DATABASE_URL must be a valid PostgreSQL or SQLite URL")
        return v
    
    # =============================================
    # CONFIGURATION PROPERTIES
    # =============================================
    
    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.ENVIRONMENT == "development"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.ENVIRONMENT == "production"
    
    @property
    def is_testing(self) -> bool:
        """Check if running in testing mode"""
        return self.ENVIRONMENT == "testing" or self.TESTING
    
    @property
    def database_url_for_testing(self) -> str:
        """Get database URL for testing"""
        if self.TEST_DATABASE_URL:
            return self.TEST_DATABASE_URL
        
        # Use in-memory SQLite for testing if no test database specified
        return "sqlite+aiosqlite:///:memory:"
    
    @property
    def effective_database_url(self) -> str:
        """Get effective database URL based on environment"""
        if self.is_testing:
            return self.database_url_for_testing
        return self.DATABASE_URL
    
    @property
    def smtp_enabled(self) -> bool:
        """Check if SMTP is configured"""
        return bool(self.SMTP_HOST and self.SMTP_USERNAME and self.SMTP_PASSWORD)
    
    @property
    def redis_enabled(self) -> bool:
        """Check if Redis is configured"""
        return bool(self.REDIS_URL)
    
    @property
    def oauth_providers_enabled(self) -> List[str]:
        """Get list of enabled OAuth providers"""
        providers = []
        
        if self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET:
            providers.append("google")
        
        if self.MICROSOFT_CLIENT_ID and self.MICROSOFT_CLIENT_SECRET:
            providers.append("microsoft")
        
        return providers
    
    @property
    def saml_enabled(self) -> bool:
        """Check if SAML is configured"""
        return bool(self.SAML_ENTITY_ID and self.SAML_SSO_URL and self.SAML_X509_CERT)
    
    # =============================================
    # SECURITY CONFIGURATION
    # =============================================
    
    def get_password_policy(self, vertical: Optional[str] = None) -> dict:
        """Get password policy based on vertical"""
        
        # Base policy
        policy = {
            "min_length": 8,
            "max_length": 128,
            "require_uppercase": True,
            "require_lowercase": True,
            "require_numbers": True,
            "require_special": False,
            "max_age_days": 90,
            "prevent_reuse_count": 5
        }
        
        # Vertical-specific policies
        if vertical == "fintech":
            policy.update({
                "min_length": 12,
                "require_special": True,
                "max_age_days": 60,
                "prevent_reuse_count": 10
            })
        elif vertical == "oilgas":
            policy.update({
                "min_length": 10,
                "require_special": True,
                "max_age_days": 45,
                "prevent_reuse_count": 8
            })
        elif vertical == "insurance":
            policy.update({
                "min_length": 10,
                "require_special": True,
                "max_age_days": 75,
                "prevent_reuse_count": 6
            })
        
        return policy
    
    def get_session_config(self, vertical: Optional[str] = None) -> dict:
        """Get session configuration based on vertical"""
        
        # Base configuration
        config = {
            "timeout_minutes": self.DEFAULT_SESSION_TIMEOUT_MINUTES,
            "max_concurrent": self.MAX_CONCURRENT_SESSIONS,
            "idle_timeout_minutes": 60,
            "require_2fa": False
        }
        
        # Vertical-specific configurations
        if vertical == "fintech":
            config.update({
                "timeout_minutes": 60,  # 1 hour
                "max_concurrent": 1,    # Single session
                "idle_timeout_minutes": 15,
                "require_2fa": True
            })
        elif vertical == "oilgas":
            config.update({
                "timeout_minutes": 240,  # 4 hours
                "max_concurrent": 1,     # Single session
                "idle_timeout_minutes": 30,
                "require_2fa": True
            })
        elif vertical == "ecommerce":
            config.update({
                "timeout_minutes": 1440,  # 24 hours
                "max_concurrent": 5,      # Multiple devices
                "idle_timeout_minutes": 120
            })
        
        return config
    
    class Config:
        """Pydantic configuration"""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env


# =============================================
# SETTINGS INSTANCE
# =============================================

@lru_cache()
def get_settings() -> AuthSettings:
    """Get cached settings instance"""
    return AuthSettings()


# =============================================
# ENVIRONMENT-SPECIFIC SETTINGS
# =============================================

def get_development_settings() -> AuthSettings:
    """Get development-specific settings"""
    return AuthSettings(
        ENVIRONMENT="development",
        DEBUG=True,
        LOG_LEVEL="DEBUG",
        DATABASE_ECHO=True,
        CREATE_TABLES_ON_STARTUP=True,
        ENABLE_TEST_ENDPOINTS=True,
        SEED_TEST_DATA=True
    )

def get_production_settings() -> AuthSettings:
    """Get production-specific settings"""
    return AuthSettings(
        ENVIRONMENT="production",
        DEBUG=False,
        LOG_LEVEL="INFO",
        DATABASE_ECHO=False,
        CREATE_TABLES_ON_STARTUP=False,
        ENABLE_TEST_ENDPOINTS=False,
        SEED_TEST_DATA=False,
        ENABLE_METRICS=True,
        ENABLE_SOC2_COMPLIANCE=True,
        ENABLE_GDPR_COMPLIANCE=True
    )

def get_testing_settings() -> AuthSettings:
    """Get testing-specific settings"""
    return AuthSettings(
        ENVIRONMENT="testing",
        TESTING=True,
        DEBUG=True,
        LOG_LEVEL="DEBUG",
        DATABASE_URL="sqlite+aiosqlite:///:memory:",
        CREATE_TABLES_ON_STARTUP=True,
        ENABLE_TEST_ENDPOINTS=True,
        RESET_DATABASE_ON_STARTUP=True
    )


# =============================================
# CONFIGURATION VALIDATION
# =============================================

def validate_production_config(settings: AuthSettings) -> List[str]:
    """Validate production configuration and return warnings"""
    warnings = []
    
    if settings.is_production:
        # Check critical production settings
        if settings.JWT_SECRET_KEY == "super-secret-jwt-key-change-in-production":
            warnings.append("JWT_SECRET_KEY should be changed in production")
        
        if not settings.smtp_enabled:
            warnings.append("SMTP not configured - email features will not work")
        
        if not settings.redis_enabled:
            warnings.append("Redis not configured - performance may be impacted")
        
        if settings.DEBUG:
            warnings.append("DEBUG mode enabled in production")
        
        if settings.DATABASE_ECHO:
            warnings.append("DATABASE_ECHO enabled in production - may impact performance")
        
        if "localhost" in settings.CORS_ORIGINS:
            warnings.append("localhost in CORS_ORIGINS in production")
        
        if not settings.ENABLE_SOC2_COMPLIANCE:
            warnings.append("SOC2 compliance not enabled in production")
    
    return warnings


# Example usage and testing
if __name__ == "__main__":
    # Test settings loading
    settings = get_settings()
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Database URL: {settings.DATABASE_URL}")
    print(f"Redis enabled: {settings.redis_enabled}")
    print(f"SMTP enabled: {settings.smtp_enabled}")
    print(f"OAuth providers: {settings.oauth_providers_enabled}")
    
    # Test production warnings
    if settings.is_production:
        warnings = validate_production_config(settings)
        if warnings:
            print("Production warnings:")
            for warning in warnings:
                print(f"  - {warning}")
    
    # Test vertical-specific configs
    print(f"FinTech password policy: {settings.get_password_policy('fintech')}")
    print(f"E-commerce session config: {settings.get_session_config('ecommerce')}") 