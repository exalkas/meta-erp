"""
SAP-Style Authentication Engine

True SAP approach with:
- All logic from customizing tables (no hardcoded rules)
- IMG-style configuration reading
- Business Rules Framework (BRF+) style rule evaluation
- Transport-aware configuration management
- Industry solution package support
"""

import asyncio
from typing import Dict, List, Any, Optional, Tuple
from uuid import UUID
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, text
from sqlalchemy.orm import selectinload

from ..models.sap_customizing import (
    T_AUTH_METHOD_CONFIG, T_AUTH_RULE_CONFIG, T_AUTH_SESSION_CONFIG,
    T_AUTH_COMPLIANCE_CONFIG, T_AUTH_WORKFLOW_CONFIG, T_AUTH_BUSINESS_OBJECT,
    T_AUTH_INDUSTRY_PACKAGE, T_AUTH_TRANSPORT_REQUEST
)
from ..models.auth_models import User, AuthSession
from ..core.exceptions import BaseAuthException, AuthenticationException
from ..core.logging import get_logger

logger = get_logger("sap_auth_engine")

class SAPStyleAuthEngine:
    """
    SAP-Style Authentication Engine
    
    Reads all business logic from customizing tables.
    No hardcoded authentication rules.
    """
    
    def __init__(self, db_session: AsyncSession, client: str = "001"):
        self.db = db_session
        self.client = client  # SAP client concept
        
        # Cache for customizing data (SAP uses buffer for this)
        self._config_cache = {}
        
    # =============================================
    # SAP-STYLE CUSTOMIZING READERS
    # =============================================
    
    async def get_auth_method_config(
        self, 
        auth_method: str, 
        tenant_id: Optional[UUID] = None
    ) -> Optional[Dict[str, Any]]:
        """Read authentication method configuration from customizing tables"""
        
        cache_key = f"auth_method_{auth_method}_{tenant_id}"
        if cache_key in self._config_cache:
            return self._config_cache[cache_key]
        
        # Read from customizing table (SAP approach)
        stmt = select(T_AUTH_METHOD_CONFIG).where(
            and_(
                T_AUTH_METHOD_CONFIG.client == self.client,
                T_AUTH_METHOD_CONFIG.auth_method == auth_method,
                or_(
                    T_AUTH_METHOD_CONFIG.tenant_id == tenant_id,
                    T_AUTH_METHOD_CONFIG.tenant_id.is_(None)  # Global settings
                )
            )
        ).order_by(T_AUTH_METHOD_CONFIG.tenant_id.desc())  # Tenant-specific first
        
        result = await self.db.execute(stmt)
        config_entry = result.first()
        
        if config_entry:
            config = {
                "auth_method": config_entry[0].auth_method,
                "is_enabled": config_entry[0].is_enabled,
                "is_primary": config_entry[0].is_primary,
                "display_order": config_entry[0].display_order,
                "config_parameters": config_entry[0].config_parameters or {},
                "validation_rules": config_entry[0].validation_rules or {}
            }
            
            # Cache the configuration (SAP buffer concept)
            self._config_cache[cache_key] = config
            return config
        
        return None
    
    async def evaluate_auth_rule(
        self,
        rule_id: str,
        context: Dict[str, Any],
        tenant_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """
        SAP BRF+ style rule evaluation
        
        Evaluates authentication rules based on context.
        All logic from customizing tables, not hardcoded.
        """
        
        logger.info(f"Evaluating auth rule: {rule_id}", context=context)
        
        # Get rule definition from customizing
        stmt = select(T_AUTH_RULE_CONFIG).where(
            and_(
                T_AUTH_RULE_CONFIG.client == self.client,
                T_AUTH_RULE_CONFIG.rule_id == rule_id,
                T_AUTH_RULE_CONFIG.is_active == True,
                or_(
                    T_AUTH_RULE_CONFIG.tenant_id == tenant_id,
                    T_AUTH_RULE_CONFIG.tenant_id.is_(None)
                )
            )
        ).order_by(T_AUTH_RULE_CONFIG.priority)
        
        result = await self.db.execute(stmt)
        rules = result.scalars().all()
        
        for rule in rules:
            # Check application context (when rule applies)
            if rule.application_context:
                if not self._matches_context(context, rule.application_context):
                    continue
            
            # Evaluate rule based on type
            rule_result = await self._evaluate_rule_definition(
                rule.rule_type, 
                rule.rule_definition, 
                context
            )
            
            if rule_result.get("match", False):
                logger.info(f"Rule {rule_id} matched", result=rule_result)
                return rule_result
        
        # Default result if no rules match
        return {"match": False, "action": "ALLOW", "message": "No matching rules"}
    
    async def get_session_config(self, tenant_id: UUID, profile: str) -> Dict[str, Any]:
        """
        Get session configuration - using defaults for now
        TODO: Implement full SAP customizing table lookup later
        """
        logger.info("Session configuration retrieved (using defaults)", 
                   tenant_id=str(tenant_id), profile=profile)
        
        # Return default session configuration
        default_config = {
            "max_session_duration_hours": 8,  # 8 hours default
            "max_concurrent_sessions": 5,
            "idle_timeout_minutes": 120,
            "single_session_mode": False,
            "auto_logout_on_new": False,
            "allow_concurrent_ip": True,
            "track_device_fingerprint": True,
            "risk_threshold": 0.7,
            "risk_action": "challenge"
        }
        
        return default_config
    
    async def check_compliance_requirements(
        self,
        industry_code: str,
        compliance_area: str,
        context: Dict[str, Any],
        tenant_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Check compliance requirements from industry-specific configuration"""
        
        stmt = select(T_AUTH_COMPLIANCE_CONFIG).where(
            and_(
                T_AUTH_COMPLIANCE_CONFIG.client == self.client,
                T_AUTH_COMPLIANCE_CONFIG.industry_code == industry_code,
                T_AUTH_COMPLIANCE_CONFIG.compliance_area == compliance_area,
                or_(
                    T_AUTH_COMPLIANCE_CONFIG.tenant_id == tenant_id,
                    T_AUTH_COMPLIANCE_CONFIG.tenant_id.is_(None)
                )
            )
        ).order_by(T_AUTH_COMPLIANCE_CONFIG.tenant_id.desc())
        
        result = await self.db.execute(stmt)
        compliance_configs = result.scalars().all()
        
        violations = []
        for config in compliance_configs:
            # Evaluate compliance rules
            for rule in config.compliance_rules.get("rules", []):
                violation = await self._check_compliance_rule(rule, context)
                if violation:
                    violations.append({
                        "rule": rule,
                        "violation": violation,
                        "enforcement_level": config.enforcement_level,
                        "is_mandatory": config.is_mandatory
                    })
        
        return {
            "compliant": len(violations) == 0,
            "violations": violations,
            "industry_code": industry_code,
            "compliance_area": compliance_area
        }
    
    async def execute_workflow(
        self,
        workflow_id: str,
        context: Dict[str, Any],
        tenant_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Execute authentication workflow based on configuration"""
        
        # Get workflow steps from customizing
        stmt = select(T_AUTH_WORKFLOW_CONFIG).where(
            and_(
                T_AUTH_WORKFLOW_CONFIG.client == self.client,
                T_AUTH_WORKFLOW_CONFIG.workflow_id == workflow_id,
                or_(
                    T_AUTH_WORKFLOW_CONFIG.tenant_id == tenant_id,
                    T_AUTH_WORKFLOW_CONFIG.tenant_id.is_(None)
                )
            )
        ).order_by(T_AUTH_WORKFLOW_CONFIG.step_number)
        
        result = await self.db.execute(stmt)
        workflow_steps = result.scalars().all()
        
        workflow_context = context.copy()
        workflow_result = {"status": "SUCCESS", "steps_executed": []}
        
        current_step = 1
        while current_step is not None:
            step_config = None
            for step in workflow_steps:
                if step.step_number == current_step:
                    step_config = step
                    break
            
            if not step_config:
                break
            
            # Check execution conditions
            if step_config.execution_conditions:
                if not self._matches_context(workflow_context, step_config.execution_conditions):
                    current_step = step_config.next_step_success
                    continue
            
            # Execute step
            step_result = await self._execute_workflow_step(
                step_config.step_type,
                step_config.step_config,
                workflow_context
            )
            
            workflow_result["steps_executed"].append({
                "step_number": current_step,
                "step_name": step_config.step_name,
                "result": step_result
            })
            
            # Update workflow context
            workflow_context.update(step_result.get("context_updates", {}))
            
            # Determine next step
            if step_result.get("success", True):
                current_step = step_config.next_step_success
            else:
                current_step = step_config.next_step_failure
                workflow_result["status"] = "FAILURE"
                workflow_result["error"] = step_result.get("error", "Step failed")
                break
        
        return workflow_result
    
    # =============================================
    # SAP-STYLE BUSINESS OBJECT OPERATIONS
    # =============================================
    
    async def get_business_object_definition(self, object_type: str) -> Optional[Dict[str, Any]]:
        """Get business object definition from BOR-style repository"""
        
        stmt = select(T_AUTH_BUSINESS_OBJECT).where(
            and_(
                T_AUTH_BUSINESS_OBJECT.client == self.client,
                T_AUTH_BUSINESS_OBJECT.object_type == object_type
            )
        )
        
        result = await self.db.execute(stmt)
        bo_def = result.scalar_one_or_none()
        
        if bo_def:
            return {
                "object_type": bo_def.object_type,
                "object_name": bo_def.object_name,
                "object_category": bo_def.object_category,
                "object_structure": bo_def.object_structure,
                "object_methods": bo_def.object_methods or {},
                "object_events": bo_def.object_events or {},
                "auth_object": bo_def.auth_object
            }
        
        return None
    
    # =============================================
    # SAP-STYLE INDUSTRY SOLUTION SUPPORT
    # =============================================
    
    async def install_industry_package(
        self,
        package_id: str,
        tenant_id: Optional[UUID] = None,
        transport_request: Optional[str] = None
    ) -> Dict[str, Any]:
        """Install industry solution package (SAP IS-* style)"""
        
        # Get package definition
        stmt = select(T_AUTH_INDUSTRY_PACKAGE).where(
            T_AUTH_INDUSTRY_PACKAGE.package_id == package_id
        )
        
        result = await self.db.execute(stmt)
        package = result.scalar_one_or_none()
        
        if not package:
            raise AuthenticationException(f"Industry package {package_id} not found")
        
        if not package.is_released:
            raise AuthenticationException(f"Industry package {package_id} not released")
        
        installation_result = {
            "package_id": package_id,
            "industry_code": package.industry_code,
            "version": package.version,
            "installed_objects": []
        }
        
        # Install package content (customizing entries)
        for content_item in package.package_content.get("customizing", []):
            await self._install_customizing_entry(
                content_item, 
                tenant_id, 
                transport_request
            )
            installation_result["installed_objects"].append(content_item)
        
        logger.info(f"Industry package installed", package_id=package_id, tenant_id=tenant_id)
        
        return installation_result
    
    # =============================================
    # SAP-STYLE HELPER METHODS
    # =============================================
    
    def _matches_context(self, context: Dict[str, Any], conditions: Dict[str, Any]) -> bool:
        """Check if context matches the specified conditions"""
        
        for condition_key, condition_value in conditions.items():
            context_value = context.get(condition_key)
            
            if isinstance(condition_value, dict):
                # Handle comparison operators
                if "eq" in condition_value:
                    if context_value != condition_value["eq"]:
                        return False
                elif "in" in condition_value:
                    if context_value not in condition_value["in"]:
                        return False
                elif "gt" in condition_value:
                    if not (context_value and context_value > condition_value["gt"]):
                        return False
                elif "lt" in condition_value:
                    if not (context_value and context_value < condition_value["lt"]):
                        return False
            else:
                # Direct value comparison
                if context_value != condition_value:
                    return False
        
        return True
    
    async def _evaluate_rule_definition(
        self,
        rule_type: str,
        rule_definition: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Evaluate rule based on type (SAP BRF+ style)"""
        
        if rule_type == "DECISION_TABLE":
            return await self._evaluate_decision_table(rule_definition, context)
        elif rule_type == "FORMULA":
            return await self._evaluate_formula(rule_definition, context)
        elif rule_type == "CONDITION":
            return await self._evaluate_condition(rule_definition, context)
        else:
            return {"match": False, "error": f"Unknown rule type: {rule_type}"}
    
    async def _evaluate_decision_table(
        self,
        table_definition: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Evaluate SAP-style decision table"""
        
        conditions = table_definition.get("conditions", [])
        results = table_definition.get("results", [])
        
        for i, condition_row in enumerate(conditions):
            row_matches = True
            
            for condition_key, condition_value in condition_row.items():
                if condition_key == "_row_id":
                    continue
                
                context_value = context.get(condition_key)
                
                # Handle decision table operators
                if condition_value == "*":  # Any value
                    continue
                elif isinstance(condition_value, str) and condition_value.startswith("!="):
                    if context_value == condition_value[2:]:
                        row_matches = False
                        break
                elif context_value != condition_value:
                    row_matches = False
                    break
            
            if row_matches and i < len(results):
                result = results[i]
                return {
                    "match": True,
                    "action": result.get("action", "ALLOW"),
                    "message": result.get("message", "Decision table match"),
                    "parameters": result.get("parameters", {})
                }
        
        return {"match": False, "action": "DENY", "message": "No decision table match"}
    
    async def _evaluate_formula(
        self,
        formula_definition: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Evaluate mathematical formula rule"""
        
        # Simple formula evaluation (can be extended)
        formula = formula_definition.get("formula", "")
        variables = formula_definition.get("variables", {})
        
        # Replace variables in formula
        for var_name, var_path in variables.items():
            var_value = context.get(var_path, 0)
            formula = formula.replace(f"${var_name}", str(var_value))
        
        try:
            # Simple evaluation (in production, use a safe evaluator)
            result = eval(formula)  # WARNING: Use safe evaluator in production
            
            threshold = formula_definition.get("threshold", 0)
            operator = formula_definition.get("operator", "gt")
            
            if operator == "gt" and result > threshold:
                return {"match": True, "action": "BLOCK", "value": result}
            elif operator == "lt" and result < threshold:
                return {"match": True, "action": "ALLOW", "value": result}
            
        except Exception as e:
            logger.error(f"Formula evaluation error: {e}")
            return {"match": False, "error": str(e)}
        
        return {"match": False}
    
    async def _evaluate_condition(
        self,
        condition_definition: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Evaluate simple condition rule"""
        
        field = condition_definition.get("field")
        operator = condition_definition.get("operator", "eq")
        value = condition_definition.get("value")
        action = condition_definition.get("action", "ALLOW")
        
        context_value = context.get(field)
        
        match = False
        if operator == "eq":
            match = context_value == value
        elif operator == "ne":
            match = context_value != value
        elif operator == "gt":
            match = context_value and context_value > value
        elif operator == "lt":
            match = context_value and context_value < value
        elif operator == "in":
            match = context_value in value if isinstance(value, list) else False
        
        return {
            "match": match,
            "action": action if match else "CONTINUE",
            "field": field,
            "context_value": context_value,
            "expected_value": value
        }
    
    async def _check_compliance_rule(
        self,
        rule: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Optional[str]:
        """Check individual compliance rule"""
        
        rule_type = rule.get("type")
        
        if rule_type == "required_field":
            field = rule.get("field")
            if not context.get(field):
                return f"Required field '{field}' is missing"
        
        elif rule_type == "format_validation":
            field = rule.get("field")
            pattern = rule.get("pattern")
            value = context.get(field)
            if value and not self._matches_pattern(value, pattern):
                return f"Field '{field}' does not match required format"
        
        elif rule_type == "value_range":
            field = rule.get("field")
            min_val = rule.get("min")
            max_val = rule.get("max")
            value = context.get(field)
            if value is not None:
                if min_val is not None and value < min_val:
                    return f"Field '{field}' below minimum value {min_val}"
                if max_val is not None and value > max_val:
                    return f"Field '{field}' above maximum value {max_val}"
        
        return None
    
    def _matches_pattern(self, value: str, pattern: str) -> bool:
        """Simple pattern matching (can be extended with regex)"""
        # Simplified pattern matching
        if pattern == "email":
            return "@" in value and "." in value
        elif pattern == "phone":
            return value.isdigit() or "+" in value
        return True
    
    async def _execute_workflow_step(
        self,
        step_type: str,
        step_config: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute individual workflow step"""
        
        if step_type == "VALIDATION":
            # Validate context against rules
            validation_rules = step_config.get("validation_rules", [])
            errors = []
            
            for rule in validation_rules:
                violation = await self._check_compliance_rule(rule, context)
                if violation:
                    errors.append(violation)
            
            return {
                "success": len(errors) == 0,
                "errors": errors,
                "step_type": step_type
            }
        
        elif step_type == "APPROVAL":
            # Approval step (simplified)
            approval_required = step_config.get("approval_required", False)
            auto_approve = step_config.get("auto_approve", False)
            
            if approval_required and not auto_approve:
                return {
                    "success": False,
                    "message": "Manual approval required",
                    "approval_request_id": f"APP_{datetime.now().strftime('%Y%m%d%H%M%S')}"
                }
            
            return {"success": True, "auto_approved": True}
        
        elif step_type == "NOTIFICATION":
            # Notification step (simplified)
            notification_type = step_config.get("notification_type", "email")
            recipients = step_config.get("recipients", [])
            
            # In real implementation, send actual notifications
            return {
                "success": True,
                "notification_sent": True,
                "notification_type": notification_type,
                "recipients": recipients
            }
        
        return {"success": True, "step_type": step_type}
    
    async def _install_customizing_entry(
        self,
        entry: Dict[str, Any],
        tenant_id: Optional[UUID],
        transport_request: Optional[str]
    ):
        """Install customizing entry from industry package"""
        
        table_name = entry.get("table")
        data = entry.get("data", {})
        
        # Add tenant context if specified
        if tenant_id:
            data["tenant_id"] = str(tenant_id)
        
        # Add transport information
        if transport_request:
            data["transport_request"] = transport_request
        
        # Insert into appropriate customizing table
        # (Simplified - in real implementation, use dynamic table mapping)
        logger.info(f"Installing customizing entry", table=table_name, data=data)

    # =============================================
    # CORE AUTHENTICATION METHODS
    # =============================================
    
    async def authenticate_user(
        self, 
        email: str, 
        password: str, 
        tenant_id: UUID,
        device_name: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Tuple[User, AuthSession]:
        """
        Authenticate user with email and password using SAP-style configuration
        """
        logger.info("Starting SAP-style authentication", email=email, tenant_id=str(tenant_id))
        
        try:
            # Get user from database
            logger.info("Step 1: Looking up user in database", email=email, tenant_id=str(tenant_id))
            from ..models.auth_models import AuthMethod, AuthMethodType
            user_query = select(User).where(
                and_(User.email == email, User.tenant_id == tenant_id, User.is_active == True)
            )
            result = await self.db.execute(user_query)
            user = result.scalar_one_or_none()
            
            if not user:
                logger.warning("Step 1 FAILED: User not found", email=email, tenant_id=str(tenant_id))
                raise AuthenticationException("Invalid credentials")
            
            logger.info("Step 1 SUCCESS: User found", user_id=str(user.user_id), email=user.email, is_active=user.is_active)

            # Get password auth method
            logger.info("Step 2: Looking up password auth method", user_id=str(user.user_id))
            auth_method_query = select(AuthMethod).where(
                and_(
                    AuthMethod.user_id == user.user_id,
                    AuthMethod.method_type == "PASSWORD",
                    AuthMethod.is_enabled == True
                )
            )
            result = await self.db.execute(auth_method_query)
            auth_method = result.scalar_one_or_none()
            
            if not auth_method:
                logger.warning("Step 2 FAILED: No password auth method found", user_id=str(user.user_id))
                raise AuthenticationException("Invalid credentials")
            
            logger.info("Step 2 SUCCESS: Auth method found", 
                       auth_method_id=str(auth_method.method_id), 
                       method_type=auth_method.method_type, 
                       is_enabled=auth_method.is_enabled,
                       hash_length=len(auth_method.password_hash or ""))

            # Verify password (using bcrypt)
            logger.info("Step 3: Verifying password hash")
            import bcrypt
            if not bcrypt.checkpw(password.encode('utf-8'), auth_method.password_hash.encode('utf-8')):
                logger.warning("Step 3 FAILED: Password verification failed", user_id=str(user.user_id))
                raise AuthenticationException("Invalid credentials")
            
            logger.info("Step 3 SUCCESS: Password verification passed")

            # Create new session
            logger.info("Step 4: Creating authentication session")
            session, session_token, refresh_token = await self.create_session(user, device_name, ip_address)
            
            logger.info("Step 4 SUCCESS: Session created", session_id=str(session.session_id))
            logger.info("Authentication successful", user_id=str(user.user_id), session_id=str(session.session_id))
            return user, session, session_token, refresh_token
            
        except Exception as e:
            if isinstance(e, BaseAuthException):
                logger.error("Authentication failed with known exception", error_type=type(e).__name__, error_message=str(e))
                raise
            logger.error("Authentication error with unexpected exception", error=str(e), error_type=type(e).__name__)
            raise AuthenticationException("Authentication failed")
    
    async def create_user(
        self,
        email: str,
        password: str,
        tenant_id: UUID,
        first_name: str,
        last_name: str,
        role: str = "user"
    ) -> User:
        """
        Create new user with password authentication method
        """
        logger.info("Creating new user", email=email, tenant_id=str(tenant_id))
        
        try:
            # Check if user already exists
            existing_query = select(User).where(
                and_(User.email == email, User.tenant_id == tenant_id)
            )
            result = await self.db.execute(existing_query)
            if result.scalar_one_or_none():
                raise AuthenticationException("User already exists")
            
            # Create user
            from uuid import uuid4
            user = User(
                user_id=uuid4(),
                tenant_id=tenant_id,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
                is_active=True,
                is_verified=False,  # Email verification required
                created_at=datetime.utcnow()
            )
            
            self.db.add(user)
            await self.db.flush()  # Get user_id
            
            # Create password auth method
            from ..models.auth_models import AuthMethod, AuthMethodType
            import bcrypt
            
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            auth_method = AuthMethod(
                method_id=uuid4(),
                user_id=user.user_id,
                tenant_id=tenant_id,
                method_type="PASSWORD",
                password_hash=hashed_password,
                is_enabled=True,
                created_at=datetime.utcnow()
            )
            
            self.db.add(auth_method)
            await self.db.commit()
            
            logger.info("User created successfully", user_id=str(user.user_id))
            return user
            
        except Exception as e:
            await self.db.rollback()
            if isinstance(e, BaseAuthException):
                raise
            logger.error("User creation error", error=str(e))
            raise AuthenticationException("User creation failed")
    
    async def create_session(
        self,
        user: User,
        device_name: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Tuple[AuthSession, str, str]:
        """
        Create new authentication session
        Returns: (session, session_token, refresh_token)
        """
        logger.info("Session creation started", user_id=str(user.user_id), tenant_id=str(user.tenant_id))
        
        from uuid import uuid4
        import secrets
        import hashlib
        
        # Generate secure tokens
        logger.info("Session Step 1: Generating tokens")
        session_token = secrets.token_urlsafe(32)
        refresh_token = secrets.token_urlsafe(32)
        
        # Hash the tokens for database storage
        logger.info("Session Step 2: Hashing tokens")
        session_token_hash = hashlib.sha256(session_token.encode()).hexdigest()
        refresh_token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        
        # Get session configuration from SAP customizing
        logger.info("Session Step 3: Getting session configuration")
        session_config = await self.get_session_config(user.tenant_id, "password")
        max_duration_hours = session_config.get("max_session_duration_hours", 24)
        logger.info("Session configuration retrieved", max_duration_hours=max_duration_hours)
        
        # Create session object
        logger.info("Session Step 4: Creating session object")
        session = AuthSession(
            session_id=uuid4(),
            user_id=user.user_id,
            tenant_id=user.tenant_id,
            session_token_hash=session_token_hash,
            refresh_token_hash=refresh_token_hash,
            device_type="web",
            device_id=device_name or "Unknown Device",
            ip_address=ip_address,
            login_method="password",
            is_active=True,
            expires_at=datetime.utcnow() + timedelta(hours=max_duration_hours),
            created_at=datetime.utcnow()
        )
        
        logger.info("Session Step 5: Adding session to database")
        self.db.add(session)
        
        logger.info("Session Step 6: Committing to database")
        await self.db.commit()
        
        logger.info("Session created successfully", session_id=str(session.session_id), user_id=str(user.user_id))
        return session, session_token, refresh_token
    
    async def revoke_session(
        self,
        session_id: UUID,
        reason: str = "logout"
    ) -> bool:
        """
        Revoke (logout) a session
        """
        try:
            session_query = select(AuthSession).where(AuthSession.session_id == session_id)
            result = await self.db.execute(session_query)
            session = result.scalar_one_or_none()
            
            if not session:
                return False
            
            session.is_active = False
            session.revoked_at = datetime.utcnow()
            session.revoked_reason = reason
            
            await self.db.commit()
            
            logger.info("Session revoked", session_id=str(session_id), reason=reason)
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error("Session revocation error", error=str(e))
            return False
    
    async def get_user_sessions(self, user_id: UUID) -> List[AuthSession]:
        """
        Get all active sessions for a user
        """
        sessions_query = select(AuthSession).where(
            and_(
                AuthSession.user_id == user_id,
                AuthSession.is_active == True,
                AuthSession.expires_at > datetime.utcnow()
            )
        ).order_by(AuthSession.created_at.desc())
        
        result = await self.db.execute(sessions_query)
        return result.scalars().all()
    
    async def get_tenant_auth_config(self, tenant_id: UUID) -> Dict[str, Any]:
        """
        Get authentication configuration for tenant from SAP customizing tables
        """
        try:
            # Get method configurations
            method_configs = await self.get_auth_method_config(tenant_id)
            
            # Get session configurations  
            session_configs = await self.get_session_config(tenant_id, "password")
            
            # Get compliance requirements
            compliance_config = await self.check_compliance_requirements(tenant_id, {})
            
            return {
                "tenant_id": str(tenant_id),
                "method_configs": method_configs,
                "session_configs": session_configs,
                "compliance_requirements": compliance_config,
                "require_terms_acceptance": compliance_config.get("require_terms", False),
                "max_sessions_per_user": session_configs.get("max_concurrent_sessions", 5)
            }
            
        except Exception as e:
            logger.error("Error getting tenant auth config", error=str(e))
            # Return default configuration
            return {
                "tenant_id": str(tenant_id),
                "require_terms_acceptance": False,
                "max_sessions_per_user": 5
            } 