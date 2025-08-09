# KV Namespace Setup Guide

This guide provides step-by-step instructions for setting up KV namespaces for
caching and rate limiting in Cloudflare Workers.

## Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI installed and authenticated
- Access to the Cloudflare dashboard

## KV Namespaces to Create

### 1. Cache KV Namespace

Used for caching API responses, model configurations, and temporary data.

**Names:**

- Development: `openai-api-cache-dev`
- Staging: `openai-api-cache-staging`
- Production: `openai-api-cache-prod`

### 2. Rate Limit KV Namespace

Used for tracking rate limits per user/IP.

**Names:**

- Development: `openai-api-rate-limit-dev`
- Staging: `openai-api-rate-limit-staging`
- Production: `openai-api-rate-limit-prod`

## Setup Commands

### Using Wrangler CLI

#### Development Environment

```sh
# Create KV namespaces for development
wrangler kv:namespace create "CACHE" --env development
wrangler kv:namespace create "RATE_LIMIT" --env development

# Create preview namespaces for development
wrangler kv:namespace create "CACHE" --env development --preview
wrangler kv:namespace create "RATE_LIMIT" --env development --preview
```

#### Staging Environment

```sh
# Create KV namespaces for staging
wrangler kv:namespace create "CACHE" --env staging
wrangler kv:namespace create "RATE_LIMIT" --env staging

# Create preview namespaces for staging
wrangler kv:namespace create "CACHE" --env staging --preview
wrangler kv:namespace create "RATE_LIMIT" --env staging --preview
```

#### Production Environment

```sh
# Create KV namespaces for production
wrangler kv:namespace create "CACHE" --env production
wrangler kv:namespace create "RATE_LIMIT" --env production

# Create preview namespaces for production
wrangler kv:namespace create "CACHE" --env production --preview
wrangler kv:namespace create "RATE_LIMIT" --env production --preview
```

### Using Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Workers & Pages > KV
3. Click "Create a namespace"
4. Enter the namespace name (e.g., `openai-api-cache-prod`)
5. Click "Add"

## Configuration Updates

After creating the KV namespaces, update your `wrangler.toml` file with the
actual IDs provided by Cloudflare.

### Getting Namespace IDs

```sh
# List all KV namespaces to get their IDs
wrangler kv:namespace list
```

### Update wrangler.toml

Replace the placeholder IDs in `wrangler.toml` with the actual IDs from the
commands above:

```toml
# Development
[[env.development.kv_namespaces]]
binding = "CACHE"
id = "your-actual-cache-dev-id"
preview_id = "your-actual-cache-dev-preview-id"

[[env.development.kv_namespaces]]
binding = "RATE_LIMIT"
id = "your-actual-rate-limit-dev-id"
preview_id = "your-actual-rate-limit-dev-preview-id"

# Staging
[[env.staging.kv_namespaces]]
binding = "CACHE"
id = "your-actual-cache-staging-id"
preview_id = "your-actual-cache-staging-preview-id"

[[env.staging.kv_namespaces]]
binding = "RATE_LIMIT"
id = "your-actual-rate-limit-staging-id"
preview_id = "your-actual-rate-limit-staging-preview-id"

# Production
[[env.production.kv_namespaces]]
binding = "CACHE"
id = "your-actual-cache-prod-id"
preview_id = "your-actual-cache-prod-preview-id"

[[env.production.kv_namespaces]]
binding = "RATE_LIMIT"
id = "your-actual-rate-limit-prod-id"
preview_id = "your-actual-rate-limit-prod-preview-id"
```

## Usage Examples

### In Your Worker Code

```typescript
// Cache usage example
const cacheKey = `model:${model}:response:${hash}`;
const cached = await env.CACHE.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

// Store in cache
await env.CACHE.put(cacheKey, JSON.stringify(response), {
  expirationTtl: 3600
});

// Rate limiting example
const rateLimitKey = `rate_limit:${userId}:${Math.floor(Date.now() / 60000)}`;
const currentCount = await env.RATE_LIMIT.get(rateLimitKey);
const newCount = (parseInt(currentCount || "0") + 1).toString();
await env.RATE_LIMIT.put(rateLimitKey, newCount, { expirationTtl: 60 });
```

## Testing KV Operations

### Development Testing

```sh
# Test KV operations locally
wrangler dev --env development

# Check KV values
wrangler kv:key get "test-key" --namespace-id your-namespace-id
```

### Production Testing

```sh
# Test KV operations in production
wrangler deploy --env production

# Monitor KV usage
wrangler tail --env production
```

## Best Practices

1. **Namespace Naming Convention**: Use descriptive names with environment
   suffixes
2. **Key Structure**: Use consistent key patterns like `type:subtype:id`
3. **TTL Settings**: Set appropriate TTL values for cache items
4. **Error Handling**: Always handle KV operation failures gracefully
5. **Monitoring**: Monitor KV usage and set up alerts for high usage

## Troubleshooting

### Common Issues

1. **Namespace Not Found**: Ensure the namespace ID is correct and the namespace
   exists
2. **Permission Errors**: Check if your API token has the necessary permissions
3. **Binding Errors**: Verify the binding names match between wrangler.toml and
   your code

### Debug Commands

```sh
# Check namespace configuration
wrangler config list

# Verify KV namespace bindings
wrangler dev --env development --log-level debug

# Check namespace limits
wrangler kv:namespace list --limit 100
```

## Automation Script

Create a `setup-kv.sh` script to automate the process:

```sh
#!/bin/bash
set -e

echo "Setting up KV namespaces..."

# Development
wrangler kv:namespace create "CACHE" --env development
wrangler kv:namespace create "RATE_LIMIT" --env development
wrangler kv:namespace create "CACHE" --env development --preview
wrangler kv:namespace create "RATE_LIMIT" --env development --preview

# Staging
wrangler kv:namespace create "CACHE" --env staging
wrangler kv:namespace create "RATE_LIMIT" --env staging
wrangler kv:namespace create "CACHE" --env staging --preview
wrangler kv:namespace create "RATE_LIMIT" --env staging --preview

# Production
wrangler kv:namespace create "CACHE" --env production
wrangler kv:namespace create "RATE_LIMIT" --env production
wrangler kv:namespace create "CACHE" --env production --preview
wrangler kv:namespace create "RATE_LIMIT" --env production --preview

echo "KV namespaces created successfully!"
echo "Please update wrangler.toml with the namespace IDs from the output above."
```

Make the script executable:

```sh
chmod +x setup-kv.sh
```

Run the script:

```sh
./setup-kv.sh
```
