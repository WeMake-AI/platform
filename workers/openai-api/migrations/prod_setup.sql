-- =============================================================================
-- Production Environment Setup
-- =============================================================================
-- Description: Production-specific configurations and security settings
-- Environment: Production only
-- =============================================================================

-- Ensure all security features are enabled
UPDATE feature_flags SET is_enabled = true WHERE flag_name IN (
  'rate_limiting_enabled',
  'usage_tracking_enabled',
  'cost_tracking_enabled',
  'audit_logging_enabled',
  'security_headers_enabled',
  'input_validation_enabled'
);

-- Disable debug features for production
UPDATE feature_flags SET is_enabled = false WHERE flag_name IN (
  'debug_mode_enabled',
  'verbose_logging_enabled',
  'mock_mode_enabled'
);

-- Insert production-specific feature flags
INSERT OR IGNORE INTO feature_flags (id, flag_name, is_enabled, description) VALUES
('prod-strict-validation', 'prod_strict_validation_enabled', true, 'Enable strict input validation for production'),
('prod-enhanced-monitoring', 'prod_enhanced_monitoring_enabled', true, 'Enable enhanced monitoring and alerting'),
('prod-data-retention', 'prod_data_retention_enabled', true, 'Enable automatic data retention policies');

-- Set conservative default model pricing for cost control
UPDATE model_pricing SET 
  input_cost_per_1k = input_cost_per_1k * 1.1,
  output_cost_per_1k = output_cost_per_1k * 1.1
WHERE provider IN ('openai', 'anthropic');

-- Create production admin user (placeholder - should be configured via environment)
-- Note: This should be replaced with proper admin setup in production deployment
INSERT OR IGNORE INTO api_keys (id, user_id, key_hash, name, description, permissions, rate_limit_per_minute, rate_limit_per_hour, rate_limit_per_day) VALUES
('prod-admin-key', 'prod-admin', 'REPLACE_WITH_SECURE_HASH', 'Production Admin Key', 'Administrative access for production monitoring', 'admin,read,write', 1000, 10000, 100000);

-- Insert system monitoring preferences
INSERT OR IGNORE INTO user_preferences (user_id, default_model, temperature, max_tokens, streaming_enabled) VALUES
('prod-admin', 'anthropic/claude-3.5-sonnet', 0.3, 4096, true);

-- Create initial system metrics entry
INSERT OR IGNORE INTO system_metrics (id, metric_name, metric_value, metric_type) VALUES
('sys-startup', 'system_startup', datetime('now'), 'timestamp'),
('sys-version', 'schema_version', '1.0.0', 'string'),
('sys-environment', 'environment', 'production', 'string');

-- Log production setup in audit log
INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, metadata) VALUES
('audit-prod-setup', 'system', 'production_setup', 'system', 'database', json_object('version', '1.0.0', 'timestamp', datetime('now')));

SELECT 'Production setup completed successfully' as status;