# Deployment Guide - OpenAI API Worker

This guide provides comprehensive instructions for deploying the OpenAI API
Worker to Cloudflare Workers across different environments.

## Overview

The OpenAI API Worker supports three deployment environments:

- **Development**: For feature development and testing
- **Staging**: For pre-production testing and validation
- **Production**: For live user traffic

Each environment has its own configuration, secrets, and deployment pipeline.

## Prerequisites

### Required Tools

- **Bun** (v1.0.0+) - [Install Bun](https://bun.sh/docs/installation)
- **Wrangler CLI** (v3.0.0+) -
  [Install Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- **Git** - [Install Git](https://git-scm.com/downloads)

### Required Accounts and Access

- **Cloudflare Account** with Workers Paid plan
- **GitHub Repository** access with Actions enabled
- **Neon Database** account for PostgreSQL
- **OpenRouter Account** for AI model access
- **PostHog Account** for analytics (optional)

### Cloudflare Setup

1. **Workers Plan**: Ensure you have a Workers Paid plan
2. **Custom Domain**: Set up custom domains for each environment
3. **KV Namespaces**: Create KV namespaces for each environment
4. **D1 Database**: Create D1 databases for each environment

## Environment Configuration

### Development Environment

**Purpose**: Local development and feature testing

**Configuration**:

- **Domain**: `openai-api-dev.wemake.workers.dev`
- **Branch**: `develop`
- **Auto-deploy**: Enabled on push to `develop`
- **Rate Limits**: Relaxed (120 req/min)
- **Logging**: Debug level enabled

### Staging Environment

**Purpose**: Pre-production testing and validation

**Configuration**:

- **Domain**: `openai-api-staging.wemake.workers.dev`
- **Branch**: `staging`
- **Auto-deploy**: Enabled on push to `staging`
- **Rate Limits**: Production-like (100 req/min)
- **Logging**: Info level

### Production Environment

**Purpose**: Live user traffic

**Configuration**:

- **Domain**: `openai-api.wemake.workers.dev`
- **Branch**: `main`
- **Auto-deploy**: Enabled with approval gates
- **Rate Limits**: Strict (60 req/min)
- **Logging**: Warn level

## Automated Deployment (CI/CD)

### GitHub Actions Workflow

The project includes a comprehensive CI/CD pipeline that automatically handles:

1. **Code Quality Checks**
   - TypeScript compilation
   - ESLint linting
   - Prettier formatting
   - Unit and integration tests

2. **Security Scanning**
   - Dependency vulnerability scanning
   - Secret detection
   - Code quality analysis

3. **Build and Deploy**
   - Worker compilation
   - Environment-specific deployment
   - Health check verification

4. **Notifications**
   - Deployment status updates
   - Error notifications
   - Performance metrics

### Deployment Triggers

| Branch           | Environment | Trigger     | Approval Required |
| ---------------- | ----------- | ----------- | ----------------- |
| `develop`        | Development | Push        | No                |
| `staging`        | Staging     | Push        | No                |
| `main`           | Production  | Push        | Yes               |
| Feature branches | None        | Manual only | N/A               |

### Setting Up CI/CD

1. **Configure Secrets** (see [CICD_SECRETS.md](./CICD_SECRETS.md))
2. **Set up Environments** in GitHub repository settings
3. **Configure Branch Protection** rules
4. **Test Deployment** with a feature branch

## Manual Deployment

### Using Deployment Script

The project includes a deployment script for manual deployments:

```bash
# Deploy to development
./scripts/deploy.sh -e development

# Deploy to staging
./scripts/deploy.sh -e staging

# Deploy to production
./scripts/deploy.sh -e production

# Deploy with custom options
./scripts/deploy.sh -e production --skip-tests --force
```

**Script Options**:

- `-e, --environment`: Target environment (required)
- `--skip-tests`: Skip test execution
- `--skip-build`: Skip build step
- `--force`: Force deployment without confirmation
- `--dry-run`: Show what would be deployed without deploying
- `--verbose`: Enable verbose logging

### Using Wrangler Directly

```bash
# Install dependencies
bun install

# Build the worker
bun run build

# Deploy to specific environment
wrangler deploy --env development
wrangler deploy --env staging
wrangler deploy --env production

# Deploy with custom name
wrangler deploy --name openai-api-custom
```

## Environment-Specific Setup

### Development Environment

1. **Create KV Namespace**:

   ```bash
   wrangler kv:namespace create "CACHE" --env development
   wrangler kv:namespace create "RATE_LIMITS" --env development
   wrangler kv:namespace create "API_KEYS" --env development
   ```

2. **Create D1 Database**:

   ```bash
   wrangler d1 create openai-api-dev
   ```

3. **Run Migrations**:

   ```bash
   wrangler d1 execute openai-api-dev --file=./migrations/001_initial_schema.sql --env development
   wrangler d1 execute openai-api-dev --file=./migrations/dev_seed.sql --env development
   ```

4. **Set Secrets**:
   ```bash
   wrangler secret put OPENROUTER_API_KEY --env development
   wrangler secret put DATABASE_URL --env development
   wrangler secret put POSTHOG_API_KEY --env development
   ```

### Staging Environment

1. **Create Resources** (similar to development but with staging names)
2. **Run Production Migrations**:

   ```bash
   wrangler d1 execute openai-api-staging --file=./migrations/001_initial_schema.sql --env staging
   wrangler d1 execute openai-api-staging --file=./migrations/prod_setup.sql --env staging
   ```

3. **Configure Monitoring**:
   - Set up health check monitoring
   - Configure alerting for failures
   - Enable performance tracking

### Production Environment

1. **Create Resources** with production naming
2. **Enhanced Security**:

   ```bash
   # Use production-specific API keys
   wrangler secret put OPENROUTER_API_KEY --env production
   wrangler secret put DATABASE_URL --env production

   # Set strict rate limits
   wrangler secret put RATE_LIMIT_PER_MINUTE --env production
   ```

3. **Monitoring and Alerting**:
   - Configure comprehensive monitoring
   - Set up alerting for all critical metrics
   - Enable audit logging

## Database Deployment

### Migration Strategy

The project uses a structured migration approach:

1. **Schema Migrations**: Structural changes to database
2. **Data Migrations**: Data transformations and seeding
3. **Environment Setup**: Environment-specific configurations

### Running Migrations

```bash
# Development
bun run db:migrate:dev

# Staging
bun run db:migrate:staging

# Production
bun run db:migrate:prod
```

### Migration Files

- `001_initial_schema.sql`: Core database schema
- `dev_seed.sql`: Development test data
- `prod_setup.sql`: Production-specific setup
- `run_migrations.sql`: Migration runner script

## Monitoring and Health Checks

### Health Check Endpoints

- **Basic Health**: `GET /health`
- **Detailed Health**: `GET /health?detailed=true`
- **Database Health**: `GET /health/database`
- **Dependencies**: `GET /health/dependencies`

### Monitoring Setup

1. **Cloudflare Analytics**:
   - Request volume and latency
   - Error rates and status codes
   - Geographic distribution

2. **Custom Metrics**:
   - API key usage
   - Model usage patterns
   - Cost tracking

3. **Alerting Rules**:
   - Health check failures
   - High error rates
   - Performance degradation
   - Security incidents

### Log Monitoring

```bash
# Real-time logs
wrangler tail --env production

# Filtered logs
wrangler tail --env production --format pretty --grep "ERROR"

# Historical logs (via Cloudflare dashboard)
# Navigate to Workers > openai-api > Logs
```

## Rollback Procedures

### Automatic Rollback

The CI/CD pipeline includes automatic rollback triggers:

- Health check failures after deployment
- Error rate exceeding threshold
- Performance degradation

### Manual Rollback

```bash
# Using Wrangler
wrangler rollback --env production

# Deploy specific version
git checkout <previous-commit>
./scripts/deploy.sh -e production

# Emergency rollback script
./scripts/emergency-rollback.sh production
```

### Rollback Verification

1. **Health Checks**: Verify all health endpoints
2. **Functionality Tests**: Run critical path tests
3. **Performance Monitoring**: Check response times
4. **Error Monitoring**: Verify error rates return to normal

## Security Considerations

### Secrets Management

- **Rotation Schedule**: Regular rotation of all secrets
- **Access Control**: Limit access to production secrets
- **Audit Logging**: Track all secret access
- **Encryption**: All secrets encrypted at rest and in transit

### Network Security

- **HTTPS Only**: All traffic encrypted
- **CORS Configuration**: Strict origin controls
- **Rate Limiting**: Prevent abuse
- **DDoS Protection**: Cloudflare's built-in protection

### Code Security

- **Dependency Scanning**: Regular vulnerability scans
- **Static Analysis**: Code quality and security checks
- **Input Validation**: Strict input sanitization
- **Output Encoding**: Prevent injection attacks

## Performance Optimization

### Caching Strategy

1. **Response Caching**: Cache frequently requested data
2. **Database Caching**: Use KV store for hot data
3. **CDN Caching**: Leverage Cloudflare's global CDN
4. **Application Caching**: In-memory caching for request lifecycle

### Resource Optimization

1. **Bundle Size**: Minimize worker bundle size
2. **Memory Usage**: Optimize memory allocation
3. **CPU Usage**: Efficient algorithms and data structures
4. **Network Calls**: Minimize external API calls

### Monitoring Performance

- **Response Times**: Track P50, P95, P99 latencies
- **Throughput**: Monitor requests per second
- **Error Rates**: Track error percentages
- **Resource Usage**: Monitor CPU and memory

## Troubleshooting

### Common Deployment Issues

#### Authentication Errors

```bash
# Check Wrangler authentication
wrangler whoami

# Re-authenticate if needed
wrangler login

# Verify API token permissions
wrangler auth list
```

#### Configuration Issues

```bash
# Validate wrangler.toml
wrangler deploy --dry-run

# Check environment variables
wrangler secret list --env production

# Verify KV namespaces
wrangler kv:namespace list
```

#### Build Failures

```bash
# Clear build cache
rm -rf dist/ .wrangler/

# Reinstall dependencies
rm -rf node_modules bun.lockb
bun install

# Check TypeScript errors
bun run type-check
```

#### Runtime Errors

```bash
# Check worker logs
wrangler tail --env production

# Test health endpoint
curl -f https://openai-api.wemake.workers.dev/health

# Verify database connectivity
wrangler d1 execute openai-api-prod --command "SELECT 1;"
```

### Debug Mode

Enable debug mode for detailed troubleshooting:

```bash
# Set debug environment variables
wrangler secret put LOG_LEVEL --env development
# Enter: debug

wrangler secret put ENABLE_DEBUG_LOGS --env development
# Enter: true

# Deploy and check logs
wrangler deploy --env development
wrangler tail --env development
```

### Performance Issues

1. **Slow Response Times**:
   - Check database query performance
   - Verify external API response times
   - Review caching effectiveness

2. **High Error Rates**:
   - Check dependency health
   - Verify configuration settings
   - Review recent deployments

3. **Resource Limits**:
   - Monitor CPU usage
   - Check memory allocation
   - Review request patterns

## Disaster Recovery

### Backup Strategy

1. **Database Backups**:
   - Automated daily backups
   - Point-in-time recovery capability
   - Cross-region backup storage

2. **Configuration Backups**:
   - Version-controlled configurations
   - Secret backup procedures
   - Infrastructure as Code

3. **Code Backups**:
   - Git repository with multiple remotes
   - Tagged releases for rollback
   - Automated backup verification

### Recovery Procedures

1. **Service Outage**:
   - Activate backup infrastructure
   - Redirect traffic to backup
   - Communicate with stakeholders

2. **Data Loss**:
   - Restore from latest backup
   - Verify data integrity
   - Resume normal operations

3. **Security Incident**:
   - Isolate affected systems
   - Rotate all credentials
   - Conduct security audit

## Maintenance

### Regular Maintenance Tasks

1. **Weekly**:
   - Review performance metrics
   - Check error logs
   - Update dependencies

2. **Monthly**:
   - Rotate secrets
   - Review security settings
   - Optimize performance

3. **Quarterly**:
   - Security audit
   - Disaster recovery testing
   - Capacity planning

### Maintenance Windows

- **Development**: No scheduled maintenance
- **Staging**: Sundays 02:00-04:00 UTC
- **Production**: First Sunday of month 02:00-04:00 UTC

## Support and Escalation

### Contact Information

- **Development Team**: dev-team@wemake.dev
- **DevOps Team**: devops@wemake.dev
- **Security Team**: security@wemake.dev
- **Emergency Hotline**: +1-XXX-XXX-XXXX

### Escalation Procedures

1. **Level 1**: Development team (response: 1 hour)
2. **Level 2**: DevOps team (response: 30 minutes)
3. **Level 3**: Security team (response: 15 minutes)
4. **Emergency**: All teams + management (response: immediate)

### Documentation

- **Runbooks**: Detailed operational procedures
- **Playbooks**: Incident response procedures
- **Architecture Docs**: System design documentation
- **API Docs**: Complete API reference

---

For additional information, refer to:

- [Main README](../README.md)
- [API Documentation](./API.md)
- [CI/CD Secrets Guide](./CICD_SECRETS.md)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
