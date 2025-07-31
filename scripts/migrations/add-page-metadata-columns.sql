-- Add metadata-driven fields to page_definitions table
-- New build migration: Adding callbacks, initial_state, api_endpoints, etc.

-- Add new columns for metadata-driven features
ALTER TABLE page_definitions 
ADD COLUMN IF NOT EXISTS initial_state JSONB,
ADD COLUMN IF NOT EXISTS state_bindings JSONB,
ADD COLUMN IF NOT EXISTS api_endpoints JSONB,
ADD COLUMN IF NOT EXISTS callbacks JSONB,
ADD COLUMN IF NOT EXISTS real_time_updates BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cache_strategy VARCHAR(50),
ADD COLUMN IF NOT EXISTS websocket_events JSONB;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_callbacks ON page_definitions USING gin(callbacks);
CREATE INDEX IF NOT EXISTS idx_page_api_endpoints ON page_definitions USING gin(api_endpoints);
CREATE INDEX IF NOT EXISTS idx_page_real_time ON page_definitions(real_time_updates);

-- Update existing login page with metadata
UPDATE page_definitions 
SET 
  initial_state = '{"isLoading": false, "errorMessage": null, "showTwoFactor": false}',
  api_endpoints = '{"login": "/auth/login/password", "magicLink": "/auth/login/magic-link", "twoFactor": "/auth/login/totp"}',
  callbacks = '{"onLoginSuccess": "redirect:/dashboard", "onLoginError": "state.errorMessage", "onTwoFactorRequired": "state.showTwoFactor=true"}',
  state_bindings = '{"user.isAuthenticated": "auth.isLoggedIn", "form.isSubmitting": "ui.loading.login"}',
  real_time_updates = FALSE,
  cache_strategy = 'no-cache'
WHERE page_name = 'login_page';

-- Verify the update
SELECT page_name, callbacks, api_endpoints FROM page_definitions WHERE page_name = 'login_page';