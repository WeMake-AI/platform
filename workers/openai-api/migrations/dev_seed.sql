-- =============================================================================
-- Development Environment Seed Data
-- =============================================================================
-- Description: Seed data for development environment testing
-- Environment: Development only
-- =============================================================================

-- Insert test users and API keys for development
INSERT OR IGNORE INTO api_keys (id, user_id, key_hash, name, description, permissions) VALUES
('dev-key-1', 'dev-user-1', 'hash_of_dev_key_1', 'Development Key 1', 'Primary development API key', 'read,write'),
('dev-key-2', 'dev-user-2', 'hash_of_dev_key_2', 'Development Key 2', 'Secondary development API key', 'read'),
('test-key-1', 'test-user-1', 'hash_of_test_key_1', 'Test Key 1', 'Automated testing API key', 'read,write');

-- Insert test user preferences
INSERT OR IGNORE INTO user_preferences (user_id, default_model, temperature, max_tokens) VALUES
('dev-user-1', 'anthropic/claude-3-haiku', 0.7, 2048),
('dev-user-2', 'openai/gpt-3.5-turbo', 0.5, 1024),
('test-user-1', 'anthropic/claude-3.5-sonnet', 0.8, 4096);

-- Insert sample usage logs for testing analytics
INSERT OR IGNORE INTO usage_logs (id, user_id, request_id, model, input_tokens, output_tokens, total_tokens, cost, latency, status) VALUES
('log-1', 'dev-user-1', 'req-1', 'anthropic/claude-3-haiku', 100, 150, 250, 0.001, 1200, 'success'),
('log-2', 'dev-user-1', 'req-2', 'anthropic/claude-3-haiku', 200, 300, 500, 0.002, 1500, 'success'),
('log-3', 'dev-user-2', 'req-3', 'openai/gpt-3.5-turbo', 150, 200, 350, 0.0015, 1000, 'success'),
('log-4', 'test-user-1', 'req-4', 'anthropic/claude-3.5-sonnet', 500, 800, 1300, 0.01, 2000, 'success');

-- Enable debug features for development
UPDATE feature_flags SET is_enabled = true WHERE flag_name IN (
  'debug_mode_enabled',
  'streaming_enabled',
  'tool_calling_enabled',
  'conversation_history_enabled',
  'usage_tracking_enabled',
  'cost_tracking_enabled'
);

-- Insert development-specific feature flags
INSERT OR IGNORE INTO feature_flags (id, flag_name, is_enabled, description) VALUES
('dev-mock-mode', 'dev_mock_mode_enabled', false, 'Enable mock mode for development testing'),
('dev-verbose-logging', 'dev_verbose_logging_enabled', true, 'Enable verbose logging for development'),
('dev-bypass-rate-limits', 'dev_bypass_rate_limits_enabled', true, 'Bypass rate limits for development testing');

SELECT 'Development seed data inserted successfully' as status;