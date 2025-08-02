"""
JWT Token Generation and Validation Utilities
"""

import jwt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from uuid import UUID

from app.core.config import get_settings

settings = get_settings()

def create_access_token(
    user_id: UUID,
    tenant_id: UUID,
    session_id: UUID,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token with user and session information
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "sub": str(user_id),  # Subject (user ID)
        "tenant_id": str(tenant_id),
        "session_id": str(session_id),
        "exp": expire,  # Expiration time
        "iat": datetime.utcnow(),  # Issued at
        "type": "access"
    }
    
    return jwt.encode(
        payload, 
        settings.JWT_SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )

def create_refresh_token(
    user_id: UUID,
    tenant_id: UUID,
    session_id: UUID,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    
    payload = {
        "sub": str(user_id),  # Subject (user ID)
        "tenant_id": str(tenant_id),
        "session_id": str(session_id),
        "exp": expire,  # Expiration time
        "iat": datetime.utcnow(),  # Issued at
        "type": "refresh"
    }
    
    return jwt.encode(
        payload, 
        settings.JWT_SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )

def validate_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Validate and decode a JWT token
    Returns the payload if valid, None if invalid
    """
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def decode_token_without_verification(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode a JWT token without verification (for debugging)
    """
    try:
        return jwt.decode(token, options={"verify_signature": False})
    except Exception:
        return None

def get_token_hash(token: str) -> str:
    """
    Generate a hash of the JWT token for database storage
    """
    import hashlib
    return hashlib.sha256(token.encode()).hexdigest()