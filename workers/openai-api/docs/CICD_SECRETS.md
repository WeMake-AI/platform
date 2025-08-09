# CI/CD Secrets Management Guide

This guide outlines the secrets and environment variables required for the
OpenAI API Worker CI/CD pipeline.

## Required Secrets

### GitHub Repository Secrets

These secrets must be configured in your GitHub repository settings under
**Settings > Secrets and variables > Actions**.

#### Core Cloudflare Secrets

| Secret Name             | Description                                        | Required For    | Example     |
| ----------------------- | -------------------------------------------------- | --------------- | ----------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API token with Workers:Edit permissions | All deployments | `abc123...` |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID                         | All deployments | `def456...` |

#### API Integration Secrets

| Secret Name          | Description                            | Required For     | Example            |
| -------------------- | -------------------------------------- | ---------------- | ------------------ |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI model access | All environments | `sk-or-...`        |
| `POSTHOG_API_KEY`    | PostHog API key for analytics          | All environments | `phc_...`          |
| `DATABASE_URL`       | Database connection string             | All environments | `postgresql://...` |

#### Optional Security Secrets

| Secret Name         | Description                     | Required For   | Example                       |
| ------------------- | ------------------------------- | -------------- | ----------------------------- |
| `SNYK_TOKEN`        | Snyk security scanning token    | Security scans | `abc123...`                   |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | Notifications  | `https://hooks.slack.com/...` |

### Environment-Specific Variables

These are configured as **Variables** (not secrets) in GitHub repository
settings.

#### Development Environment

```bash
ENVIRONMENT=development
LOG_LEVEL=debug
RATE_LIMIT_PER_MINUTE=120
CORS_ORIGINS=http://localhost:3000,http://localhost:4321
ENABLE_DEBUG_LOGS=true
MAX_REQUEST_SIZE=2MB
CACHE_TTL=300
```

#### Staging Environment

```bash
ENVIRONMENT=staging
LOG_LEVEL=info
RATE_LIMIT_PER_MINUTE=100
CORS_ORIGINS=https://staging.wemake.dev
ENABLE_DEBUG_LOGS=false
MAX_REQUEST_SIZE=1MB
CACHE_TTL=600
```

#### Production Environment

```bash
ENVIRONMENT=production
LOG_LEVEL=warn
RATE_LIMIT_PER_MINUTE=60
CORS_ORIGINS=https://wemake.dev,https://app.wemake.dev
ENABLE_DEBUG_LOGS=false
MAX_REQUEST_SIZE=1MB
CACHE_TTL=3600
```

## Setting Up Secrets

### 1. GitHub Repository Secrets

1. Navigate to your repository on GitHub
2. Go to **Settings > Secrets and variables > Actions**
3. Click **New repository secret**
4. Add each required secret from the tables above

### 2. Cloudflare API Token

To create a Cloudflare API token:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use the **Custom token** template
4. Configure permissions:
   - **Zone:Zone:Read** (for all zones)
   - **Zone:Zone Settings:Edit** (for all zones)
   - **Account:Cloudflare Workers:Edit** (for your account)
   - **Account:Account Settings:Read** (for your account)
5. Set **Account Resources** to your specific account
6. Set **Zone Resources** to all zones or specific zones
7. Copy the generated token

### 3. Environment-Specific Secrets

For environment-specific deployments, you can also set up **Environment
secrets**:

1. Go to **Settings > Environments**
2. Create environments: `development`, `staging`, `production`
3. Add environment-specific secrets and variables
4. Configure protection rules as needed

## Security Best Practices

### Secret Rotation

- **Cloudflare API Token**: Rotate every 90 days
- **OpenRouter API Key**: Rotate every 180 days
- **Database credentials**: Rotate every 90 days
- **PostHog API Key**: Rotate every 180 days

### Access Control

- Limit API token permissions to minimum required
- Use environment-specific tokens when possible
- Regularly audit secret access logs
- Remove unused secrets immediately

### Monitoring

- Set up alerts for failed deployments
- Monitor API usage for anomalies
- Track secret usage in audit logs
- Implement rate limiting on API endpoints

## Local Development

For local development, create a `.dev.vars` file (never commit this):

```bash
# Copy from .dev.vars.example and fill in real values
OPENROUTER_API_KEY=your_openrouter_key_here
POSTHOG_API_KEY=your_posthog_key_here
DATABASE_URL=your_database_url_here
CLOUDFLARE_API_TOKEN=your_cloudflare_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
```

## Troubleshooting

### Common Issues

#### Deployment Fails with "Unauthorized"

- Check `CLOUDFLARE_API_TOKEN` is correct
- Verify token has required permissions
- Ensure `CLOUDFLARE_ACCOUNT_ID` matches your account

#### Health Check Fails

- Verify `DATABASE_URL` is accessible
- Check KV namespace bindings in `wrangler.toml`
- Ensure all required environment variables are set

#### Security Scan Failures

- Update dependencies with known vulnerabilities
- Check `SNYK_TOKEN` is valid and has permissions
- Review security scan results in workflow logs

### Debugging Commands

```bash
# Test Cloudflare authentication
wrangler whoami

# Validate wrangler configuration
wrangler deploy --dry-run

# Check environment variables
wrangler secret list

# Test health endpoint
curl -f https://your-worker.your-subdomain.workers.dev/health
```

## Compliance and Auditing

### Audit Trail

- All deployments are logged in GitHub Actions
- Secret access is tracked in GitHub audit logs
- Cloudflare API usage is logged in Cloudflare dashboard

### Compliance Requirements

- Secrets are encrypted at rest and in transit
- Access is limited to authorized personnel
- Regular security reviews are conducted
- Incident response procedures are documented

### Data Protection

- No secrets are logged in plain text
- Secrets are masked in GitHub Actions output
- Database connections use encrypted channels
- API keys are scoped to minimum required permissions

## Emergency Procedures

### Secret Compromise

1. **Immediate Actions**:
   - Revoke compromised secret immediately
   - Generate new secret with different value
   - Update GitHub repository secrets
   - Deploy to all environments

2. **Investigation**:
   - Review access logs for unauthorized usage
   - Check for any suspicious API calls
   - Document incident for security review

3. **Prevention**:
   - Implement additional monitoring
   - Review access permissions
   - Update security procedures

### Deployment Rollback

```bash
# Emergency rollback using Wrangler
wrangler rollback --env production

# Or deploy previous version
git checkout <previous-commit>
./scripts/deploy.sh -e production
```

## Contact Information

For questions or issues with secrets management:

- **DevOps Team**: devops@wemake.dev
- **Security Team**: security@wemake.dev
- **Emergency Contact**: +1-XXX-XXX-XXXX

---

**Note**: This document contains sensitive information about our infrastructure.
Do not share outside the development team.
