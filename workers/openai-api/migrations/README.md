# Database Schema and Migrations

This directory contains the database schema and migration files for the OpenAI
API worker.

## Overview

The database schema supports:

- **Usage Tracking**: Monitor API usage, costs, and performance
- **Rate Limiting**: Track and enforce rate limits per user/IP
- **API Key Management**: Secure API key storage and permissions
- **Conversation History**: Store and retrieve conversation data
- **Cost Tracking**: Monitor and analyze API costs
- **Audit Logging**: Security and compliance tracking
- **Analytics**: Usage statistics and reporting
- **Feature Flags**: Dynamic feature control
- **User Preferences**: Customizable user settings

## Files

### Core Schema

- `../schema.sql` - Complete database schema with all tables, indexes, and
  triggers

### Migrations

- `001_initial_schema.sql` - Initial schema setup (references main schema.sql)
- `dev_seed.sql` - Development environment seed data and test configurations
- `prod_setup.sql` - Production environment security and monitoring setup
- `run_migrations.sql` - Migration runner script with tracking

### Documentation

- `README.md` - This file

## Database Tables

### Core Tables

1. **usage_logs** - Track API usage, tokens, costs, and latency
2. **rate_limits** - Monitor rate limiting by user/IP
3. **api_keys** - Manage API keys with permissions and quotas
4. **conversations** - Store conversation metadata and history
5. **messages** - Individual messages within conversations
6. **user_preferences** - User-specific settings and defaults
7. **model_pricing** - Cost calculation data for different models

### System Tables

8. **webhooks** - External integration endpoints and delivery tracking
9. **audit_logs** - Security and compliance audit trail
10. **user_sessions** - Session management and tracking
11. **feature_flags** - Dynamic feature control and A/B testing
12. **daily_usage_stats** - Aggregated daily usage statistics
13. **system_metrics** - System performance and health metrics
14. **schema_metadata** - Schema versioning and migration tracking

## Migration Process

### Development Environment

```bash
# 1. Run initial schema
wrangler d1 execute openai-api-dev --file=001_initial_schema.sql

# 2. Load development seed data
wrangler d1 execute openai-api-dev --file=dev_seed.sql
```

### Staging Environment

```bash
# 1. Run initial schema
wrangler d1 execute openai-api-staging --file=001_initial_schema.sql

# 2. Optional: Load minimal test data (create staging_seed.sql if needed)
```

### Production Environment

```bash
# 1. Run initial schema
wrangler d1 execute openai-api-prod --file=001_initial_schema.sql

# 2. Apply production configurations
wrangler d1 execute openai-api-prod --file=prod_setup.sql
```

## Environment-Specific Configurations

### Development

- Test API keys and users
- Sample usage data for testing
- Debug features enabled
- Relaxed rate limits
- Verbose logging enabled

### Production

- Security features enabled
- Strict rate limiting
- Audit logging active
- Debug features disabled
- Enhanced monitoring
- Data retention policies

## Schema Versioning

The schema includes a `schema_metadata` table that tracks:

- Schema version
- Migration history
- Last update timestamp
- Environment information

## Analytics Views

The schema includes several views for analytics:

- `user_usage_summary` - Per-user usage aggregation
- `model_usage_stats` - Model usage statistics
- `daily_usage_trends` - Daily usage trend analysis

## Maintenance

### Regular Tasks

1. **Data Cleanup**: Remove old logs and sessions (see commented procedures in
   schema.sql)
2. **Index Optimization**: Monitor query performance and adjust indexes
3. **Cost Analysis**: Review model pricing and usage patterns
4. **Security Audit**: Regular review of API keys and permissions

### Monitoring Queries

```sql
-- Check recent usage
SELECT * FROM user_usage_summary WHERE date >= date('now', '-7 days');

-- Monitor costs
SELECT model, SUM(cost) as total_cost FROM usage_logs
WHERE created_at >= datetime('now', '-1 day') GROUP BY model;

-- Rate limit status
SELECT user_id, COUNT(*) as requests FROM rate_limits
WHERE window_start >= datetime('now', '-1 hour') GROUP BY user_id;
```

## Security Considerations

1. **API Keys**: Stored as hashes, never plain text
2. **Rate Limiting**: Multiple time windows (minute, hour, day)
3. **Audit Logging**: All administrative actions logged
4. **Input Validation**: Enforced at application and database level
5. **Data Retention**: Automatic cleanup of old data

## Performance Optimization

1. **Indexes**: Optimized for common query patterns
2. **Partitioning**: Consider partitioning large tables by date
3. **Archiving**: Move old data to cold storage
4. **Caching**: Use KV store for frequently accessed data

## Troubleshooting

### Common Issues

1. **Migration Failures**: Check foreign key constraints and data types
2. **Performance**: Review query plans and index usage
3. **Data Integrity**: Verify triggers and constraints
4. **Permissions**: Ensure proper API key permissions

### Debug Queries

```sql
-- Check schema version
SELECT * FROM schema_metadata ORDER BY created_at DESC LIMIT 1;

-- Verify table structure
SELECT name, sql FROM sqlite_master WHERE type='table';

-- Check recent errors
SELECT * FROM audit_logs WHERE action LIKE '%error%' ORDER BY created_at DESC;
```
