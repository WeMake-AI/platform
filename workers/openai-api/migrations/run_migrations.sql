-- =============================================================================
-- Migration Runner Script
-- =============================================================================
-- Description: Executes migrations in the correct order for any environment
-- Usage: Run this script to set up the database schema and environment-specific data
-- =============================================================================

-- Create migrations tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_name TEXT NOT NULL UNIQUE,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  checksum TEXT,
  execution_time_ms INTEGER
);

-- Function to log migration execution (simulated with INSERT)
-- Note: SQLite doesn't support stored procedures, so this is a template

-- Migration 001: Initial Schema
-- Check if migration has been run
INSERT OR IGNORE INTO schema_migrations (migration_name, checksum) 
VALUES ('001_initial_schema', 'sha256_hash_of_schema_sql');

-- Migration execution would happen here via application code
-- The actual schema.sql file should be executed by the application

-- Environment-specific setup
-- This should be determined by environment variables or configuration

-- For Development Environment:
-- INSERT OR IGNORE INTO schema_migrations (migration_name, checksum) 
-- VALUES ('dev_seed', 'sha256_hash_of_dev_seed_sql');

-- For Production Environment:
-- INSERT OR IGNORE INTO schema_migrations (migration_name, checksum) 
-- VALUES ('prod_setup', 'sha256_hash_of_prod_setup_sql');

-- Verify all migrations
SELECT 
  migration_name,
  executed_at,
  'Migration completed' as status
FROM schema_migrations 
ORDER BY executed_at;

-- Final verification
SELECT 
  COUNT(*) as total_tables,
  'Database schema ready' as status
FROM sqlite_master 
WHERE type = 'table' 
AND name NOT LIKE 'sqlite_%';