-- Migration: Add is_template and vertical fields to roles table
-- Date: 2025-01-30
-- Purpose: Support role template system and vertical-specific roles

-- Add is_template column for template role flagging
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- Add vertical column for industry vertical classification
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS vertical VARCHAR(50);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_template ON roles(is_template);
CREATE INDEX IF NOT EXISTS idx_role_vertical ON roles(vertical);

-- Add comments for documentation
COMMENT ON COLUMN roles.is_template IS 'Flag indicating if this role is a template for tenant onboarding';
COMMENT ON COLUMN roles.vertical IS 'Industry vertical (ecommerce, automotive, oilgas, agtech, fintech, insurance, maritime)';

-- Update existing template roles (these are from our JSON seed data)
-- System roles remain unchanged, business roles become templates
UPDATE roles 
SET is_template = TRUE 
WHERE tenant_id IS NULL 
  AND is_system_role = FALSE
  AND name IN (
    'BUSINESS_OWNER', 
    'MANAGER', 
    'OPERATIONS_MANAGER', 
    'SALES_MANAGER', 
    'FINANCE_CONTROLLER', 
    'ACCOUNTANT', 
    'COMPLIANCE_OFFICER', 
    'EMPLOYEE', 
    'CUSTOMER_SERVICE_REP', 
    'READ_ONLY_USER'
  );

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Added is_template and vertical fields to roles table';
END $$;