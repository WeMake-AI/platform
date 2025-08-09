-- =============================================================================
-- D1 Database Schema for WeMake OpenAI API Worker
-- =============================================================================
-- This schema supports:
-- - Usage tracking and analytics
-- - Rate limiting and quota management
-- - API key management and authentication
-- - Conversation history and message storage
-- - Cost tracking and billing
-- - Audit logging and security
-- - Webhook integrations
-- - User preferences and settings
--
-- Version: 1.0.0
-- Compatible with: Cloudflare D1 (SQLite)
-- Created: 2024-12-18
-- =============================================================================

-- Usage logs for tracking AI model usage and costs
CREATE TABLE IF NOT EXISTS usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  request_id TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost REAL NOT NULL DEFAULT 0.0,
  latency INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for usage_logs table
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_model ON usage_logs(model);
CREATE INDEX IF NOT EXISTS idx_usage_logs_request_id ON usage_logs(request_id);

-- Rate limiting table for tracking user requests
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  requests_count INTEGER DEFAULT 0,
  window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
  window_end DATETIME DEFAULT CURRENT_TIMESTAMP,
  window_type TEXT NOT NULL DEFAULT 'minute', -- minute, hour, day
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rate_limits table
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_type ON rate_limits(window_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);

-- API keys management table
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT,
  description TEXT,
  permissions TEXT DEFAULT 'read,write',
  rate_limit_minute INTEGER DEFAULT 60,
  rate_limit_hour INTEGER DEFAULT 1000,
  rate_limit_day INTEGER DEFAULT 10000,
  usage_quota_tokens INTEGER DEFAULT 100000,
  usage_quota_cost REAL DEFAULT 10.0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at DATETIME,
  last_used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for api_keys table
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);

-- Conversations table for tracking conversation history
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  model TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0.0,
  is_active BOOLEAN DEFAULT TRUE,
  metadata TEXT, -- JSON metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for conversations table
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_is_active ON conversations(is_active);

-- Messages table for storing individual messages in conversations
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content TEXT NOT NULL,
  tokens INTEGER DEFAULT 0,
  model TEXT,
  metadata TEXT, -- JSON metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  default_model TEXT DEFAULT 'anthropic/claude-3.5-sonnet',
  temperature REAL DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  enable_streaming BOOLEAN DEFAULT TRUE,
  enable_tool_calling BOOLEAN DEFAULT TRUE,
  privacy_mode BOOLEAN DEFAULT FALSE,
  metadata TEXT, -- JSON metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Model pricing table for cost calculations
CREATE TABLE IF NOT EXISTS model_pricing (
  id TEXT PRIMARY KEY,
  model TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  prompt_cost_per_1k REAL NOT NULL,
  completion_cost_per_1k REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for model_pricing table
CREATE INDEX IF NOT EXISTS idx_model_pricing_model ON model_pricing(model);
CREATE INDEX IF NOT EXISTS idx_model_pricing_provider ON model_pricing(provider);
CREATE INDEX IF NOT EXISTS idx_model_pricing_is_active ON model_pricing(is_active);

-- Insert default model pricing data
INSERT OR IGNORE INTO model_pricing (id, model, provider, prompt_cost_per_1k, completion_cost_per_1k) VALUES
('claude-3-5-sonnet', 'anthropic/claude-3.5-sonnet', 'anthropic', 0.003, 0.015),
('claude-3-haiku', 'anthropic/claude-3-haiku', 'anthropic', 0.00025, 0.00125),
('gpt-4-turbo', 'openai/gpt-4-turbo', 'openai', 0.01, 0.03),
('gpt-3-5-turbo', 'openai/gpt-3.5-turbo', 'openai', 0.0005, 0.0015),
('llama-3-8b', 'meta-llama/llama-3-8b-instruct', 'meta', 0.0001, 0.0002),
('mistral-7b', 'mistralai/mistral-7b-instruct', 'mistral', 0.0001, 0.0002);

-- Webhooks table for external integrations
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT NOT NULL, -- JSON array of events
  secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_delivery_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for webhooks table
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);

-- Audit logs table for security and compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT, -- JSON metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_usage_logs_timestamp 
AFTER UPDATE ON usage_logs
BEGIN
  UPDATE usage_logs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_rate_limits_timestamp 
AFTER UPDATE ON rate_limits
BEGIN
  UPDATE rate_limits SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_api_keys_timestamp 
AFTER UPDATE ON api_keys
BEGIN
  UPDATE api_keys SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_conversations_timestamp 
AFTER UPDATE ON conversations
BEGIN
  UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_messages_timestamp 
AFTER UPDATE ON messages
BEGIN
  UPDATE messages SET created_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_user_preferences_timestamp 
AFTER UPDATE ON user_preferences
BEGIN
  UPDATE user_preferences SET updated_at = CURRENT_TIMESTAMP WHERE user_id = NEW.user_id;
END;

CREATE TRIGGER IF NOT EXISTS update_model_pricing_timestamp 
AFTER UPDATE ON model_pricing
BEGIN
  UPDATE model_pricing SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_webhooks_timestamp 
AFTER UPDATE ON webhooks
BEGIN
  UPDATE webhooks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- =============================================================================
-- SESSION MANAGEMENT
-- =============================================================================

-- User sessions table for authentication and tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user_sessions table
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- =============================================================================
-- ANALYTICS AND AGGREGATION
-- =============================================================================

-- Daily usage aggregation for analytics
CREATE TABLE IF NOT EXISTS daily_usage_stats (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  user_id TEXT,
  model TEXT,
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0.0,
  avg_latency REAL DEFAULT 0.0,
  success_rate REAL DEFAULT 1.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, user_id, model)
);

-- Indexes for daily_usage_stats table
CREATE INDEX IF NOT EXISTS idx_daily_usage_stats_date ON daily_usage_stats(date);
CREATE INDEX IF NOT EXISTS idx_daily_usage_stats_user_id ON daily_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_stats_model ON daily_usage_stats(model);

-- System health metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
  id TEXT PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_unit TEXT,
  tags TEXT, -- JSON object for additional metadata
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for system_metrics table
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);

-- =============================================================================
-- FEATURE FLAGS AND CONFIGURATION
-- =============================================================================

-- Feature flags table for dynamic configuration
CREATE TABLE IF NOT EXISTS feature_flags (
  id TEXT PRIMARY KEY,
  flag_name TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_users TEXT, -- JSON array of user IDs
  conditions TEXT, -- JSON object for conditions
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for feature_flags table
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(flag_name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);

-- =============================================================================
-- ADDITIONAL TRIGGERS
-- =============================================================================

CREATE TRIGGER IF NOT EXISTS update_user_sessions_timestamp 
AFTER UPDATE ON user_sessions
BEGIN
  UPDATE user_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_daily_usage_stats_timestamp 
AFTER UPDATE ON daily_usage_stats
BEGIN
  UPDATE daily_usage_stats SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_feature_flags_timestamp 
AFTER UPDATE ON feature_flags
BEGIN
  UPDATE feature_flags SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- =============================================================================
-- MIGRATION SCRIPTS AND ENVIRONMENT SETUP
-- =============================================================================

-- Insert default feature flags
INSERT OR IGNORE INTO feature_flags (id, flag_name, is_enabled, description) VALUES
('streaming-enabled', 'streaming_enabled', true, 'Enable streaming responses for real-time output'),
('tool-calling-enabled', 'tool_calling_enabled', true, 'Enable function/tool calling capabilities'),
('conversation-history', 'conversation_history_enabled', true, 'Enable conversation history storage'),
('usage-tracking', 'usage_tracking_enabled', true, 'Enable detailed usage tracking and analytics'),
('cost-tracking', 'cost_tracking_enabled', true, 'Enable cost tracking and billing calculations'),
('rate-limiting', 'rate_limiting_enabled', true, 'Enable rate limiting for API requests'),
('webhook-notifications', 'webhook_notifications_enabled', false, 'Enable webhook notifications for events'),
('debug-mode', 'debug_mode_enabled', false, 'Enable debug mode for detailed logging'),
('cache-responses', 'cache_responses_enabled', true, 'Enable response caching for performance'),
('ai-gateway', 'ai_gateway_enabled', false, 'Enable Cloudflare AI Gateway integration');

-- =============================================================================
-- VIEWS FOR ANALYTICS AND REPORTING
-- =============================================================================

-- View for user usage summary
CREATE VIEW IF NOT EXISTS user_usage_summary AS
SELECT 
  u.user_id,
  COUNT(u.id) as total_requests,
  SUM(u.total_tokens) as total_tokens,
  SUM(u.cost) as total_cost,
  AVG(u.latency) as avg_latency,
  COUNT(CASE WHEN u.status = 'success' THEN 1 END) * 100.0 / COUNT(u.id) as success_rate,
  MIN(u.created_at) as first_request,
  MAX(u.created_at) as last_request
FROM usage_logs u
GROUP BY u.user_id;

-- View for model usage statistics
CREATE VIEW IF NOT EXISTS model_usage_stats AS
SELECT 
  u.model,
  COUNT(u.id) as total_requests,
  SUM(u.total_tokens) as total_tokens,
  SUM(u.cost) as total_cost,
  AVG(u.latency) as avg_latency,
  COUNT(CASE WHEN u.status = 'success' THEN 1 END) * 100.0 / COUNT(u.id) as success_rate,
  COUNT(DISTINCT u.user_id) as unique_users
FROM usage_logs u
GROUP BY u.model;

-- View for daily usage trends
CREATE VIEW IF NOT EXISTS daily_usage_trends AS
SELECT 
  DATE(u.created_at) as date,
  COUNT(u.id) as total_requests,
  SUM(u.total_tokens) as total_tokens,
  SUM(u.cost) as total_cost,
  AVG(u.latency) as avg_latency,
  COUNT(DISTINCT u.user_id) as unique_users,
  COUNT(DISTINCT u.model) as unique_models
FROM usage_logs u
GROUP BY DATE(u.created_at)
ORDER BY date DESC;

-- =============================================================================
-- CLEANUP AND MAINTENANCE PROCEDURES
-- =============================================================================

-- Note: These are SQL comments for maintenance procedures
-- Actual cleanup should be implemented in the application code

-- Cleanup old usage logs (older than 90 days)
-- DELETE FROM usage_logs WHERE created_at < datetime('now', '-90 days');

-- Cleanup expired sessions
-- DELETE FROM user_sessions WHERE expires_at < datetime('now') OR is_active = FALSE;

-- Cleanup old audit logs (older than 1 year)
-- DELETE FROM audit_logs WHERE created_at < datetime('now', '-1 year');

-- Cleanup old system metrics (older than 30 days)
-- DELETE FROM system_metrics WHERE timestamp < datetime('now', '-30 days');

-- Update daily usage stats (should be run daily)
-- INSERT OR REPLACE INTO daily_usage_stats (
--   id, date, user_id, model, total_requests, total_tokens, total_cost, avg_latency, success_rate
-- )
-- SELECT 
--   user_id || '-' || model || '-' || DATE(created_at) as id,
--   DATE(created_at) as date,
--   user_id,
--   model,
--   COUNT(*) as total_requests,
--   SUM(total_tokens) as total_tokens,
--   SUM(cost) as total_cost,
--   AVG(latency) as avg_latency,
--   COUNT(CASE WHEN status = 'success' THEN 1 END) * 100.0 / COUNT(*) as success_rate
-- FROM usage_logs 
-- WHERE DATE(created_at) = DATE('now', '-1 day')
-- GROUP BY DATE(created_at), user_id, model;

-- =============================================================================
-- SCHEMA VERSION AND METADATA
-- =============================================================================

-- Schema metadata table
CREATE TABLE IF NOT EXISTS schema_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert schema version and metadata
INSERT OR REPLACE INTO schema_metadata (key, value) VALUES
('schema_version', '1.0.0'),
('created_date', '2024-12-18'),
('description', 'WeMake OpenAI API Worker Database Schema'),
('compatible_with', 'Cloudflare D1 (SQLite)'),
('last_migration', datetime('now'));

-- Trigger for schema_metadata updates
CREATE TRIGGER IF NOT EXISTS update_schema_metadata_timestamp 
AFTER UPDATE ON schema_metadata
BEGIN
  UPDATE schema_metadata SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
END;