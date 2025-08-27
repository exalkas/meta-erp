"""
Risk Scoring Engine for Authentication
Advanced risk assessment for login attempts and user sessions.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum
from dataclasses import dataclass
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from ..core.logging import get_logger
from ..models.auth_models import User, AuthSession, AuditLog

logger = get_logger("risk_scoring")


class RiskLevel(Enum):
    """Risk level classifications."""
    VERY_LOW = "very_low"      # 0-20 points
    LOW = "low"                # 21-40 points  
    MEDIUM = "medium"          # 41-60 points
    HIGH = "high"              # 61-80 points
    VERY_HIGH = "very_high"    # 81-100 points


@dataclass
class RiskFactor:
    """Individual risk factor assessment."""
    name: str
    score: int
    reason: str
    weight: float = 1.0


@dataclass
class RiskAssessment:
    """Complete risk assessment result."""
    total_score: int
    risk_level: RiskLevel
    factors: List[RiskFactor]
    recommendations: List[str]
    requires_2fa: bool
    requires_approval: bool
    timestamp: datetime


class RiskScoringEngine:
    """Advanced risk scoring for authentication events."""
    
    def __init__(self):
        # Risk factor weights (can be configured per tenant)
        self.weights = {
            "new_device": 1.0,
            "new_location": 1.0, 
            "unusual_time": 0.5,
            "failed_attempts": 1.5,
            "velocity": 1.2,
            "account_age": 0.3,
            "privilege_level": 0.8
        }
        
        # Time-based risk thresholds
        self.unusual_hours = {
            "start": 23,  # 11 PM
            "end": 6      # 6 AM
        }
    
    async def assess_login_risk(
        self,
        db: AsyncSession,
        user: User,
        device_info: Dict,
        ip_address: str,
        login_time: datetime = None
    ) -> RiskAssessment:
        """
        Comprehensive risk assessment for login attempt.
        
        Args:
            db: Database session
            user: User attempting login
            device_info: Device detection results
            ip_address: User's IP address
            login_time: Time of login attempt
            
        Returns:
            RiskAssessment with score, level, and recommendations
        """
        
        if not login_time:
            login_time = datetime.utcnow()
        
        logger.info("Starting risk assessment", user_id=str(user.user_id))
        
        risk_factors = []
        
        # Device-based risk factors
        device_factors = await self._assess_device_risk(db, user, device_info)
        risk_factors.extend(device_factors)
        
        # Location-based risk factors
        location_factors = await self._assess_location_risk(db, user, ip_address, device_info)
        risk_factors.extend(location_factors)
        
        # Time-based risk factors
        time_factors = self._assess_time_risk(login_time, user)
        risk_factors.extend(time_factors)
        
        # Historical behavior risk factors
        history_factors = await self._assess_history_risk(db, user, login_time)
        risk_factors.extend(history_factors)
        
        # Account-based risk factors
        account_factors = self._assess_account_risk(user, login_time)
        risk_factors.extend(account_factors)
        
        # Calculate total weighted score
        total_score = min(100, sum(
            factor.score * factor.weight * self.weights.get(factor.name.lower().replace(' ', '_'), 1.0)
            for factor in risk_factors
        ))
        
        # Scale score to fit database field constraint (NUMERIC(3,2) = max 9.99)
        db_score = min(9.99, total_score / 10.0)  # Scale 0-100 to 0-9.99
        
        # Determine risk level
        risk_level = self._determine_risk_level(total_score)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(total_score, risk_factors, user)
        
        assessment = RiskAssessment(
            total_score=int(total_score),
            risk_level=risk_level,
            factors=risk_factors,
            recommendations=recommendations,
            requires_2fa=total_score >= 60 or getattr(user, 'is_2fa_enabled', False),
            requires_approval=total_score >= 80,
            timestamp=login_time
        )
        
        # Add database-compatible score as attribute
        assessment.db_score = db_score
        
        logger.info(
            "Risk assessment completed",
            user_id=str(user.user_id),
            risk_score=total_score,
            risk_level=risk_level.value,
            factors_count=len(risk_factors)
        )
        
        return assessment
    
    async def _assess_device_risk(self, db: AsyncSession, user: User, device_info: Dict) -> List[RiskFactor]:
        """Assess device-related risk factors."""
        
        factors = []
        device_fingerprint = device_info.get("fingerprint")
        
        if not device_fingerprint:
            factors.append(RiskFactor(
                name="unknown_device",
                score=30,
                reason="Device fingerprint unavailable"
            ))
            return factors
        
        # Check if device has been used before
        existing_session = await db.execute(
            select(AuthSession).where(
                and_(
                    AuthSession.user_id == user.user_id,
                    AuthSession.device_id == device_fingerprint
                )
            ).limit(1)
        )
        
        if not existing_session.scalar_one_or_none():
            factors.append(RiskFactor(
                name="new_device",
                score=25,
                reason=f"First login from {device_info.get('device_type', 'unknown')} device"
            ))
        
        # Bot detection
        if device_info.get("is_bot", False):
            factors.append(RiskFactor(
                name="bot_detection",
                score=60,
                reason="Automated/bot user agent detected"
            ))
        
        # Mobile device risk (generally lower)
        if device_info.get("is_mobile", False):
            factors.append(RiskFactor(
                name="mobile_device",
                score=-5,
                reason="Mobile device login (generally safer)"
            ))
        
        return factors
    
    async def _assess_location_risk(self, db: AsyncSession, user: User, ip_address: str, device_info: Dict) -> List[RiskFactor]:
        """Assess location-related risk factors."""
        
        factors = []
        country_code = device_info.get("country_code", "UNKNOWN")
        
        # Check for new country
        recent_sessions = await db.execute(
            select(AuthSession).where(
                and_(
                    AuthSession.user_id == user.user_id,
                    AuthSession.created_at >= datetime.utcnow() - timedelta(days=30)
                )
            ).limit(10)
        )
        
        known_countries = set()
        for session in recent_sessions.scalars():
            # In a real implementation, you'd extract country from stored IP data
            # For now, assume we have this data
            known_countries.add("US")  # Placeholder
        
        if country_code not in known_countries and country_code != "LOCAL":
            factors.append(RiskFactor(
                name="new_location",
                score=20,
                reason=f"Login from new country: {country_code}"
            ))
        
        # High-risk countries (configurable list)
        high_risk_countries = {"TOR", "VPN", "PROXY"}  # Placeholder
        if country_code in high_risk_countries:
            factors.append(RiskFactor(
                name="high_risk_location",
                score=40,
                reason=f"Login from high-risk location: {country_code}"
            ))
        
        return factors
    
    def _assess_time_risk(self, login_time: datetime, user: User) -> List[RiskFactor]:
        """Assess time-based risk factors."""
        
        factors = []
        login_hour = login_time.hour
        
        # Unusual hours
        if (login_hour >= self.unusual_hours["start"] or 
            login_hour <= self.unusual_hours["end"]):
            factors.append(RiskFactor(
                name="unusual_time",
                score=10,
                reason=f"Login at unusual hour: {login_hour:02d}:00"
            ))
        
        # Weekend login (depends on user's typical pattern)
        if login_time.weekday() >= 5:  # Saturday=5, Sunday=6
            factors.append(RiskFactor(
                name="weekend_login",
                score=5,
                reason="Weekend login detected"
            ))
        
        return factors
    
    async def _assess_history_risk(self, db: AsyncSession, user: User, login_time: datetime) -> List[RiskFactor]:
        """Assess historical behavior risk factors."""
        
        factors = []
        
        # Skip database-dependent risk factors for now to avoid transaction conflicts
        # TODO: Implement audit_logs table and re-enable these checks
        logger.info("Skipping historical risk assessment - audit_logs table not available")
        
        return factors
    
    def _assess_account_risk(self, user: User, login_time: datetime) -> List[RiskFactor]:
        """Assess account-specific risk factors."""
        
        factors = []
        
        # Account age (newer accounts are riskier)
        try:
            # Handle timezone-aware vs naive datetime comparison
            if user.created_at:
                if user.created_at.tzinfo is None and login_time.tzinfo is not None:
                    # user.created_at is naive, login_time is aware
                    from datetime import timezone
                    user_created_at = user.created_at.replace(tzinfo=timezone.utc)
                elif user.created_at.tzinfo is not None and login_time.tzinfo is None:
                    # user.created_at is aware, login_time is naive
                    login_time = login_time.replace(tzinfo=user.created_at.tzinfo)
                    user_created_at = user.created_at
                else:
                    user_created_at = user.created_at
                
                account_age = (login_time - user_created_at).days
            else:
                # No created_at timestamp, assume new account
                account_age = 0
                
            if account_age < 7:
                factors.append(RiskFactor(
                    name="account_age",
                    score=15,
                    reason=f"New account: {account_age} days old"
                ))
            elif account_age < 30:
                factors.append(RiskFactor(
                    name="account_age",
                    score=5,
                    reason=f"Young account: {account_age} days old"
                ))
        except Exception as e:
            logger.warning(f"Could not calculate account age: {e}")
            # Assume new account for safety
            factors.append(RiskFactor(
                name="account_age",
                score=10,
                reason="Could not determine account age"
            ))
        
        # Unverified email
        if not user.email_verified:
            factors.append(RiskFactor(
                name="unverified_email",
                score=20,
                reason="Email address not verified"
            ))
        
        # Admin/privileged account
        # This would check user roles in a real implementation
        if user.is_active and hasattr(user, 'roles'):
            # Placeholder for role checking
            factors.append(RiskFactor(
                name="privilege_level",
                score=10,
                reason="Privileged account access"
            ))
        
        return factors
    
    def _determine_risk_level(self, score: float) -> RiskLevel:
        """Determine risk level from total score."""
        
        if score <= 20:
            return RiskLevel.VERY_LOW
        elif score <= 40:
            return RiskLevel.LOW
        elif score <= 60:
            return RiskLevel.MEDIUM
        elif score <= 80:
            return RiskLevel.HIGH
        else:
            return RiskLevel.VERY_HIGH
    
    def _generate_recommendations(self, score: float, factors: List[RiskFactor], user: User) -> List[str]:
        """Generate security recommendations based on risk assessment."""
        
        recommendations = []
        
        if score >= 80:
            recommendations.append("Require manual approval for this login")
            recommendations.append("Consider temporarily locking the account")
        
        if score >= 60:
            recommendations.append("Require 2FA verification")
            recommendations.append("Send security alert to user")
        
        if score >= 40:
            recommendations.append("Log detailed audit information")
            recommendations.append("Monitor session closely")
        
        # Factor-specific recommendations
        factor_names = [f.name for f in factors]
        
        if "new_device" in factor_names:
            recommendations.append("Send device verification email")
        
        if "new_location" in factor_names:
            recommendations.append("Send location verification alert")
        
        if "failed_attempts" in factor_names:
            recommendations.append("Implement progressive delays")
        
        if "bot_detection" in factor_names:
            recommendations.append("Require CAPTCHA verification")
        
        return list(set(recommendations))  # Remove duplicates


# Singleton instance
risk_scorer = RiskScoringEngine()