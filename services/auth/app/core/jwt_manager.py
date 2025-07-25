"""
JWT Token Manager - Authentication Service

Handles JWT token creation, validation, and payload extraction.
"""

import jwt
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, Union
from uuid import UUID, uuid4

from app.core.config import get_auth_settings
from app.core.logging import get_logger
from app.core.exceptions import InvalidTokenException

logger = get_logger("jwt_manager")


class JWTManager:
    """JWT token management for access and refresh tokens."""
    
    def __init__(self):
        self.settings = get_auth_settings()
    
    def create_access_token(
        self,
        user_id: UUID,
        email: str,
        tenant_id: Optional[UUID] = None,
        roles: Optional[list] = None,
        permissions: Optional[list] = None,
        session_id: Optional[UUID] = None
    ) -> str:
        """Create a JWT access token."""
        
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=self.settings.access_token_expire_minutes)
        
        payload = {
            # Standard JWT claims
            "iss": "metadata-erp-auth",  # Issuer
            "sub": str(user_id),          # Subject (user ID)
            "aud": "metadata-erp-api",    # Audience
            "iat": int(now.timestamp()),  # Issued at
            "exp": int(expires_at.timestamp()),  # Expires at
            "jti": str(uuid4()),          # JWT ID (unique)
            
            # Custom claims
            "token_type": "access",
            "email": email,
            "tenant_id": str(tenant_id) if tenant_id else None,
            "roles": roles or [],
            "permissions": permissions or [],
            "session_id": str(session_id) if session_id else None,
        }
        
        token = jwt.encode(
            payload,
            self.settings.jwt_secret_key,
            algorithm=self.settings.jwt_algorithm
        )
        
        logger.debug(
            "Access token created",
            user_id=str(user_id),
            email=email,
            tenant_id=str(tenant_id) if tenant_id else None,
            expires_at=expires_at.isoformat(),
            session_id=str(session_id) if session_id else None
        )
        
        return token
    
    def create_refresh_token(
        self,
        user_id: UUID,
        session_id: UUID,
        tenant_id: Optional[UUID] = None
    ) -> str:
        """Create a JWT refresh token."""
        
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=self.settings.refresh_token_expire_days)
        
        payload = {
            # Standard JWT claims
            "iss": "metadata-erp-auth",
            "sub": str(user_id),
            "aud": "metadata-erp-auth",  # Refresh tokens are for auth service only
            "iat": int(now.timestamp()),
            "exp": int(expires_at.timestamp()),
            "jti": str(uuid4()),
            
            # Custom claims
            "token_type": "refresh",
            "session_id": str(session_id),
            "tenant_id": str(tenant_id) if tenant_id else None,
        }
        
        token = jwt.encode(
            payload,
            self.settings.jwt_secret_key,
            algorithm=self.settings.jwt_algorithm
        )
        
        logger.debug(
            "Refresh token created",
            user_id=str(user_id),
            session_id=str(session_id),
            tenant_id=str(tenant_id) if tenant_id else None,
            expires_at=expires_at.isoformat()
        )
        
        return token
    
    def decode_token(self, token: str) -> Dict[str, Any]:
        """Decode and validate a JWT token."""
        
        try:
            payload = jwt.decode(
                token,
                self.settings.jwt_secret_key,
                algorithms=[self.settings.jwt_algorithm],
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iat": True,
                    "verify_aud": False,  # We handle audience validation manually
                }
            )
            
            logger.debug(
                "Token decoded successfully",
                token_type=payload.get("token_type"),
                user_id=payload.get("sub"),
                expires_at=datetime.fromtimestamp(payload.get("exp", 0), timezone.utc).isoformat()
            )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            raise InvalidTokenException("Token has expired")
        
        except jwt.InvalidTokenError as e:
            logger.warning("Invalid token", error=str(e))
            raise InvalidTokenException(f"Invalid token: {str(e)}")
        
        except Exception as e:
            logger.error("Token decoding failed", error=str(e))
            raise InvalidTokenException("Token decoding failed")
    
    def validate_access_token(self, token: str) -> Dict[str, Any]:
        """Validate an access token and return payload."""
        
        payload = self.decode_token(token)
        
        # Validate token type
        if payload.get("token_type") != "access":
            logger.warning("Invalid token type for access token", token_type=payload.get("token_type"))
            raise InvalidTokenException("Invalid token type")
        
        # Validate audience
        if payload.get("aud") != "metadata-erp-api":
            logger.warning("Invalid audience for access token", audience=payload.get("aud"))
            raise InvalidTokenException("Invalid token audience")
        
        return payload
    
    def validate_refresh_token(self, token: str) -> Dict[str, Any]:
        """Validate a refresh token and return payload."""
        
        payload = self.decode_token(token)
        
        # Validate token type
        if payload.get("token_type") != "refresh":
            logger.warning("Invalid token type for refresh token", token_type=payload.get("token_type"))
            raise InvalidTokenException("Invalid token type")
        
        # Validate audience
        if payload.get("aud") != "metadata-erp-auth":
            logger.warning("Invalid audience for refresh token", audience=payload.get("aud"))
            raise InvalidTokenException("Invalid token audience")
        
        return payload
    
    def extract_user_info(self, token: str) -> Dict[str, Any]:
        """Extract user information from an access token."""
        
        payload = self.validate_access_token(token)
        
        user_info = {
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "tenant_id": payload.get("tenant_id"),
            "roles": payload.get("roles", []),
            "permissions": payload.get("permissions", []),
            "session_id": payload.get("session_id"),
            "expires_at": datetime.fromtimestamp(payload.get("exp", 0), timezone.utc),
            "issued_at": datetime.fromtimestamp(payload.get("iat", 0), timezone.utc),
        }
        
        return user_info
    
    def is_token_expired(self, token: str) -> bool:
        """Check if a token is expired without raising an exception."""
        
        try:
            payload = jwt.decode(
                token,
                self.settings.jwt_secret_key,
                algorithms=[self.settings.jwt_algorithm],
                options={"verify_exp": False}  # Don't raise on expiration
            )
            
            exp_timestamp = payload.get("exp", 0)
            if exp_timestamp == 0:
                return True
            
            expires_at = datetime.fromtimestamp(exp_timestamp, timezone.utc)
            now = datetime.now(timezone.utc)
            
            return now >= expires_at
            
        except Exception:
            # If we can't decode the token at all, consider it expired
            return True
    
    def get_token_expiry(self, token: str) -> Optional[datetime]:
        """Get the expiry time of a token."""
        
        try:
            payload = jwt.decode(
                token,
                self.settings.jwt_secret_key,
                algorithms=[self.settings.jwt_algorithm],
                options={"verify_exp": False}
            )
            
            exp_timestamp = payload.get("exp", 0)
            if exp_timestamp == 0:
                return None
            
            return datetime.fromtimestamp(exp_timestamp, timezone.utc)
            
        except Exception:
            return None
    
    def create_token_pair(
        self,
        user_id: UUID,
        email: str,
        session_id: UUID,
        tenant_id: Optional[UUID] = None,
        roles: Optional[list] = None,
        permissions: Optional[list] = None
    ) -> Dict[str, Any]:
        """Create both access and refresh tokens."""
        
        access_token = self.create_access_token(
            user_id=user_id,
            email=email,
            tenant_id=tenant_id,
            roles=roles,
            permissions=permissions,
            session_id=session_id
        )
        
        refresh_token = self.create_refresh_token(
            user_id=user_id,
            session_id=session_id,
            tenant_id=tenant_id
        )
        
        access_expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=self.settings.access_token_expire_minutes
        )
        
        token_data = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": self.settings.access_token_expire_minutes * 60,  # in seconds
            "expires_at": access_expires_at.isoformat(),
        }
        
        logger.info(
            "Token pair created",
            user_id=str(user_id),
            email=email,
            session_id=str(session_id),
            tenant_id=str(tenant_id) if tenant_id else None
        )
        
        return token_data


# Global JWT manager instance
_jwt_manager: Optional[JWTManager] = None


def get_jwt_manager() -> JWTManager:
    """Get JWT manager instance (singleton)."""
    global _jwt_manager
    if _jwt_manager is None:
        _jwt_manager = JWTManager()
    return _jwt_manager 